// The "What's New" reveal (showWhatsNewIfDue/showWhatsNew/closeWhatsNew,
// whatsNewOverlay) — a one-time celebratory screen for a RETURNING user
// whose last-seen version predates the visual redesign, reusing the PR-
// celebration overlay's look instead of the plain per-version bullet list
// every routine release gets. See test/roadmap-features.test.mjs for the
// fresh-install case (never shown — nothing to compare it to).
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

async function makeReturningUser(window, lastSeenVersion) {
  // A fresh bootApp() always looks like a brand-new install to init()'s own
  // bootstrap logic (empty IndexedDB) — simulate an existing device with a
  // real name and an old tracked version the same way roadmap-features.test.mjs
  // does: write the setting directly, then re-sync the in-memory copy.
  window.saveWelcomeForm("שחף");
  await window.dbSetSetting("haimunia:lastSeenVersion", lastSeenVersion);
  await window.loadLastSeenVersion();
}

test("a returning user whose last-seen version predates the redesign sees the reveal once, then not again", async () => {
  const window = await bootApp();
  await makeReturningUser(window, "2.30.5"); // one patch before the WHATS_NEW_MILESTONE (2.31.0)

  assert.equal(window.showWhatsNewIfDue(), true, "due for the reveal");
  assert.ok(window.document.getElementById("whatsNewOverlay").classList.contains("open"));
  assert.ok(window.document.getElementById("whatsNewHighlights").children.length >= 3, "should show the highlight rows, not an empty sheet");
  window.closeWhatsNew();

  assert.equal(window.showWhatsNewIfDue(), false, "already caught up now — shouldn't show again");
  assert.ok(!window.document.getElementById("whatsNewOverlay").classList.contains("open"));
});

test("a user already on or after the milestone version never sees the reveal", async () => {
  const window = await bootApp();
  await makeReturningUser(window, "2.31.0"); // exactly the milestone
  assert.equal(window.showWhatsNewIfDue(), false);
  assert.ok(!window.document.getElementById("whatsNewOverlay").classList.contains("open"));

  await makeReturningUser(window, "2.32.0"); // past it
  assert.equal(window.showWhatsNewIfDue(), false);
});

test("showing the reveal also clears the regular notifications badge, instead of stacking a second prompt on top", async () => {
  const window = await bootApp();
  await makeReturningUser(window, "0.0.0"); // as old as a real pre-tracking device gets
  assert.ok(window.unseenReleaseNotes().length > 0, "sanity check: there really are unseen notes at this age");

  window.showWhatsNewIfDue();
  assert.equal(window.unseenReleaseNotes().length, 0, "the reveal should mark the user fully caught up, not leave a redundant badge behind it");
  assert.equal(window.document.getElementById("notificationsBadge").style.display, "none");
});

test("the reveal is reachable from init() itself for a genuinely old returning device, not just when called directly", async () => {
  const window = await bootApp();
  // init() already ran once during bootApp() and (correctly) treated this
  // empty-DB boot as a fresh install — reset to a "real device, old
  // version" state and re-run init() the same way a page reload would.
  await makeReturningUser(window, "2.30.0");
  await window.init();
  assert.ok(window.document.getElementById("whatsNewOverlay").classList.contains("open"), "a real init() pass should trigger the reveal for an old returning device");
});
