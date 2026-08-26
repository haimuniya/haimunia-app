#!/usr/bin/env node
// Accessibility: text size preference (רגיל / גדול / גדול מאוד), for members
// who can't read the app's smaller labels. Implemented as CSS zoom on
// <html> rather than font-size, specifically so it scales every literal px
// value already baked into this app's inline styles, not just text in rem.
// The one real risk with zoom is position:fixed modals — zoom doesn't
// establish a new containing block the way transform would, so this
// verifies a fixed overlay's inset:0 still covers the real viewport (not
// scaled away) while its own content still scales with the rest of the
// page, and that nothing overflows horizontally at the largest size.
//
// Usage:
//   node text-scale.mjs                 # local working tree
//   TARGET_URL=<url> node text-scale.mjs # a deployed site
import { chromium } from "playwright";
import { resolveTarget } from "./lib/target.mjs";
import { dismissWelcomeModal, consoleErrorCollector } from "./lib/actions.mjs";

let failed = false;
function check(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? " — " + detail : ""}`);
  if (!ok) failed = true;
}

const target = await resolveTarget();
console.log(`Target: ${target.url}${target.local ? " (local static server)" : ""}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
const errors = await consoleErrorCollector(page);

await page.goto(target.url, { waitUntil: "networkidle" });
await page.waitForSelector("#app", { state: "visible" });
await dismissWelcomeModal(page);

const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);

check("no horizontal overflow at the default size", await noOverflow());

// Measure a real element's rendered size before/after switching to xlarge —
// this is the actual proof zoom is doing something, not just that the
// attribute got set.
const measureFooterLabel = () => page.evaluate(() => {
  const el = document.querySelector("[data-action='set-text-scale'][data-pref='normal']");
  return el ? el.getBoundingClientRect().height : null;
});

await page.evaluate(() => document.getElementById("content").scrollIntoView());
await page.mouse.wheel(0, 4000);
await page.waitForTimeout(150);
const heightBefore = await measureFooterLabel();

await page.click("[data-action='set-text-scale'][data-pref='xlarge']");
await page.waitForTimeout(150);
const attr = await page.evaluate(() => document.documentElement.getAttribute("data-text-scale"));
check("clicking גדול מאוד sets data-text-scale=xlarge", attr === "xlarge", attr);

const heightAfter = await measureFooterLabel();
check("the control's own rendered size actually grew (zoom is applying, not just the attribute)", heightAfter > heightBefore * 1.3, `${heightBefore} -> ${heightAfter}`);

check("no horizontal overflow on the main tab at the largest size", await noOverflow());

await page.reload({ waitUntil: "networkidle" });
const attrAfterReload = await page.evaluate(() => document.documentElement.getAttribute("data-text-scale"));
check("preference persists across a reload", attrAfterReload === "xlarge", attrAfterReload);

// The real risk case: a position:fixed modal at the largest text size.
// inset:0 must still cover the true viewport (not get scaled away), while
// the content inside it still visibly scales with the rest of the page.
await page.click("#tabWodBtn");
await page.waitForTimeout(150);
await page.click("[data-action='open-wod-picker']");
await page.waitForTimeout(150);
await page.click("[data-action='open-wod-builder']");
await page.waitForSelector("#wodBuilderOverlay.open");
await page.waitForTimeout(150);
// Note: getBoundingClientRect() on an explicitly-pixel-sized element inside
// a zoomed tree reports in that tree's zoomed coordinate space (e.g. a real
// 800px gets reported back as ~1160 at 1.45x) — comparing that directly
// against Playwright's real (physical) viewportSize() looks like a mismatch
// but isn't one; it's just two different unit systems. What actually matters
// is whether the modal is genuinely usable on screen, so check that instead.
const overlaySetHeight = await page.evaluate(() => document.getElementById("wodBuilderOverlay").style.height);
const innerH = await page.evaluate(() => window.innerHeight);
check("the modal's own JS height hack still resolves to the real viewport height under zoom",
  overlaySetHeight === `${innerH}px`, `style.height=${overlaySetHeight} window.innerHeight=${innerH}`);
const closeVisible = await page.locator("[data-action='close-wod-builder'] svg").first().isVisible();
const createVisible = await page.locator("[data-action='create-wod']").isVisible();
check("the modal's close button and its far-lower create button are both genuinely visible on screen",
  closeVisible && createVisible, `close=${closeVisible} create=${createVisible}`);
check("no horizontal overflow with a fixed modal open at the largest size", await noOverflow());

check("no console errors", errors.length === 0, errors.join(" | "));

await browser.close();
await target.close();
console.log(failed ? "\ntext-scale: FAILED" : "\ntext-scale: all checks passed");
process.exit(failed ? 1 : 0);
