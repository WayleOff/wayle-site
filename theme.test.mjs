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
