/* Validation stricte d'un thème. Rien d'autre que des valeurs connues n'atteint jamais le CSS.
   validate(input) → { ok, errors:[{path,message}], theme } (theme = défauts + valeurs valides). */
import { SCHEMA, defaultTheme, setPath, getPath } from "./schema.js";
import { isColor } from "../engine/color.js";

const BYPATH = new Map(SCHEMA.map((t) => [t.path, t]));
const ASSET = /^(\/_blob\/[A-Za-z0-9_-]{1,64}|\/api\/media\?id=[A-Za-z0-9_-]{1,64})$/;

/* ---------- CSS personnalisé ----------
   Liste blanche prudente : le CSS saisi est publié tel quel sur le site public (/theme.css).
   On REFUSE (et on ne « nettoie » pas en silence) tout ce qui peut charger une ressource externe ou sortir du CSS :
   @import, url() hors médias du site, fonctions d'image, expressions, échappements « \ », balises. */
export function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ""); }
const URL_OK = /^\s*(["']?)(\/api\/media\?id=[A-Za-z0-9_-]{1,64}|\/_blob\/[A-Za-z0-9_-]{1,64})\1\s*$/;
export function checkCustomCss(v, max = 8000) {
  if (typeof v !== "string") return "texte attendu";
  if (v.length > max) return `trop long (${v.length} / ${max} caractères)`;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)) return "caractère de contrôle interdit";
  if (v.includes("<")) return "le caractère « < » est interdit";
  if (v.includes("\\")) return "les échappements « \\ » sont interdits (ils permettent de contourner les contrôles)";
  const open = (v.match(/\/\*/g) || []).length, close = (v.match(/\*\//g) || []).length;
  if (open !== close) return "commentaire /* … */ mal fermé";
  const c = stripComments(v);
  if (/\/\*|\*\//.test(c)) return "commentaires imbriqués non pris en charge";
  if (/@(import|charset|namespace|document|-moz-document)\b/i.test(c)) return "@import / @charset / @namespace interdits : le CSS ne peut rien charger de l'extérieur";
  if (/expression\s*\(|javascript\s*:|vbscript\s*:|livescript\s*:|-moz-binding|behavior\s*:/i.test(c)) return "valeur interdite (expression, javascript:, behavior…)";
  if (/\b(image-set|-webkit-image-set|cross-fade|-webkit-cross-fade|element|image|src)\s*\(/i.test(c)) return "fonction de chargement d'image interdite (image-set, src(), image()…)";
  /* url() : uniquement les médias du site */
  const re = /url\s*\(([^)]*)\)/gi; let m;
  while ((m = re.exec(c))) if (!URL_OK.test(m[1])) return "url() autorisé uniquement vers vos médias (/api/media?id=…)";
  if (/url\s*\(/i.test(c.replace(re, ""))) return "url() mal formé";
  /* équilibre {} () et guillemets (hors chaînes) */
  let depth = 0, par = 0, q = "";
  for (const ch of c) {
    if (q) { if (ch === q) q = ""; else if (ch === "\n") return "guillemet non fermé"; continue; }
    if (ch === '"' || ch === "'") q = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth < 0) return "accolade « } » en trop"; }
    else if (ch === "(") par++;
    else if (ch === ")") { par--; if (par < 0) return "parenthèse « ) » en trop"; }
  }
  if (q) return "guillemet non fermé";
  if (depth !== 0) return "accolade « { » non fermée";
  if (par !== 0) return "parenthèse « ( » non fermée";
  return null;
}

function flatten(o, pre = "", out = []) {
  for (const [k, v] of Object.entries(o)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") { out.push([pre + k, v, true]); continue; }
    const p = pre + k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, p + ".", out);
    else out.push([p, v]);
  }
  return out;
}

export function checkValue(t, v) {
  switch (t.type) {
    case "color": return typeof v === "string" && v.length <= 64 && isColor(v) ? null : "couleur invalide (hex, rgb(a) ou hsl(a))";
    case "number": return typeof v === "number" && Number.isFinite(v) && v >= t.min && v <= t.max ? null : `nombre attendu entre ${t.min} et ${t.max}`;
    case "bool": return typeof v === "boolean" ? null : "booléen attendu";
    case "enum": return t.options.includes(v) ? null : "valeur hors liste : " + t.options.join(", ");
    case "font": return t.options.includes(v) ? null : "police hors catalogue";
    case "text": return typeof v === "string" && v.length <= (t.max || 120) && !/[\u0000-\u001f<>]/.test(v) ? null : "texte invalide ou trop long";
    case "css": return checkCustomCss(v, t.max || 8000);
    case "asset": return v === "" || (typeof v === "string" && ASSET.test(v)) ? null : "ressource invalide";
    default: return "type inconnu";
  }
}

export function validate(input) {
  const errors = [];
  const theme = defaultTheme();
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, errors: [{ path: "", message: "objet attendu" }], theme };
  for (const [path, v, bad] of flatten(input)) {
    const t = BYPATH.get(path);
    if (bad || !t) { errors.push({ path, message: "réglage inconnu" }); continue; }
    const m = checkValue(t, v);
    if (m) errors.push({ path, message: m }); else setPath(theme, path, v);
  }
  return { ok: !errors.length, errors, theme };
}

/* extrait uniquement les écarts avec les défauts (pour le stockage) */
export function diffFromDefaults(theme) {
  const out = {};
  for (const t of SCHEMA) { const v = getPath(theme, t.path); if (v !== undefined && v !== t.default) setPath(out, t.path, v); }
  return out;
}
