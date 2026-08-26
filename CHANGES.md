# Bronze/silver/gold medals render as real weight-plate photos — 2026-08-26

Requested directly: three provided photos (a green "10 KG" plate, a blue
"20 KG" plate, a gray "5 KG" plate) replace the SVG shield glyph for
every tiered achievement (the pr and streak groups — the only ones with
a bronze/silver/gold tier). Final mapping, after one correction:
bronze = gray/5kg, silver = green/10kg, gold = blue/20kg.

Processed with a throwaway Playwright/canvas script (same approach as
the app icon generation earlier this session — no image-editing tool
available): auto-detected each plate's bounding box, trimmed the
padding, and re-exported as a clean 320x320 PNG (`assets/medal-bronze
.png`/`-silver.png`/`-gold.png`, ~28KB each).

`renderMedal()` now renders `<img class="medal-shape" src="./assets/
medal-${tier}.png">` for any tiered achievement instead of the `<svg>`
shield — same class, so the existing locked (grayscale) and earned
(colored glow) CSS filters apply unchanged, no new rules needed beyond
one `img.medal-shape` override forcing the box back to square (the
shield's box was taller than wide; these plates are square photos).
Non-tiered medals (milestone, rx, capstone) are untouched.

4 new tests in `test/medals.test.mjs`. Full suite: 138/138 jsdom
tests, all 10 browser-check scripts, green. Verified visually via a
real-browser screenshot of an earned bronze badge before and after the
mapping correction.

# Replace "בוקס" with "מועדון" everywhere in the app — 2026-08-26

Requested with a screenshot circling it in the profile edit screen.
Six occurrences total, all in the tenure-achievement labels/rules and
the welcome modal's box-start-date question: "חודש בבוקס" / "חצי שנה
בבוקס" / "שנה בבוקס" (TENURE_MILESTONES labels), the matching achievement
rule text, the achievements screen's "add a start date" prompt, and the
welcome modal's own question. All six updated to the grammatically
correct "במועדון" form. Internal identifiers (`boxStartDate`,
`welcomeBoxStartInput`, etc.) are untouched — English internal names,
Hebrew UI text, same split this app already keeps throughout.

# Close out the WOD-section deep-dive: EMOM duration/rest, unit labels, custom-WOD deletion — 2026-08-26

Follow-up to the EMOM weight fix (previous entry below): "it is not only
on emom" turned out to be right. Deep-dived the whole אימונים section —
the builder's per-movement fields, the score-type logic (`scoreValue`/
`bestWodScore`/`formatWodEntry`), and every WOD list (history, picker,
benchmarks) — and shipped everything that came out of it except one
item flagged as a design decision, not a bug (see below).

**EMOM movements can now be duration/hold-based**, same reps↔duration
toggle every other format already had. A new `emomTargetDurations`
array parallels `emomTargetReps`; `emomMovementTypes` (`"reps"` /
`"duration"` / `"rest"`, see next item) says which one a given station
actually means. The log form switches to a seconds stepper for those
stations, labeled with the movement name — no separate structural
change needed since `wodEmomReps` already stores raw numbers
type-agnostically.

**EMOM movements can now be marked as a rest station** — a
`toggle-builder-movement-rest` chip in the builder that hides the
reps/duration/weight fields entirely once toggled. The log form skips
rendering a stepper for a rest station and shows a plain "מנוחה" label
instead. `saveWod()` and `startEditWodEntry()` both correctly exclude
rest stations from the saved `emomReps` array (keeping only the real,
loggable stations) and correctly re-expand a saved compact array back
to the WOD's full rotation shape when re-editing, so field indices stay
aligned with the right movement even when a rest station sits between
two logged ones.

**Calorie/meter movements get a real unit label.** Ten Monostructural
movements (Run, Row, Bike, Ski Erg, Swim...) and — where logged as reps
rather than the existing duration toggle — the seven distance-based Odd
Object carries were all labeled "חזרות" (reps) in the builder and the
EMOM log form's per-round header, regardless of what they actually
measure. New `repsFieldLabel()` detects the unit straight from the
movement's own name suffix ("(Calories)"/"(Meters)") and swaps the
label to "קלוריות"/"מטרים" accordingly. No data model change — same
number underneath, just labeled correctly.

