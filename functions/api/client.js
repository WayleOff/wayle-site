// Espace client Wayle : accès par code personnel (jamais stocké en clair : seule l'empreinte SHA-256 l'est).
// Public, mais : codes de 10 caractères (≈ 50 bits), blocage après plusieurs essais ratés, données limitées au client concerné.
const WINDOW_MS = 15 * 60e3, MAX_FAILS_IP = 8, MAX_FAILS_ALL = 60;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function sha256(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
export const normCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const codeHash = (c) => sha256("wayle-client:" + normCode(c));

async function getDoc(env, coll, id) {
  const r = await env.DB.prepare("SELECT data FROM docs WHERE coll=?1 AND id=?2").bind(coll, id).first();
  return r ? JSON.parse(r.data) : null;
}
async function putDoc(env, coll, id, data) {
  await env.DB.prepare("INSERT INTO docs (coll,id,data,updated_at) VALUES (?1,?2,?3,?4) ON CONFLICT(coll,id) DO UPDATE SET data=?3, updated_at=?4")
    .bind(coll, id, JSON.stringify(data), Date.now()).run();
}

async function blocked(env, key, max) {
  const d = await getDoc(env, "c_rate", key);
  return !!d && d.n >= max && Date.now() - d.t < WINDOW_MS;
}
async function fail(env, key) {
  const d = await getDoc(env, "c_rate", key), now = Date.now();
  await putDoc(env, "c_rate", key, !d || now - d.t >= WINDOW_MS ? { n: 1, t: now } : { n: d.n + 1, t: d.t });
}

const str = (s, n) => String(s == null ? "" : s).slice(0, n);
const url = (u) => (/^https?:\/\/[^\s"'<>]{1,500}$/i.test(String(u || "")) ? String(u) : "");

function view(p, act) {
  const dec = (act && act.decisions) || {};
  const msgs = [
    ...((act && act.msgs) || []).map((m) => ({ from: "client", text: m.text, at: m.at })),
    ...(p.msgsAdmin || []).map((m) => ({ from: "wayle", text: m.text, at: m.at })),
  ].sort((a, b) => a.at - b.at).slice(-100);
  return {
    name: str(p.name, 120), project: str(p.project, 160), contact: str(p.contact, 200),
    steps: (p.steps || []).slice(0, 30).map((s) => ({ label: str(s.label, 120), state: ["done", "current", "todo"].includes(s.state) ? s.state : "todo", date: str(s.date, 40) })),
    versions: (p.versions || []).slice(0, 40).map((v) => {
      const d = dec[v.id] || {};
      return { id: str(v.id, 40), title: str(v.title, 160), note: str(v.note, 600), date: str(v.date, 40), url: url(v.url),
        status: d.status === "validated" || d.status === "changes" ? d.status : "pending", comment: str(d.comment, 1000), decidedAt: d.at || 0 };
    }),
    files: (p.files || []).slice(0, 60).map((f) => ({ title: str(f.title, 160), date: str(f.date, 40), url: url(f.url) })),
    invoices: (p.invoices || []).slice(0, 60).map((i) => ({ label: str(i.label, 160), amount: str(i.amount, 40), state: ["paid", "due", "sent"].includes(i.state) ? i.state : "sent", url: url(i.url) })),
    messages: msgs.map((m) => ({ from: m.from, text: str(m.text, 1000), at: m.at })),
  };
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "unavailable" }, 503);
  const u = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== u.origin) return json({ error: "forbidden" }, 403);
  const raw = await request.text();
  if (raw.length > 6000) return json({ error: "too_large" }, 413);
  let b;
  try { b = JSON.parse(raw); } catch (e) { return json({ error: "bad_json" }, 400); }
  if (!b || typeof b !== "object") return json({ error: "bad_body" }, 400);

  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const ipKey = "ip_" + (await sha256("ip:" + ip)).slice(0, 24);
  if ((await blocked(env, ipKey, MAX_FAILS_IP)) || (await blocked(env, "all", MAX_FAILS_ALL)))
    return json({ error: "too_many", message: "Trop d’essais. Réessayez dans quelques minutes." }, 429);

  const code = normCode(b.code);
  if (code.length < 8 || code.length > 16) { await fail(env, ipKey); await fail(env, "all"); return json({ error: "bad_code" }, 401); }
  const h = await codeHash(code);
  const { results } = await env.DB.prepare("SELECT id, data FROM docs WHERE coll='c_portal'").all();
  let hit = null;
  for (const r of results) { const d = JSON.parse(r.data); if (d.codeHash && d.codeHash === h) hit = { id: r.id, p: d }; }
  if (!hit) { await fail(env, ipKey); await fail(env, "all"); return json({ error: "bad_code" }, 401); }

  const act = (await getDoc(env, "c_activity", hit.id)) || { decisions: {}, msgs: [], events: [] };
  act.decisions = act.decisions || {}; act.msgs = act.msgs || []; act.events = act.events || [];
  const now = Date.now();

  if (b.a === "review") {
    const v = (hit.p.versions || []).find((x) => x.id === b.v);
    if (!v || !["validated", "changes"].includes(b.status)) return json({ error: "bad_request" }, 400);
    const comment = str(b.comment, 1000).trim();
    if (b.status === "changes" && !comment) return json({ error: "comment_required" }, 400);
    act.decisions[v.id] = { status: b.status, comment, at: now };
    act.events.push({ at: now, kind: "review", text: (b.status === "validated" ? "Version validée : " : "Modifications demandées : ") + str(v.title, 100) + (comment ? " — " + comment.slice(0, 200) : "") });
    act.events = act.events.slice(-100);
    await putDoc(env, "c_activity", hit.id, act);
  } else if (b.a === "msg") {
    const text = str(b.text, 1000).trim();
    if (!text) return json({ error: "empty" }, 400);
    if (act.msgs.length >= 80) return json({ error: "limit" }, 429);
    act.msgs.push({ text, at: now });
    act.events.push({ at: now, kind: "msg", text: "Message : " + text.slice(0, 200) });
    act.events = act.events.slice(-100);
    await putDoc(env, "c_activity", hit.id, act);
  } else if (b.a !== "get") return json({ error: "bad_action" }, 400);

  return json(view(hit.p, act));
}
