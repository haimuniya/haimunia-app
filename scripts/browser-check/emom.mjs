#!/usr/bin/env node
// Sub-task D: EMOM WODs with a rotating movement lineup, built through the
// WOD builder (reusable/named, same pattern as Fran/Grace) rather than a
// one-off freeform entry. Drives the real "EMOM" format chip, the
// minutes stepper, picking two movements in order, and logging an attempt
// with one reps field per movement.
//
// Usage:
//   node emom.mjs                 # local working tree
//   TARGET_URL=<url> node emom.mjs # a deployed site
import { chromium } from "playwright";
import { resolveTarget } from "./lib/target.mjs";
import { dismissWelcomeModal, consoleErrorCollector, fillStepper } from "./lib/actions.mjs";

let failed = false;
function check(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? " — " + detail : ""}`);
  if (!ok) failed = true;
}

const target = await resolveTarget();
console.log(`Target: ${target.url}${target.local ? " (local static server)" : ""}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 1000 } });
const errors = await consoleErrorCollector(page);

await page.goto(target.url, { waitUntil: "networkidle" });
await page.waitForSelector("#app", { state: "visible" });
await dismissWelcomeModal(page);

await page.click("#tabWodBtn");
await page.waitForTimeout(200);
// No WOD is pre-selected on a fresh load anymore (see the empty-state
// prompt in renderWodLogSection) — its own direct build button replaces
// what used to be a picker-then-builder detour.
await page.click("[data-action='open-wod-builder']");
await page.waitForSelector("#wodBuilderOverlay.open", { timeout: 5000 });

await page.fill("#wodBuilderName", "Test Builder EMOM");
await page.click("#wodBuilderFormats .format-chip[data-format='emom']");
await page.waitForTimeout(150);

const minutesStepperShown = await page.evaluate(() => !!document.querySelector("[data-action='builder-emom-minutes'].stepper-val"));
check("selecting EMOM format shows the minutes stepper", minutesStepperShown);
await fillStepper(page, "[data-action='builder-emom-minutes'].stepper-val", 12);

// Pick two movements, in order — Wall Balls first, then Burpees.
await page.fill("#wodBuilderMoveSearch", "Wall Balls");
await page.waitForTimeout(150);
await page.click(".movecheck-row[data-name='Wall Balls']");
await page.waitForTimeout(100);
// Deep-dive follow-up to the weight fix: EMOM movements used to be locked
// to reps-only, no toggle at all. They now get the same reps/duration
// toggle and weight stepper as every other format.
const hasTypeToggle = await page.evaluate(() => !!document.querySelector("[data-action='toggle-builder-movement-type'][data-name='Wall Balls']"));
check("EMOM movements now get the reps/duration toggle, same as every other format", hasTypeToggle);
const hasWeightStepper = await page.evaluate(() => !!document.querySelector("[data-action='builder-movement-weight'][data-field='Wall Balls']"));
check("a weight-bearing EMOM movement (Wall Balls, Odd Object) shows a weight stepper", hasWeightStepper);

await fillStepper(page, "[data-action='builder-movement-reps'][data-field='Wall Balls'].stepper-val", 15);
await fillStepper(page, "[data-action='builder-movement-weight'][data-field='Wall Balls'].stepper-val", 9);

await page.fill("#wodBuilderMoveSearch", "Burpees");
await page.waitForTimeout(150);
await page.click(".movecheck-row[data-name='Burpees']");
await page.waitForTimeout(100);
await fillStepper(page, "[data-action='builder-movement-reps'][data-field='Burpees'].stepper-val", 10);

// Third station: a hold, switched to duration mode.
await page.fill("#wodBuilderMoveSearch", "Plank Hold");
await page.waitForTimeout(150);
await page.click(".movecheck-row[data-name='Plank Hold']");
await page.waitForTimeout(100);
await page.click("[data-action='toggle-builder-movement-type'][data-name='Plank Hold'][data-type='duration']");
await page.waitForTimeout(100);
const durationStepperShown = await page.evaluate(() => !!document.querySelector("[data-action='builder-movement-duration'][data-field='Plank Hold']"));
check("switching an EMOM movement to duration mode shows a seconds stepper", durationStepperShown);
await fillStepper(page, "[data-action='builder-movement-duration'][data-field='Plank Hold'].stepper-val", 40);

// Fourth station: marked as a rest minute.
await page.fill("#wodBuilderMoveSearch", "Mountain Climbers");
await page.waitForTimeout(150);
await page.click(".movecheck-row[data-name='Mountain Climbers']");
await page.waitForTimeout(100);
await page.click("[data-action='toggle-builder-movement-rest'][data-name='Mountain Climbers']");
await page.waitForTimeout(100);
const restHidesFields = await page.evaluate(() => !document.querySelector("[data-action='builder-movement-reps'][data-field='Mountain Climbers']"));
check("marking an EMOM movement as rest hides its reps/duration/weight fields", restHidesFields);

await page.click("[data-action='create-wod']");
await page.waitForTimeout(300);

const descText = await page.evaluate(() => document.querySelector(".wod-desc")?.textContent || "");
check(
  "created EMOM's description mentions every station — reps, weight, hold time, and rest",
  descText.includes("EMOM 12") && descText.includes("Wall Balls @ 9kg") && descText.includes("Burpees") && /0:40 Plank Hold|40" Plank Hold/.test(descText) && descText.includes("Rest"),
  descText
);

const emomSteppers = await page.evaluate(() => [...document.querySelectorAll("[data-action='wod-emom-step'].stepper-val")].map((el) => el.value));
check("log form shows one editable stepper per non-rest rotation movement, in order (rest gets none)", JSON.stringify(emomSteppers) === JSON.stringify(["15", "10", "40"]), JSON.stringify(emomSteppers));
const restRowShown = await page.evaluate(() => document.body.textContent.includes("מנוחה"));
check("the rest station still shows as a labeled row in the log form", restRowShown);

const scoreTypeLabel = await page.evaluate(() => document.body.textContent.includes("EMOM"));
check("score-type stat card shows EMOM, not a fallback label", scoreTypeLabel);

// Log an attempt: matched wall balls, scaled down burpees.
await fillStepper(page, "[data-action='wod-emom-step'][data-field='0'].stepper-val", 15);
await fillStepper(page, "[data-action='wod-emom-step'][data-field='1'].stepper-val", 7);
await page.click("[data-action='save-wod']");
await page.waitForTimeout(300);

const noPrFlash = await page.evaluate(() => document.getElementById("wodFlashBox")?.style.display !== "flex");
check("saving an EMOM attempt never flashes a PR (no cross-attempt scoring)", noPrFlash);

await page.click("#tabCalendarBtn");
await page.waitForTimeout(200);
const calText = (await page.evaluate(() => document.getElementById("calDetail")?.textContent || "")).replace(/\s+/g, " ").trim();
check("calendar day view shows per-movement reps (15 · 7 · 40), the rest station excluded, not a generic score", calText.includes("15 · 7 · 40"), calText);

check("no console errors", errors.length === 0, errors.join(" | "));

await browser.close();
await target.close();
console.log(failed ? "\nemom: FAILED" : "\nemom: all checks passed");
process.exit(failed ? 1 : 0);
