// CONTRAST, COMPUTED FROM THE SHIPPED TOKENS (audit 2026-11, finding 1).
//
// Four places failed: the delete-confirm button (2.13:1), input placeholders
// (2.93:1), the active WOD-builder format chip's gloss (2.7:1) and the faded
// WOD save button (1.47:1). Each is checked here the way a contrast checker
// measures it - WCAG relative luminance, with any translucent layer blended
// over what is under it - in both themes, from the values in index.html.
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appJs = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n").replace(/\/\*[\s\S]*?\*\//g, "");

function tokensIn(block) {
  const t = {};
  for (const m of block.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;?/g)) t[m[1]] = m[2];
  return t;
}
function blockAfter(marker) {
  const at = html.indexOf(marker);
  const open = html.indexOf("{", at);
  return html.slice(open, html.indexOf("}", open));
}
const light = tokensIn(blockAfter(":root{"));
const dark = tokensIn(blockAfter(':root[data-theme="dark"]{'));
// The scene sheets re-tint --surface/--surface2 (see .scene-sheet in index.html).
const sceneLight = tokensIn(css.match(/\n\s*\.scene-sheet\{--surface:[^}]*\}/)[0]);
const sceneDark = tokensIn(css.match(/:root\[data-theme="dark"\] \.scene-sheet\{--surface:[^}]*\}/)[0]);

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const blend = (fg, alpha, bg) => fg.map((c, i) => c * alpha + bg[i] * (1 - alpha));
function lum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const [x, y] = [lum(typeof a === "string" ? rgb(a) : a), lum(typeof b === "string" ? rgb(b) : b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const AA = 4.5;
const themes = { light, dark };

test("sanity: the tokens these checks use are found in both themes", () => {
  for (const [name, t] of Object.entries(themes)) {
    for (const k of ["surface", "surface2", "bg", "steel", "red", "energy-text", "energy"]) assert.ok(t[k], `${name} --${k}`);
  }
  assert.ok(sceneLight.surface && sceneLight.surface2 && sceneDark.surface && sceneDark.surface2);
});

test("delete-confirm: the filled danger button keeps white ink on --red (was #FF9488, 2.13:1)", () => {
  // The dark override for outlined danger chips must not reach the filled one.
  for (const m of css.matchAll(/([^{}]*\.chip-btn\.danger[^{}]*)\{\s*color:#FF9488;?\s*\}/g)) {
    assert.match(m[1], /:not\(\.primary\)/, `this rule outranks .chip-btn.primary.danger: ${m[1].trim()}`);
  }
  assert.match(css, /\.chip-btn\.primary\.danger\{[^}]*background:var\(--red\);[^}]*color:#fff;/);
  for (const [name, t] of Object.entries(themes)) {
    const r = ratio("#ffffff", t.red);
    assert.ok(r >= AA, `${name}: white on --red ${t.red} is ${r.toFixed(2)}:1`);
  }
});

test("placeholders use --steel at full opacity, and clear 4.5:1 on every input surface", () => {
  assert.match(css, /input::placeholder, textarea::placeholder\{ color:var\(--steel\); opacity:1; \}/);
  const surfaces = (t, s) => [t.surface, t.surface2, t.bg, s.surface, s.surface2];
  for (const [name, t, s] of [["light", light, sceneLight], ["dark", dark, sceneDark]]) {
    for (const bg of surfaces(t, s)) {
      const r = ratio(t.steel, bg);
      assert.ok(r >= AA, `${name}: --steel ${t.steel} on ${bg} is ${r.toFixed(2)}:1`);
    }
  }
});

test("WOD builder: the active format chip's gloss clears 4.5:1 on its tinted background (was 2.7:1)", () => {
  const rule = css.match(/\.format-chip\.active \.format-chip-sub\{([^}]*)\}/)[1];
  assert.match(rule, /color:var\(--energy-text\)/);
  assert.doesNotMatch(rule, /opacity/, "no fade on top of the ink");
  const tint = css.match(/\.format-chip\.active\{[^}]*background:rgba\((\d+),(\d+),(\d+),([.\d]+)\)/);
  const [r, g, b, a] = tint.slice(1).map(Number);
  // The builder's cards sit on --surface (.wodbuild-card-details).
  for (const [name, t] of Object.entries(themes)) {
    const bg = blend([r, g, b], a, rgb(t.surface));
    const c = ratio(t["energy-text"], bg);
    assert.ok(c >= AA, `${name}: --energy-text on the active tint is ${c.toFixed(2)}:1`);
  }
});

test("WOD save before Rx is answered: no opacity fade, a muted fill whose label clears 4.5:1 (was 1.47:1)", () => {
  const at = appJs.indexOf("function syncWodSaveCta(");
  const body = appJs.slice(at, appJs.indexOf("\n}\n", at));
  assert.doesNotMatch(body, /opacity = unanswered/, "the inline .45 fade is gone");
  const rule = css.match(/body\[data-scene\] #bottomBar \.save-btn\[aria-disabled="true"\]\{([^}]*)\}/)[1];
  assert.match(rule, /background:var\(--surface2\)/);
  assert.match(rule, /color:var\(--steel\)/);
  for (const [name, t] of Object.entries(themes)) {
    const c = ratio(t.steel, t.surface2);
    assert.ok(c >= AA, `${name}: --steel on --surface2 is ${c.toFixed(2)}:1`);
  }
  // And the enabled scene button it returns to.
  assert.ok(ratio("#ffffff", "#d92f2b") >= AA);
});
