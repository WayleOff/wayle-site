/* Validation stricte d'un thème. Rien d'autre que des valeurs connues n'atteint jamais le CSS.
   validate(input) → { ok, errors:[{path,message}], theme } (theme = défauts + valeurs valides). */
import { SCHEMA, defaultTheme, setPath, getPath } from "./schema.js";
import { isColor } from "../engine/color.js";

const BYPATH = new Map(SCHEMA.map((t) => [t.path, t]));
const ASSET = /^(\/_blob\/[A-Za-z0-9_-]{1,64}|\/api\/media\?id=[A-Za-z0-9_-]{1,64})$/;

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
