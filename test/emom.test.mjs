// Sub-task D: EMOM WODs with a rotating movement lineup, built through the
// WOD builder like any other named/reusable WOD (Fran, Grace, ...) rather
// than a one-off freeform entry. Unlike every other scoreType, an EMOM's
// movement rotation is structured data on the WOD record itself (see
// sanitizeCustomWod) because the log form needs it to render one reps field
// per movement — everything else in the builder only ever bakes into free
// text. Confirmed scope: no cross-attempt scoring yet (see bestWodScore).
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

test("createWodFromBuilder (EMOM): movement rotation order follows selection order, targets carried from the builder steppers", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.getElementById("wodBuilderName").value = "Test EMOM Rotation";
  // No separately exposed setter for builderFormat — drive it the same way
  // a real tap does, through the click dispatcher.
  window.document.querySelector("[data-action='builder-set-format'][data-format='emom']").click();
  window.toggleBuilderMovement("Wall Balls");
  window.toggleBuilderMovement("Burpees");
  window.applyFieldValue("builder-movement-reps", "Wall Balls", 12);
  window.applyFieldValue("builder-movement-reps", "Burpees", 8);
  window.applyFieldValue("builder-emom-minutes", "emomMinutes", 14);
  window.createWodFromBuilder();

  const wod = window.allWods().find((w) => w.name === "Test EMOM Rotation");
  assert.ok(wod, "the EMOM WOD should have been created");
  assert.equal(wod.scoreType, "emom");
  assert.equal(wod.emomMinutes, 14);
  assert.deepEqual(wod.emomMovements, ["Wall Balls", "Burpees"], "rotation order should match selection order");
  assert.deepEqual(wod.emomTargetReps, [12, 8]);
  assert.ok(wod.desc.includes("Wall Balls") && wod.desc.includes("Burpees"), "generated desc should mention both movements");
});

test("createWodFromBuilder (EMOM): refuses to create one with zero movements selected", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.getElementById("wodBuilderName").value = "Test EMOM Empty";
  window.document.querySelector("[data-action='builder-set-format'][data-format='emom']")?.click();
  window.createWodFromBuilder();
  const wod = window.allWods().find((w) => w.name === "Test EMOM Empty");
  assert.equal(wod, undefined, "an EMOM with no movements in the rotation should not be created");
});

test("sanitizeCustomWod: rejects an EMOM WOD whose movement list sanitizes down to empty", async () => {
  const window = await bootApp();
  const out = window.sanitizeCustomWod({ id: "w1", name: "Bad EMOM", scoreType: "emom", emomMovements: ["", "   "], emomTargetReps: [5, 5], emomMinutes: 10 });
  assert.equal(out, null);
});

test("sanitizeCustomWod: a well-formed EMOM round-trips its structure, clamped and length-matched", async () => {
  const window = await bootApp();
  const out = window.sanitizeCustomWod({
    id: "w1", name: "Good EMOM", scoreType: "emom",
    emomMovements: ["Wall Balls", "Burpees"], emomTargetReps: [12], emomMinutes: 999999,
  });
  assert.deepEqual(out.emomMovements, ["Wall Balls", "Burpees"]);
  assert.deepEqual(out.emomTargetReps, [12, 0], "a shorter targets array should pad to match the movement count, not misalign");
  assert.ok(out.emomMinutes <= 999, "should clamp to LIMITS.minutes, not reject the whole WOD");
});

test("saveWod (EMOM): persists one rep count per movement, isPR always false, formatWodEntry shows per-movement reps", async () => {
  const window = await bootApp();
  await window.addCustomWod("Test EMOM Log", "emom", "EMOM 10: 12 Wall Balls / 8 Burpees", {
    emomMinutes: 10, emomMovements: ["Wall Balls", "Burpees"], emomTargetReps: [12, 8],
  });
  const wod = window.allWods().find((w) => w.name === "Test EMOM Log");
  // addCustomWod already selects the WOD it just created (selectedWodId),
  // same as addMovement does for a new movement — no separate step needed.

  window.applyFieldValue("wod-emom-step", "0", 12);
  window.applyFieldValue("wod-emom-step", "1", 6); // scaled down on burpees
  await window.saveWod();

  const dbEntries = await window.dbLoadWodEntries();
  const saved = dbEntries.find((e) => e.wodId === wod.id);
  assert.ok(saved);
  assert.equal(saved.scoreType, "emom");
  assert.deepEqual(saved.emomReps, [12, 6]);
  assert.equal(saved.isPR, false, "EMOM has no cross-attempt scoring — never a PR");
  assert.equal(window.formatWodEntry(saved), "12 · 6");
});

