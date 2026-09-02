// computeCurrentStreak() drives the header flame counter and had zero test
// coverage before this file (found in a research audit of the app). Seeds
// entries at specific dates via importDataFromFile() (see import.test.mjs
// for why that's the standard way to get arbitrary-dated entries into a
// test — saveSet() always uses "today"), all computed relative to the real
// current date with window.localISODate(), matching exactly what the app
// itself uses internally.
import { test } from "node:test";
import assert from "node:assert";
import { bootApp } from "./helpers/boot.mjs";

const BACKUP_APP_ID = "box-log";
const BACKUP_VERSION = 1;
function makeBackupFile(payload) {
  const json = JSON.stringify({ app: BACKUP_APP_ID, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), ...payload });
  return { size: json.length, text: async () => json };
}
function daysAgo(window, n) {
  return window.localISODate(new Date(Date.now() - n * 86400000));
}
async function seedEntriesOnDays(window, dayOffsets) {
  const entries = dayOffsets.map((n, i) => ({
    id: `streak-e${i}`, exerciseId: "streak-m1", date: daysAgo(window, n), weight: 40, reps: 5, sets: 1,
  }));
  const file = makeBackupFile({
    customMovements: [{ id: "streak-m1", name: "Streak Test Squat", category: "Squat" }],
    entries, customWods: [], wodEntries: [], bodyweightEntries: [], measureTypes: [], measureEntries: [],
  });
  await window.importDataFromFile(file);
}

test("no entries at all -> streak is 0", async () => {
  const window = await bootApp();
  assert.equal(window.computeCurrentStreak(), 0);
});

test("a single entry logged today -> streak is 1", async () => {
  const window = await bootApp();
  await seedEntriesOnDays(window, [0]);
  assert.equal(window.computeCurrentStreak(), 1);
});

test("entries on 3 consecutive days including today -> streak is 3", async () => {
  const window = await bootApp();
  await seedEntriesOnDays(window, [0, 1, 2]);
  assert.equal(window.computeCurrentStreak(), 3);
});

test("nothing logged today yet, but yesterday was trained -> streak counts from yesterday, not reset to 0", async () => {
  const window = await bootApp();
  await seedEntriesOnDays(window, [1, 2]); // yesterday + the day before, nothing today
  assert.equal(window.computeCurrentStreak(), 2, "today not being logged yet shouldn't zero out a streak still in progress");
});

test("a gap day breaks the streak — only the days after the gap count", async () => {
  const window = await bootApp();
  // Today and the day before yesterday are trained, but yesterday itself has
  // nothing — the streak should stop at the gap, not bridge over it.
  await seedEntriesOnDays(window, [0, 2]);
  assert.equal(window.computeCurrentStreak(), 1, "the gap at day -1 should cut the streak down to just today");
});

test("logging twice on the same day still only counts as one day of the streak", async () => {
  const window = await bootApp();
  await seedEntriesOnDays(window, [0, 0, 1]); // two entries today, one yesterday
  assert.equal(window.computeCurrentStreak(), 2, "a same-day double log must not inflate the streak beyond the number of distinct days");
});

test("a streak entirely in the past (nothing today or yesterday) is 0, not the length of that old streak", async () => {
  const window = await bootApp();
  await seedEntriesOnDays(window, [5, 6, 7]);
  assert.equal(window.computeCurrentStreak(), 0, "a streak that isn't still running as of today/yesterday shouldn't report as active");
});
