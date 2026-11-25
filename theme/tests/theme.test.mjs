import test from "node:test";
import assert from "node:assert/strict";
import { validate } from "../tokens/validate.js";
import { compile } from "../engine/compile.js";
import { parse, contrast, scale, suggestText } from "../engine/color.js";
import { contrastReport } from "../engine/contrast.js";
import { cssFromStored } from "../engine/index.js";
import { SCHEMA, defaultTheme } from "../tokens/schema.js";

test("défauts valides", () => { assert.ok(validate({}).ok); assert.ok(SCHEMA.every((t) => t.label && t.group)); });
test("chemins uniques", () => { assert.equal(new Set(SCHEMA.map((t) => t.path)).size, SCHEMA.length); });
test("couleurs : formats", () => {
  assert.deepEqual(parse("#fff"), { r: 255, g: 255, b: 255, a: 1 });
  assert.equal(parse("rgba(255,255,255,.08)").a, 0.08);
  assert.ok(parse("hsl(270 60% 50%)"));
  for (const bad of ["red", "url(x)", "#12", "rgb(1,2)", "#fff;}", "var(--x)", "expression(1)", 42, null]) assert.equal(parse(bad), null, String(bad));
});
test("rejet des injections CSS", () => {
  const attacks = [
    { colors: { dark: { bg: "#000;}body{display:none" } } },
    { colors: { dark: { bg: "url(http://x)" } } },
    { typography: { fontHeading: "Arial;}@import url(x)" } },
    { shape: { radius: { card: "24px;}" } } },
    { motion: { easing: "ease;}a{" } },
    { name: "<script>" },
    JSON.parse('{"__proto__":{"polluted":1}}'),
    { inconnu: 1 },
  ];
  for (const a of attacks) { const r = validate(a); assert.equal(r.ok, false, JSON.stringify(a)); }
  assert.equal({}.polluted, undefined);
});
test("bornes numériques", () => {
  assert.equal(validate({ layout: { container: 99999 } }).ok, false);
  assert.equal(validate({ layout: { container: NaN } }).ok, false);
  assert.equal(validate({ layout: { container: "1100" } }).ok, false);
  assert.ok(validate({ layout: { container: 1200 } }).ok);
});
test("CSS compilé ne contient rien de dangereux", () => {
  const css = compile(validate({}).theme);
  assert.ok(!/@import|url\(|expression|<|javascript:/i.test(css));
  const custom = compile(validate({ typography: { fontHeading: "Playfair Display" } }).theme);
  assert.match(custom, /^@import url\("https:\/\/fonts\.googleapis\.com\/css2\?family=Playfair\+Display:wght@400\.\.800&display=swap"\);/);
  assert.ok(!/@import/.test(custom.split("\n").slice(1).join("\n")));
  assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length);
});
test("modes", () => {
  const t = (mode) => compile(validate({ mode }).theme);
  assert.match(t("dark"), /:root:not\(\[data-theme="light"\]\)\{/);
  assert.match(t("light"), /:root\[data-theme="dark"\]\{/);
  assert.match(t("auto"), /--mode:auto/);
});
test("stocké invalide → défauts, pas d'exception", () => {
  assert.ok(cssFromStored({ colors: { dark: { bg: "oops" } } }).includes("--bg:#1E1038"));
  assert.ok(cssFromStored(null).includes("--bg:#FAF8FB"));
});
test("contraste WCAG", () => {
  assert.ok(Math.abs(contrast("#000", "#fff") - 21) < 0.01);
  assert.ok(contrast("#777", "#fff") < 4.5);
  assert.ok(contrast(suggestText("#777", "#fff"), "#fff") >= 4.5);
  assert.ok(contrastReport(defaultTheme()).length > 10);
});
test("nuances", () => { const s = scale("#E8501E"); assert.equal(Object.keys(s).length, 10); });
test("fond auto", () => {
  const css = compile(validate({ background: { mesh: "auto" } }).theme);
  assert.match(css, /--bg-mesh:radial-gradient/);
});

import { PRESETS } from "../themes/presets.js";
test("presets : valides, contraste lisible", () => {
  assert.ok(PRESETS.length >= 9);
  for (const p of PRESETS) {
    const v = validate(p.theme);
    assert.ok(v.ok, p.id + " : " + JSON.stringify(v.errors));
    const rep = contrastReport(v.theme).filter((r) => r.mode === (v.theme.mode === "light" ? "light" : "dark"));
    for (const r of rep.filter((x) => ["Texte principal / fond", "Texte secondaire / fond", "Texte du bouton / bouton"].includes(x.label))) assert.ok(r.ratio >= 4.5, `${p.id} ${r.label} ${r.ratio}`);
    assert.ok(!/@import(?!\s+url\("https:\/\/fonts\.googleapis\.com\/css2\?family=[A-Za-z0-9+:@.;=&]+&display=swap"\);)/.test(compile(v.theme)));
  }
});

test("composants : rien d'émis par défaut, règles sûres sinon", () => {
  const base = compile(validate({}).theme);
  assert.ok(!/\.btn|rvIn|grayscale|\.cover::before/.test(base));
  assert.match(base, /--dur-k:1;/);
  const t = validate({ components: { button: { style: "outline", case: "upper" }, card: { hover: "lift" }, field: { style: "underlined" }, image: { filter: "grayscale" }, hero: { overlay: 0.4 } }, motion: { reveal: "zoom", duration: 0.7, enabled: true, smoothScroll: false } });
  assert.ok(t.ok, JSON.stringify(t.errors));
  const css = compile(t.theme);
  for (const re of [/text-transform:uppercase/, /translateY\(-4px\)/, /border-width:0 0 1\.5px/, /grayscale\(1\)/, /rgba\(20,8,40,0\.4\)/, /@keyframes rvIn\{from\{opacity:0;scale:\.96\}\}/, /--dur-k:2;/, /scroll-behavior:auto/]) assert.match(css, re, String(re));
  assert.match(compile(validate({ motion: { enabled: false } }).theme), /animation:none!important/);
});
test("mode clair : fond de bandeau reste sombre", () => {
  const css = compile(validate({ mode: "light", background: { style: "flat" } }).theme);
  assert.match(css, /--bg-cover:#14082A/);
  assert.match(css, /--mode:light/);
});

/* ---------- étape 4 ---------- */
import { checkCustomCss } from "../tokens/validate.js";
import { fromBase, dominantColors, randomPatch, paletteToPatch, applyPatch, mulberry32, HARMONIES } from "../engine/palette.js";
import { setPath } from "../tokens/schema.js";

test("CSS perso : accepte le CSS ordinaire", () => {
  for (const c of ["", ".btn{letter-spacing:.02em}", "/* note */ h1 > span{color:red}\n@media (max-width:600px){.cover{min-height:60vh}}", ".x{background:url(/api/media?id=abc_123)}", '.x{background:url("/api/media?id=abc")}', ".x{content:'a'}"])
    assert.equal(checkCustomCss(c), null, c);
});
test("CSS perso : refuse tout ce qui charge ou s'échappe", () => {
  const bad = [
    "@import url(https://evil.test/x.css);", "@IMPORT 'x.css';", "@charset 'x';", "@/**/import 'x';",
    ".x{background:url(https://evil.test/a.png)}", ".x{background:url(//evil.test/a.png)}", ".x{background:url(data:image/png;base64,AAAA)}", ".x{background:url(/other/path.png)}",
    ".x{background:url(/api/media?id=a/../b)}", ".x{background:ur/**/l(https://e.t/a)}", ".x{background:URL( https://e.t/a )}",
    ".x{background:image-set('https://e.t/a.png' 1x)}", ".x{background:-webkit-image-set(url(/api/media?id=a) 1x)}", ".x{content:src('x')}",
    ".x{width:expression(alert(1))}", ".x{background:javascript:alert(1)}", ".x{-moz-binding:url(/api/media?id=a)}", ".x{behavior:url(x.htc)}",
    ".x{content:'\\75rl(x)'}", "</style><script>alert(1)</script>", ".x{color:red}<!--", ".x{",
    "}.y{color:red}", ".x{background:url(/api/media?id=a}", ".x{content:'abc}", "/* ouvert .x{color:red}", ".x{color:red;}\u0007",
  ];
  for (const c of bad) assert.notEqual(checkCustomCss(c), null, "devait être refusé : " + JSON.stringify(c));
  assert.notEqual(checkCustomCss("a".repeat(8001)), null);
});
test("CSS perso : validé, stocké, émis sans commentaires, en dernier", () => {
  const t = defaultTheme(); t.advanced.customCss = "/* secret */.btn{letter-spacing:.03em}"; 
  assert.ok(validate(t).ok);
  const css = compile(validate(t).theme);
  assert.ok(css.trim().endsWith(".btn{letter-spacing:.03em}"));
  assert.ok(!css.includes("secret"));
  t.advanced.customCssOn = false; assert.ok(!compile(validate(t).theme).includes("letter-spacing:.03em"));
  /* un CSS invalide qui parviendrait au compilateur n'est jamais émis */
  const raw = defaultTheme(); raw.advanced.customCss = "@import url(https://evil.test/x.css);";
  assert.ok(!compile(raw).includes("evil.test"));
  /* et le validateur le refuse à l'entrée */
  assert.ok(!validate({ advanced: { customCss: "@import url(https://evil.test/x.css);" } }).ok);
});
test("polices importées : @font-face seulement si utilisée et envoyée", () => {
  const t = defaultTheme();
  assert.ok(!compile(t).includes("@font-face"));
  t.typography.custom1.file = "/api/media?id=mabc123"; t.typography.custom1.name = "Ma Police";
  assert.ok(!compile(t).includes("@font-face"), "non utilisée");
  t.typography.fontHeading = "Police importée 1";
  const css = compile(validate(t).theme);
  assert.ok(/@font-face\{font-family:"Police importée 1";src:url\(\/api\/media\?id=mabc123\) format\("woff2"\)/.test(css));
  assert.ok(css.includes('--font-heading:"Police importée 1",system-ui,sans-serif'));
  /* sans fichier : pas de @font-face, repli système */
  const u = defaultTheme(); u.typography.fontBody = "Police importée 2";
  assert.ok(!compile(u).includes("@font-face"));
  /* le fichier doit être un média du site */
  assert.ok(!validate({ typography: { custom1: { file: "https://evil.test/f.woff2" } } }).ok);
  assert.ok(!validate({ typography: { custom1: { file: '/api/media?id=a");}body{x:y' } } }).ok);
  assert.ok(!validate({ typography: { custom1: { name: "<b>" } } }).ok);
});
test("thème par défaut : aucune règle nouvelle émise", () => {
  const css = compile(defaultTheme());
  assert.ok(!/@font-face|css personnalisé/.test(css));
});

test("palette depuis une couleur : lisible, valide, clair et sombre", () => {
  const rng = mulberry32(42), bases = ["#E8501E", "#2563EB", "#FFE600", "#111111", "#FFFFFF", "#808080", "#00FF88", "#7C3AED", "#B4381F"];
  for (let i = 0; i < 60; i++) bases.push("#" + Math.floor(rng() * 0xffffff).toString(16).padStart(6, "0"));
  for (const b of bases) for (const h of Object.keys(HARMONIES)) {
    const pal = fromBase(b, h); assert.ok(pal, b);
    const t = defaultTheme(); applyPatch(t, paletteToPatch(pal), setPath);
    const v = validate(t); assert.ok(v.ok, b + " " + h + " " + JSON.stringify(v.errors));
    for (const sc of ["dark", "light"]) {
      const c = pal[sc], bg = c.bg;
      assert.ok(contrast(c.ink, bg) >= 7, `ink ${b} ${h} ${sc}`);
      assert.ok(contrast(c.mid, bg) >= 4.5, `mid ${b} ${h} ${sc}`);
      assert.ok(contrast(c.primary, bg) >= 4.5, `primary ${b} ${h} ${sc} ${contrast(c.primary, bg)}`);
      assert.ok(contrast(c.secondary, bg) >= 4.5, `secondary ${b} ${h} ${sc}`);
      assert.ok(contrast(c.btnInk, c.btn) >= 4.5, `btn ${b} ${h} ${sc}`);
    }
  }
  assert.equal(fromBase("pas une couleur"), null);
});
const px = (list) => { const a = []; for (const [n, r, g, b, al] of list) for (let i = 0; i < n; i++) a.push(r, g, b, al == null ? 255 : al); return Uint8ClampedArray.from(a); };
test("palette depuis une image : dominantes", () => {
  const d = dominantColors(px([[700, 200, 40, 40], [300, 30, 60, 200], [2000, 255, 255, 255], [500, 10, 10, 10]]));
  const hue = (hex) => { const p = parse(hex); const mx = Math.max(p.r, p.g, p.b); return mx === p.r ? "r" : mx === p.b ? "b" : "g"; };
  assert.equal(hue(d.primary), "r"); assert.ok(d.secondary && hue(d.secondary) === "b");
  assert.equal(dominantColors(px([[500, 120, 120, 120], [500, 130, 130, 130]])).secondary, null);
  assert.equal(dominantColors(px([[100, 255, 0, 0, 0]])).secondary, null); /* image transparente */
  assert.equal(dominantColors(new Uint8ClampedArray(0)).primary, "#808080");
  const one = dominantColors(px([[900, 40, 180, 90]])); assert.equal(one.secondary, null);
});
test("thème aléatoire : toujours valide et lisible", () => {
  for (let seed = 1; seed <= 150; seed++) for (const kind of ["all", "colors", "fonts", "shapes"]) {
    const cur = defaultTheme(); if (seed % 2) cur.mode = "light";
    const patch = randomPatch(kind, mulberry32(seed), cur);
    const t = defaultTheme(); applyPatch(t, patch, setPath);
    const v = validate(t); assert.ok(v.ok, kind + seed + JSON.stringify(v.errors));
    if (kind === "colors") assert.equal(patch.mode, undefined, "les couleurs seules gardent le mode");
    if (kind === "colors" || kind === "all") {
      const rep = contrastReport(v.theme).filter((r) => ["ink", "mid", "btnInk", "primary", "secondary"].includes(r.fg));
      assert.ok(rep.every((r) => r.ok), kind + seed + JSON.stringify(rep.filter((r) => !r.ok)));
    }
    if (kind === "fonts") assert.deepEqual(Object.keys(patch).sort(), ["typography.fontBody", "typography.fontHeading"]);
  }
});
