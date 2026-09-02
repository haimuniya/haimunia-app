// bestEst1RMByExercise() replaced a per-exercise call to bestEst1RM() inside
// renderHistoryListArea() — that function itself re-scans the whole entries
// array, so calling it once per active exercise was O(exercises × entries),
// re-run on every keystroke in the History search box. This checks the
// replacement produces byte-for-byte the same numbers bestEst1RM() would
// have, including its one edge case (a duration-only exercise reports null,
// not 0 — duration entries carry est1RM: 0 so they can't win the max by
// accident, but they're excluded from the pool entirely, not just ignored
// when computing it).
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

test("bestEst1RMByExercise() matches bestEst1RM() per exercise across a mixed set of movements", async () => {
  const window = await bootApp();

  await window.addMovement("Test Perf Squat", "Squat");
  window.applyFieldValue("step", "weight", 100);
  window.applyFieldValue("step", "reps", 5);
  window.applyFieldValue("step", "sets", 1);
  await window.saveSet();
  window.applyFieldValue("step", "weight", 120);
  window.applyFieldValue("step", "reps", 1);
  await window.saveSet(); // a heavier single — should win the max for this exercise

  await window.addMovement("Test Perf Deadlift", "Deadlift");
  window.applyFieldValue("step", "weight", 140);
  window.applyFieldValue("step", "reps", 3);
  await window.saveSet();

  const map = window.bestEst1RMByExercise();
  const allMovements = await window.dbLoadMovements();
  const squat = allMovements.find((m) => m.name === "Test Perf Squat");
  const deadlift = allMovements.find((m) => m.name === "Test Perf Deadlift");

  assert.equal(map.get(squat.id), window.bestEst1RM(squat.id));
  assert.equal(map.get(deadlift.id), window.bestEst1RM(deadlift.id));
});

test("a duration-only exercise reports null from both bestEst1RM() and bestEst1RMByExercise(), matching renderHistoryListArea's existing display", async () => {
  const window = await bootApp();
  await window.addMovement("Test Perf Plank", "Other");
  window.setLogEntryType("duration");
  window.applyFieldValue("step", "durationSeconds", 45);
  window.applyFieldValue("step", "sets", 1);
  await window.saveSet();

  const allMovements = await window.dbLoadMovements();
  const plank = allMovements.find((m) => m.name === "Test Perf Plank");
  assert.equal(window.bestEst1RM(plank.id), null);

  const map = window.bestEst1RMByExercise();
  assert.equal(map.get(plank.id), undefined, "the map has no entry at all for a duration-only exercise");

  // renderHistoryListArea() renders `${bestMap.get(m.id) ?? null} kg` for
  // exactly this reason — `?? null` turns the map's `undefined` back into
  // the same "null kg" bestEst1RM() itself would have produced directly.
  window.document.getElementById("tabHistoryBtn").click();
  const row = window.document.querySelector(`[data-action='select-history'][data-id='${plank.id}']`);
  assert.ok(row.textContent.includes("null kg"));
});