test("bestWodScore/formatWodBest: an EMOM WOD reports no best (—), never a fabricated PR", async () => {
  const window = await bootApp();
  await window.addCustomWod("Test EMOM NoBest", "emom", "", { emomMinutes: 8, emomMovements: ["Wall Balls"], emomTargetReps: [15] });
  const wod = window.allWods().find((w) => w.name === "Test EMOM NoBest");
  window.applyFieldValue("wod-emom-step", "0", 15);
  await window.saveWod();
  window.applyFieldValue("wod-emom-step", "0", 20); // "better" by any naive numeric read, still not a PR
  await window.saveWod();

  assert.equal(window.bestWodScore(wod.id), null);
  assert.equal(window.formatWodBest(wod.id), "—");
  const entries = window.wodEntriesFor(wod.id);
  assert.ok(entries.every((e) => e.isPR === false), "neither attempt should be flagged as a PR");
});

test("startEditWodEntry (EMOM): restores the per-movement rep counts for editing", async () => {
  const window = await bootApp();
  await window.addCustomWod("Test EMOM Edit", "emom", "", { emomMinutes: 12, emomMovements: ["Wall Balls", "Burpees"], emomTargetReps: [12, 8] });
  const wod = window.allWods().find((w) => w.name === "Test EMOM Edit");
  window.applyFieldValue("wod-emom-step", "0", 10);
  window.applyFieldValue("wod-emom-step", "1", 7);
  await window.saveWod();
  const [entry] = window.wodEntriesFor(wod.id);

  window.applyFieldValue("wod-emom-step", "0", 99); // dirty the state first
  window.startEditWodEntry(entry.id);
  const val0 = window.document.querySelector("[data-field='0'][data-action='wod-emom-step'].stepper-val").value;
  const val1 = window.document.querySelector("[data-field='1'][data-action='wod-emom-step'].stepper-val").value;
  assert.equal(val0, "10");
  assert.equal(val1, "7");

  window.applyFieldValue("wod-emom-step", "0", 11);
  await window.saveWod();
  const rows = window.wodEntriesFor(wod.id);
  assert.equal(rows.length, 1, "editing should overwrite in place");
  assert.deepEqual(rows[0].emomReps, [11, 7]);
});

// Reported bug: the builder hid the weight stepper for every EMOM movement,
// even loaded ones like Wall Balls or a DB/KB station — EMOM movements got
// treated as reps-only regardless of category, unlike every other format
// (which already showed weight for WOD_MOVE_CATEGORIES_WITH_WEIGHT). Fixed
// by applying the same hasWeight check to EMOM instead of forcing it off.
test("WOD builder: a weight-bearing EMOM movement (Odd Object) shows a weight stepper, a bodyweight one (Gymnastics) does not", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.querySelector("[data-action='builder-set-format'][data-format='emom']").click();
  window.toggleBuilderMovement("Wall Balls"); // Odd Object — weight-bearing
  window.toggleBuilderMovement("Burpees"); // Gymnastics — bodyweight

  const wallBallWeightStepper = window.document.querySelector("[data-action='builder-movement-weight'][data-field='Wall Balls']");
  const burpeeWeightStepper = window.document.querySelector("[data-action='builder-movement-weight'][data-field='Burpees']");
  assert.ok(wallBallWeightStepper, "a loaded EMOM movement should offer a weight stepper");
  assert.equal(burpeeWeightStepper, null, "a bodyweight EMOM movement should not offer a weight stepper");
});

