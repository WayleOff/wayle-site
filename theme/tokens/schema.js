/* Schéma des tokens : source unique des réglages de thème.
   Chaque entrée : chemin dans l'objet de thème, libellé, groupe, type, défaut, bornes.
   `wired:true` = déjà branché sur le CSS du site (visible dans le panneau). Les autres sont réservés aux étapes 2 et 3. */
import { FONTS } from "./fonts.js";

const T = []; // liste ordonnée
const add = (path, label, group, type, def, o = {}) => T.push({ path, label, group, type, default: def, wired: false, ...o });

/* ---------- Couleurs (clair et sombre) ---------- */
const COLORS = [
  // clé, libellé, clair, sombre, branché
  ["bg", "Fond", "#FAF8FB", "#1E1038", true],
  ["surface", "Surface", "#F0ECF4", "rgba(255,255,255,.08)", true],
  ["surfaceRaised", "Surface élevée", "#FFFFFF", "rgba(255,255,255,.14)", false],
  ["ink", "Texte principal", "#1F1433", "#FFFFFF", true],
  ["mid", "Texte secondaire", "#5E5472", "rgba(255,255,255,.86)", true],
  ["muted", "Texte atténué", "#8A809C", "rgba(255,255,255,.6)", false],
  ["line", "Bordures", "#DCD5E6", "rgba(255,255,255,.22)", true],
  ["primary", "Primaire", "#E8501E", "#FF7A4D", true],
  ["secondary", "Secondaire", "#6A2BD0", "#B9A2FF", true],
  ["accent", "Accent", "#E8501E", "#FF7A4D", false],
  ["btn", "Bouton plein", "#1F1433", "#FFFFFF", true],
  ["btnInk", "Texte du bouton plein", "#FFFFFF", "#1E1038", true],
  ["link", "Liens", "#6A2BD0", "#B9A2FF", false],
  ["linkHover", "Liens au survol", "#4F1FA3", "#D2C3FF", false],
  ["success", "Succès", "#1E7A46", "#8CE8B0", true],
  ["warning", "Avertissement", "#9A5B00", "#FFC857", false],
  ["error", "Erreur", "#C0341D", "#FFB4A5", true],
  ["info", "Information", "#1F5FBF", "#9CC2FF", false],
];
for (const [k, label, light, dark, wired] of COLORS) {
  add("colors.light." + k, label + " (clair)", "Couleurs", "color", light, { wired });
  add("colors.dark." + k, label + " (sombre)", "Couleurs", "color", dark, { wired });
}
add("mode", "Mode", "Couleurs", "enum", "dark", { options: ["dark", "light", "auto"], wired: true });

/* ---------- Fond ---------- */
add("background.style", "Style du fond", "Fond", "enum", "mesh", { options: ["mesh", "flat"], wired: true });
add("background.mesh", "Dégradé", "Fond", "enum", "wayle", { options: ["wayle", "auto"], wired: true });
add("background.grain", "Grain", "Fond", "number", 0.2, { min: 0, max: 0.6, step: 0.05 });

