// Vérification du jeton Cloudflare Access (partagée par toutes les fonctions privées).
let certCache = { at: 0, keys: null };
const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
export const json = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra } });

async function getKeys(team) {
  if (certCache.keys && Date.now() - certCache.at < 3600e3) return certCache.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error("certs");
  certCache = { at: Date.now(), keys: (await r.json()).keys };
  return certCache.keys;
}

function tokenOf(request) {
  const h = request.headers.get("Cf-Access-Jwt-Assertion");
  if (h) return h;
  const m = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(request.headers.get("Cookie") || "");
  return m ? m[1] : null;
}

export async function verifyAccess(request, env) {
  const team = env.ACCESS_TEAM_DOMAIN, aud = env.ACCESS_AUD;
  if (!team || !aud) return false; // non configuré : on refuse tout
  const tok = tokenOf(request);
  if (!tok) return false;
  const parts = tok.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64u(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(b64u(parts[1])));
    if (header.alg !== "RS256") return false;
    const jwk = (await getKeys(team)).find((k) => k.kid === header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
    if (!ok) return false;
    const audOk = Array.isArray(payload.aud) ? payload.aud.includes(aud) : payload.aud === aud;
    if (!audOk || payload.iss !== `https://${team}` || payload.exp * 1000 < Date.now()) return false;
    if (env.ALLOWED_EMAIL && String(payload.email || "").toLowerCase() !== env.ALLOWED_EMAIL.toLowerCase()) return false;
    return true;
  } catch (e) { return false; }
}
