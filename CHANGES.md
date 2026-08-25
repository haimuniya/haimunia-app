# Ladder UX pass — 2026-08-25

The ladder toggle worked but was easy to miss (a small text link) and gave
no feedback on what it actually did — no indication of which set you were
on, the save button never changed to reflect it, and finishing without
switching tabs first left stale state on screen (a real bug: `endLadder()`
via the explicit toggle never called `render()`, so the UI kept showing
"finish ladder" and the old round list until something else happened to
re-render).

- Toggle is now a full-width bordered button (matching the app's existing
  "+ add new" prompt pattern) with a ladder icon and a plain-language
  subtitle when off. While active, it shows live progress inline — "5 סטים
  נרשמו · הבא: 6" — instead of requiring a scroll down to the chip list to
  know where you are.
- The Save button's own label now changes too: "הוספת סט 6 לסולם — Strict
  Press" instead of the generic "רישום סט", so it's explicit that tapping
  it adds another rung rather than finishing anything.
- Fixed: tapping "סיום" now re-renders immediately (previously required
  switching tabs to see the toggle/list actually clear) and shows a brief
  confirmation ("הסולם נשמר — 5 סטים") reusing the existing footer message
  mechanism.
- Fixed a copy bug: the empty-ladder hint referenced "the blue button" —
  the save button is actually the brand's orange/energy color, never blue.

Files changed: `app.js`. Verified with the full test suite plus a real
Chromium session driving the exact flow (toggle on, 5 different-weight
rounds, finish without switching tabs, confirm the render and message).

---

# Service worker: stop self-reloading on first install, apply updates without reopening — 2026-08-25

Two bugs in the update-delivery path, found while chasing a report that the
new ladder feature "wasn't showing up."

**Critical: every fresh visit was reloading itself ~1-2s after opening.**
`self.clients.claim()` in the service worker's `activate` handler fires
`controllerchange` even on a page's very first-ever install — not just on a
real update swap. The app's `controllerchange` listener reloaded
unconditionally, so any in-progress input (the welcome-modal name field, a
weight being adjusted, a ladder mid-session) could get silently wiped a
second or two into every single visit. `applyUpdate()` now sets a
`swapRequested` flag right before asking a waiting worker to take over, and
the listener only reloads when that flag is set — ignoring the incidental
first-claim event. Confirmed via a real Chromium session: before the fix, a
fresh load always fired a second navigation within ~2s; after, zero.

**Updates now apply without a manual reopen, in the common case.** Previously
every update needed an explicit tap on the "עדכון חדש זמין" banner. Since the
phone screen locking between sets already fires `visibilitychange`, updates
now apply automatically the moment the page regains visibility after being
backgrounded — no banner, no reopening needed. The banner still appears as a
fallback only when an update lands while the page has stayed continuously
visible (reloading then could drop unsaved input), and applies automatically
on the next visibility regain even if the banner is never tapped.

Files changed: `app.js`. No test suite coverage for either fix — both are
real Service Worker lifecycle behavior that jsdom doesn't implement, so they
were verified with a real Chromium session (Playwright) against a local
static server instead; see the session's own scratch scripts for the pattern
if this code changes again.

---

# Ladder logging — 2026-08-25

Working-up ladders (e.g. Press: 6 reps @ 60, 5 @ 70, 4 @ 80, 3 @ 85, 3 @ 90 —
each rung a different weight *and* rep count) didn't fit the "Sets" field,
which only means "N identical sets at one weight/reps." Saving each rung
separately already worked, but showed up as unrelated rows.

- Entries gained an optional `groupId` (`sanitizeEntry`) tying together the
  rows saved in one ladder session. Existing records get `groupId: null` —
  no behavior change for anyone who never uses this.
- New toggle in the log tab: "רישום סולם" turns it on (generates a session
  id), every Save while it's on joins that session, a running list of the
  rounds so far shows underneath with a per-round remove. "סיום סולם" turns
  it off. Switching exercise or changing the log date auto-ends it, so a set
  can't silently misjoin the wrong session.
- The calendar day view groups a ladder's rows into one card (exercise name
  + PR flame shown once) — but every rung keeps its own edit/delete, so a
  specific set stays individually correctable.
- The full-screen "PR!" celebration popup is suppressed while a ladder is
  active — an ascending ladder routinely beats the previous best est1RM on
  every rung, which meant one popup per rung. The inline barbell flash still
  shows a PR immediately; the popup resumes normally once the ladder ends.
- Nothing else changed: PR detection, `bestEst1RM`/`repRecordFor`, the
  progress chart, and export/import all still treat every round as its own
  entry, same as before — a ladder's rungs just happen to share a tag.

Files changed: `app.js`. Tests: `test/sanitizers.test.mjs` (groupId
round-trip), `test/app-flow.test.mjs` (a real 5-round ladder end to end,
including surviving a simulated reload, and exercise-switch auto-ending it).

---

# "Next level" pass — 2026-08-25

Follow-up to the review below: closed out the "left for you" items from the
2.8.0 pass, plus an accessibility sweep, an install prompt, and the first
committed automated test suite.