/* ---------- Typographie ---------- */
const fontNames = FONTS.map((f) => f.name);
add("typography.fontHeading", "Police des titres", "Typographie", "font", "Bricolage Grotesque", { options: fontNames, wired: true });
add("typography.fontBody", "Police du texte", "Typographie", "font", "Figtree", { options: fontNames, wired: true });
add("typography.fontMono", "Police monospace", "Typographie", "font", "Monospace système", { options: fontNames, wired: true });
add("typography.custom1.file", "Police importée 1 : fichier", "Typographie", "asset", "", { wired: true });
add("typography.custom1.name", "Police importée 1 : nom", "Typographie", "text", "", { max: 60, wired: true });
add("typography.custom2.file", "Police importée 2 : fichier", "Typographie", "asset", "", { wired: true });
add("typography.custom2.name", "Police importée 2 : nom", "Typographie", "text", "", { max: 60, wired: true });
add("typography.baseSize", "Taille de base", "Typographie", "number", 1.0625, { min: 0.875, max: 1.375, step: 0.0625, unit: "rem", wired: true });
add("typography.lineHeight", "Hauteur de ligne du texte", "Typographie", "number", 1.65, { min: 1.2, max: 2, step: 0.05, wired: true });
add("typography.headingLineHeight", "Hauteur de ligne des titres", "Typographie", "number", 1.08, { min: 0.9, max: 1.5, step: 0.02 });
add("typography.headingTracking", "Espacement des lettres des titres", "Typographie", "number", -0.02, { min: -0.08, max: 0.1, step: 0.005, unit: "em" });
add("typography.scaleRatio", "Échelle typographique", "Typographie", "enum", "1.25", { options: ["1.125", "1.2", "1.25", "1.333", "1.5", "1.618"] });
add("typography.measure", "Largeur max. des paragraphes", "Typographie", "number", 68, { min: 40, max: 120, step: 1, unit: "ch" });
add("typography.fluid", "Tailles fluides (clamp)", "Typographie", "bool", true);

/* ---------- Mise en page ---------- */
add("layout.container", "Largeur du conteneur", "Mise en page", "number", 1100, { min: 1000, max: 1600, step: 10, unit: "px", wired: true });
add("layout.gutter", "Marge latérale", "Mise en page", "number", 1.5, { min: 0.75, max: 4, step: 0.25, unit: "rem" });
add("layout.sectionGap", "Espace entre sections", "Mise en page", "number", 6, { min: 2, max: 12, step: 0.5, unit: "rem" });
add("layout.columns", "Colonnes de la grille", "Mise en page", "number", 12, { min: 1, max: 12, step: 1 });
add("layout.gap", "Gouttière", "Mise en page", "number", 1.25, { min: 0, max: 4, step: 0.25, unit: "rem" });
add("layout.bpSm", "Rupture mobile", "Mise en page", "number", 520, { min: 320, max: 700, step: 10, unit: "px" });
add("layout.bpMd", "Rupture tablette", "Mise en page", "number", 900, { min: 600, max: 1100, step: 10, unit: "px" });

/* ---------- Formes ---------- */
const R = [["pill", "Boutons et pastilles", 999, 999], ["xl", "Grands bandeaux", 28, 80], ["card", "Cartes, formulaires, fenêtres", 24, 80], ["md", "Blocs, citations", 20, 80], ["img", "Images", 18, 80], ["field", "Champs de formulaire", 14, 80]];
for (const [k, label, def, max] of R) add("shape.radius." + k, "Arrondi : " + label, "Formes", "number", def, { min: 0, max: Math.max(max, def), step: 1, unit: "px", wired: true });
add("shape.borderWidth", "Épaisseur des bordures", "Formes", "number", 1, { min: 0, max: 6, step: 0.5, unit: "px" });
add("shape.glassBlur", "Flou d'arrière-plan", "Formes", "number", 16, { min: 0, max: 40, step: 1, unit: "px" });
add("shape.shadow", "Ombres", "Formes", "enum", "soft", { options: ["none", "soft", "medium", "strong"] });

/* ---------- Composants (étape 3) ---------- */
add("components.button.style", "Boutons : style", "Composants", "enum", "solid", { options: ["solid", "outline", "ghost"], wired: true });
add("components.button.case", "Boutons : casse", "Composants", "enum", "normal", { options: ["normal", "upper"], wired: true });
add("components.header.position", "En-tête : position", "Composants", "enum", "fixed", { options: ["fixed", "sticky", "static"] });
add("components.card.hover", "Cartes : survol", "Composants", "enum", "zoom", { options: ["none", "lift", "zoom"], wired: true });
add("components.field.style", "Champs : style", "Composants", "enum", "boxed", { options: ["underlined", "boxed", "filled"], wired: true });
add("components.image.filter", "Images : filtre", "Composants", "enum", "none", { options: ["none", "grayscale", "sepia"], wired: true });
add("components.hero.overlay", "Voile sur la vidéo d'accueil", "Composants", "number", 0, { min: 0, max: 0.9, step: 0.05, wired: true });

