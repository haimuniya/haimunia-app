// Tiered achievement medals (pr/streak groups — the only ones with a
// bronze/silver/gold tier) render as weight-plate photos instead of the
// SVG shield, per the mapping the user gave directly: gray "5 KG" plate =
// bronze, green "10 KG" = silver, blue "20 KG" = gold. Non-tiered medals
// (milestone, rx, capstone) are unaffected — they keep the existing SVG
// shield/circle glyph system.
//
// The plate <img> is wrapped in a `.medal-plate.medal-shape` div (plus a
// `.medal-plate-shine` gloss overlay) so it gets a circular frame, rim,
// and diagonal highlight — reported as looking flat/unfinished otherwise,
// especially the locked state, which the base SVG-tuned filter crushed to
// near-invisible against this app's dark background.
//
// ACHIEVEMENTS is a module-scope `const`, not a window property (top-level
// const/let never attach to the global object), so this drives the real
// achievements modal DOM the same way the rest of this suite does, rather
// than reaching into internal state directly.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

function badgeByName(window, text) {
  return [...window.document.querySelectorAll(".medal-badge")].find((el) => el.querySelector(".medal-name")?.textContent.includes(text));
}

test("tiered (pr) medals render the mapped weight-plate image, wrapped in the circular plate frame, not the SVG shield", async () => {
  const window = await bootApp();
  window.openAchievements();

  const bronze = badgeByName(window, "ברונזה");
  const silver = badgeByName(window, "כסף");
  const gold = badgeByName(window, "זהב");
  assert.ok(bronze && silver && gold, "the achievements list should show all three PR tiers");

  assert.ok(bronze.querySelector(".medal-plate.medal-shape img")?.src.includes("assets/medal-bronze.png"));
  assert.ok(silver.querySelector(".medal-plate.medal-shape img")?.src.includes("assets/medal-silver.png"));
  assert.ok(gold.querySelector(".medal-plate.medal-shape img")?.src.includes("assets/medal-gold.png"));
  assert.ok(bronze.querySelector(".medal-plate-shine"), "the plate should get the gloss overlay for visual depth");
  assert.equal(bronze.querySelector("svg"), null, "a tiered medal should not also render the SVG shield");
});

test("tiered (streak) medals use the same tier->plate mapping as pr medals", async () => {
  const window = await bootApp();
  window.openAchievements();
  const streakBronze = [...window.document.querySelectorAll(".medal-badge")].find((el) => el.querySelector(".medal-name")?.textContent.includes("רצף") && el.querySelector(".medal-name")?.textContent.includes("ברונזה"));
  assert.ok(streakBronze, "a bronze-tier streak achievement should exist");
  assert.ok(streakBronze.querySelector(".medal-plate.medal-shape img")?.src.includes("assets/medal-bronze.png"));
});

test("non-tiered medals (milestone, rx, capstone) still render the SVG shield/circle, unaffected by the plate swap", async () => {
  const window = await bootApp();
  window.openAchievements();
  const badges = [...window.document.querySelectorAll(".medal-badge")];
  const milestone = badges.find((el) => el.querySelector(".medal-name")?.textContent.includes("אתלט שלם"));
  const capstone = badges.find((el) => el.classList.contains("capstone-badge"));
  assert.ok(milestone && capstone, "a milestone badge and the capstone badge should both be present");

  for (const badge of [milestone, capstone]) {
    assert.ok(badge.querySelector("svg.medal-shape"), "non-tiered medals should still use the SVG shield/circle");
    assert.equal(badge.querySelector(".medal-plate"), null, "non-tiered medals should never pick up the plate frame (no tier)");
  }
});

test("a tiered medal still gets the locked/earned CSS classes on the surrounding badge, same as before the plate swap", async () => {
  const window = await bootApp();
  window.openAchievements();
  const found = badgeByName(window, "ברונזה");
  assert.ok(found, "the bronze PR badge should exist");
  assert.ok(found.classList.contains("locked"), "a fresh install should have this tier locked");
  assert.ok(!found.classList.contains("earned"));
  // The plate wrapper always carries medal-shape, so the existing
  // grayscale/glow CSS filters (scoped to .medal-badge.locked/.earned
  // .medal-shape) still apply to it, plus the plate-specific locked
  // override that keeps it visible instead of crushed to near-invisible.
  assert.ok(found.querySelector(".medal-plate.medal-shape"));
});