**Custom WODs can finally be deleted.** There was no delete or rename
path for a custom WOD definition at all — every typo or test WOD (this
session's own "Test EMOM ..." WODs among them) would have stuck around
in the picker forever. Added a delete button in the picker, custom
WODs only, and only when `wodEntriesFor(id).length === 0` — deleting a
WOD *definition* must never be how someone's logged training history
disappears. `deleteCustomWod()` itself is the authoritative guard, not
just the UI: it refuses non-custom WODs and anything with entries even
if called directly.

**Left alone, flagged as a decision not a bug:** `"load"`-scored WODs
log weight only, no reps — reads as an intentional 1RM/heaviest-lift
design (every other format keeps weight as a WOD-level prescription
baked into the description; this is the one format where weight *is*
the score). Not touching it without an explicit call that it should do
more.

**Also found and fixed along the way:** a pre-existing Playwright/test
race, not an app bug — filling two stepper fields on the same builder
row back to back (e.g. reps then weight) could race the synchronous
re-render a field's own commit triggers, landing keystrokes on an
already-detached DOM node. A real user's tap-then-type naturally lands
on the post-render element, so this never affected real use; the new
shared `fillStepper()` helper in `scripts/browser-check/lib/actions.mjs`
blurs and waits between fields so future check scripts don't hit the
same race.

29 new tests across `test/emom.test.mjs` (extended) and the new
`test/wod-management.test.mjs`, plus 6 new browser-check assertions in
`emom.mjs`. Full suite: 134/134 jsdom tests, all 10 browser-check
scripts, green.

# EMOM movements can carry a prescribed weight — 2026-08-26

Reported with a screenshot: the WOD builder's EMOM screen let you set
reps per rotation movement (e.g. "10 Wall Balls") but had no way to
attach a weight, even for movements that are always loaded — Wall
Balls, D-Ball Cleans, any Dumbbell/Kettlebell/Weightlifting station.

Root cause: `hasWeight` in `renderWodBuilderMovements()` was
unconditionally forced to `false` whenever `builderFormat === "emom"`,
regardless of the movement's own category — every other format already
checked `WOD_MOVE_CATEGORIES_WITH_WEIGHT` (Weightlifting / Dumbbell /
Kettlebell / Odd Object) correctly. Removed the EMOM-only override so
it uses the same category check as everything else.

Weight is a fixed prescription per movement, the same way it already
worked for every non-EMOM format — baked into the generated free-text
description (`emomWodDesc()`, now `"10 Wall Balls @ 9kg"`) and into a
new structured `emomTargetWeights` array on the WOD record (parallel to
`emomTargetReps`, same clamp/pad-to-length handling in
`sanitizeCustomWod`) so the log form can show it as a label next to
each movement's reps stepper. Not logged per attempt — same as every
other format, the load itself doesn't change round to round or entry
to entry, only the reps you complete against it do.

5 new tests in `test/emom.test.mjs`, verified against the pre-fix code
via `git stash` before confirming the fix. Full suite: 122/122 jsdom
tests, all 10 browser-check scripts, green.

# Full-codebase audit: close out the remaining findings — 2026-08-26

Last round of the audit (previous two entries below): the remaining
low-severity finding, plus all eight test-coverage gaps the regression
pass flagged as having zero automated coverage.

**Fixed:** `clearAllData()` reset 21 pieces of state but not the five
`ladderMode`/`ladderGroupId`/`ladderPrimaryId`/`ladderPartnerId`/
`ladderBlockLabel` variables — clearing all data while a ladder was
active left the toggle showing "active" against a groupId pointing at
nothing. Now calls the existing `endLadder()`. Cosmetic only, never data
corruption (`currentLadderRounds()` just rendered "0 rounds").

**New test coverage** (32 new tests across 8 files, driving the real app
through its own exposed functions and dispatcher actions, same as the
rest of this suite — nothing reimplemented):
- `test/achievements.test.mjs` — the achievements modal and the
  post-save celebration popup (badge unlocks, plain PRs, locked-vs-earned
  rendering).
- `test/calendar.test.mjs` — month navigation (`cal-prev`/`cal-next`,
  including the January→December year wrap), day selection, and the
  logged-entry dot marker.
- `test/bodyweight-measurements.test.mjs` — the History tab's bodyweight
  and custom-measurement sections: same-day overwrite, case-insensitive
  duplicate type names, and cleanup on delete.
- `test/theme.test.mjs` — mirrors the existing text-scale tests for the
  sibling theme mechanism, including "auto" mode and the
  `meta[theme-color]` sync.
- `test/wod-history-chart.test.mjs` — confirms `renderWodDetailCard()`
  actually skips the PR-trend chart for EMOM (no single comparable
  score) while every other score type still gets one.
- `test/import-export-ui.test.mjs` — drives the real footer buttons
  through the click dispatcher, not `importDataFromFile()` directly as
  the existing `import.test.mjs` does. Required three small,
  test-only jsdom stubs in `test/helpers/boot.mjs` (documented there):
  `URL.createObjectURL`/`revokeObjectURL` (unimplemented in jsdom), a
  no-navigate shim for `<a download>` clicks (jsdom tries to "navigate"
  to the blob: URL otherwise), and clamping the rare 10s+ `setTimeout`
  down to near-zero (`exportData()`'s cleanup timer is a real 30s
  Node timer that would otherwise keep every test run waiting on it).
- `test/install-prompt.test.mjs` — the `beforeinstallprompt`/install
  banner handshake: showing the banner, replaying the deferred native
  prompt, the session-scoped dismiss, and `appinstalled` clearing state.
- `test/roadmap-features.test.mjs` — one new test asserting the
  onboarding overlay's actual content (all four tab walkthroughs), not
  just its open/dismiss timing as before.

Full suite: 118/118 jsdom tests (up from 86), all 10 browser-check
scripts, and `roadmap.mjs`, green.

# Full-codebase audit: fix the high-severity edit-then-navigate corruption bug — 2026-08-26

The logic/state-consistency pass of the same audit (previous entry below)
found the highest-severity issue: editing a strength or WOD entry, then
picking a different exercise/WOD *without* cancelling the edit first, then
saving, silently overwrote the original entry's identity in place —
`saveSet()`/`saveWod()` keep the edited entry's `id`/timestamp but write
the newly-picked exercise/WOD's data onto it. No warning, no duplicate,
just corrupted history.

Root cause: `editingEntryId`/`editingWodEntryId` weren't cleared by any of
the paths that change `selectedId`/`selectedWodId` mid-edit —
`choosePickedMovement()` (and `addMovement()`, which routes through it),
`select-benchmark`, `pick-wod`, the WOD picker's Enter-to-exact-match
shortcut, and `addCustomWod()`'s both branches (creating a new WOD or
reusing one that already exists by name). Fixed with two small guards —
`endEntryEditIfActive()` and `endWodEditIfActive()` — called at every one
of those sites: picking something else mid-edit now cancels the edit and
starts a fresh entry, instead of corrupting the one being edited.

