#!/usr/bin/env node
// Lower-priority sub-task: a reference-only time cap on a WOD. Never
// scored or enforced.
//
// Usage:
//   node wod-extras.mjs                 # local working tree
//   TARGET_URL=<url> node wod-extras.mjs # a deployed site
import { chromium } from "playwright";
import { resolveTarget } from "./lib/target.mjs";
import { dismissWelcomeModal, dismissCelebrationIfOpen, consoleErrorCollector } from "./lib/actions.mjs";

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
// No WOD is pre-selected on a fresh load anymore — its own direct build
// button in the empty state replaces the old picker-then-builder detour.
await page.click("[data-action='open-wod-builder']");
await page.waitForSelector("#wodBuilderOverlay.open", { timeout: 5000 });

await page.fill("#wodBuilderName", "Test Capped WOD");
await page.click("#wodBuilderFormats .format-chip[data-format='time']");
await page.waitForTimeout(150);
const capStepperShown = await page.evaluate(() => !!document.querySelector("[data-action='builder-time-cap'].stepper-val"));
check("selecting a non-EMOM format shows the time-cap stepper", capStepperShown);
await page.fill("[data-action='builder-time-cap'].stepper-val", "20");
await page.dispatchEvent("[data-action='builder-time-cap'].stepper-val", "change");
await page.click("[data-action='create-wod']");
await page.waitForTimeout(300);

const capText = await page.evaluate(() => document.body.textContent);
check("log view shows the time cap after creating the WOD", capText.includes("מגבלת זמן: 20:00"));

// Log an attempt against the capped WOD.
await page.fill("[data-field='wodMinutes'].stepper-val", "18");
await page.dispatchEvent("[data-field='wodMinutes'].stepper-val", "change");
await page.click("[data-action='save-wod']");
await page.waitForTimeout(300);
await dismissCelebrationIfOpen(page);

await page.click("#tabCalendarBtn");
await page.waitForTimeout(200);
const calText = (await page.evaluate(() => document.getElementById("calDetail")?.textContent || "")).replace(/\s+/g, " ").trim();
check("calendar day view shows the logged attempt", calText.includes("Test Capped WOD"), calText);

check("no console errors", errors.length === 0, errors.join(" | "));

await browser.close();
await target.close();
console.log(failed ? "\nwod-extras: FAILED" : "\nwod-extras: all checks passed");
process.exit(failed ? 1 : 0);
