// A REFRESH, MIDNIGHT, AND A CONNECTION THE BROWSER CLOSES (audit 2026-11,
// findings 7 and 8).
import { test } from "node:test";
import assert from "node:assert";
import FDBFactory from "fake-indexeddb/lib/FDBFactory";
import { bootApp } from "./helpers/boot.mjs";

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const prep = (w) => { w.scrollTo = () => {}; w.fetch = () => Promise.resolve({ ok: true }); };
const sessionOf = (w) => {
  const out = {};
  for (let i = 0; i < w.sessionStorage.length; i++) { const k = w.sessionStorage.key(i); out[k] = w.sessionStorage.getItem(k); }
  return out;
};
const activeTab = (w) => w.document.querySelector("#bottomTabBar [aria-selected='true']")?.dataset.tab;

// ---- finding 7 ----
test("a connection the browser closes is reopened on the next write", async () => {
  const window = await bootApp({ beforeScripts: prep });
  window.saveWelcomeForm("נועה");
  const db = await window.openDB();
  db.close();
  db.onclose(); // what the browser fires when it closes a connection itself
  window.choosePickedMovement("back-squat");
  window.applyFieldValue("step", "weight", 90); window.applyFieldValue("step", "reps", 5);
  await window.saveSet();
  await tick(50);
  const fresh = await window.openDB();
  assert.notEqual(fresh, db, "a new connection");
  assert.equal((await window.dbLoadAll()).length, 1, "and the set reached the disk");
  // A late close event from the OLD connection must not drop the new one.
  db.onclose();
  assert.equal(await window.openDB(), fresh);
});

test("versionchange closes the connection and the next access reopens it", async () => {
  const window = await bootApp({ beforeScripts: prep });
  const db = await window.openDB();
  db.onversionchange();
  await window.dbSetSetting("probe", 1);
  assert.equal(await window.dbGetSetting("probe"), 1);
  assert.notEqual(await window.openDB(), db);
});

// ---- finding 8 ----
test("a refresh keeps the open screen and the half-typed set", async () => {
  const idb = new FDBFactory();
  const a = await bootApp({ indexedDB: idb, beforeScripts: prep });
  a.saveWelcomeForm("נועה");
  a.choosePickedMovement("deadlift");
  a.applyFieldValue("step", "weight", 87.5);
  a.applyFieldValue("step", "reps", 4);
  a.document.querySelector("[data-action='switch-tab'][data-tab='calendar']").click();
  await tick(30);
  const kept = sessionOf(a);
  assert.ok(kept["haimunia:sessionView"], "the view is kept in sessionStorage");

  // The same tab, reloaded: same database, same sessionStorage.
  const b = await bootApp({ indexedDB: idb, sessionStorage: kept, beforeScripts: prep });
  assert.equal(activeTab(b), "calendar", "back on the screen it was on");
  b.document.querySelector("[data-action='switch-tab'][data-tab='add']").click();
  await b.saveSet();
  await tick(50);
  const saved = b.entriesFor("deadlift");
  assert.equal(saved.length, 1, "the draft was still there to save");
  assert.equal(saved[0].weight, 87.5);
  assert.equal(saved[0].reps, 4);
});

test("a ?tab= link still wins, and a draft editing a vanished set is dropped", async () => {
  const idb = new FDBFactory();
  const stored = { "haimunia:sessionView": JSON.stringify({ tab: "calendar", wodSubTab: "log", draft: { selectedId: "back-squat", chosen: true, type: "reps", weight: 60, reps: 5, sets: 1, durationSeconds: 20, date: null, editId: "set-gone" } }) };
  const w = await bootApp({ indexedDB: idb, url: "https://example.test/?tab=wod", sessionStorage: stored, beforeScripts: prep });
  assert.equal(activeTab(w), "wod");
  w.saveWelcomeForm("נועה");
  w.document.querySelector("[data-action='switch-tab'][data-tab='add']").click();
  assert.ok(w.document.querySelector(".log-empty-head"), "no movement was restored from a draft whose set is gone");
});

test("a malformed stored view is ignored", async () => {
  const w = await bootApp({ sessionStorage: { "haimunia:sessionView": "{not json" }, beforeScripts: prep });
  assert.equal(activeTab(w), "add");
});

test("'today' moves on at midnight and on return to the foreground", async () => {
  let offset = 0;
  const w = await bootApp({
    beforeScripts: (win) => {
      prep(win);
      const Real = win.Date;
      class ShiftedDate extends Real {
        constructor(...args) { if (args.length) super(...args); else super(Real.now() + offset); }
        static now() { return Real.now() + offset; }
      }
      win.Date = ShiftedDate;
    },
  });
  w.saveWelcomeForm("נועה");
  w.choosePickedMovement("back-squat");
  w.document.querySelector("[data-action='switch-tab'][data-tab='add']").click();
  await tick(20);
  const before = w.document.getElementById("logDateInput").value;
  const label = w.document.getElementById("dateLabel").textContent;
  offset += 24 * 3600 * 1000;
  w.document.dispatchEvent(new w.Event("visibilitychange"));
  await tick(20);
  const after = w.document.getElementById("logDateInput").value;
  assert.notEqual(after, before, "the form's date followed the day");
  assert.equal(after, w.todayISO());
  assert.notEqual(w.document.getElementById("dateLabel").textContent, label, "and so did the header");
  // The timer: refreshToday() is what it runs.
  offset += 24 * 3600 * 1000;
  w.refreshToday();
  assert.equal(w.document.getElementById("logDateInput").value, w.todayISO());
});
