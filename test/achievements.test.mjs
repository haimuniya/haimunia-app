// Coverage gap closed (full-codebase audit, "regression + coverage" pass):
// the achievements modal and the post-save celebration popup had zero
// automated coverage before this. Uses the "אתלט שלם" (well-rounded)
// milestone — logging one set in each of the five PR categories
// (ACHIEVEMENT_PR_CATEGORIES) — since it's deterministic and needs no date
// or session-count bookkeeping, unlike the streak/session-count badges.
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import { bootApp } from "./helpers/boot.mjs";

test("logging a set in every PR category earns the well-rounded badge and pops the celebration", async () => {
  const window = await bootApp();
  assert.equal(window.isWellRounded(), false, "should not start well-rounded");

  const categories = ["Squat", "Deadlift", "Press", "Olympic", "Pull"];
  for (const cat of categories) {
    await window.addMovement(`Test WR ${cat}`, cat);
    window.applyFieldValue("step", "weight", 40);
    window.applyFieldValue("step", "reps", 5);
    window.applyFieldValue("step", "sets", 1);
    await window.saveSet();
  }

  assert.equal(window.isWellRounded(), true, "one set in each PR category should satisfy the well-rounded rule");

  // The last save should have triggered celebrateAfterSave(), which pops
  // the celebration overlay for any badge newly earned by that save.
  assert.equal(window.document.getElementById("celebrationOverlay").classList.contains("open"), true, "earning a new badge should pop the celebration overlay");
  const medalsText = window.document.getElementById("celebrationMedals").textContent;
  assert.ok(medalsText.includes("אתלט שלם"), "the newly-earned well-rounded medal should be shown in the celebration");

  window.closeCelebration();
  assert.equal(window.document.getElementById("celebrationOverlay").classList.contains("open"), false);
});

test("the achievements modal shows the well-rounded badge as earned, with its rule hidden once unlocked", async () => {
  const window = await bootApp();
  for (const cat of ["Squat", "Deadlift", "Press", "Olympic", "Pull"]) {
    await window.addMovement(`Test Ach ${cat}`, cat);
    window.applyFieldValue("step", "weight", 30);
    window.applyFieldValue("step", "reps", 3);
    window.applyFieldValue("step", "sets", 1);
    await window.saveSet();
  }
  window.closeCelebration();

  window.openAchievements();
  assert.equal(window.document.getElementById("achievementsOverlay").classList.contains("open"), true);
  // Match on the medal's own name exactly, not a substring search over the
  // whole badge — the capstone badge's *rule* text also mentions "אתלט שלם"
  // as one of its requirements, which a loose substring match would hit
  // first (it renders earlier in the list) and it's locked by design.
  const badge = [...window.document.querySelectorAll(".medal-badge")].find((el) => el.querySelector(".medal-name")?.textContent === "אתלט שלם");
  assert.ok(badge, "the well-rounded medal should be rendered in the achievements list");
  assert.ok(badge.classList.contains("earned"), "it should be marked earned, not locked");
  assert.ok(!badge.querySelector(".medal-rule"), "an earned badge should not show its unlock rule as a caption");

  window.closeAchievements();
  assert.equal(window.document.getElementById("achievementsOverlay").classList.contains("open"), false);
});

test("a locked achievement shows its rule as a visible caption (touch screens never see the title tooltip)", async () => {
  const window = await bootApp();
  window.openAchievements();
  const locked = window.document.querySelector(".medal-badge.locked");
  assert.ok(locked, "a fresh install should have plenty of locked badges");
  assert.ok(locked.querySelector(".medal-rule"), "a locked badge must print its rule, since title tooltips never show on touch");
});

// Restoring a backup pours in a whole history at once. Every badge that
// history justifies was earned months ago, so none of them is "new" — but
// nothing marked them seen, so the athlete's next single save popped one
// celebration listing all of them at once.
test("restoring a backup baselines its badges silently, instead of saving them up for the next set's celebration", async () => {
  const source = await bootApp();
  for (const cat of ["Squat", "Deadlift", "Press", "Olympic", "Pull"]) {
    await source.addMovement(`Backup ${cat}`, cat);
    source.applyFieldValue("step", "weight", 40);
    source.applyFieldValue("step", "reps", 5);
    source.applyFieldValue("step", "sets", 1);
    await source.saveSet();
  }
  source.closeCelebration();
  // importDataFromFile() only touches file.size and (await file.text()) —
  // same stand-in the import suite uses, since jsdom's File has no text().
  const json = JSON.stringify(source.buildBackupPayload());

  const restored = await bootApp();
  await restored.importDataFromFile({ size: json.length, text: async () => json });

  assert.equal(restored.isWellRounded(), true, "the imported history should satisfy the well-rounded rule");
  assert.deepEqual(restored.newlyEarnedAchievements().map((a) => a.id), [], "everything the import justifies must already count as seen");
  assert.equal(restored.document.getElementById("celebrationOverlay").classList.contains("open"), false, "an import itself should never pop the celebration");

  // A genuinely new badge earned after the restore still celebrates.
  await restored.addMovement("Post Restore Squat", "Squat");
  restored.applyFieldValue("step", "weight", 100);
  restored.applyFieldValue("step", "reps", 3);
  restored.applyFieldValue("step", "sets", 1);
  await restored.saveSet();
  assert.equal(restored.document.getElementById("celebrationOverlay").classList.contains("open"), true, "a real new PR after an import should still celebrate");
});

