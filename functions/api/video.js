// Vidéo publique du site, envoyée depuis l'éditeur : /api/video?id=...
// Stockée dans Cloudflare R2 (liaison « VIDEOS »). Prend en charge la lecture par morceaux (Range) pour que les vidéos démarrent vite.
export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(id) || !env.VIDEOS) return new Response("not found", { status: 404 });
  let o;
  try { o = await env.VIDEOS.get("v/" + id, request.headers.get("Range") ? { range: request.headers } : undefined); }
  catch (e) { return new Response("range not satisfiable", { status: 416 }); }
  if (!o) return new Response("not found", { status: 404 });
  const type = o.httpMetadata && /^video\/(mp4|webm)$/.test(o.httpMetadata.contentType || "") ? o.httpMetadata.contentType : "video/mp4";
  const h = new Headers({
    "Content-Type": type, "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=31536000, immutable", "Content-Security-Policy": "default-src 'none'; sandbox",
  });
  let status = 200, len = o.size;
  if (o.range) {
    const r = o.range, off = r.suffix != null ? Math.max(0, o.size - r.suffix) : (r.offset || 0);
    len = r.suffix != null ? Math.min(r.suffix, o.size) : (r.length != null ? r.length : o.size - off);
    status = 206; h.set("Content-Range", `bytes ${off}-${off + len - 1}/${o.size}`);
  }
  h.set("Content-Length", String(len));
  return new Response(o.body, { status, headers: h });
}
