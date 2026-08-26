// Lower-priority sub-task: an optional, reference-only time cap on a WOD
// definition. Never scored or enforced — see sanitizeCustomWod and CHANGES.md.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

test("sanitizeCustomWod: a well-formed time cap round-trips; absent/zero clamps to null (no cap)", async () => {
  const window = await bootApp();
  const withCap = window.sanitizeCustomWod({ id: "w1", name: "Test Cap WOD", scoreType: "time", timeCapSeconds: 1200 });
  assert.equal(withCap.timeCapSeconds, 1200);
  const noCap = window.sanitizeCustomWod({ id: "w2", name: "Test No Cap WOD", scoreType: "time" });
  assert.equal(noCap.timeCapSeconds, null);
  const zeroCap = window.sanitizeCustomWod({ id: "w3", name: "Test Zero Cap WOD", scoreType: "time", timeCapSeconds: 0 });
  assert.equal(zeroCap.timeCapSeconds, null, "0 means no cap, not a literal 0-second cap");
});

test("createWodFromBuilder: a time-cap minutes stepper value becomes the WOD's timeCapSeconds", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.getElementById("wodBuilderName").value = "Test Builder Cap WOD";
  window.document.querySelector("[data-action='builder-set-format'][data-format='time']").click();
  window.applyFieldValue("builder-time-cap", "timeCapMinutes", 20);
  window.createWodFromBuilder();

  const wod = window.allWods().find((w) => w.name === "Test Builder Cap WOD");
  assert.ok(wod);
  assert.equal(wod.timeCapSeconds, 1200);
});

test("createWodFromBuilder: leaving the time cap at 0 creates a WOD with no cap", async () => {
  const window = await bootApp();
  window.openWodBuilder();
  window.document.getElementById("wodBuilderName").value = "Test Builder No Cap WOD";
  window.document.querySelector("[data-action='builder-set-format'][data-format='amrap']").click();
  window.createWodFromBuilder();
  const wod = window.allWods().find((w) => w.name === "Test Builder No Cap WOD");
  assert.equal(wod.timeCapSeconds, null);
});