// saveSet() suppresses the popup for every rung of a ladder, so a badge
// unlocked mid-ladder used to wait for some unrelated later save to
// announce it — or was never celebrated at all when the ladder was the
// whole session.
test("a badge earned mid-ladder is paid out when the ladder is finished, not left hanging", async () => {
  const window = await bootApp();
  const isOpen = () => window.document.getElementById("celebrationOverlay").classList.contains("open");

  await window.addMovement("Ladder Badge Press", "Press");
  window.toggleLadderMode();
  window.applyFieldValue("step", "weight", 50);
  window.applyFieldValue("step", "reps", 5);
  window.applyFieldValue("step", "sets", 1);
  await window.saveSet();
  assert.equal(isOpen(), false, "still suppressed mid-ladder");

  window.toggleLadderMode(); // finish the ladder
  assert.equal(isOpen(), true, "finishing the ladder should celebrate what its rungs unlocked");
  assert.equal(window.document.getElementById("celebrationTitle").textContent, "כל הכבוד!", "a badge payout uses the badge title, not the PR one");
  assert.ok(window.document.getElementById("celebrationMedals").textContent.includes("ברונזה"), "the bronze Press tier earned by the ladder should be shown");
  window.closeCelebration();

  // Nothing left over: the badges were marked seen as they were shown.
  assert.deepEqual(window.newlyEarnedAchievements().map((a) => a.id), []);
  // Starting and ending an empty ladder must not pop anything.
  window.toggleLadderMode();
  window.toggleLadderMode();
  assert.equal(isOpen(), false, "an empty ladder has nothing to celebrate");
});

test("a plain PR with no new badge still celebrates, without a badge grid", async () => {
  const window = await bootApp();
  await window.addMovement("Test Plain PR Deadlift", "Deadlift");
  window.applyFieldValue("step", "weight", 60);
  window.applyFieldValue("step", "reps", 5);
  window.applyFieldValue("step", "sets", 1);
  await window.saveSet();
  window.closeCelebration();

  // A heavier set on the same movement is a PR but (on its own) shouldn't
  // complete any category/streak/milestone tier this fresh.
  window.applyFieldValue("step", "weight", 65);
  await window.saveSet();

  assert.equal(window.document.getElementById("celebrationOverlay").classList.contains("open"), true, "a plain PR alone should still pop the celebration");
  const title = window.document.getElementById("celebrationTitle").textContent;
  assert.equal(title, "שיא אישי חדש!", "a PR-only celebration should use the PR title, not the badge one");
  const prLine = window.document.getElementById("celebrationPrLine");
  assert.equal(prLine.style.display, "block");
  assert.ok(prLine.textContent.includes("Test Plain PR Deadlift"));
});

// ---- Achievements modal layout (renderAchievementsContent) ----

test("each badge family heads its own block with an accurate earned/total count", async () => {
  const window = await bootApp();
  for (const cat of ["Squat", "Deadlift"]) {
    await window.addMovement(`Count ${cat}`, cat);
    window.applyFieldValue("step", "weight", 45);
    window.applyFieldValue("step", "reps", 5);
    window.applyFieldValue("step", "sets", 1);
    await window.saveSet();
  }
  window.closeCelebration();
  window.openAchievements();

  const sections = [...window.document.querySelectorAll(".ach-modern .ach-section")];
  assert.ok(sections.length >= 8, "one block per PR category plus streak, milestones and Rx");
  for (const section of sections) {
    const count = section.querySelector(".ach-section-count");
    assert.ok(count, "every family head should carry its progress count");
    const [done, total] = count.textContent.split("/").map(Number);
    assert.equal(total, section.querySelectorAll(".medal-badge").length, "the total should match the medals actually rendered");
    assert.equal(done, section.querySelectorAll(".medal-badge.earned").length, "the earned half of the count should match the earned medals");
  }
  // One PR logged in each of two categories = bronze in both, nothing else.
  const squat = sections.find((s) => s.querySelector(".ach-section-title").textContent === "Squat");
  assert.equal(squat.querySelector(".ach-section-count").textContent, "1/3");
});

test("with no club start date the milestone family shows an invite to add one, and drops it once it's set", async () => {
  const window = await bootApp();
  window.openAchievements();
  const invite = window.document.querySelector(".ach-invite");
  assert.ok(invite, "the tenure badges can't be evaluated without a start date, so the modal should ask for one");
  assert.equal(invite.dataset.action, "open-profile-from-achievements", "the invite must still route to the profile form");
  assert.ok(invite.textContent.includes("תאריך התחלה במועדון"));

  window.saveBoxStartDate("2020-01-01");
  window.openAchievements();
  assert.equal(window.document.querySelector(".ach-invite"), null, "with a start date on file there's nothing left to invite");
});

// Anton only ships a latin subset in this app (see its @font-face
// unicode-range), so a bare 'Anton',sans-serif stack drops every Hebrew
// string in these elements to the OS default font instead of Rubik.
test("display-font elements name 'Rubik' as the fallback, so their Hebrew text stays on the app's own font", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  for (const selector of ["celebration-title", "ach-summary-level", "ach-summary-num"]) {
    const rule = html.match(new RegExp(`\\.${selector}\\{[^}]*\\}`));
    assert.ok(rule, `.${selector} should have a rule in the stylesheet`);
    assert.match(rule[0], /font-family:'Anton','Rubik',sans-serif;/, `.${selector} must fall back to Rubik before sans-serif`);
  }
});
