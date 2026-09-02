// Regressions found while auditing the WOD log form (renderWodLogSection)
// and its expanded history card (renderWodDetailCard). All three were silent:
// nothing threw, the wrong thing just showed up (or didn't).
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

// Selects a benchmark the way a user does — through the Benchmarks sub-tab —
// so the whole selection path runs, not just an internal state poke.
function pickBenchmark(window, id) {
  window.document.getElementById("tabWodBtn").click();
  window.document.querySelector(".subtabbtn[data-subtab='benchmarks']").click();
  window.document.querySelector(`[data-action='select-benchmark'][data-id='${id}']`).click();
}

async function logTime(window, minutes, seconds) {
  window.applyFieldValue("wod-step", "wodMinutes", minutes);
  window.applyFieldValue("wod-step", "wodSeconds", seconds);
  await window.saveWod();
}

test("the PR stripe flash actually shows after a record WOD score", async () => {
  const window = await bootApp();
  pickBenchmark(window, "fran");
  await logTime(window, 4, 30);
  // flashWodPR() used to run BEFORE render(), which replaces #content's
  // innerHTML wholesale — it lit an element that was discarded in the same
  // tick, so the flash was never visible for a single frame.
  const flash = window.document.getElementById("wodFlashBox");
  assert.ok(flash, "the flash box should be in the freshly rendered log form");
  assert.equal(flash.style.display, "flex", "a PR should leave the flash box visible after the re-render");
});

test("an Rx entry never carries the Scaled-only notes/weight fields", async () => {
  const window = await bootApp();
  pickBenchmark(window, "fran");

  // Fill in the Scaled-only fields, then switch back to Rx — those fields are
  // no longer on screen, so saving must not smuggle them onto the entry. It
  // used to, and sanitizeWodEntry then dropped them again on the next load,
  // so the notes silently disappeared between sessions.
  window.document.querySelector("[data-action='set-rx'][data-rx='0']").click();
  const notes = window.document.getElementById("wodNotesInput");
  notes.value = "banded pull-ups";
  notes.dispatchEvent(new window.Event("input"));
  window.applyFieldValue("wod-step", "wodScaledWeight", 25);
  window.document.querySelector("[data-action='set-rx'][data-rx='1']").click();
  assert.equal(window.document.getElementById("wodNotesInput"), null, "the notes field is Scaled-only");

  await logTime(window, 5, 0);
  const entry = window.wodEntriesFor("fran")[0];
  assert.equal(entry.rx, true);
  assert.equal(entry.notes, null, "an Rx entry should not keep the hidden modification note");
  assert.equal(entry.scaledWeight, null, "an Rx entry should not keep a scaled weight either");
});

test("a For Time WOD's trend chart plots faster times higher, not lower", async () => {
  const window = await bootApp();
  pickBenchmark(window, "fran");
  await logTime(window, 4, 30);
  await logTime(window, 3, 45); // best
  await logTime(window, 6, 0);  // worst

  const wod = window.allWods().find((w) => w.id === "fran");
  const points = window.renderWodDetailCard(wod).match(/points="([^"]+)"/)[1]
    .split(" ").map((p) => Number(p.split(",")[1]));
  assert.equal(points.length, 3);
  // SVG y grows downwards, so "higher on the chart" is the SMALLEST y. Plotted
  // raw, a For Time score climbs as the athlete gets SLOWER — the line read as
  // progress while the times got worse.
  const [first, best, worst] = points;
  assert.ok(best < first, "3:45 should sit above the earlier 4:30");
  assert.ok(worst > first, "6:00 should sit below the earlier 4:30");
});

test("a Load WOD's trend chart is still plotted the normal way up", async () => {
  const window = await bootApp();
  await window.addCustomWod("Test Load Trend", "load", "");
  for (const kg of [60, 80, 70]) {
    window.applyFieldValue("wod-step", "wodWeight", kg);
    await window.saveWod();
  }
  const wod = window.allWods().find((w) => w.name === "Test Load Trend");
  const points = window.renderWodDetailCard(wod).match(/points="([^"]+)"/)[1]
    .split(" ").map((p) => Number(p.split(",")[1]));
  const [first, best, middle] = points;
  assert.ok(best < first, "80 kg should sit above 60 kg");
  assert.ok(middle > best && middle < first, "70 kg belongs between the two");
});

test("the log form keeps showing the score format once the WOD has history", async () => {
  const window = await bootApp();
  pickBenchmark(window, "fran");
  assert.ok(window.renderWodLogSection().includes("For Time"), "format should be visible before any attempt");
  await logTime(window, 4, 30);
  // The format used to live in a stat card that the "you've done this before"
  // panel replaced outright, so it vanished exactly when a second reference
  // point made it useful.
  assert.ok(window.renderWodLogSection().includes("For Time"), "format should still be visible with history");
});

test("EMOM's log form offers an attempt count instead of a permanently empty best", async () => {
  const window = await bootApp();
  await window.addCustomWod("Test EMOM Hero Stats", "emom", "", {
    emomMinutes: 10, emomMovements: ["Burpees"], emomTargetReps: [8],
  });
  window.document.getElementById("tabWodBtn").click();
  // EMOM has no single comparable score across attempts (see bestWodScore),
  // so its "שיא" cell could only ever read "—".
  const html = window.renderWodLogSection();
  assert.ok(!/stat-label">שיא</.test(html), "EMOM should not get a best-score cell");
  assert.ok(/stat-label">ניסיונות</.test(html), "EMOM should get an attempt count instead");
});
