// Coverage for the current nav shell: a fixed bottom tab bar (.tabbar, one
// tap to any of the four screens — see CHANGES.md for why this replaced an
// earlier hamburger-menu-only design that cost two taps per switch) and the
// settings modal (theme/text-scale/profile/backup/delete), reached directly
// from the header's gear button with no menu step in between.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

test("the bottom tab bar is visible (not the old hidden-compat-shim state) and switches tabs on one click", async () => {
  const window = await bootApp();
  const bar = window.document.querySelector(".tabbar");
  assert.notEqual(bar.style.display, "none", "the bottom nav is a real, visible control now, not a hidden shim");

  window.document.getElementById("tabHistoryBtn").click();
  assert.equal(window.document.getElementById("tabHistoryBtn").className, "tabbtn active");
  assert.equal(window.document.getElementById("pageTitle").textContent, "התקדמות");
});

test("the page title tracks every tab", async () => {
  const window = await bootApp();
  const titleFor = { tabAddBtn: "רישום", tabHistoryBtn: "התקדמות", tabCalendarBtn: "לוח שנה", tabWodBtn: "אימונים" };
  for (const [btnId, label] of Object.entries(titleFor)) {
    window.document.getElementById(btnId).click();
    assert.equal(window.document.getElementById("pageTitle").textContent, label);
  }
});

test("the header's gear button opens the settings modal directly — no menu step in between", async () => {
  const window = await bootApp();
  const overlay = window.document.getElementById("settingsOverlay");
  assert.ok(!overlay.classList.contains("open"));

  window.document.getElementById("settingsBtn").click();
  assert.ok(overlay.classList.contains("open"));
  assert.ok(window.document.querySelector("#settingsBody [data-action='set-theme']"), "the theme control is reachable from settings");
  assert.ok(window.document.querySelector("#settingsBody [data-action='export-data']"), "the export control is reachable from settings");
});

test("clicking the settings overlay backdrop closes it, but clicking inside the sheet does not", async () => {
  const window = await bootApp();
  window.openSettingsModal();
  const overlay = window.document.getElementById("settingsOverlay");
  assert.ok(overlay.classList.contains("open"));

  window.document.getElementById("settingsBody").click();
  assert.ok(overlay.classList.contains("open"), "clicking inside the sheet keeps it open");

  overlay.click();
  assert.ok(!overlay.classList.contains("open"), "clicking the backdrop itself closes it");
});

test("the delete-everything confirm flow works inside the settings modal", async () => {
  const window = await bootApp();
  window.openSettingsModal();

  window.document.querySelector("#settingsBody [data-action='ask-clear']").click();
  assert.ok(window.document.querySelector("#settingsBody [data-action='do-clear']"), "asking to clear shows the confirm step, re-rendered inside the still-open modal");

  window.document.querySelector("#settingsBody [data-action='cancel-clear']").click();
  assert.ok(window.document.querySelector("#settingsBody [data-action='ask-clear']"), "cancelling reverts back to the plain delete link");
});

test("the settings modal shows a profile card that opens the profile-edit modal", async () => {
  const window = await bootApp();
  await window.saveWelcomeForm("שחף");
  window.openSettingsModal();
  assert.ok(window.document.querySelector("#settingsBody").textContent.includes("שחף"), "settings shows the current profile name");

  window.document.querySelector("#settingsBody [data-action='edit-user-name']").click();
  assert.ok(window.document.getElementById("welcomeOverlay").classList.contains("open"), "the profile card opens the same profile-edit modal as everywhere else");
});

test("completing delete-everything from settings leaves the welcome modal visible on top, not hidden behind the still-open settings sheet", async () => {
  const window = await bootApp();
  window.openSettingsModal();
  window.document.querySelector("#settingsBody [data-action='ask-clear']").click();
  window.document.querySelector("#settingsBody [data-action='do-clear']").click();

  assert.ok(window.document.getElementById("welcomeOverlay").classList.contains("open"), "clearing data reopens the welcome modal");
  // Both #welcomeOverlay and #settingsOverlay share the base .modal-overlay
  // z-index (50, no override needed now that the full-screen menu — the one
  // overlay that ever needed a z-index override — is gone) so this only
  // stacks correctly because #welcomeOverlay comes later in DOM order.
});
