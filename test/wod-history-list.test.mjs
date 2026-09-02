// The WOD ▸ "היסטוריה" sub-tab list. Three things this locks down, all of
// which were real defects in the list before:
//   1. An EMOM WOD has no comparable best score (see bestWodScore), so
//      formatWodBest returns "—" for it — which, printed in the score column
//      under a heading reading "all-time records", claimed the user had no
//      score at all. The row now counts attempts instead.
//   2. A search matching nothing was a dead end: no way back to the full list
//      short of finding and hand-clearing the box.
//   3. Nothing logged yet rendered a bare icon and a sentence, with no route
//      to the screen that would fix that.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

async function openHistorySubtab(window) {
  window.document.getElementById("tabWodBtn").click();
  window.document.querySelector("[data-subtab='history']").click();
  return window.document.getElementById("wodHistoryListArea");
}

test("with nothing logged, the history list offers a way into the log form", async () => {
  const window = await bootApp();
  const area = await openHistorySubtab(window);

  const cta = area.querySelector("[data-action='switch-wod-subtab']");
  assert.ok(cta, "the empty state should offer a route to the log sub-tab, not just a message");
  assert.equal(cta.dataset.subtab, "log");
  assert.ok(!window.document.getElementById("wodHistorySearch"), "no search box while there is nothing to search");

  cta.click();
  assert.equal(
    window.document.querySelector(".subtabbtn.active").dataset.subtab, "log",
    "tapping it should actually move to the log sub-tab",
  );
});

test("an EMOM WOD's row counts attempts instead of claiming it has no record", async () => {
  const window = await bootApp();
  await window.addCustomWod("List Probe EMOM", "emom", "", {
    emomMinutes: 6, emomMovements: ["Burpees"], emomTargetReps: [5],
  });
  window.applyFieldValue("wod-emom-step", "0", 8);
  await window.saveWod();

  const area = await openHistorySubtab(window);
  const row = area.querySelector("[data-action='select-wod-history']");
  const text = row.textContent.replace(/\s+/g, " ");
  assert.ok(!text.includes("—"), `an EMOM row should not show the no-score dash: ${text}`);
  assert.ok(text.includes("ניסיון"), `it should count attempts instead: ${text}`);
});

test("a scored WOD's row still leads with its all-time best, plus how often and how recently", async () => {
  const window = await bootApp();
  const fran = window.allWods().find((w) => w.name === "Fran");
  window.document.getElementById("tabWodBtn").click();
  window.document.querySelector("[data-subtab='benchmarks']").click();
  window.document.querySelector(`[data-action='select-benchmark'][data-id='${fran.id}']`).click();
  for (const [m, s] of [[4, 30], [3, 55]]) {
    window.applyFieldValue("wod-step", "wodMinutes", m);
    window.applyFieldValue("wod-step", "wodSeconds", s);
    await window.saveWod();
  }

  const area = await openHistorySubtab(window);
  const row = area.querySelector("[data-action='select-wod-history']");
  const text = row.textContent.replace(/\s+/g, " ");
  assert.ok(text.includes("3:55"), `the best (fastest) time should be the row's headline: ${text}`);
  assert.ok(text.includes("2 ניסיונות"), `the row should say how many attempts there were: ${text}`);
  assert.equal(row.getAttribute("aria-expanded"), "false", "a collapsed row must say so for screen readers");

  row.click();
  const reopened = area.querySelector("[data-action='select-wod-history']");
  assert.equal(reopened.getAttribute("aria-expanded"), "true", "expanding the row must flip aria-expanded");
  assert.ok(area.querySelector(".chart-card"), "expanding should reveal the detail card");
});

test("a search that matches nothing offers a way back to the full list", async () => {
  const window = await bootApp();
  await window.addCustomWod("List Probe Load", "load", "");
  window.applyFieldValue("wod-step", "wodWeight", 60);
  await window.saveWod();

  const area = await openHistorySubtab(window);
  const box = window.document.getElementById("wodHistorySearch");
  box.value = "no-such-wod";
  box.dispatchEvent(new window.Event("input", { bubbles: true }));

  const clear = area.querySelector("[data-action='clear-wod-history-search']");
  assert.ok(clear, "a no-match state should offer to clear the search, not just report the miss");

  clear.click();
  assert.equal(box.value, "", "clearing should empty the box the user can see, not just the internal state");
  assert.ok(
    area.querySelector("[data-action='select-wod-history']"),
    "and the full list should be back",
  );
});