/* ---------- Animations ---------- */
add("motion.enabled", "Animations", "Animations", "bool", true, { wired: true });
add("motion.duration", "Durée", "Animations", "number", 0.35, { min: 0.1, max: 1.2, step: 0.05, unit: "s", wired: true });
add("motion.easing", "Courbe", "Animations", "enum", "smooth", { options: ["smooth", "ease", "ease-in-out", "spring"], wired: true });
add("motion.reveal", "Apparition au défilement", "Animations", "enum", "slide", { options: ["none", "fade", "slide", "zoom"], wired: true });
add("motion.smoothScroll", "Défilement doux", "Animations", "bool", true, { wired: true });

/* ---------- Identité (gérée pour l'instant par l'Apparence existante) ---------- */
add("identity.siteName", "Nom du site", "Identité", "text", "Wayle Production", { max: 80 });
add("identity.logoLight", "Logo (fond clair)", "Identité", "asset", "");
add("identity.logoDark", "Logo (fond sombre)", "Identité", "asset", "");
add("identity.favicon", "Favicon", "Identité", "asset", "");
add("identity.ogImage", "Image de partage", "Identité", "asset", "");

/* ---------- Avancé (étape 4) ---------- */
add("advanced.customCssOn", "CSS personnalisé actif", "Avancé", "bool", true, { wired: true });
add("advanced.customCss", "CSS personnalisé", "Avancé", "css", "", { max: 8000, wired: true });

/* ---------- Méta du thème ---------- */
add("name", "Nom du thème", "Thème", "text", "Wayle", { max: 60, wired: true });
add("description", "Description", "Thème", "text", "Identité actuelle : dégradé violet et orange, titres Bricolage Grotesque.", { max: 200, wired: true });

export const SCHEMA = T;
export const EASINGS = {
  smooth: "cubic-bezier(.22,.7,.22,1)",
  ease: "ease",
  "ease-in-out": "ease-in-out",
  spring: "cubic-bezier(.34,1.56,.64,1)",
};
export const COVER_WAYLE =
  "radial-gradient(60% 50% at 80% 6%,rgba(96,44,176,.9),transparent 70%),radial-gradient(75% 60% at 22% 30%,rgba(232,80,30,.72),transparent 68%),radial-gradient(85% 55% at 45% 102%,rgba(106,43,208,.95),transparent 70%),var(--bg)";
export const MESH_WAYLE =
  "radial-gradient(60% 50% at 80% 6%,rgba(96,44,176,.9),transparent 70%),radial-gradient(75% 60% at 22% 30%,rgba(232,80,30,.72),transparent 68%),radial-gradient(55% 45% at 88% 48%,rgba(214,70,40,.5),transparent 70%),radial-gradient(85% 55% at 45% 102%,rgba(106,43,208,.95),transparent 70%),radial-gradient(50% 40% at 4% 96%,rgba(232,140,90,.55),transparent 70%),var(--bg)";

/* Objet de thème complet rempli avec les valeurs par défaut */
export function setPath(o, path, v) {
  const p = path.split(".");
  let c = o;
  for (let i = 0; i < p.length - 1; i++) c = c[p[i]] = c[p[i]] || {};
  c[p[p.length - 1]] = v;
}
export function getPath(o, path) {
  let c = o;
  for (const k of path.split(".")) { if (c == null || typeof c !== "object") return undefined; c = c[k]; }
  return c;
}
export function defaultTheme() {
  const o = {};
  for (const t of SCHEMA) setPath(o, t.path, t.default);
  return o;
}
