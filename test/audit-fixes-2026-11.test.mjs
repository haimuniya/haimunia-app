// The smaller findings of the 2026-11 QA audit, one test each.
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import { bootApp, waitFor } from "./helpers/boot.mjs";

const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));

// ---- finding 2 ----
test("saving a session note on the calendar shows the same toast other saves show", async () => {
  const window = await bootApp({ beforeScripts: (w) => { w.scrollTo = () => {}; } });
  window.saveWelcomeForm("נועה");
  const d = window.document;
  d.querySelector("[data-action='switch-tab'][data-tab='calendar']").click();
  await waitFor(() => d.getElementById("sessionNoteInput"));
  d.getElementById("sessionNoteInput").value = "הרגשתי חזק";
  d.querySelector("[data-action='save-session-note']").click();
  await waitFor(() => /ההערה נשמרה/.test(d.getElementById("appToastDock").textContent), 2000, 5, "the save toast");
  assert.equal(d.getElementById("appToastBar").getAttribute("role"), "status");
  assert.equal(await window.dbGetSetting(`sessionNote:${window.todayISO()}`), "הרגשתי חזק");
});

// ---- finding 3 ----
test("the update banner is a real button that says tap to update, not a status", () => {
  const html = read("index.html");
  const tag = html.match(/<button[^>]*id="updateBanner"[^>]*>/)[0];
  const banner = html.slice(html.indexOf(tag), html.indexOf("</button>", html.indexOf(tag)));
  assert.match(tag, /type="button"/);
  assert.doesNotMatch(tag, /role=/, "no status role on a control");
  assert.doesNotMatch(tag, /aria-live/);
  assert.match(tag, /aria-label="עדכון חדש זמין\. הקישו כדי לעדכן"/, "the accessible name says what a tap does");
  assert.match(banner, /הקישו כדי לעדכן/);
  assert.doesNotMatch(banner, /סגרו|פתחו/, "no more 'close and reopen' on the control that updates");
});

// ---- finding 4 ----
test("CI runs the version check and the tests on push and pull request", () => {
  const wf = read(".github/workflows/test.yml");
  assert.match(wf, /on:\s*\n\s*push:\s*\n\s*pull_request:/);
  assert.match(wf, /run: npm ci/);
  assert.match(wf, /run: npm run check-version/);
  assert.match(wf, /run: npm test/);
});

// ---- finding 9 ----
test("week streaks run Sunday to Saturday", async () => {
  const window = await bootApp();
  const wb = window.weekBucket;
  // 2026-11-08 is a Sunday, 2026-11-14 the Saturday after it.
  for (const day of ["2026-11-09", "2026-11-12", "2026-11-13", "2026-11-14"]) assert.equal(wb(day), wb("2026-11-08"), day);
  assert.equal(wb("2026-11-15"), wb("2026-11-08") + 1, "Sunday starts the next week");
  assert.equal(wb("2026-11-07"), wb("2026-11-08") - 1, "Saturday ends the one before");
  // Across the DST change (Israel, 2026-10-25) a week is still seven days.
  assert.equal(wb("2026-10-31"), wb("2026-10-25"));
  assert.equal(wb("2026-11-01"), wb("2026-10-25") + 1);
});

test("the 404 page links to the app from any depth, and the privacy page's CSP has nothing a meta tag ignores", () => {
  const notFound = read("404.html");
  assert.match(notFound, /<a href="\/haimunia-app\/">/, "root-relative, so /haimunia-app/a/b/ still lands on the app");
  assert.doesNotMatch(notFound, /href="\.\/"/);
  const privacy = read("privacy.html");
  const csp = privacy.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.doesNotMatch(csp, /frame-ancestors|report-uri|sandbox/, "ignored in a <meta> CSP, and logged as an error");
  assert.match(csp, /script-src 'self';/, "the rest of the policy is unchanged");
});
