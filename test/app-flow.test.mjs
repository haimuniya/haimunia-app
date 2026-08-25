// Drives the real app (not a reimplementation) through its own exposed
// functions — addMovement/applyFieldValue/saveSet/reloadFromDb — the same
// functions its click handlers call. This is the regression net for the
// "add a movement, log a set, restart the app" path: IndexedDB writes
// actually landing, and reloadFromDb() correctly re-sanitizing and
// repopulating in-memory state from what's on disk.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

test("add a movement, log a set, and see it survive a simulated reload", async () => {
  const window = await bootApp();

  const before = window.allMovements().length;
  await window.addMovement("Test Overhead Press", "Press");
  const movements = window.allMovements();
  assert.equal(movements.length, before + 1);
  const movement = movements.find((m) => m.name === "Test Overhead Press");
  assert.ok(movement, "new movement should be findable by name");
  assert.equal(movement.category, "Press");

  // addMovement() already selects the new movement (selectedId), so the
  // stepper fields below apply to it.
  window.applyFieldValue("step", "weight", 62.5);
  window.applyFieldValue("step", "reps", 5);
  window.applyFieldValue("step", "sets", 3);
  await window.saveSet();

  const dbEntries = await window.dbLoadAll();
  const saved = dbEntries.find((e) => e.exerciseId === movement.id);
  assert.ok(saved, "the set should be persisted to IndexedDB");
  assert.equal(saved.weight, 62.5);
  assert.equal(saved.reps, 5);
  assert.equal(saved.sets, 3);

  // Simulate an app restart: wipe in-memory state's only path back to truth
  // is IndexedDB, so reloadFromDb() re-sanitizing correctly is what "your
  // data survives closing the app" actually depends on.
  await window.reloadFromDb();
  const afterReload = window.entriesFor(movement.id);
  assert.equal(afterReload.length, 1);
  assert.equal(afterReload[0].weight, 62.5);
  assert.equal(afterReload[0].reps, 5);
  assert.equal(afterReload[0].sets, 3);

  const movementsAfterReload = window.allMovements();
  assert.ok(movementsAfterReload.some((m) => m.name === "Test Overhead Press"), "custom movement should survive reload too");
});

test("editing an existing entry overwrites it in place rather than duplicating it", async () => {
  const window = await bootApp();
  await window.addMovement("Test Deadlift", "Deadlift");
  const movement = window.allMovements().find((m) => m.name === "Test Deadlift");

  window.applyFieldValue("step", "weight", 100);
  window.applyFieldValue("step", "reps", 5);
  window.applyFieldValue("step", "sets", 1);
  await window.saveSet();

  const [entry] = window.entriesFor(movement.id);
  window.startEditEntry(entry.id);
  window.applyFieldValue("step", "weight", 110);
  await window.saveSet();

  const dbEntries = await window.dbLoadAll();
  const forMovement = dbEntries.filter((e) => e.exerciseId === movement.id);
  assert.equal(forMovement.length, 1, "editing should overwrite, not add a second row");
  assert.equal(forMovement[0].weight, 110);
});

test("a ladder (different weight+reps each round) groups under one groupId and survives reload", async () => {
  const window = await bootApp();
  await window.addMovement("Test Press Ladder", "Press");
  const movement = window.allMovements().find((m) => m.name === "Test Press Ladder");

  window.toggleLadderMode(); // ladder on
  const rungs = [[60, 6], [70, 5], [80, 4], [85, 3], [90, 3]];
  for (const [w, r] of rungs) {
    window.applyFieldValue("step", "weight", w);
    window.applyFieldValue("step", "reps", r);
    window.applyFieldValue("step", "sets", 1);
    await window.saveSet();
  }

  const rounds = window.currentLadderRounds();
  assert.equal(rounds.length, 5, "all 5 rungs should be tagged into the running ladder");
  assert.deepEqual(rounds.map((r) => [r.weight, r.reps]), rungs, "rounds should stay in the order they were logged");
  const groupId = rounds[0].groupId;
  assert.ok(groupId, "rounds should carry a real groupId");
  assert.ok(rounds.every((r) => r.groupId === groupId), "every rung should share the same groupId");

  // The day view's own grouping should fold these 5 rows into one group.
  const dayEntries = window.entriesFor(movement.id);
  const groups = window.groupDayEntries(dayEntries);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].length, 5);

  window.toggleLadderMode(); // finish the ladder

  // Restart: reloadFromDb() must re-sanitize groupId correctly too.
  await window.reloadFromDb();
  const afterReload = window.entriesFor(movement.id);
  assert.equal(afterReload.length, 5);
  assert.ok(afterReload.every((e) => e.groupId === groupId), "groupId should survive a reload");

  // A fresh ladder for a different exercise gets its own, different groupId.
  await window.addMovement("Test Press Ladder 2", "Press");
  window.toggleLadderMode();
  window.applyFieldValue("step", "weight", 40);
  window.applyFieldValue("step", "reps", 8);
  await window.saveSet();
  const newRounds = window.currentLadderRounds();
  assert.equal(newRounds.length, 1);
  assert.notEqual(newRounds[0].groupId, groupId, "a new ladder session should not reuse the previous groupId");
});

test("the PR celebration popup is suppressed mid-ladder but fires normally otherwise", async () => {
  const window = await bootApp();
  const isCelebrationOpen = () => window.document.getElementById("celebrationOverlay").classList.contains("open");

  await window.addMovement("Test Celebration Press", "Press");
  window.toggleLadderMode();
  window.applyFieldValue("step", "weight", 60);
  window.applyFieldValue("step", "reps", 6);
  await window.saveSet();
  assert.equal(isCelebrationOpen(), false, "first rung of a fresh movement is a PR but the popup should stay closed mid-ladder");

  window.applyFieldValue("step", "weight", 70);
  window.applyFieldValue("step", "reps", 5);
  await window.saveSet();
  assert.equal(isCelebrationOpen(), false, "still suppressed for later rungs");

  window.toggleLadderMode(); // finish the ladder

  await window.addMovement("Test Celebration Deadlift", "Deadlift");
  window.applyFieldValue("step", "weight", 120);
  window.applyFieldValue("step", "reps", 3);
  await window.saveSet();
  assert.equal(isCelebrationOpen(), true, "a normal (non-ladder) PR save should still celebrate");
});

test("switching exercise mid-ladder ends it, so the next save doesn't silently join it", async () => {
  const window = await bootApp();
  await window.addMovement("Test Ladder Squat", "Squat");
  const squat = window.allMovements().find((m) => m.name === "Test Ladder Squat");
  window.toggleLadderMode();
  window.applyFieldValue("step", "weight", 100);
  window.applyFieldValue("step", "reps", 5);
  await window.saveSet();
  const groupId = window.currentLadderRounds()[0].groupId;

  await window.addMovement("Test Ladder Bench", "Press"); // switches selectedId -> should end the ladder
  window.applyFieldValue("step", "weight", 60);
  window.applyFieldValue("step", "reps", 8);
  await window.saveSet();

  const benchEntry = window.allMovements().find((m) => m.name === "Test Ladder Bench");
  const benchSets = window.entriesFor(benchEntry.id);
  assert.equal(benchSets.length, 1);
  assert.equal(benchSets[0].groupId, null, "a set logged after switching exercise should not join the old ladder");

  const squatSets = window.entriesFor(squat.id);
  assert.equal(squatSets[0].groupId, groupId, "the squat set already saved keeps its original groupId");
});
