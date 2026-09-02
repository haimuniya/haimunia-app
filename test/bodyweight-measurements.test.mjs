// Coverage gap closed (full-codebase audit): the History tab's bodyweight
// and custom-measurements sections (both nested under #tabHistoryBtn, not
// their own top-level tabs) had zero automated coverage. Drives the real
// expand/save actions and confirms the write actually lands in IndexedDB.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

test("logging today's bodyweight persists it and updates the collapsed row's summary", async () => {
  const window = await bootApp();
  window.document.getElementById("tabHistoryBtn").click();
  window.document.querySelector("[data-action='toggle-bodyweight']").click();

  window.applyFieldValue("bw-step", "bwWeight", 78.5);
  window.document.querySelector("[data-action='save-bw']").click();
  await new Promise((r) => setTimeout(r, 0)); // saveBodyweight() is async

  const rows = await window.dbLoadBodyweight();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].weight, 78.5);
  assert.equal(rows[0].date, window.todayISO());

  // Collapse and re-expand: the collapsed row's summary should reflect the
  // just-saved weight, not the pre-save default.
  window.document.querySelector("[data-action='toggle-bodyweight']").click();
  const summaryText = window.document.getElementById("bodyweightArea").textContent;
  assert.ok(summaryText.includes("78.5"), "the collapsed row should show the newly-saved weight");
});

test("logging bodyweight again the same day overwrites today's entry instead of adding a second one", async () => {
  const window = await bootApp();
  window.document.getElementById("tabHistoryBtn").click();
  window.document.querySelector("[data-action='toggle-bodyweight']").click();

  window.applyFieldValue("bw-step", "bwWeight", 80);
  window.document.querySelector("[data-action='save-bw']").click();
  await new Promise((r) => setTimeout(r, 0));

  window.applyFieldValue("bw-step", "bwWeight", 81);
  window.document.querySelector("[data-action='save-bw']").click();
  await new Promise((r) => setTimeout(r, 0));

  const rows = await window.dbLoadBodyweight();
  assert.equal(rows.length, 1, "same-day saves should overwrite, not duplicate");
  assert.equal(rows[0].weight, 81);
});

test("adding a custom measure type, then logging and reading back a measurement", async () => {
  const window = await bootApp();
  window.document.getElementById("tabHistoryBtn").click();

  await window.addMeasureType("Test Waist");
  const typesArea = window.document.getElementById("measureArea").textContent;
  assert.ok(typesArea.includes("Test Waist"), "the new measure type should appear in the list");

  const type = (await window.dbLoadMeasureTypes()).find((t) => t.name === "Test Waist");
  assert.ok(type, "the type should be persisted");

  // addMeasureType() already expands the freshly-created type.
  window.applyFieldValue("measure-step", type.id, 82);
  window.document.querySelector(`[data-action='save-measurement'][data-id='${type.id}']`).click();
  await new Promise((r) => setTimeout(r, 0));

  const entries = await window.dbLoadMeasurements();
  const saved = entries.find((e) => e.typeId === type.id);
  assert.ok(saved, "the measurement should be persisted");
  assert.equal(saved.value, 82);
  assert.equal(saved.date, window.todayISO());
});

test("adding a measure type with a name that already exists re-opens the existing one instead of duplicating it", async () => {
  const window = await bootApp();
  window.document.getElementById("tabHistoryBtn").click();
  await window.addMeasureType("Test Chest");
  await window.addMeasureType("test chest"); // same name, different case

  const types = await window.dbLoadMeasureTypes();
  const matches = types.filter((t) => t.name.toLowerCase() === "test chest");
  assert.equal(matches.length, 1, "re-adding the same name (case-insensitively) should not create a duplicate type");
});

test("deleting a measure type removes it and its logged measurements", async () => {
  const window = await bootApp();
  window.document.getElementById("tabHistoryBtn").click();
  await window.addMeasureType("Test Hips");
  const type = (await window.dbLoadMeasureTypes()).find((t) => t.name === "Test Hips");

  window.applyFieldValue("measure-step", type.id, 95);
  await window.saveMeasurement(type.id);
  assert.ok((await window.dbLoadMeasurements()).some((e) => e.typeId === type.id));

  await window.deleteMeasureType(type.id);

  assert.ok(!(await window.dbLoadMeasureTypes()).some((t) => t.id === type.id), "the type itself should be gone");
  assert.ok(!(await window.dbLoadMeasurements()).some((e) => e.typeId === type.id), "its measurements should be cleaned up too, not left orphaned");
});

test("a non-positive bodyweight is refused, with a reason, instead of writing a 0 kg entry", async () => {
  const window = await bootApp();
  window.document.getElementById("tabHistoryBtn").click();
  window.document.querySelector("[data-action='toggle-bodyweight']").click();

  window.applyFieldValue("bw-step", "bwWeight", 0);
  window.document.querySelector("[data-action='save-bw']").click();
  await new Promise((r) => setTimeout(r, 0));

  assert.equal((await window.dbLoadBodyweight()).length, 0, "0 kg must never reach storage — it owns the headline number and cannot be deleted once the day rolls over");
  const card = window.document.getElementById("bodyweightArea");
  assert.ok(card.querySelector(".bm-warn"), "the card should say why the save did nothing rather than looking dead");

  // A real weight afterwards still saves, and clears the warning.
  window.applyFieldValue("bw-step", "bwWeight", 77);
  window.document.querySelector("[data-action='save-bw']").click();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal((await window.dbLoadBodyweight()).length, 1);
  assert.ok(!window.document.getElementById("bodyweightArea").querySelector(".bm-warn"));
});

test("a single bodyweight entry can be deleted, and the stepper falls back to the next-newest", async () => {
  const window = await bootApp();
  await window.dbPutBodyweight({ id: "bw-older", date: "2026-08-20", ts: 1000, weight: 80.2 });
  await window.dbPutBodyweight({ id: "bw-newer", date: "2026-08-27", ts: 2000, weight: 79.1 });
  await window.reloadFromDb();
  window.document.getElementById("tabHistoryBtn").click();
  window.document.querySelector("[data-action='toggle-bodyweight']").click();

  const delBtns = window.document.querySelectorAll("[data-action='delete-bodyweight-entry']");
  assert.equal(delBtns.length, 2, "every listed bodyweight entry needs its own delete — a mistyped weight used to be permanent");

  delBtns[0].click(); // newest first
  await new Promise((r) => setTimeout(r, 0));

  const rows = await window.dbLoadBodyweight();
  assert.deepEqual(rows.map((r) => r.id), ["bw-older"]);
  assert.equal(window.getFieldValue("bw-step", "bwWeight"), 80.2, "the stepper should re-seed off the surviving entry, not keep showing the deleted one");
});

test("saving a measurement of 0 explains itself instead of silently doing nothing", async () => {
  const window = await bootApp();
  window.document.getElementById("tabHistoryBtn").click();
  await window.addMeasureType("Test Thigh"); // a fresh type's stepper starts at 0

  const type = (await window.dbLoadMeasureTypes()).find((t) => t.name === "Test Thigh");
  window.document.querySelector(`[data-action='save-measurement'][data-id='${type.id}']`).click();
  await new Promise((r) => setTimeout(r, 0));

  assert.equal((await window.dbLoadMeasurements()).length, 0);
  assert.ok(window.document.getElementById("measureArea").querySelector(".bm-warn"), "the first tap most users make used to hit a dead no-op");
});
