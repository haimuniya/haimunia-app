// TWO TABS ON ONE PHONE (audit 2026-11, finding 6).
//
// Two tabs, or two windows of the installed app, share one IndexedDB but kept
// their own in-memory copy of it: stale totals in the second, a set deleted
// in one coming back when the other saved its stale copy, and "delete
// everything" not seen by the other at all. Both windows here share ONE
// fake-indexeddb factory, which is what two tabs of one origin share.
import { test } from "node:test";
import assert from "node:assert";
import FDBFactory from "fake-indexeddb/lib/FDBFactory";
import { bootApp, waitFor } from "./helpers/boot.mjs";

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));

// jsdom has no BroadcastChannel. This one delivers to every other instance of
// the same name, asynchronously and as a structured copy, like the real one.
function channelHub() {
  const all = new Set();
  return class FakeBroadcastChannel {
    constructor(name) { this.name = name; this.onmessage = null; all.add(this); }
    postMessage(data) {
      const copy = JSON.parse(JSON.stringify(data));
      for (const c of all) if (c !== this && c.name === this.name) setTimeout(() => c.onmessage && c.onmessage({ data: copy }), 0);
    }
    close() { all.delete(this); }
  };
}

async function twoTabs({ channel = true } = {}) {
  const idb = new FDBFactory();
  const Hub = channelHub();
  const prep = (w) => { w.scrollTo = () => {}; w.fetch = () => Promise.resolve({ ok: true }); w.BroadcastChannel = channel ? Hub : undefined; };
  const a = await bootApp({ indexedDB: idb, beforeScripts: prep });
  a.saveWelcomeForm("דנה");
  await tick(50);
  const b = await bootApp({ indexedDB: idb, beforeScripts: prep });
  await tick(50);
  return { a, b };
}
async function logSet(w, weight = 100, reps = 5) {
  w.choosePickedMovement("back-squat");
  w.applyFieldValue("step", "weight", weight);
  w.applyFieldValue("step", "reps", reps);
  await w.saveSet();
}
const onDisk = async (w) => (await w.dbLoadAll()).map((e) => e.id);

test("a set saved in one tab shows up in the other", async () => {
  const { a, b } = await twoTabs();
  assert.equal(b.entriesFor("back-squat").length, 0);
  await logSet(a);
  await waitFor(() => b.entriesFor("back-squat").length === 1, 5000, 5, "tab B to re-read");
  await logSet(a, 102.5, 3);
  await waitFor(() => b.entriesFor("back-squat").length === 2, 5000, 5, "tab B to see the second set");
});

test("a set deleted in one tab is gone in the other, and an edit there cannot bring it back", async () => {
  const { a, b } = await twoTabs();
  await logSet(a);
  await waitFor(() => b.entriesFor("back-squat").length === 1, 5000);
  const id = a.entriesFor("back-squat")[0].id;
  // Tab B opens the set for editing first...
  await b.startEditEntry(id);
  b.applyFieldValue("step", "weight", 110);
  assert.ok(b.document.querySelector("[data-action='cancel-edit-entry']"), "tab B is editing the set");
  // ...then tab A deletes it.
  await a.deleteEntry(id);
  await waitFor(() => b.entriesFor("back-squat").length === 0, 5000, 5, "tab B to drop the deleted set");
  await waitFor(() => /נמחק בלשונית אחרת/.test(b.document.getElementById("appToastDock").textContent), 5000, 5, "tab B to say the set it was editing is gone");
  assert.ok(!b.document.querySelector("[data-action='cancel-edit-entry']"), "and to leave edit mode");
  // Tab B left edit mode, so a save now files a NEW set from the form - the
  // deleted row itself never returns.
  await b.saveSet();
  await tick(80);
  assert.ok(!(await onDisk(a)).includes(id), "the deleted set did not come back");
});

test("even without the message, a stale tab's edit never re-creates a deleted set", async () => {
  // No BroadcastChannel and no storage event delivered: tab B never hears.
  const { a, b } = await twoTabs({ channel: false });
  await logSet(a);
  await tick(80);
  const id = a.entriesFor("back-squat")[0].id;
  // Tab B learns of the set the way a stale tab would: its own reload.
  await b.reloadFromDb();
  await b.startEditEntry(id);
  b.applyFieldValue("step", "weight", 120);
  await a.deleteEntry(id);
  await tick(50);
  await b.saveSet();
  await tick(80);
  assert.deepEqual(await onDisk(a), [], "dbUpdateEntry refused to write a row that is gone");
  assert.equal(b.entriesFor("back-squat").length, 0, "and tab B dropped its stale copy");
  assert.match(b.document.getElementById("appToastDock").textContent, /נמחק/, "and said why");

  // A set opened for editing after the delete is refused up front.
  await logSet(a, 80, 5);
  await tick(50);
  await b.reloadFromDb();
  const id2 = b.entriesFor("back-squat")[0].id;
  await a.deleteEntry(id2);
  await tick(50);
  await b.startEditEntry(id2);
  assert.equal(b.entriesFor("back-squat").length, 0, "the editor does not open on a row that is gone");
  await b.saveSet();
  await tick(80);
  assert.ok(!(await onDisk(a)).includes(id2), "and it is never written back");
});

test("delete everything in one tab empties the other and shows it the welcome", async () => {
  const { a, b } = await twoTabs();
  await logSet(a);
  await waitFor(() => b.entriesFor("back-squat").length === 1, 5000);
  await a.clearAllData();
  await waitFor(() => b.entriesFor("back-squat").length === 0, 5000, 5, "tab B to wipe its memory");
  await waitFor(() => b.document.getElementById("welcomeOverlay").classList.contains("open"), 5000, 5, "tab B's welcome");
  await tick(100);
  assert.deepEqual(await onDisk(b), []);
});

test("no BroadcastChannel: the storage event carries the same message", async () => {
  const { a, b } = await twoTabs({ channel: false });
  await logSet(a);
  await tick(80);
  const raw = a.localStorage.getItem("haimunia:tabSync");
  assert.ok(raw, "tab A wrote the fallback key");
  const msg = JSON.parse(raw);
  assert.equal(msg.type, "changed");
  assert.deepEqual(Object.keys(msg).sort(), ["at", "from", "type"], "only that something changed, never the data");
  // jsdom windows do not share localStorage; deliver the event by hand, as
  // the browser does to every other tab of the origin.
  b.dispatchEvent(new b.StorageEvent("storage", { key: "haimunia:tabSync", newValue: raw }));
  await waitFor(() => b.entriesFor("back-squat").length === 1, 5000, 5, "tab B to re-read on the storage event");
});
