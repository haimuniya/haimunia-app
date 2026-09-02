// Coverage for the hamburger menu + settings modal that replaced the old
// always-visible top tab bar and footer-buried settings. Primary nav now
// lives entirely behind the hamburger; the .tabbar pill row stays in the DOM
// (hidden) only so render()'s tab-button sync loop has real elements to
// write into — these tests also guard that compatibility shim.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

test("the hamburger button opens the menu overlay, and closing it removes the open class", async () => {
  const window = await bootApp();
  const overlay = window.document.getElementById("menuOverlay");
  assert.ok(!overlay.classList.contains("open"), "menu starts closed");

  window.document.getElementById("menuBtn").click();
  assert.ok(overlay.classList.contains("open"), "clicking the hamburger opens the menu");

  window.document.querySelector("#menuOverlay [data-action='close-menu']").click();
  assert.ok(!overlay.classList.contains("open"), "the X button closes the menu");
});

test("clicking the menu overlay backdrop closes it, but clicking inside the sheet does not", async () => {
  const window = await bootApp();
  window.openMenu();
  const overlay = window.document.getElementById("menuOverlay");
  assert.ok(overlay.classList.contains("open"));

  // A click whose target is a descendant of the sheet must not close it —
  // same guard pattern as the achievements/notifications/wod-picker overlays.
  window.document.getElementById("menuBody").click();
  assert.ok(overlay.classList.contains("open"), "clicking inside the sheet keeps the menu open");

  overlay.click();
  assert.ok(!overlay.classList.contains("open"), "clicking the backdrop itself closes the menu");
});

test("the menu lists all four primary tabs with the current tab marked active", async () => {
  const window = await bootApp();
  window.openMenu();
  const items = window.document.querySelectorAll("#menuBody [data-action='menu-nav']");
  assert.equal(items.length, 4, "all four primary destinations are listed");
  const tabs = [...items].map((el) => el.dataset.tab);
  assert.deepEqual(tabs, ["add", "history", "calendar", "wod"]);

  const active = window.document.querySelector("#menuBody [data-action='menu-nav'].active");
  assert.equal(active.dataset.tab, "add", "the Log tab is active by default");
  assert.equal(active.getAttribute("aria-selected"), "true");
});

test("picking a destination from the menu switches tabs, closes the menu, and updates the page title", async () => {
  const window = await bootApp();
  window.openMenu();
  window.document.querySelector("#menuBody [data-action='menu-nav'][data-tab='history']").click();

  assert.ok(!window.document.getElementById("menuOverlay").classList.contains("open"), "picking a destination closes the menu");
  assert.equal(window.document.getElementById("pageTitle").textContent, "התקדמות");
  assert.equal(window.document.getElementById("tabHistoryBtn").className, "tabbtn active", "the hidden legacy tab button still tracks the active tab");
});

test("the page title tracks every tab", async () => {
  const window = await bootApp();
  // `tab` is a top-level `let` inside app.js's own eval'd scope, not reachable
  // as window.tab (see test/helpers/boot.mjs) — drive it the same way the app
  // itself does, through the hidden-but-functional legacy tab buttons.
  const titleFor = { tabAddBtn: "רישום", tabHistoryBtn: "התקדמות", tabCalendarBtn: "לוח שנה", tabWodBtn: "אימונים" };
  for (const [btnId, label] of Object.entries(titleFor)) {
    window.document.getElementById(btnId).click();
    assert.equal(window.document.getElementById("pageTitle").textContent, label);
  }
});

test("the settings row in the menu closes the menu and opens the settings modal", async () => {
  const window = await bootApp();
  window.openMenu();
  window.document.querySelector("#menuBody [data-action='open-settings-modal']").click();

  assert.ok(!window.document.getElementById("menuOverlay").classList.contains("open"), "opening settings closes the menu behind it");
  assert.ok(window.document.getElementById("settingsOverlay").classList.contains("open"));
  assert.ok(window.document.querySelector("#settingsBody [data-action='set-theme']"), "the theme control is reachable from settings");
  assert.ok(window.document.querySelector("#settingsBody [data-action='export-data']"), "the export control is reachable from settings");
});

test("the delete-everything confirm flow works from inside the settings modal", async () => {
  const window = await bootApp();
  window.openSettingsModal();

  window.document.querySelector("#settingsBody [data-action='ask-clear']").click();
  assert.ok(window.document.querySelector("#settingsBody [data-action='do-clear']"), "asking to clear shows the confirm step, re-rendered inside the still-open modal");

  window.document.querySelector("#settingsBody [data-action='cancel-clear']").click();
  assert.ok(window.document.querySelector("#settingsBody [data-action='ask-clear']"), "cancelling reverts back to the plain delete link");
});

test("the profile card in the menu opens the profile-edit modal", async () => {
  const window = await bootApp();
  await window.saveWelcomeForm("שחף");
  window.openMenu();
  assert.ok(window.document.querySelector("#menuBody").textContent.includes("שחף"), "the menu shows the current profile name");

  window.document.querySelector("#menuBody [data-action='edit-user-name']").click();
  assert.ok(window.document.getElementById("welcomeOverlay").classList.contains("open"), "the profile card opens the same profile-edit modal as everywhere else");
  // #welcomeOverlay has no z-index override (base .modal-overlay: 50) and
  // #menuOverlay is explicitly raised to 61 (see index.html) so it can sit
  // above the install/update banners — opening the profile modal without
  // closing the menu first would leave it visually stuck behind the menu.
  assert.ok(!window.document.getElementById("menuOverlay").classList.contains("open"), "opening the profile modal from the menu closes the menu, so the profile modal isn't left stacked behind it");
});
