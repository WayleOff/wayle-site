// En-têtes de sécurité sur toutes les réponses (pages, API et fichiers statiques).
// Rien n'est écrasé : si une fonction a déjà posé un en-tête (ex. les médias avec leur CSP « sandbox »), il est conservé.
// La CSP ne limite volontairement ni les scripts ni les styles (le site en utilise en ligne) :
// elle ferme les portes les plus courantes (iframe étrangère, <base> détourné, <object>, formulaire envoyé ailleurs).
const BASE = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=31536000",
};
const HTML_CSP = "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'";

export async function onRequest({ request, next }) {
  const res = await next();
  const h = new Headers(res.headers);
  const https = new URL(request.url).protocol === "https:";
  for (const [k, v] of Object.entries(BASE)) {
    if (k === "Strict-Transport-Security" && !https) continue;
    if (!h.has(k)) h.set(k, v);
  }
  if (/text\/html/i.test(h.get("Content-Type") || "")) {
    if (!h.has("Content-Security-Policy")) h.set("Content-Security-Policy", HTML_CSP);
    if (!h.has("X-Frame-Options")) h.set("X-Frame-Options", "SAMEORIGIN");
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
