// History tab: the overview stat row and the exercise-search dead-ends.
//
// The stat row sits directly under the header's streak flame, so "אימונים
// השבוע" has to mean what the streak and the calendar's day dots already mean
// by a trained day — otherwise a week of nothing but WODs reads as 0 sessions
// next to a lit streak flame.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

const statValues = (window) =>
  [...window.document.querySelectorAll(".history-stat-value")].map((el) => el.textContent);

test("a week of nothing but WODs still counts as a session in the History overview", async () => {
  const window = await bootApp();
  await window.addCustomWod("Test Stat WOD", "amrap", "");
  const wod = window.allWods().find((w) => w.name === "Test Stat WOD");
  window.selectedWodId = wod.id;
  window.applyFieldValue("wod-step", "rounds", 9);
  await window.saveWod();

  window.document.getElementById("tabHistoryBtn").click();
  const [prs, sessions, sets] = statValues(window);
  assert.equal(sessions, "1", "a logged WOD is a session, same as it is for the streak and the calendar");
  assert.equal(prs, "1", "a first WOD attempt is a PR, and the calendar already draws it as one");
  assert.equal(sets, "0", "סטים שנרשמו stays strength-only — a WOD has no sets to count");
});

test("clearing all data also clears the History search, so the first new set isn't hidden behind a stale query", async () => {
  const window = await bootApp();
  await window.addMovement("Test Stale Squat", "Squat");
  window.applyFieldValue("step", "weight", 100);
  window.applyFieldValue("step", "reps", 5);
  window.applyFieldValue("step", "sets", 1);
  await window.saveSet();

  window.document.getElementById("tabHistoryBtn").click();
  // Type through the real input handler — historySearch is a module-level
  // binding, not a window property, so it can only be driven from the UI.
  const input = window.document.getElementById("historySearch");
  input.value = "Test Stale";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(window.document.querySelectorAll(".history-entry").length, 1, "the query matches the one exercise");

  await window.clearAllData();
  await window.addMovement("Test Fresh Press", "Press");
  window.applyFieldValue("step", "weight", 40);
  window.applyFieldValue("step", "reps", 5);
  window.applyFieldValue("step", "sets", 1);
  await window.saveSet();
  window.document.getElementById("tabHistoryBtn").click();

  assert.equal(window.document.getElementById("historySearch").value, "");
  assert.equal(window.document.querySelectorAll(".history-entry").length, 1, "the freshly logged exercise is visible, not filtered out by a query for wiped data");
});

test("a search with no matches offers a way out instead of a dead end", async () => {
  const window = await bootApp();
  await window.addMovement("Test Exit Squat", "Squat");
  window.applyFieldValue("step", "weight", 100);
  window.applyFieldValue("step", "reps", 5);
  window.applyFieldValue("step", "sets", 1);
  await window.saveSet();

  window.document.getElementById("tabHistoryBtn").click();
  const input = window.document.getElementById("historySearch");
  input.value = "zzzznomatch";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));

  const clear = window.document.querySelector("#historyListArea [data-action='clear-history-search']");
  assert.ok(clear, "the no-match empty state offers a clear-search button");
  clear.click();
  assert.equal(window.document.getElementById("historySearch").value, "");
  assert.equal(window.document.querySelectorAll(".history-entry").length, 1);
});

test("with no logged sets at all, History points at the Log tab rather than just going blank", async () => {
  const window = await bootApp();
  window.document.getElementById("tabHistoryBtn").click();

  assert.equal(window.document.getElementById("historySearch"), null, "no search box before there's anything to search");
  const cta = window.document.querySelector(".history-empty-cta");
  assert.ok(cta, "the empty state carries a call to action");
  cta.click();
  assert.ok(window.document.getElementById("tabAddBtn").classList.contains("active"), "it lands on the Log tab");
});