Files changed: `app.js`, `index.html`, `sw.js`. New: `assets/fonts/*` (13
files), `package.json`, `package-lock.json`, `scripts/sync-version.mjs`,
`test/*`, `.gitignore`. `manifest.json` unchanged.

Verified with `npm test` (Node's built-in test runner, jsdom + fake-indexeddb,
dev-only — nothing here ships to the deployed site): **19 assertions**, all
passing, covering sanitizers/XSS-escaping, the add-movement → log-a-set →
simulated-reload round trip, and the import path (valid backup, `__proto__`
category neutralization, wrong-app-id rejection, oversized-file rejection).

## Self-hosted fonts, tightened CSP

- Downloaded the exact Rubik (400/600/700/800/900, latin+hebrew subsets),
  JetBrains Mono (500/700), and Anton (400) `.woff2` files Google's own CSS2
  API serves for this app, into `./assets/fonts/`. Verified woff2 magic bytes
  on all 13 files.
- Replaced the Google Fonts `<link>` in `index.html` with local `@font-face`
  rules using the same `unicode-range` values, so subsetting behavior is
  unchanged.
- CSP's `style-src`/`font-src` no longer allow any external origin — the app
  now makes zero third-party network requests, full stop.
- `sw.js` precaches all 13 font files, so typography no longer degrades
  offline.

## Accessibility pass

Previously: 2 `aria-*`/`role` attributes in the whole app. Now: 120 across
`index.html` + `app.js`. Added:
- `role="tablist"`/`"tab"`/`aria-selected` on the main tab bar and the WOD
  sub-tab bar, kept in sync on every tab switch.
- `role="dialog"` `aria-modal` `aria-labelledby` on all 6 modals (picker, WOD
  picker, WOD builder, achievements, celebration, welcome), `aria-label` on
  every icon-only close button.
- `aria-label` on every search input, date input, and icon-only edit/delete
  button; `aria-label` on the stepper +/− buttons and value fields.
- `role="radiogroup"`/`"radio"` + `aria-checked` on the WOD format picker, bar
  weight picker, Rx/Scaled toggle, and theme picker; `role="checkbox"`
  `aria-checked` on the WOD-builder movement checklist rows.
- `role="status"`/`aria-live` on the update banner, install banner, loading
  screen, storage-error footer note, and import-result message.

## Version sync automated

`APP_VERSION` (app.js) and `SW_VERSION` (sw.js) were kept in sync by hand.
`scripts/sync-version.mjs` now does it — `npm run sync-version` after bumping
`APP_VERSION`, `npm run check-version` (or `npm test`) fails loudly if they
ever drift.

## Install prompt

Custom "Add to Home Screen" banner (`app.js`: `beforeinstallprompt` handling;
`index.html`: `#installBanner`), styled like the update banner but with the
brand stripe instead of solid energy color so the two are visually distinct.
Shows once per session, steps aside if an update banner is showing, never
shows if already installed. iOS Safari doesn't fire `beforeinstallprompt`, so
the banner simply never appears there — no regression, just no improvement
for that platform.

## Export privacy notice

One line under the export/import buttons: the backup file is plaintext JSON
and includes name, bodyweight history, and full training log.

## Left undone (by design, not oversight)

- **Server response headers** (HSTS, `X-Content-Type-Options`,
  `Permissions-Policy`, real `frame-ancestors`) — GitHub Pages can't set
  custom headers; would need Cloudflare or another host in front. Decided
  against for now: no backend, no data leaves the device, so this was already
  low real-world risk.

---

# Security & hardening pass — v2.7.0 → v2.8.0

Files changed: `app.js`, `index.html`, `sw.js`. `manifest.json` unchanged.

Verified with two suites run against the real app booted in a DOM
(jsdom + fake-indexeddb): **58 security assertions** and **59 functional
regression assertions**, all passing.

---

## Critical

### 1. XSS via unescaped HTML attributes
`esc()` was applied to text nodes but skipped on several attribute values.

- `renderStepper()` — `data-field`, `data-action`, `data-step`, `data-min`,
  `value`, and the label are now all escaped. `field` is a user-authored
  movement name from the WOD builder.
- `data-id` on `pick-movement`, `pick-wod`, `select-history`,
  `select-wod-history`, `delete-entry`, `delete-wod-entry`; `data-date` on
  `cal-select-day`.
- `CATEGORY_LABELS[cat] || cat` and `style="background:${CATEGORY_COLORS[cat]}"`
  — replaced with `catLabel()` / `catColor()`, which use `hasOwnProperty` and
  fall back to safe defaults, then escaped.
- The `render()` catch-block printed `err.message` raw into `innerHTML`.

The `id` and `category` sinks were reachable from an imported backup file,
which is the vector that mattered.

### 2. Import accepted arbitrary data
`importDataFromFile()` checked only that `record.id` was truthy.

