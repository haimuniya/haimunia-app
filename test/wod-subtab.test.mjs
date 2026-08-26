// Bug fix: the WOD tab's רישום/היסטוריה pill buttons live in renderWodTab(),
// which only runs on a full top-level tab switch. switch-wod-subtab's
// handler used to only call renderWodContent() (swaps #wodContent's
// innerHTML), leaving the highlighted pill stuck on whichever subtab was
// active when the WOD tab was first opened — the content switched
// correctly, but the highlight didn't follow. Reported by the user with a
// screenshot: היסטוריה highlighted while the רישום (log) form was showing.
//
// Also covers the third sub-tab added right after — בנצ'מרקים — a
// browsable list of the built-in Girls/Heroes WODs (WOD_LIBRARY), separate
// from custom ones, that jumps into the log form on pick.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

test("switching WOD subtabs moves the pill highlight, not just the content", async () => {
  const window = await bootApp();
  window.document.getElementById("tabWodBtn").click();
  const isActive = (subtab) => window.document.querySelector(`.subtabbtn[data-subtab='${subtab}']`).classList.contains("active");

  assert.equal(isActive("log"), true, "log (רישום) is the default subtab and should start highlighted");
  assert.equal(isActive("history"), false);
  assert.equal(isActive("benchmarks"), false);

  window.document.querySelector(".subtabbtn[data-subtab='history']").click();
  assert.equal(isActive("history"), true, "clicking היסטוריה should highlight it");
  assert.equal(isActive("log"), false, "רישום should no longer be highlighted");
  assert.ok(window.document.getElementById("wodHistoryListArea"), "content underneath should have switched to history too");

  window.document.querySelector(".subtabbtn[data-subtab='log']").click();
  assert.equal(isActive("log"), true, "clicking רישום again should move the highlight back");
  assert.equal(isActive("history"), false);
  assert.ok(window.document.getElementById("wodLogDateInput"), "content underneath should have switched back to the log form");
});

test("Benchmarks sub-tab lists only WOD_LIBRARY entries (Girls/Heroes), grouped by category", async () => {
  const window = await bootApp();
  window.document.getElementById("tabWodBtn").click();
  window.document.querySelector(".subtabbtn[data-subtab='benchmarks']").click();

  assert.ok(window.document.getElementById("wodBenchmarksListArea"), "benchmarks content should be rendered");
  const bodyText = window.document.getElementById("wodBenchmarksListArea").textContent;
  assert.ok(bodyText.includes("Fran"), "a real built-in benchmark should be listed");
  assert.ok(bodyText.includes("Murph"), "both Girls and Heroes should be represented");

  // A custom WOD must never show up in this list.
  await window.addCustomWod("Test Custom Not A Benchmark", "load", "");
  window.document.querySelector(".subtabbtn[data-subtab='benchmarks']").click();
  const afterCustom = window.document.getElementById("wodBenchmarksListArea").textContent;
  assert.ok(!afterCustom.includes("Test Custom Not A Benchmark"), "custom WODs should not appear in the benchmarks list");
});

test("picking a benchmark selects it and jumps straight to the log form", async () => {
  const window = await bootApp();
  window.document.getElementById("tabWodBtn").click();
  window.document.querySelector(".subtabbtn[data-subtab='benchmarks']").click();

  const franBtn = window.document.querySelector("[data-action='select-benchmark'][data-id='fran']");
  assert.ok(franBtn, "Fran should be pickable from the benchmarks list");
  franBtn.click();

  const isActive = (subtab) => window.document.querySelector(`.subtabbtn[data-subtab='${subtab}']`).classList.contains("active");
  assert.equal(isActive("log"), true, "picking a benchmark should switch to the log subtab");
  assert.equal(isActive("benchmarks"), false);
  const headerText = window.document.querySelector(".exercise-select span")?.textContent || "";
  assert.equal(headerText, "Fran", "the log form should show the picked benchmark");
});