test("createWodFromBuilder (EMOM): captures per-movement weight, bakes it into the generated description", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.getElementById("wodBuilderName").value = "Test EMOM Weighted";
  window.document.querySelector("[data-action='builder-set-format'][data-format='emom']").click();
  window.toggleBuilderMovement("Wall Balls");
  window.toggleBuilderMovement("Burpees");
  window.applyFieldValue("builder-movement-reps", "Wall Balls", 10);
  window.applyFieldValue("builder-movement-weight", "Wall Balls", 9);
  window.applyFieldValue("builder-movement-reps", "Burpees", 8);
  window.createWodFromBuilder();

  const wod = window.allWods().find((w) => w.name === "Test EMOM Weighted");
  assert.ok(wod);
  assert.deepEqual(wod.emomTargetWeights, [9, 0], "Wall Balls should carry its weight, Burpees (never given one) should default to 0");
  assert.ok(wod.desc.includes("Wall Balls @ 9kg"), `generated desc should bake in the weight — got "${wod.desc}"`);
  assert.ok(!wod.desc.includes("Burpees @"), "a movement with no weight set should not get a stray \"@ 0kg\"");
});

test("sanitizeCustomWod: emomTargetWeights round-trips, clamps, and pads/truncates to match the movement list like emomTargetReps", async () => {
  const window = await bootApp();
  const out = window.sanitizeCustomWod({
    id: "w1", name: "Weighted EMOM", scoreType: "emom",
    emomMovements: ["Wall Balls", "Burpees"], emomTargetReps: [10, 8],
    emomTargetWeights: [9], emomMinutes: 10,
  });
  assert.deepEqual(out.emomTargetWeights, [9, 0], "a shorter weights array should pad to match the movement count, not misalign");
});

test("the log form shows the prescribed weight next to a loaded EMOM movement, and omits it for an unweighted one", async () => {
  const window = await bootApp();
  await window.addCustomWod("Test EMOM Log Weight", "emom", "", {
    emomMinutes: 10, emomMovements: ["Wall Balls", "Burpees"], emomTargetReps: [10, 8], emomTargetWeights: [9, 0],
  });
  window.document.getElementById("tabWodBtn").click();

  const labels = [...window.document.querySelectorAll(".steppers .stepper-label, .stepper-label")].map((el) => el.textContent);
  const wallBallLabel = labels.find((l) => l.includes("Wall Balls"));
  const burpeeLabel = labels.find((l) => l.includes("Burpees"));
  assert.ok(wallBallLabel?.includes("9"), `Wall Balls' label should show its prescribed weight — got "${wallBallLabel}"`);
  assert.ok(burpeeLabel && !/\(\d/.test(burpeeLabel), `Burpees has no weight and should not show a stray "(0 ק"ג)" — got "${burpeeLabel}"`);
});

test("renderWodLogSection resyncs wodEmomReps when switching to a differently-shaped EMOM WOD", async () => {
  const window = await bootApp();
  await window.addCustomWod("Test EMOM Shape A", "emom", "", { emomMinutes: 10, emomMovements: ["Wall Balls"], emomTargetReps: [15] });
  // addCustomWod already selects the WOD it just created — switching to the
  // WOD tab (a real click, same as a user tapping it) renders it.
  window.document.getElementById("tabWodBtn").click();
  const oneStepper = window.document.querySelectorAll("[data-action='wod-emom-step'].stepper-val").length;
  assert.equal(oneStepper, 1);

  // Creating (and thereby selecting) a second, differently-shaped EMOM WOD
  // re-renders through addCustomWod's own render() call — tab is already
  // "wod" from the click above, so this reflects the new selection.
  await window.addCustomWod("Test EMOM Shape B", "emom", "", { emomMinutes: 12, emomMovements: ["Burpees", "Box Jumps", "Wall Balls"], emomTargetReps: [10, 12, 15] });
  const threeSteppers = window.document.querySelectorAll("[data-action='wod-emom-step'].stepper-val").length;
  assert.equal(threeSteppers, 3, "switching to a 3-movement EMOM should resize the stepper set, not keep the old 1");
  const vals = [...window.document.querySelectorAll("[data-action='wod-emom-step'].stepper-val")].map((el) => el.value);
  assert.deepEqual(vals, ["10", "12", "15"], "should prefill from the new WOD's own target reps");
});

// Deep-dive follow-up to the weight fix: EMOM movements could only ever be
// reps, with no way to mark a station as a hold (duration) or a rest minute
// — the same class of "forced into the wrong field" bug as the weight gap,
// just for two more cases. See the WOD-section audit report.
test("WOD builder (EMOM): a movement can be switched to duration mode, same toggle as every other format", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.querySelector("[data-action='builder-set-format'][data-format='emom']").click();
  window.toggleBuilderMovement("Plank Hold");

  const repsStepperBefore = window.document.querySelector("[data-action='builder-movement-reps'][data-field='Plank Hold']");
  assert.ok(repsStepperBefore, "an EMOM movement should default to a reps stepper");

  window.document.querySelector("[data-action='toggle-builder-movement-type'][data-name='Plank Hold'][data-type='duration']").click();
  const durationStepper = window.document.querySelector("[data-action='builder-movement-duration'][data-field='Plank Hold']");
  assert.ok(durationStepper, "switching an EMOM movement to duration mode should show a seconds stepper");
});

