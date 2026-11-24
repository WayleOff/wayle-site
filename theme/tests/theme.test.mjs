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
  assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length);
});
test("modes", () => {
  const t = (mode) => compile(validate({ mode }).theme);
  assert.match(t("dark"), /:root:not\(\[data-theme="light"\]\)\{/);
  assert.match(t("light"), /:root\[data-theme="dark"\]\{/);
  assert.match(t("auto"), /prefers-color-scheme:dark/);
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
