// Accessibility: users can bump the whole app's text size up (רגיל / גדול /
// גדול מאוד), for members who can't read the smaller labels. Same mechanism
// as the existing theme preference — localStorage (not IndexedDB) so
// theme-init.js can apply it synchronously before first paint, no flash of
// the default size. The actual visual scaling (CSS zoom on <html>, and that
// it doesn't break position:fixed modals) can't be verified in jsdom — see
// scripts/browser-check/text-scale.mjs for that half.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

test("text scale defaults to normal, with no data-text-scale attribute", async () => {
  const window = await bootApp();
  assert.equal(window.document.documentElement.hasAttribute("data-text-scale"), false);
});

test("setTextScalePref applies the attribute, persists to localStorage, and re-renders the footer row", async () => {
  const window = await bootApp();
  window.setTextScalePref("large");
  assert.equal(window.document.documentElement.getAttribute("data-text-scale"), "large");
  assert.equal(window.localStorage.getItem("haimunia:textScale"), "large");

  window.setTextScalePref("xlarge");
  assert.equal(window.document.documentElement.getAttribute("data-text-scale"), "xlarge");

  window.setTextScalePref("normal");
  assert.equal(window.document.documentElement.hasAttribute("data-text-scale"), false, "normal should remove the attribute, not set it to a no-op value");
});

test("setTextScalePref ignores an invalid value instead of applying garbage", async () => {
  const window = await bootApp();
  window.setTextScalePref("large");
  window.setTextScalePref("huge"); // not a real option
  assert.equal(window.document.documentElement.getAttribute("data-text-scale"), "large", "an invalid preference should be a no-op, not overwrite the valid one");
});

test("loadTextScalePref reads a previously-saved preference back from localStorage", async () => {
  const window = await bootApp();
  window.localStorage.setItem("haimunia:textScale", "xlarge");
  window.loadTextScalePref();
  window.applyTextScalePref();
  assert.equal(window.document.documentElement.getAttribute("data-text-scale"), "xlarge");
});

test("the footer's text-scale row reflects the current selection", async () => {
  const window = await bootApp();
  window.setTextScalePref("xlarge");
  const active = window.document.querySelector("[data-action='set-text-scale'][data-pref='xlarge']");
  assert.equal(active.getAttribute("aria-checked"), "true");
  const inactive = window.document.querySelector("[data-action='set-text-scale'][data-pref='normal']");
  assert.equal(inactive.getAttribute("aria-checked"), "false");
});