Also fixed the accompanying moderate-severity finding: the EMOM
reps-resync at `renderWodLogSection()` only checked array *length*
against the newly-selected WOD, so swapping between two different EMOM
WODs with the same movement count left the previous WOD's reps on screen
against the new WOD's labels. Now keyed off the WOD's own id
(`wodEmomRepsForWodId`), not just length — also reset on "clear all
data" for the same reason.

New test file `test/edit-navigation-guard.test.mjs` (3 tests) reproduces
all three scenarios against the pre-fix code (verified via `git stash`)
before confirming the fix. Full suite: 86/86 jsdom tests, all 10
browser-check scripts, green.

# Full-codebase audit: wiring fixes — 2026-08-26

Ran a full audit (wiring/dead-code, security, logic/state-consistency,
regression + coverage) across the whole app. Security came back clean.
Three wiring issues found and fixed here; the higher-severity
logic/state findings (an edit-then-navigate-then-save path that can
silently overwrite the wrong entry's identity, on both the strength and
WOD sides) are tracked separately, pending sign-off before touching
`saveSet()`/`saveWod()`.

- The WOD tab's new empty state (previous entry below) accidentally
  orphaned the full "כל האימונים שלי" picker — the only way to browse
  and reselect an existing *custom* WOD with search — since it only
  rendered after something was already selected. Added a direct link to
  it from the empty state, wired to the existing `open-wod-picker`
  action.
