// The three weight-plate medal images (assets/medal-bronze/silver/gold.png,
// referenced by app.js's tiered-achievement markup) were added without
// being added to sw.js's ASSETS precache list. isPrecached() gates what
// gets written to cache on a successful fetch, so these never got cached
// for offline use even after loading once online - a member opening the
// achievements modal or a medal-unlock celebration offline (common at a
// gym) saw a broken image for every tiered medal while every other app
// asset kept working offline as intended.
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";

const sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("every assets/medal-*.png referenced by app.js is in sw.js's ASSETS precache list", () => {
  const assetsMatch = sw.match(/const ASSETS = \[([\s\S]*?)\];/);
  assert.ok(assetsMatch, "sw.js must define an ASSETS array");
  const assetsBlock = assetsMatch[1];

  // app.js builds the path as a template literal (`./assets/medal-${ach.tier}.png`),
  // so it can't be regex-matched as a literal string - confirm the
  // template exists, then check every real tier value it's built from.
  assert.match(app, /\.\/assets\/medal-\$\{ach\.tier\}\.png/, "app.js should build the tiered-medal image path from ach.tier");
  for (const tier of ["bronze", "silver", "gold"]) {
    const path = `./assets/medal-${tier}.png`;
    assert.ok(assetsBlock.includes(`"${path}"`), `${path} must be precached (sw.js ASSETS) so tiered medals don't break offline`);
  }
});