- Added `sanitizeMovement` / `sanitizeCustomWod` / `sanitizeEntry` /
  `sanitizeWodEntry` / `sanitizeBodyweight`. Each rebuilds the record field by
  field from a whitelist: `cleanId` (charset `A-Za-z0-9._:-`), `cleanStr`
  (control chars stripped, length capped), `cleanNum` (clamped both ends),
  `cleanISODate`, `cleanTs`. Nothing from the file is ever stored as-is.
- `data.app` and `data.version` are now verified (they were written on export
  and ignored on import).
- 25 MB file cap, 20,000-record-per-list cap.
- Confirmation prompt before merging, and a `box-log-rollback-<date>.json`
  auto-backup is downloaded first, since the merge can't be undone in-app.
- Result message reports imported / rejected / failed-to-save counts.
- New `reloadFromDb()` re-sanitizes on every load, so records written by an
  older build of the app can't poison the render path either.

### 3. Prototype pollution → persistent DoS
`byCategory[m.category]` with `category: "__proto__"` resolved to
`Object.prototype`, and `.push` threw a `TypeError`. Because the record was
persisted, the picker crashed on every load until "clear all data".

- `byCategory` and `builderMovements` now use `Object.create(null)` via `bag()`.
- `catColor` / `catLabel` guard lookups with `hasOwnProperty`.
- The category whitelist in the sanitizer closes the entry point.

---

## Hardening

- **CSP added** to `index.html` — `script-src 'self'`, `object-src 'none'`,
  `base-uri 'none'`, `form-action 'none'`, `connect-src 'self'`.
  `'unsafe-inline'` is in `style-src` only (inline `style=` attributes; there is
  no inline `<script>` anywhere). `frame-ancestors` is in the meta tag but is
  ignored there — **set it as a real response header on the host.**
- `<meta name="referrer" content="no-referrer">`.
- Google Fonts left in place but documented inline with the exact steps to
  self-host; `preconnect` to `fonts.gstatic.com` was missing and is now added.
  Self-hosting is the one item I couldn't do for you — it needs the woff2 files.

---

## Service worker (rewritten)

- **Origin-gated.** It previously cached every successful GET from any origin,
  forever. Now same-origin only, and only app-shell paths are written back.
- **`Promise.allSettled` over individual `cache.add()`** instead of `addAll()`,
  which failed the entire install on one missing file.
- **Added the maskable icons** to `ASSETS` (referenced in the manifest, absent
  from the precache list).
- **Navigation handling with `ignoreSearch: true`** — this is what makes the
  manifest shortcuts (`./index.html?tab=add`) work offline; exact-URL matching
  missed on the query string.
- **`skipWaiting()` removed from install.** A new worker parks in `waiting`; the
  update banner posts `SKIP_WAITING` and the page reloads on `controllerchange`.
  Previously the new worker took over while the old `app.js` was still running.
- Navigation preload enabled; `SW_VERSION` bumped to 2.8.0 alongside
  `APP_VERSION`.

---

## Smaller fixes

- **Pinch-zoom restored.** `user-scalable=no` / `maximum-scale=1` removed from
  the viewport meta, and the `touchmove` / `gesture*` blockers removed from
  `app.js` (WCAG 1.4.4). The double-tap-zoom suppression is kept, since that one
  fires by accident on the steppers.
- **Numeric inputs bounded at both ends** via `clampField()` — previously only a
  floor. `1e12` in a weight box no longer propagates into app state.
- **`maxlength` on every text input**, plus `cleanStr()` caps in JS (names 80,
  notes 300).
- **IDs now use `crypto.randomUUID()`.** The old slug scheme stripped every
  non-`[a-z0-9]` character, so all Hebrew movement names collapsed to
  `custom--<timestamp>`.
- **`userName` moved from localStorage to IndexedDB** (with one-time migration).
  It's the only PII in the app and "clear all data" never touched it — it does
  now, and the welcome modal reappears. Same for the last-export marker.
- **Storage failures surfaced.** `noteStorageError()` distinguishes
  `QuotaExceededError` and shows it in red in the footer instead of silently
  swallowing it.
- `CSS.escape` via `cssSel()` on the two `querySelector` calls that interpolate
  a field name — these threw on any name containing a quote.
- `openDB()` now memoises its promise instead of reopening the DB per call.
- `URL.revokeObjectURL` deferred 30s so the download reliably starts.
- `mobile-web-app-capable` added next to the deprecated Apple variant.

---

## Left for you

1. **Self-host the fonts** and tighten the CSP to `font-src 'self'` /
   `style-src 'self' 'unsafe-inline'`.
2. **Server response headers**: HSTS, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: no-referrer`, `Permissions-Policy` denying
   camera/microphone/geolocation/usb, and `frame-ancestors 'none'` as a real
   header.
3. **Automate the version bump** — `APP_VERSION` in `app.js` and `SW_VERSION` in
   `sw.js` are still synced by hand. A missed bump means users stay on stale
   code, which is now a security concern and not just a UX one.
4. Exports are still plaintext JSON containing the name, bodyweight history, and
   full training log. Normal for a backup, but worth a line of UI text next to
   the export button.