- Removed a dead click-dispatcher branch (`view-today-calendar` — no
  markup anywhere ever set that action).
- Removed an orphaned CSS class (`.flex-1`, zero usages).

# The WOD tab no longer defaults to a random benchmark — 2026-08-26

Reported with a screenshot: opening רישום showed "Fran" already loaded and
ready to log, which read as "this is already my workout" rather than
something deliberately chosen. Root cause: `selectedWodId` initialized to
`WOD_LIBRARY[0].id` — always Fran, since it's simply the first entry in
that array — and reset to it on every fresh page load (never persisted,
so this happened on literally every visit, not just first install).

`selectedWodId` now starts `null` and stays that way until the user
actually picks or builds something. `renderWodLogSection()` gained an
empty-state branch for that case: "בחרו אימון להתחלה" with two buttons —
יצירת אימון (straight into the builder) and בנצ'מרק (the בנצ'מרקים
sub-tab). Both of the old picker-then-builder detours in the browser-check
scripts got simplified to the new direct button now that it exists.

The "clear all data" reset was also still setting the same
`WOD_LIBRARY[0]` default — changed to `null` there too for consistency.
`saveWod()` picked up a defensive `if (!w) return;` guard, even though the
empty state has no save button to reach it through.

# Remove the גדול מאוד (xlarge) text-size option — 2026-08-26

Direct feedback the same day it shipped: 1.45x was too big. Dropped it
from `loadTextScalePref`/`setTextScalePref`'s valid values, the footer's
options list, and the `--text-scale` CSS rule — just רגיל/גדול (1x/1.2x)
now. No migration needed: the validation already treats any unrecognized
stored value as invalid and falls back to normal, so a device that had
already picked xlarge just quietly reverts on next load rather than
erroring.

Also worth noting for anyone reading this after an "icon didn't update"
report: confirmed the deployed `icon-192.png` is correct on the server
(fetched it directly, byte count matches the new file) — a stale icon on
an already-installed iOS home screen is a platform limitation, not a
deploy issue. iOS snapshots the icon at "Add to Home Screen" time and
never re-checks it; the only fix is removing and re-adding the shortcut.

# Text-size preference, new app icon — 2026-08-26

Two pieces of direct user feedback.

