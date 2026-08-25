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
