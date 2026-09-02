// Regression coverage for the app-chrome pass: the settings sheet's
// destructive-action state machine, the two fixed top banners sharing one
// slot, and the transient-status line that renders outside the sheet.
// Everything here is a bug that existed and is now fixed — see the comments
// on each test for what the old behavior was.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

test("closing the settings sheet disarms a half-completed 'delete everything'", async () => {
  const window = await bootApp();
  window.openSettingsModal();
  window.document.querySelector("#settingsBody [data-action='ask-clear']").click();
  assert.ok(window.document.querySelector("#settingsBody [data-action='do-clear']"), "asking to clear arms the confirm step");

  // confirmClear was only ever reset by ביטול or by going through with the
  // delete — so arming it and backing out (backdrop/✕/Escape) left the next
  // open of settings sitting on a live "כן, מחיקה", one stray tap from
  // wiping the log with no second confirmation.
  window.closeSettingsModal();
  window.openSettingsModal();
  assert.equal(window.document.querySelector("#settingsBody [data-action='do-clear']"), null, "reopening settings must not still be armed to delete");
  assert.ok(window.document.querySelector("#settingsBody [data-action='ask-clear']"), "it should be back to the plain, unarmed delete button");
});

test("an update banner steps the install banner aside without latching a user dismissal", async () => {
  const window = await bootApp();
  const install = window.document.getElementById("installBanner");
  const evt = new window.Event("beforeinstallprompt", { cancelable: true });
  evt.prompt = () => {};
  evt.userChoice = Promise.resolve({ outcome: "accepted" });
  window.dispatchEvent(evt);
  assert.equal(install.style.display, "block");

  // showUpdateBanner() used to call dismissInstallBanner(), which also writes
  // the sessionStorage "the user tapped ✕" flag — so one update banner
  // suppressed the install prompt for the rest of the session, and
  // sessionStorage survives the post-update reload in the same tab.
  window.showUpdateBanner();
  assert.equal(install.style.display, "none", "the install banner still yields the shared fixed-top slot");
  assert.equal(window.sessionStorage.getItem("haimunia:installDismissed"), null, "yielding the slot is not a dismissal");

  window.document.getElementById("updateBanner").style.display = "none";
  window.showInstallBanner();
  assert.equal(install.style.display, "block", "once the update banner is gone the install prompt can come back");
});

test("a ladder-finished confirmation is visible on the page, not only inside the closed settings sheet", async () => {
  const window = await bootApp();
  // setImportMessage() backs more than imports: finishing a ladder and saving
  // a session note both use it, and both fire while the settings sheet is
  // closed. The line lived only in the sheet, so those confirmations
  // rendered nowhere.
  window.setImportMessage("הסולם נשמר — 3 סטים");
  window.render();
  assert.ok(window.document.getElementById("content").textContent.includes("הסולם נשמר"), "the confirmation should show on the page itself");

  // …and exactly once when the sheet IS open, so a screen reader doesn't get
  // the same aria-live status announced twice.
  window.openSettingsModal();
  window.render();
  const occurrences = window.document.body.textContent.split("הסולם נשמר").length - 1;
  assert.equal(occurrences, 1, "with settings open the message renders once, in the sheet");
});

test("the settings sheet keeps its support link, and offers the preferences as real radio controls", async () => {
  const window = await bootApp();
  window.openSettingsModal();
  const support = window.document.querySelector("#settingsBody a[href^='mailto:']");
  assert.ok(support, "the support mailto link should be reachable from settings");
  assert.equal(support.getAttribute("href"), "mailto:haimuniya@gmail.com");

  const radios = [...window.document.querySelectorAll("#settingsBody [role='radio']")];
  assert.equal(radios.length, 5, "three theme options and two text-size options");
  assert.ok(radios.every((r) => r.hasAttribute("aria-checked")), "every option reports its own checked state");
  assert.equal(radios.filter((r) => r.getAttribute("aria-checked") === "true").length, 2, "exactly one option is selected per group");
});

test("an empty notifications list invites rather than just stating a fact", async () => {
  const window = await bootApp();
  window.openNotifications();
  const list = window.document.getElementById("notificationsList");
  assert.ok(list.querySelector(".chrome-empty"), "the empty state uses the shared invite-shaped block");
  assert.ok(list.textContent.includes("אין עדכונים חדשים"));
  assert.ok(list.querySelector(".chrome-empty svg"), "…with an icon, not a bare sentence");
});

test("skipping the name prompt leaves no empty, focusable greeting button in the header", async () => {
  const window = await bootApp();
  const greeting = window.document.getElementById("userGreeting");
  assert.equal(greeting.style.display, "none", "an unnamed user gets no nameless zero-content button in the tab order");

  await window.saveWelcomeForm("שחף");
  assert.notEqual(window.document.getElementById("userGreeting").style.display, "none");
  assert.ok(window.document.getElementById("userGreeting").textContent.includes("שחף"));
});