- **Text size preference** ("older members can't see the small letters").
  A new רגיל / גדול / גדול מאוד control in the footer, next to the existing
  theme toggle — same mechanism (localStorage, applied by theme-init.js
  before first paint, no flash of the wrong size). Implemented as CSS
  `zoom` on `<html>` rather than converting fonts to `rem`: this app's
  typography is almost entirely literal `px` values baked into inline
  styles generated by app.js, not a stylesheet using relative units, so a
  `font-size`-based scale would only have touched a small fraction of the
  UI. `zoom` scales everything uniformly with a two-line CSS change.
  The one real risk was `position:fixed` modals (the picker, WOD builder,
  onboarding, etc.) — `zoom` doesn't establish a new containing block the
  way `transform` would, so verified explicitly in a real browser: a fixed
  overlay's `inset:0` still resolves against the true viewport (covers the
  screen correctly) while everything rendered inside it still scales with
  the rest of the page. One real interaction surfaced during that testing:
  `getBoundingClientRect()` on an element with an explicit pixel height
  (the WOD builder modal's own iOS-viewport-height workaround) reports in
  the zoomed tree's local coordinate space, not real device pixels — looks
  like a mismatch when compared naively against the real viewport size,
  but isn't one; the modal renders and behaves correctly on screen. The
  browser-check script verifies the underlying JS-computed height and
  actual on-screen visibility of the modal's controls instead of that
  raw (and misleading) rect comparison.
- **New app icon and logo**, replacing the placeholder set. Source was a
  single square composition (rounded tile, full wordmark, tagline) with a
  white margin around it — processed via a small Playwright/canvas script
  (no image-editing tooling available in this environment) into the four
  required PWA sizes: `icon-192`/`icon-512` (rounded, transparent corners,
  cropped tight to the source's own tile) and `icon-192-maskable`/
  `icon-512-maskable` (full-bleed navy background sampled from the source,
  content scaled to ~78% and cropped past the source's own inner
  highlight/bevel stroke, which read as a stray ring once shrunk onto a
  flat maskable background — not visible in the "any" icons, where it
  sits flush with their own edge).

# Fix: tapping a stepper's number reset it instead of letting you type — 2026-08-26

Reported with two screenshots of the EMOM builder's per-movement reps
field, but the root cause was in the one shared click dispatcher every
numeric stepper in the app goes through, so it affected all of them —
weight/reps/sets in the Log tab, WOD score fields, bodyweight,
measurements, everything.

The stepper's `<input>` carries the same `data-action` as its own +/-
buttons (that's how `getFieldValue`/`setFieldState` work for both). The
click dispatcher's "step" branch matched on `data-action` alone, with no
check for *which* element was actually clicked — so a tap on the number
itself fell into the same `dir * step` arithmetic as a real +/- press,
except the input has no `data-dir`, so `dir` was `NaN`, `clampField()`
floored that to the field's min, and the resulting re-render tore the
input out from under the tap before a keystroke could land. One tap
reset the field to 0 and stole focus — indistinguishable from "you can't
type a number in here" from the outside.

Fixed with a one-line guard: only an element carrying the `stepper-btn`
class (the +/- buttons, never the input) reaches the arithmetic. Typing
now works everywhere a number can be entered.

# Add a Benchmarks sub-tab to the WOD tab — 2026-08-25

A third sub-tab under אימונים, alongside רישום/היסטוריה: בנצ'מרקים lists the
built-in Girls/Heroes WODs (`WOD_LIBRARY`) grouped by category, with a
search box, deliberately excluding custom WODs — this is specifically for
browsing the fixed named benchmarks, not everything a box has ever logged.
Picking one selects it and switches straight to the log subtab
(`switchWodSubtab`, extracted from the previous round's subtab-highlight
fix so both the manual pill click and this new picker path stay in sync).
Reused the exact category-grouped list markup from the WOD picker
(`.cat-group`/`.cat-head`/`.movement-btn`) rather than inventing a new
pattern.

# Remove the partner tag; notifications now clear once seen — 2026-08-25

Two pieces of direct user feedback:

- **Removed the partner-tag field.** Not relevant to how this app is used —
  a session note per day (already shipped) covers "how did it feel"
  without a redundant per-WOD field. Pulled `partnerTag` out of
  `sanitizeWodEntry`, `saveWod`/`startEditWodEntry`, the log form, and both
  display sites (calendar day view, History tab's recent-attempts list).
  Old entries that already have a stored `partnerTag` from the brief window
  it was live just quietly stop surfacing it on the next load — sanitizers
  rebuild every record field-by-field, so nothing crashes or needs a
  migration. Time cap is untouched (kept, wasn't part of the complaint).
- **Notifications now disappear once seen.** They used to accumulate into
  a permanent history (the bell listed every past release, unseen ones
  marked "חדש"). Now `renderNotificationsList()` only ever renders what's
  currently unseen — once you've opened the bell (or gotten the auto-popup
  on a version bump), that entry is just gone, not archived. Same single
  list still backs both the auto-popup and the manual bell tap.

# Fix: WOD tab's רישום/היסטוריה pill highlight not following the subtab — 2026-08-25

Reported by the user with a screenshot: after switching WOD subtabs,
היסטוריה stayed highlighted while the רישום (log) form was actually
showing underneath. Root cause: the pill buttons are rendered once in
renderWodTab(), which only runs on a full top-level tab switch —
switch-wod-subtab's handler only ever called renderWodContent() (swaps
#wodContent's innerHTML), so the content switched correctly but the
highlight never followed it. Fixed by having the handler also update the
two buttons' active/aria-selected state directly, same pattern already
used for the WOD builder's format chips.

# Workout format support, sub-tasks A (WOD builder half) + B + D + extras — 2026-08-25

Finishes the workout-format-support spec: the WOD builder's own duration
toggle (the other half of sub-task A), blocks/supersets (B), EMOM (D), and
the two lower-priority extras (time cap, partner tag). Sub-task C was
already covered by the existing ladder feature (confirmed in the previous
round). Plain single-exercise logging, and every previously-shipped
feature, is unaffected — re-verified via the full test suite and browser
checks after each addition below.

- **WOD builder duration toggle.** A movement checked in the builder can be
  marked "reps" or "duration" (a reps/duration chip pair per movement,
  reusing the toggle from the Log tab). Only changes the free-text
  description the builder generates (`builderMovementsToDesc`) — WOD
  entries themselves have never stored structured per-movement data for any
  format except EMOM (see below).
- **Supersets and A/B/C/D block labels.** Extends the existing ladder
  mechanism rather than replacing it: a ladder can now optionally take a
  second exercise (`setLadderPartner`), turning it into a superset —
  alternating rounds between exactly two exercises under one `groupId`,
  switched between via two pills (`switchLadderExercise`) instead of the
  normal exercise picker (which still ends it, same as before). An
  optional `blockLabel` chip (A/B/C/D) tags the whole group, carried by
  every round. The calendar day view and Log tab's running list both
  derive "is this a superset" from the group's own data (more than one
  distinct exerciseId), not from in-progress session state, so a finished
  superset displays correctly regardless of how it was built.
- **EMOM.** A fourth WOD scoreType, built through the same
  reusable/named WOD builder as Fran or Grace — not a one-off freeform
  entry. Unlike every other format, an EMOM's movement rotation
  (`emomMovements`/`emomTargetReps`/`emomMinutes`) is structured data on the
  WOD record itself, because the log form needs it to render one reps
  field per movement, prefilled from that WOD's own targets and resized
  automatically when switching between differently-shaped EMOM WODs.
  Explicitly out of scope per the confirmed spec: no cross-attempt scoring
  — `bestWodScore`/the History tab's PR chart both skip EMOM entirely
  rather than fabricate a comparison that doesn't mean anything for it.
- **Time cap and partner tag.** Two small, independent additions: an
  optional reference-only time cap on a WOD (shown in the log header,
  never enforced or scored), and a free-text partner tag per WOD entry
  ("with Dana") shown next to Rx/Scaled in history and the calendar.

Also fixed along the way: the strength Log tab's est-1RM/barbell-visual
live-update on raw keystroke input wasn't duration-mode-aware (a latent gap
from the previous round, caught while wiring the same live-update path for
the new duration stepper), and picking an exact-name search match in the
exercise picker via Enter didn't end an active ladder the way clicking the
same movement's button already did — both now consistent.

# Workout format support, sub-task A: duration/hold entries — 2026-08-25

A structured spec came in covering four workout-logging gaps that BTWB/
SugarWOD-style apps handle poorly: timed holds, multi-part A/B/C blocks
with supersets, pyramid rep schemes, and EMOMs with rotating movements.
Pyramid schemes turned out to already be covered by the existing ladder
feature (confirmed, not assumed — skipped as its own sub-task). This round
covers sub-task A only; blocks/supersets and EMOM are separate, larger
changes staged for their own rounds.

- **Duration/hold entries in the strength Log tab.** A new reps/duration
  toggle next to the exercise picker switches the whole entry form: reps
  mode is exactly what existed before (unchanged), duration mode swaps the
  reps stepper for a duration-in-seconds one and skips the barbell-plate
  visual and bar-weight row (neither applies to a timed hold). Weight stays
  available in duration mode for weighted carries/holds, defaulting to 0
  for a bodyweight hold. `sanitizeEntry` gained a `type` ("reps" |
  "duration") discriminator and a `durationSeconds` field — every entry
  from before this change has no `type`, which sanitizes to "reps"
  automatically, so existing data and the plain reps flow are unaffected.
- Selecting an exercise now defaults the toggle to whatever it was last
  logged as (a hold-only movement like a plank stays in duration mode),
  and editing an existing entry restores its own type regardless of
  whatever the toggle currently shows.
- PR tracking, the History tab's per-exercise chart, and the achievement
  system's per-category PR counter all now correctly separate duration
  entries from reps entries — a hold-only movement reports "no 1RM" (not a
  phantom 0kg one), and its History chart plots hold time instead of
  est1RM. Recent-history, the calendar day view, and ladder-round display
  all format each entry by its own type, so a mixed history (an exercise
  logged both ways over time) renders correctly everywhere.
- Ladders and duration entries compose: a ladder can be a sequence of
  progressively longer holds, same as it can be a sequence of different
  weight/rep rungs. Switching the reps/duration toggle mid-ladder ends it,
  same as switching exercise or date already did.

# Roadmap round: notifications, onboarding, streaks, recent history, session notes — 2026-08-25

A 10-phase roadmap came in for "look at every tab." Two phases turned out
to already be substantially satisfied by existing code (found during
research, not assumed): the WOD tab's custom + Girls/Heroes-benchmark entry
paths, and the Log tab's last-session reference (which the immediately
preceding round had already turned into a tap-to-prefill button). Phase 9
depended on a "Goals" feature that doesn't exist anywhere in the codebase —
asked directly, skipped for this round. Phase 8 (build-then-commit a whole
session before saving anything) is a real redesign of the save flow the
user themselves flagged as needing its own planning pass — deferred to a
dedicated follow-up rather than bundled in with seven other features.

This round: expanded `WOD_LIBRARY` with 7 more evergreen benchmarks (Kelly,
Eva, Barbara, Filthy Fifty, Michael, Danny, Badger). Everything below is new.

- **Update notifications.** A small `RELEASE_NOTES` list (separate from
  this file — short, Hebrew, user-facing) backs both a one-time "מה חדש"
  popup shown to returning users after a real update, and a persistent bell
  icon in the header with an unread badge. A genuinely fresh install sees
  neither — nothing to catch up on; existing devices from before this
  shipped get silently backfilled so they're never shown a changelog
  retroactively.
- **First-time onboarding.** A short one-screen walkthrough (what each tab
  is for) shown once, immediately after the very first welcome/name modal —
  never for a device that already has data or a name.
- **Recent history at the point of entry.** Picking an exercise or WOD now
  shows up to 5 real logged attempts from the last 14 days, not just the
  single most-recent one. No warm-up logic anywhere in it — every row is an
  actual saved set.
- **Streak indicator.** Consecutive days (strength set or WOD, either
  counts) with at least one entry, shown next to the header's date. Reuses
  the exact same day-has-an-entry check the calendar's dots already used
  (extracted into one shared `hasAnyEntryOn`), so the two can never disagree
  about what counts as a trained day. Today not being logged yet doesn't
  break it — just isn't counted until it is.
- **Per-day session note.** One free-text field per calendar date ("how did
  the session feel"), distinct from the existing per-WOD-entry scaling
  notes. Surfaced from the Calendar day view.

Files changed: `app.js`, `index.html`. New `test/roadmap-features.test.mjs`
(7 tests: version comparison, fresh-install vs. existing-device bootstrap
paths, streak counting across gaps, the 14-day/5-item recent-history cap,
session-note round-trip). New `scripts/browser-check/roadmap.mjs` — real
Chromium session driving all five features end to end, including the
session note surviving a navigate-away-and-back round trip. `boot-smoke.mjs`
and `ladder.mjs` re-verified for regressions; their shared `dismissWelcomeModal`
helper updated to also close the new onboarding modal, since every
fresh-context check now hits it.

---

# Prefill from last session — 2026-08-25

Reframed what this app actually is: filled in after a workout (from memory
or a whiteboard scribble), not used live during one — which rules out
things like a rest timer, but means entry *speed* for reconstructing a
session is what matters. Progressive overload means today's numbers are
usually close to last time's, not random, yet the "אימון אחרון" (last
session) card was informational only — you still dragged the steppers from
scratch every time.

It's now a button: tapping it copies that exercise's last weight, reps,
and sets straight into the steppers (and the barbell visual updates with
them). A small repeat icon signals it's interactive, distinct from the
adjacent 1RM card which stays informational.

Files changed: `app.js`. Two new tests in `test/app-flow.test.mjs` (prefill
pulls the right exercise's history, not whatever was left over from a
different one; no-op when there's no history yet). Verified visually in a
real Chromium session — steppers and barbell both update from one tap.

---

# Committed browser-check scripts — 2026-08-25

Three real bugs this session (self-reload on first install, PR celebration
firing on every ladder rung, editing mid-ladder not ending it) only
surfaced through real-Chromium testing — jsdom doesn't implement Service
Worker lifecycle or real DOM event timing, so the committed `npm test`
suite structurally can't catch this class of bug. Those checks previously
lived as scratch scripts, rebuilt from scratch each time.

`scripts/browser-check/` — a separate package (own `package.json`, own
`playwright` dependency, own lockfile) so the main app's dependency tree
stays untouched:

- `npm run setup` once (installs Playwright + downloads Chromium)
- `npm run check:boot` — fresh load, fonts actually loaded, no self-reload,
  all 4 tabs switch, no console errors
- `npm run check:ladder` — a real 5-round working-up ladder end to end:
  toggle, save, celebration suppression, calendar grouping, edit, delete,
  finish
- `npm run check:update` — the Service Worker update lifecycle (first
  install doesn't self-reload; an update hidden from view auto-applies
  silently; one landing mid-session shows the banner and applies on the
  next visibility regain). Local-only — it edits `sw.js` on disk to
  simulate a new deploy landing, reverted when it's done.
- `npm run check:all` runs all three, stopping at the first failure

Each defaults to a throwaway local static server over the working tree
(uncommitted changes included); `TARGET_URL=<url>` points any of them at a
deployed site instead, e.g. to verify a push actually landed.

Not part of the main test suite or any CI — on-demand only, the same way
this session ran them by hand throughout.

---

# Gap-hunting pass — 2026-08-25

Went back through the app looking for rough edges, focused on the ladder
feature since it's newest. Found and fixed one real interaction bug, plus
an accessibility gap.

- **Bug: editing an unrelated entry mid-ladder didn't end it.**
  `startEditEntry()` (the pencil icon on any set in history/calendar)
  switches the selected exercise and log date, exactly like picking a new
  movement or changing the date already did — but unlike those two, it
  never called `endLadder()`. Editing an old set from a different exercise
  while a ladder was running left the toggle still advertising an active
  ladder for the wrong context. Fixed — with one deliberate exception:
  editing one of the *active ladder's own* rounds (fixing a typo in set 3)
  does **not** end it, so correcting a mistake mid-session doesn't strand
  you from adding set 6 afterward.
- **Accessibility:** the ladder progress text ("5 סטים נרשמו · הבא: 6")
  now carries `aria-live="polite"`, matching the pattern already used for
  the storage-error and import-result messages.

Files changed: `app.js`. Two new regression tests in `test/app-flow.test.mjs`
cover both the "unrelated edit ends it" and "own-round edit doesn't" cases;
the fix was verified in a real Chromium session too — my own test script
had exercised this exact path without realizing the tested behavior was
wrong until this pass looked closer.

---

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
