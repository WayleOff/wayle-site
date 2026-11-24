// Image publique d'un média du site (logo, favicon, photos des pages) : /api/media?id=...
export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || !env.DB) return new Response("not found", { status: 404 });
  const row = await env.DB.prepare("SELECT data FROM docs WHERE coll='s_media' AND id=?1").bind(id).first();
  if (!row) return new Response("not found", { status: 404 });
  const d = JSON.parse(row.data);
  if (!/^image\/(png|jpeg|webp|gif)$/.test(d.type || "")) return new Response("not found", { status: 404 });
  const bin = Uint8Array.from(atob(d.data), (c) => c.charCodeAt(0));
  return new Response(bin, { headers: { "Content-Type": d.type, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
}