test("createWodFromBuilder (EMOM): a duration-mode movement is captured with its own type and target seconds", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.getElementById("wodBuilderName").value = "Test EMOM Duration";
  window.document.querySelector("[data-action='builder-set-format'][data-format='emom']").click();
  window.toggleBuilderMovement("Plank Hold");
  window.document.querySelector("[data-action='toggle-builder-movement-type'][data-name='Plank Hold'][data-type='duration']").click();
  window.applyFieldValue("builder-movement-duration", "Plank Hold", 40);
  window.toggleBuilderMovement("Burpees");
  window.applyFieldValue("builder-movement-reps", "Burpees", 10);
  window.createWodFromBuilder();

  const wod = window.allWods().find((w) => w.name === "Test EMOM Duration");
  assert.ok(wod);
  assert.deepEqual(wod.emomMovementTypes, ["duration", "reps"]);
  assert.deepEqual(wod.emomTargetDurations, [40, 0]);
  assert.ok(wod.desc.includes("40\" Plank Hold") || wod.desc.includes("0:40 Plank Hold"), `generated desc should show the hold time, not a raw rep count — got "${wod.desc}"`);
});

test("WOD builder (EMOM): a movement can be marked as a rest station, hiding its reps/duration/weight fields", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.querySelector("[data-action='builder-set-format'][data-format='emom']").click();
  window.toggleBuilderMovement("Wall Balls");

  assert.ok(window.document.querySelector("[data-action='builder-movement-reps'][data-field='Wall Balls']"), "before marking rest, the reps field should show as usual");

  window.document.querySelector("[data-action='toggle-builder-movement-rest'][data-name='Wall Balls']").click();
  assert.equal(window.document.querySelector("[data-action='builder-movement-reps'][data-field='Wall Balls']"), null, "a rest station should hide its reps stepper");
  assert.equal(window.document.querySelector("[data-action='builder-movement-weight'][data-field='Wall Balls']"), null, "a rest station should hide its weight stepper too, even though Wall Balls is normally weight-bearing");
});

test("createWodFromBuilder (EMOM): a rest station is captured with type \"rest\" and shows as \"Rest\" in the description", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.getElementById("wodBuilderName").value = "Test EMOM Rest";
  window.document.querySelector("[data-action='builder-set-format'][data-format='emom']").click();
  window.toggleBuilderMovement("Wall Balls");
  window.applyFieldValue("builder-movement-reps", "Wall Balls", 10);
  window.toggleBuilderMovement("Burpees");
  window.document.querySelector("[data-action='toggle-builder-movement-rest'][data-name='Burpees']").click();
  window.createWodFromBuilder();

  const wod = window.allWods().find((w) => w.name === "Test EMOM Rest");
  assert.ok(wod);
  assert.deepEqual(wod.emomMovementTypes, ["reps", "rest"]);
  assert.ok(wod.desc.includes("Rest"), `generated desc should mention Rest — got "${wod.desc}"`);
});

