/* Thèmes prêts à l'emploi. Chaque thème n'indique que ses écarts avec le thème Wayle (défauts du schéma).
   Variantes sombres uniquement pour l'instant : les thèmes clairs arrivent avec les composants (étape 3). */
const R = (pill, xl, card, md, img, field) => ({ pill, xl, card, md, img, field });
const dark = (o) => ({ colors: { dark: o } });
const merge = (...a) => a.reduce((m, x) => { for (const k of Object.keys(x)) m[k] = typeof x[k] === "object" && !Array.isArray(x[k]) && m[k] ? merge(m[k], x[k]) : x[k]; return m; }, {});

export const PRESETS = [
  { id: "wayle", name: "Wayle (actuel)", description: "Dégradé violet et orange, titres Bricolage Grotesque.", theme: {} },
  { id: "minimal-sombre", name: "Minimal sombre", description: "Fond uni, une seule couleur d'accent, angles discrets.",
    theme: merge(dark({ bg: "#0F1115", surface: "rgba(255,255,255,.05)", ink: "#F5F6F8", mid: "rgba(245,246,248,.74)", line: "rgba(255,255,255,.14)", primary: "#8AB4FF", secondary: "#C7CCD6", btn: "#F5F6F8", btnInk: "#0F1115" }),
      { background: { style: "flat" }, typography: { fontHeading: "Inter", fontBody: "Inter" }, shape: { radius: R(10, 16, 14, 12, 10, 8) } }) },
  { id: "creatif", name: "Créatif / studio", description: "Rose et cyan électriques, dégradé automatique, titres Space Grotesk.",
    theme: merge(dark({ bg: "#12031F", surface: "rgba(255,255,255,.08)", ink: "#FFFFFF", mid: "rgba(255,255,255,.86)", line: "rgba(255,255,255,.24)", primary: "#FF3D9A", secondary: "#3DE0FF", btn: "#FFFFFF", btnInk: "#12031F" }),
      { background: { mesh: "auto" }, typography: { fontHeading: "Space Grotesk", fontBody: "DM Sans" }, shape: { radius: R(999, 40, 28, 24, 24, 18) } }) },
  { id: "brutaliste", name: "Brutaliste", description: "Noir, jaune acide, angles droits, bordures franches.",
    theme: merge(dark({ bg: "#0A0A0A", surface: "#161616", ink: "#FFFFFF", mid: "#D9D9D9", line: "#FFFFFF", primary: "#FFE600", secondary: "#FF5A1F", btn: "#FFE600", btnInk: "#0A0A0A" }),
      { background: { style: "flat" }, typography: { fontHeading: "Space Grotesk", fontBody: "Inter", fontMono: "JetBrains Mono" }, shape: { radius: R(0, 0, 0, 0, 0, 0) } }) },
  { id: "doux", name: "Doux / organique", description: "Vert profond et sable, formes très arrondies.",
    theme: merge(dark({ bg: "#14231C", surface: "rgba(255,255,255,.07)", ink: "#F6F1E7", mid: "rgba(246,241,231,.82)", line: "rgba(246,241,231,.22)", primary: "#F2B880", secondary: "#A8D5B5", btn: "#F6F1E7", btnInk: "#14231C" }),
      { background: { mesh: "auto" }, typography: { fontHeading: "DM Sans", fontBody: "DM Sans" }, shape: { radius: R(999, 44, 36, 28, 28, 22) } }) },
  { id: "luxe", name: "Luxe", description: "Noir et or, titres Playfair Display, angles quasi droits.",
    theme: merge(dark({ bg: "#0B0B0C", surface: "rgba(255,255,255,.05)", ink: "#F4EFE6", mid: "rgba(244,239,230,.8)", line: "rgba(212,175,55,.35)", primary: "#D4AF37", secondary: "#E8D9A8", btn: "#D4AF37", btnInk: "#0B0B0C" }),
      { background: { style: "flat" }, typography: { fontHeading: "Playfair Display", fontBody: "Inter" }, shape: { radius: R(2, 4, 2, 2, 2, 2) } }) },
];
for (const p of PRESETS) p.theme.name = p.name, p.theme.description = p.description;
export const presetById = (id) => PRESETS.find((p) => p.id === id) || null;
