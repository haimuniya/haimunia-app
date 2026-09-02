// Coverage for the shared overlay accessibility helper (OVERLAY_A11Y,
// trapFocusOnOpen, restoreFocusOnClose in app.js) — added after a research
// audit found every modal in the app (old and new) let keyboard focus tab
// straight out into the page behind an "open" dialog, with no Escape
// shortcut and no focus restore on close. One helper, wired into all 9
// overlay open/close pairs; this exercises a representative sample rather
// than all nine individually (the wiring itself is identical everywhere).
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

function tab(window, { shift = false } = {}) {
  const ev = new window.KeyboardEvent("keydown", { key: "Tab", shiftKey: shift, bubbles: true, cancelable: true });
  window.document.dispatchEvent(ev);
  return ev;
}
function escape(window) {
  const ev = new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
  window.document.dispatchEvent(ev);
  return ev;
}

test("opening an overlay moves focus inside it, and closing restores focus to the trigger", async () => {
  const window = await bootApp();
  const trigger = window.document.getElementById("notificationsBellBtn");
  trigger.focus();
  assert.equal(window.document.activeElement, trigger);

  window.openNotifications();
  assert.notEqual(window.document.activeElement, trigger, "focus should have moved into the overlay");
  assert.ok(window.document.getElementById("notificationsOverlay").contains(window.document.activeElement), "focus should land on something inside the overlay");

  window.closeNotifications();
  assert.equal(window.document.activeElement, trigger, "closing should return focus to whatever opened it");
});

test("Tab cycles within an open overlay instead of escaping into the page behind it", async () => {
  const window = await bootApp();
  // A fresh boot auto-opens #welcomeOverlay (first-run) — dismiss it first so
  // it isn't the topmost overlay intercepting the key events meant for
  // achievements underneath it (real usage never has two modals open at
  // once outside the one deliberate case covered by the last test below).
  window.closeWelcomeModal();
  window.openAchievements();
  const overlay = window.document.getElementById("achievementsOverlay");
  const focusables = [...overlay.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])')];
  assert.ok(focusables.length >= 2, "the achievements overlay should have more than one focusable element to make this a real test");

  const last = focusables[focusables.length - 1];
  last.focus();
  const ev = tab(window); // Tab forward from the last element should wrap to the first, not leave the overlay
  assert.equal(window.document.activeElement, focusables[0]);
  assert.ok(ev.defaultPrevented, "the wrap-around Tab should be intercepted");

  const first = focusables[0];
  first.focus();
  tab(window, { shift: true }); // Shift+Tab backward from the first element should wrap to the last
  assert.equal(window.document.activeElement, last);
});

test("Escape closes an overlay that's already dismissable by clicking its backdrop", async () => {
  const window = await bootApp();
  window.closeWelcomeModal(); // see the note in the previous test — same reason
  window.openSettingsModal();
  assert.ok(window.document.getElementById("settingsOverlay").classList.contains("open"));

  escape(window);
  assert.ok(!window.document.getElementById("settingsOverlay").classList.contains("open"), "Escape should close it, same as the backdrop click already does");
});

test("Escape does NOT close onboarding or the welcome modal — those require an explicit choice, same as clicking their backdrop already doesn't close them", async () => {
  const window = await bootApp();
  window.openOnboarding();
  escape(window);
  assert.ok(window.document.getElementById("onboardingOverlay").classList.contains("open"), "onboarding has no data-action on its own overlay div (not backdrop-closeable) — Escape shouldn't dismiss it either");
  window.closeOnboarding();

  window.openWelcomeModal(false);
  escape(window);
  assert.ok(window.document.getElementById("welcomeOverlay").classList.contains("open"), "same for the first-run welcome modal");
});

test("when two overlays are open at once, only the topmost (later in DOM order) responds to Escape/Tab", async () => {
  const window = await bootApp();
  // Reproduces the real stacking case from CHANGES.md: completing
  // delete-everything from inside Settings reopens the welcome modal on top
  // of the still-open settings sheet.
  window.openSettingsModal();
  window.openWelcomeModal(true);
  assert.ok(window.document.getElementById("settingsOverlay").classList.contains("open"));
  assert.ok(window.document.getElementById("welcomeOverlay").classList.contains("open"));

  escape(window); // welcome isn't Escape-closeable, and it's the topmost overlay — settings underneath must NOT react
  assert.ok(window.document.getElementById("welcomeOverlay").classList.contains("open"), "the topmost overlay (welcome) should still be open");
  assert.ok(window.document.getElementById("settingsOverlay").classList.contains("open"), "settings underneath should be untouched by a key event meant for the overlay on top");
});