test("the log form renders a duration stepper for a hold station and no stepper at all for a rest station", async () => {
  const window = await bootApp();
  await window.addCustomWod("Test EMOM Log Types", "emom", "", {
    emomMinutes: 12,
    emomMovements: ["Wall Balls", "Plank Hold", "Burpees"],
    emomMovementTypes: ["reps", "duration", "rest"],
    emomTargetReps: [10, 0, 0],
    emomTargetDurations: [0, 40, 0],
  });
  window.document.getElementById("tabWodBtn").click();

  const repsStepper = window.document.querySelector("[data-action='wod-emom-step'][data-field='0'].stepper-val");
  const durationStepper = window.document.querySelector("[data-action='wod-emom-step'][data-field='1'].stepper-val");
  const restStepper = window.document.querySelector("[data-action='wod-emom-step'][data-field='2'].stepper-val");
  assert.ok(repsStepper, "the reps station should get a normal editable stepper");
  assert.equal(repsStepper.value, "10");
  assert.ok(durationStepper, "the duration station should get an editable stepper too");
  assert.equal(durationStepper.value, "40", "should prefill from emomTargetDurations, not emomTargetReps (which is meaningless for this station)");
  assert.equal(restStepper, null, "the rest station should not render any editable stepper");
  assert.ok(window.document.body.textContent.includes("מנוחה"), "the rest station should still show as a labeled row, just with nothing to fill in");
});

// Deep-dive follow-up: Monostructural movements (Row/Bike/Ski/Run — measured
// in calories or meters, never reps) got the same generic "חזרות" label as
// every rep-counted movement, in both the builder and the EMOM rotation.
test("WOD builder: a calorie/meter movement's stepper is labeled by its own unit, not a generic \"reps\"", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.querySelector("[data-action='builder-set-format'][data-format='amrap']").click();
  window.toggleBuilderMovement("Row (Calories)");
  window.toggleBuilderMovement("Run (Meters)");
  window.toggleBuilderMovement("Burpees");

  const label = (name) => window.document.querySelector(`[data-action='builder-movement-reps'][data-field='${name}']`)?.closest(".stepper")?.querySelector(".stepper-label")?.textContent;
  assert.equal(label("Row (Calories)"), "קלוריות");
  assert.equal(label("Run (Meters)"), "מטרים");
  assert.equal(label("Burpees"), "חזרות");
});

test("repsFieldLabel: detects the unit straight from the movement's own name suffix", async () => {
  const window = await bootApp();
  assert.equal(window.repsFieldLabel("Row (Calories)"), "קלוריות");
  assert.equal(window.repsFieldLabel("Assault Bike (Calories)"), "קלוריות");
  assert.equal(window.repsFieldLabel("Run (Meters)"), "מטרים");
  assert.equal(window.repsFieldLabel("Shuttle Runs (Meters)"), "מטרים");
  assert.equal(window.repsFieldLabel("Wall Balls"), "חזרות");
  assert.equal(window.repsFieldLabel("Back Squat"), "חזרות");
});

test("saveWod (EMOM): a rest station isn't saved as a stray value, and re-editing restores the real stations at the right indices", async () => {
  const window = await bootApp();
  await window.addCustomWod("Test EMOM Rest Save", "emom", "", {
    emomMinutes: 10,
    emomMovements: ["Wall Balls", "Burpees", "Box Jumps"],
    emomMovementTypes: ["reps", "rest", "reps"],
    emomTargetReps: [12, 0, 8],
  });
  const wod = window.allWods().find((w) => w.name === "Test EMOM Rest Save");
  window.document.getElementById("tabWodBtn").click();

  window.applyFieldValue("wod-emom-step", "0", 12);
  window.applyFieldValue("wod-emom-step", "2", 9);
  await window.saveWod();

  const [saved] = window.wodEntriesFor(wod.id);
  assert.deepEqual(saved.emomReps, [12, 9], "the rest station (index 1) should not appear in the saved reps at all");
  assert.equal(window.formatWodEntry(saved), "12 · 9", "history/calendar display should never show a stray number for the rest station");

  window.startEditWodEntry(saved.id);
  const val0 = window.document.querySelector("[data-field='0'][data-action='wod-emom-step'].stepper-val").value;
  const val2 = window.document.querySelector("[data-field='2'][data-action='wod-emom-step'].stepper-val").value;
  assert.equal(val0, "12", "re-editing should restore Wall Balls (index 0) correctly, not shifted by the missing rest slot");
  assert.equal(val2, "9", "re-editing should restore Box Jumps (index 2) correctly too");
  assert.equal(window.document.querySelector("[data-field='1'][data-action='wod-emom-step'].stepper-val"), null, "the rest station still shouldn't have an editable stepper while editing");
});
