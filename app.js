// ---------- Hard-block zoom (iOS Safari ignores user-scalable=no in the meta tag) ----------
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());
document.addEventListener("gestureend", (e) => e.preventDefault());
let lastTouchEndTime = 0;
document.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - lastTouchEndTime <= 300) e.preventDefault();
  lastTouchEndTime = now;
}, false);

// ---------- Data ----------
const CATEGORY_COLORS = {
  Squat: "var(--teal)", Deadlift: "var(--red)", Press: "var(--yellow)",
  Olympic: "var(--green)", Pull: "var(--purple)", Other: "var(--steel)",
  Custom: "var(--brass)", Girls: "var(--purple)", Heroes: "var(--red)",
  Gymnastics: "var(--purple)", Weightlifting: "var(--blue)", Dumbbell: "var(--green)",
  Kettlebell: "var(--yellow)", "Odd Object": "var(--red)", Monostructural: "var(--steel)",
};

const CATEGORY_LABELS = {
  Squat: "Squat", Deadlift: "Deadlift", Press: "Press", Olympic: "Olympic",
  Pull: "Pull", Other: "Other", Custom: "Custom", Girls: "Girls", Heroes: "Heroes",
  Gymnastics: "Gymnastics", Weightlifting: "Weightlifting", Dumbbell: "Dumbbell",
  Kettlebell: "Kettlebell", "Odd Object": "Odd Object", Monostructural: "Monostructural",
};

const MOVEMENTS = [
  { id: "back-squat", name: "Back Squat", category: "Squat" },
  { id: "front-squat", name: "Front Squat", category: "Squat" },
  { id: "overhead-squat", name: "Overhead Squat", category: "Squat" },
  { id: "deadlift", name: "Deadlift", category: "Deadlift" },
  { id: "sumo-deadlift", name: "Sumo Deadlift", category: "Deadlift" },
  { id: "deficit-deadlift", name: "Deficit Deadlift", category: "Deadlift" },
  { id: "strict-press", name: "Strict Press", category: "Press" },
  { id: "push-press", name: "Push Press", category: "Press" },
  { id: "bench-press", name: "Bench Press", category: "Press" },
  { id: "push-jerk", name: "Push Jerk", category: "Press" },
  { id: "split-jerk", name: "Split Jerk", category: "Press" },
  { id: "clean", name: "Clean (Squat Clean)", category: "Olympic" },
  { id: "power-clean", name: "Power Clean", category: "Olympic" },
  { id: "hang-clean", name: "Hang Clean", category: "Olympic" },
  { id: "clean-and-jerk", name: "Clean and Jerk", category: "Olympic" },
  { id: "snatch", name: "Snatch", category: "Olympic" },
  { id: "power-snatch", name: "Power Snatch", category: "Olympic" },
  { id: "hang-snatch", name: "Hang Snatch", category: "Olympic" },
  { id: "weighted-pullup", name: "Weighted Pull-Up", category: "Pull" },
  { id: "weighted-chinup", name: "Weighted Chin-Up", category: "Pull" },
  { id: "bent-over-row", name: "Bent-Over Row", category: "Pull" },
  { id: "thruster", name: "Thruster", category: "Other" },
  { id: "front-rack-lunge", name: "Front Rack Lunge", category: "Other" },
  { id: "weighted-dip", name: "Weighted Dip", category: "Other" },
  { id: "turkish-getup", name: "Turkish Get-Up", category: "Other" },
];

const STANDARD_REPS = [1, 2, 3, 5, 10];
const BAR_KG = 20;
const APP_VERSION = "2.0.1";

const WOD_MOVEMENT_TAGS = [
  // Gymnastics (bodyweight)
  { name: "Air Squat", category: "Gymnastics" },
  { name: "Pistols (Single-Leg Squat)", category: "Gymnastics" },
  { name: "Push-Ups", category: "Gymnastics" },
  { name: "Pull-Ups", category: "Gymnastics" },
  { name: "Chest-to-Bar Pull-Ups", category: "Gymnastics" },
  { name: "Strict Pull-Ups", category: "Gymnastics" },
  { name: "Bar Muscle-Ups", category: "Gymnastics" },
  { name: "Ring Muscle-Ups", category: "Gymnastics" },
  { name: "Ring Dips", category: "Gymnastics" },
  { name: "Handstand Push-Ups", category: "Gymnastics" },
  { name: "Handstand Walk", category: "Gymnastics" },
  { name: "Wall Walks", category: "Gymnastics" },
  { name: "Toes-to-Bar", category: "Gymnastics" },
  { name: "Knees-to-Elbows", category: "Gymnastics" },
  { name: "Sit-Ups", category: "Gymnastics" },
  { name: "GHD Sit-Ups", category: "Gymnastics" },
  { name: "Burpees", category: "Gymnastics" },
  { name: "Burpee Box Jump-Overs", category: "Gymnastics" },
  { name: "Box Jumps", category: "Gymnastics" },
  { name: "Box Step-Ups", category: "Gymnastics" },
  { name: "Rope Climbs", category: "Gymnastics" },
  { name: "Double-Unders", category: "Gymnastics" },
  { name: "Single-Unders", category: "Gymnastics" },
  { name: "L-Sit", category: "Gymnastics" },
  // Weightlifting (barbell)
  { name: "Back Squat", category: "Weightlifting" },
  { name: "Front Squat", category: "Weightlifting" },
  { name: "Overhead Squat", category: "Weightlifting" },
  { name: "Deadlift", category: "Weightlifting" },
  { name: "Sumo Deadlift", category: "Weightlifting" },
  { name: "Romanian Deadlift", category: "Weightlifting" },
  { name: "Clean", category: "Weightlifting" },
  { name: "Power Clean", category: "Weightlifting" },
  { name: "Hang Clean", category: "Weightlifting" },
  { name: "Hang Power Clean", category: "Weightlifting" },
  { name: "Clean and Jerk", category: "Weightlifting" },
  { name: "Snatch", category: "Weightlifting" },
  { name: "Power Snatch", category: "Weightlifting" },
  { name: "Hang Snatch", category: "Weightlifting" },
  { name: "Split Jerk", category: "Weightlifting" },
  { name: "Push Jerk", category: "Weightlifting" },
  { name: "Push Press", category: "Weightlifting" },
  { name: "Strict Press", category: "Weightlifting" },
  { name: "Bench Press", category: "Weightlifting" },
  { name: "Thruster", category: "Weightlifting" },
  { name: "Sumo Deadlift High Pull", category: "Weightlifting" },
  { name: "Good Mornings", category: "Weightlifting" },
  // Dumbbell
  { name: "DB Snatch", category: "Dumbbell" },
  { name: "DB Clean", category: "Dumbbell" },
  { name: "DB Clean and Jerk", category: "Dumbbell" },
  { name: "DB Thruster", category: "Dumbbell" },
  { name: "DB Push Press", category: "Dumbbell" },
  { name: "DB Overhead Squat", category: "Dumbbell" },
  { name: "DB Front Squat", category: "Dumbbell" },
  { name: "DB Deadlift", category: "Dumbbell" },
  { name: "DB Lunges", category: "Dumbbell" },
  { name: "DB Man Makers", category: "Dumbbell" },
  { name: "Devil Press", category: "Dumbbell" },
  { name: "DB Box Step-Overs", category: "Dumbbell" },
  // Kettlebell
  { name: "KB Swings (Russian)", category: "Kettlebell" },
  { name: "KB Swings (American)", category: "Kettlebell" },
  { name: "KB Snatch", category: "Kettlebell" },
  { name: "KB Clean", category: "Kettlebell" },
  { name: "KB Goblet Squat", category: "Kettlebell" },
  { name: "KB Overhead Squat", category: "Kettlebell" },
  { name: "Turkish Get-Up", category: "Kettlebell" },
  // Odd object / carries
  { name: "Wall Balls", category: "Odd Object" },
  { name: "Farmers Carry", category: "Odd Object" },
  { name: "Sandbag Cleans", category: "Odd Object" },
  { name: "Sandbag Carry", category: "Odd Object" },
  { name: "Sled Push", category: "Odd Object" },
  { name: "Sled Pull", category: "Odd Object" },
  { name: "Yoke Carry", category: "Odd Object" },
  { name: "Atlas Stone to Shoulder", category: "Odd Object" },
  // Monostructural
  { name: "Run (Meters)", category: "Monostructural" },
  { name: "Row (Meters)", category: "Monostructural" },
  { name: "Row (Calories)", category: "Monostructural" },
  { name: "Bike (Calories)", category: "Monostructural" },
  { name: "Assault Bike (Calories)", category: "Monostructural" },
  { name: "Ski Erg (Calories)", category: "Monostructural" },
  { name: "Swim (Meters)", category: "Monostructural" },
];
const WOD_MOVE_CATEGORIES_WITH_WEIGHT = new Set(["Weightlifting", "Dumbbell", "Kettlebell", "Odd Object"]);

const WOD_LIBRARY = [
  { id: "fran", name: "Fran", category: "Girls", scoreType: "time", desc: "21-15-9 Thrusters & Pull-ups" },
  { id: "grace", name: "Grace", category: "Girls", scoreType: "time", desc: "30 Clean & Jerks" },
  { id: "isabel", name: "Isabel", category: "Girls", scoreType: "time", desc: "30 Snatches" },
  { id: "diane", name: "Diane", category: "Girls", scoreType: "time", desc: "21-15-9 Deadlifts & HSPU" },
  { id: "elizabeth", name: "Elizabeth", category: "Girls", scoreType: "time", desc: "21-15-9 Cleans & Ring Dips" },
  { id: "karen", name: "Karen", category: "Girls", scoreType: "time", desc: "150 Wall Balls for time" },
  { id: "annie", name: "Annie", category: "Girls", scoreType: "time", desc: "50-40-30-20-10 Double-unders & Sit-ups" },
  { id: "helen", name: "Helen", category: "Girls", scoreType: "time", desc: "3 rounds: 400m run, 21 KB swings, 12 pull-ups" },
  { id: "nancy", name: "Nancy", category: "Girls", scoreType: "time", desc: "5 rounds: 400m run, 15 OHS" },
  { id: "jackie", name: "Jackie", category: "Girls", scoreType: "time", desc: "1000m row, 50 thrusters, 30 pull-ups" },
  { id: "angie", name: "Angie", category: "Girls", scoreType: "time", desc: "100 pull-ups, push-ups, sit-ups, squats" },
  { id: "cindy", name: "Cindy", category: "Girls", scoreType: "amrap", desc: "AMRAP 20: 5 pull-ups, 10 push-ups, 15 squats" },
  { id: "mary", name: "Mary", category: "Girls", scoreType: "amrap", desc: "AMRAP 20: 5 HSPU, 10 pistols, 15 pull-ups" },
  { id: "murph", name: "Murph", category: "Heroes", scoreType: "time", desc: "1mi run, 100 pull-ups, 200 push-ups, 300 squats, 1mi run" },
  { id: "dt", name: "DT", category: "Heroes", scoreType: "time", desc: "5 rounds: 12 deadlifts, 9 hang power cleans, 6 push jerks" },
  { id: "randy", name: "Randy", category: "Heroes", scoreType: "time", desc: "75 power snatches" },
  { id: "jt", name: "JT", category: "Heroes", scoreType: "time", desc: "21-15-9 HSPU, ring dips, push-ups" },
  { id: "nate", name: "Nate", category: "Heroes", scoreType: "amrap", desc: "AMRAP 20: 2 muscle-ups, 4 HSPU, 8 KB swings" },
];
const PLATE_DEFS = [
  { kg: 25, color: "#D8453C", w: 15, h: 78 },
  { kg: 20, color: "#3E6FD9", w: 15, h: 70 },
  { kg: 15, color: "#E0B23C", w: 13, h: 62 },
  { kg: 10, color: "#4B9B5F", w: 11, h: 54 },
  { kg: 5, color: "#7A828C", w: 9, h: 44 },
  { kg: 2.5, color: "#1A1A1A", w: 7, h: 34 },
  { kg: 1.25, color: "#1A1A1A", w: 6, h: 26 },
];

function calcPlates(total) {
  let perSide = Math.max(0, (total - BAR_KG) / 2);
  const out = [];
  for (const p of PLATE_DEFS) {
    while (perSide + 1e-9 >= p.kg) { out.push(p); perSide -= p.kg; }
  }
  return out;
}
function estimate1RM(weight, reps) {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}
function localISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayISO() { return localISODate(new Date()); }
const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function esc(str) { return String(str ?? "").replace(/[&<>"']/g, (c) => ESC_MAP[c]); }
let customMovements = [];
function allMovements() { return MOVEMENTS.concat(customMovements); }
function movementById(id) { return allMovements().find((m) => m.id === id); }

// ---------- IndexedDB ----------
const DB_NAME = "box-log-db", STORE = "entries", MOVSTORE = "movements", WODSTORE = "wodEntries", CUSTOMWODSTORE = "customWods", BWSTORE = "bodyweight";
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 5);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(MOVSTORE)) db.createObjectStore(MOVSTORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(WODSTORE)) db.createObjectStore(WODSTORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(CUSTOMWODSTORE)) db.createObjectStore(CUSTOMWODSTORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(BWSTORE)) db.createObjectStore(BWSTORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbLoadMovements() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOVSTORE, "readonly");
    const req = tx.objectStore(MOVSTORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbAddMovement(m) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOVSTORE, "readwrite");
    tx.objectStore(MOVSTORE).put(m);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbClearMovements() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MOVSTORE, "readwrite");
    tx.objectStore(MOVSTORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbLoadWodEntries() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WODSTORE, "readonly");
    const req = tx.objectStore(WODSTORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbPutWodEntry(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WODSTORE, "readwrite");
    tx.objectStore(WODSTORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbDeleteWodEntry(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WODSTORE, "readwrite");
    tx.objectStore(WODSTORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbClearWodEntries() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WODSTORE, "readwrite");
    tx.objectStore(WODSTORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbLoadCustomWods() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOMWODSTORE, "readonly");
    const req = tx.objectStore(CUSTOMWODSTORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbAddCustomWod(w) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOMWODSTORE, "readwrite");
    tx.objectStore(CUSTOMWODSTORE).put(w);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbClearCustomWods() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOMWODSTORE, "readwrite");
    tx.objectStore(CUSTOMWODSTORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbLoadBodyweight() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BWSTORE, "readonly");
    const req = tx.objectStore(BWSTORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbPutBodyweight(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BWSTORE, "readwrite");
    tx.objectStore(BWSTORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbClearBodyweight() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BWSTORE, "readwrite");
    tx.objectStore(BWSTORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbLoadAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- State ----------
let entries = [];
const VALID_TABS = ["add", "history", "calendar", "wod"];
const urlTab = new URLSearchParams(location.search).get("tab");
let tab = VALID_TABS.includes(urlTab) ? urlTab : "add";
let selectedId = MOVEMENTS[0].id;
let weight = 20, reps = 5, sets = 1;
let historyId = MOVEMENTS[0].id;
let historySearch = "";
const now0 = new Date();
let calYear = now0.getFullYear();
let calMonth = now0.getMonth();
let calSelectedDate = todayISO();

// WOD tab state
let wodEntries = [];
let customWods = [];
let wodSubTab = "log";
let selectedWodId = WOD_LIBRARY[0].id;
let wodMinutes = 3, wodSeconds = 0, wodRounds = 5, wodReps = 0, wodWeight = 20;
let wodRx = true;
let wodScaledWeight = 20;
let wodNotes = "";
let wodHistoryId = WOD_LIBRARY[0].id;
let wodHistorySearch = "";
let wodBuilderOpen = false;
let builderFormat = null;
let builderMovements = {};
let builderMoveSearch = "";
let confirmClear = false;
let storageOK = true;

// Bodyweight tab state
let bodyweightEntries = [];
let bwWeight = 70;

let importMessage = "";
let importMsgTimeout = null;
function setImportMessage(msg) {
  importMessage = msg;
  clearTimeout(importMsgTimeout);
  importMsgTimeout = setTimeout(() => { importMessage = ""; render(); }, 5000);
}

// ---------- Derived helpers ----------
function entriesFor(id) { return entries.filter((e) => e.exerciseId === id); }
function bestEst1RM(id) {
  const list = entriesFor(id);
  return list.length ? Math.max(...list.map((e) => e.est1RM)) : null;
}
function repRecordFor(id, repCount) {
  const list = entriesFor(id).filter((e) => e.reps === repCount);
  return list.length ? Math.max(...list.map((e) => e.weight)) : null;
}
function activeExercises() {
  const ids = [...new Set(entries.map((e) => e.exerciseId))];
  return ids.map(movementById).filter(Boolean);
}

async function addMovement(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = allMovements().find((m) => m.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    selectedId = existing.id;
    closePicker();
    render();
    return;
  }
  const id = "custom-" + trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
  const movement = { id, name: trimmed, category: "Custom" };
  customMovements.push(movement);
  try { await dbAddMovement(movement); } catch (e) { storageOK = false; }
  selectedId = id;
  closePicker();
  render();
}
async function saveSet() {
  const prevRepRecord = repRecordFor(selectedId, reps) || 0;
  const prevEst1RM = bestEst1RM(selectedId) || 0;
  const est = estimate1RM(weight, reps);
  const isPR = weight > prevRepRecord || est > prevEst1RM;
  const entry = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    ts: Date.now(),
    exerciseId: selectedId, weight, reps, sets, date: todayISO(), isPR, est1RM: est,
  };
  entries.unshift(entry);
  try { await dbPut(entry); storageOK = true; } catch (e) { storageOK = false; }
  if (isPR) flashPR();
  render();
}
async function deleteEntry(id) {
  entries = entries.filter((e) => e.id !== id);
  try { await dbDelete(id); } catch (e) { storageOK = false; }
  render();
}

// ---------- Bodyweight ----------
async function saveBodyweight() {
  const today = todayISO();
  const existing = bodyweightEntries.find((e) => e.date === today);
  const entry = existing
    ? { ...existing, weight: bwWeight, ts: Date.now() }
    : { id: "bw-" + Date.now().toString() + Math.random().toString(36).slice(2), date: today, ts: Date.now(), weight: bwWeight };
  bodyweightEntries = bodyweightEntries.filter((e) => e.id !== entry.id);
  bodyweightEntries.unshift(entry);
  try { await dbPutBodyweight(entry); storageOK = true; } catch (e) { storageOK = false; }
  render();
}
const LAST_EXPORT_KEY = "boxlog:lastExportAt";
function markExported() {
  try { localStorage.setItem(LAST_EXPORT_KEY, String(Date.now())); } catch (e) {}
}
function daysSinceLastExport() {
  try {
    const v = localStorage.getItem(LAST_EXPORT_KEY);
    if (!v) return null;
    return Math.floor((Date.now() - Number(v)) / 86400000);
  } catch (e) { return null; }
}
function exportData() {
  const payload = {
    app: "box-log",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    customMovements,
    wodEntries,
    customWods,
    bodyweightEntries,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `box-log-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  markExported();
  render();
}

function triggerImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.addEventListener("change", () => {
    if (input.files && input.files[0]) importDataFromFile(input.files[0]);
  });
  input.click();
}

async function importDataFromFile(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (e) {
    setImportMessage("הייבוא נכשל — הקובץ אינו קובץ גיבוי תקין");
    render();
    return;
  }
  if (!data || typeof data !== "object") {
    setImportMessage("הייבוא נכשל — הקובץ אינו קובץ גיבוי תקין");
    render();
    return;
  }
  const lists = {
    customMovements: Array.isArray(data.customMovements) ? data.customMovements : [],
    customWods: Array.isArray(data.customWods) ? data.customWods : [],
    entries: Array.isArray(data.entries) ? data.entries : [],
    wodEntries: Array.isArray(data.wodEntries) ? data.wodEntries : [],
    bodyweightEntries: Array.isArray(data.bodyweightEntries) ? data.bodyweightEntries : [],
  };
  let ok = 0, skipped = 0;
  for (const m of lists.customMovements) { try { if (!m.id) throw 0; await dbAddMovement(m); ok++; } catch (e) { skipped++; } }
  for (const w of lists.customWods) { try { if (!w.id) throw 0; await dbAddCustomWod(w); ok++; } catch (e) { skipped++; } }
  for (const e of lists.entries) { try { if (!e.id) throw 0; await dbPut(e); ok++; } catch (err) { skipped++; } }
  for (const e of lists.wodEntries) { try { if (!e.id) throw 0; await dbPutWodEntry(e); ok++; } catch (err) { skipped++; } }
  for (const e of lists.bodyweightEntries) { try { if (!e.id) throw 0; await dbPutBodyweight(e); ok++; } catch (err) { skipped++; } }

  try {
    entries = await dbLoadAll();
    entries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    customMovements = await dbLoadMovements();
    wodEntries = await dbLoadWodEntries();
    wodEntries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    customWods = await dbLoadCustomWods();
    bodyweightEntries = await dbLoadBodyweight();
    bodyweightEntries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (bodyweightEntries[0]) bwWeight = bodyweightEntries[0].weight;
    storageOK = true;
  } catch (e) {
    storageOK = false;
  }
  setImportMessage(skipped ? `יובאו ${ok} פריטים, דולגו ${skipped}` : `יובאו ${ok} פריטים`);
  render();
}

async function clearAllData() {
  entries = [];
  wodEntries = [];
  customMovements = [];
  customWods = [];
  bodyweightEntries = [];
  try {
    await dbClear();
    await dbClearWodEntries();
    await dbClearMovements();
    await dbClearCustomWods();
    await dbClearBodyweight();
  } catch (e) {
    storageOK = false;
  }
  selectedId = MOVEMENTS[0].id;
  historyId = MOVEMENTS[0].id;
  selectedWodId = WOD_LIBRARY[0].id;
  wodHistoryId = WOD_LIBRARY[0].id;
  bwWeight = 70;
  confirmClear = false;
  render();
}

// ---------- WOD helpers & actions ----------
function allWods() { return WOD_LIBRARY.concat(customWods); }
function wodById(id) { return allWods().find((w) => w.id === id); }
function wodEntriesFor(id) { return wodEntries.filter((e) => e.wodId === id); }
function activeWods() {
  const ids = [...new Set(wodEntries.map((e) => e.wodId))];
  return ids.map(wodById).filter(Boolean);
}
function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60), s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function scoreValue(e) {
  if (e.scoreType === "time") return e.timeSeconds;
  if (e.scoreType === "amrap") return e.rounds * 1000 + e.reps;
  return e.weight;
}
function bestWodScore(id) {
  const w = wodById(id);
  const list = wodEntriesFor(id);
  if (!list.length) return null;
  if (w.scoreType === "time") return Math.min(...list.map(scoreValue));
  return Math.max(...list.map(scoreValue));
}
function formatWodEntry(e) {
  const base = e.scoreType === "time" ? formatClock(e.timeSeconds) : e.scoreType === "amrap" ? `${e.rounds}+${e.reps}` : `${e.weight} kg`;
  return (!e.rx && e.scaledWeight) ? `${base} @ ${e.scaledWeight}kg` : base;
}
function lastScaledAttempt(id) {
  const list = wodEntriesFor(id).filter((e) => !e.rx).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return list.length ? list[0] : null;
}
function formatWodBest(id) {
  const w = wodById(id);
  const best = bestWodScore(id);
  if (best === null) return "—";
  if (w.scoreType === "time") return formatClock(best);
  if (w.scoreType === "amrap") return `${Math.floor(best / 1000)}+${best % 1000}`;
  return `${best} kg`;
}

async function addCustomWod(name, scoreType, desc) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = allWods().find((w) => w.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) { selectedWodId = existing.id; closeWodPicker(); closeWodBuilder(); render(); return; }
  const id = "customwod-" + trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
  const wod = { id, name: trimmed, category: "Custom", scoreType, desc: desc || "" };
  customWods.push(wod);
  try { await dbAddCustomWod(wod); } catch (e) { storageOK = false; }
  selectedWodId = id;
  closeWodPicker();
  closeWodBuilder();
  render();
}

// ---------- WOD builder ----------
function openWodBuilder(prefillName) {
  wodBuilderOpen = true;
  builderFormat = null;
  builderMovements = {};
  builderMoveSearch = "";
  document.body.style.overflow = "hidden";
  const overlay = document.getElementById("wodBuilderOverlay");
  overlay.style.height = (window.visualViewport ? window.visualViewport.height : window.innerHeight) + "px";
  overlay.classList.add("open");
  document.getElementById("wodBuilderName").value = prefillName || "";
  const moveSearch = document.getElementById("wodBuilderMoveSearch");
  if (moveSearch) moveSearch.value = "";
  renderWodBuilderMovements("");
  renderWodBuilderFormats();
}
function closeWodBuilder() {
  wodBuilderOpen = false;
  document.body.style.overflow = "";
  const overlay = document.getElementById("wodBuilderOverlay");
  if (overlay) overlay.classList.remove("open");
}
function renderWodBuilderFormats() {
  document.querySelectorAll("#wodBuilderFormats .format-chip").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.format === builderFormat);
    btn.style.borderColor = "";
  });
  const hint = document.getElementById("wodBuilderFormatHint");
  if (hint) {
    hint.textContent = "חובה לבחור אחד";
    hint.style.color = "var(--steel)";
  }
}
function renderWodBuilderMovements(query) {
  const el = document.getElementById("wodBuilderMovements");
  if (!el) return;
  if (typeof query === "string") builderMoveSearch = query;
  const q = builderMoveSearch.trim().toLowerCase();
  const filtered = WOD_MOVEMENT_TAGS.filter((m) => m.name.toLowerCase().includes(q));
  const byCategory = {};
  filtered.forEach((m) => { (byCategory[m.category] = byCategory[m.category] || []).push(m); });
  if (Object.keys(byCategory).length === 0) {
    el.innerHTML = `<div style="color:var(--steel); text-align:center; padding:16px 0; font-size:13px;">לא נמצא תרגיל התואם ל-"${esc(builderMoveSearch)}"</div>`;
    return;
  }
  el.innerHTML = Object.entries(byCategory).map(([cat, items]) => `
    <div class="cat-group">
      <div class="cat-head"><div class="dot" style="background:${CATEGORY_COLORS[cat]}"></div><span class="cat-name">${CATEGORY_LABELS[cat] || cat}</span></div>
      ${items.map((m) => {
        const checked = Object.prototype.hasOwnProperty.call(builderMovements, m.name);
        const data = builderMovements[m.name] || { reps: 10, weight: 0 };
        const hasWeight = WOD_MOVE_CATEGORIES_WITH_WEIGHT.has(m.category);
        return `
        <button class="movecheck-row ${checked ? "checked" : ""}" data-action="toggle-builder-movement" data-name="${m.name}">
          <span style="font-weight:600; font-size:14px;">${m.name}</span>
          <div class="movecheck-box">${checked ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>' : ""}</div>
        </button>
        ${checked ? (hasWeight ? `
        <div class="flex" style="gap:8px; margin:-2px 0 10px; padding:0 2px;">
          ${renderStepper(m.name, "חזרות", data.reps, 1, 0, "builder-movement-reps")}
          ${renderStepper(m.name, "ק\"ג", data.weight, 2.5, 0, "builder-movement-weight")}
        </div>` : `
        <div style="width:50%; margin:-2px 0 10px; padding:0 2px;">
          ${renderStepper(m.name, "חזרות", data.reps, 1, 0, "builder-movement-reps")}
        </div>`) : ""}`;
      }).join("")}
    </div>`).join("");
}
function createWodFromBuilder() {
  const nameInput = document.getElementById("wodBuilderName");
  const name = nameInput ? nameInput.value.trim() : "";
  if (!name) { nameInput.focus(); return; }
  if (!builderFormat) {
    const hint = document.getElementById("wodBuilderFormatHint");
    if (hint) {
      hint.textContent = "יש לבחור פורמט למעלה כדי להמשיך";
      hint.style.color = "var(--red)";
    }
    document.querySelectorAll("#wodBuilderFormats .format-chip").forEach((btn) => {
      btn.style.borderColor = "var(--red)";
    });
    return;
  }
  const desc = Object.entries(builderMovements)
    .map(([name, d]) => `${d.reps} ${name}${d.weight ? ` @ ${d.weight}kg` : ""}`)
    .join(", ");
  addCustomWod(name, builderFormat, desc);
}

async function saveWod() {
  const w = wodById(selectedWodId);
  const prevBest = bestWodScore(selectedWodId);
  const entry = {
    id: "wod-" + Date.now().toString() + Math.random().toString(36).slice(2),
    ts: Date.now(),
    date: todayISO(),
    wodId: selectedWodId,
    scoreType: w.scoreType,
    rx: wodRx,
  };
  if (w.scoreType === "time") entry.timeSeconds = wodMinutes * 60 + wodSeconds;
  else if (w.scoreType === "amrap") { entry.rounds = wodRounds; entry.reps = wodReps; }
  else entry.weight = wodWeight;
  entry.notes = wodNotes.trim() || null;
  entry.scaledWeight = !wodRx ? wodScaledWeight : null;

  const val = scoreValue(entry);
  const isPR = prevBest === null || (w.scoreType === "time" ? val < prevBest : val > prevBest);
  entry.isPR = isPR;

  wodEntries.unshift(entry);
  try { await dbPutWodEntry(entry); storageOK = true; } catch (e) { storageOK = false; }
  wodNotes = "";
  if (isPR) flashWodPR();
  render();
}
async function deleteWodEntry(id) {
  wodEntries = wodEntries.filter((e) => e.id !== id);
  try { await dbDeleteWodEntry(id); } catch (e) { storageOK = false; }
  render();
}

let wodPrFlashTimeout = null;
function flashWodPR() {
  const el = document.getElementById("wodFlashBox");
  if (!el) return;
  el.style.display = "flex";
  clearTimeout(wodPrFlashTimeout);
  wodPrFlashTimeout = setTimeout(() => { if (el) el.style.display = "none"; }, 1400);
}

let prFlashTimeout = null;
function flashPR() {
  const el = document.getElementById("barWrap");
  if (!el) return;
  el.classList.add("pr");
  const flash = document.getElementById("prFlash");
  if (flash) flash.style.display = "flex";
  clearTimeout(prFlashTimeout);
  prFlashTimeout = setTimeout(() => {
    el.classList.remove("pr");
    if (flash) flash.style.display = "none";
  }, 1400);
}

function showUpdateBanner() {
  const el = document.getElementById("updateBanner");
  if (el) el.style.display = "block";
}

// ---------- Icons ----------
const ICONS = {
  flame: '<svg width="15" height="15" viewBox="0 0 24 24" fill="var(--brass)" stroke="none"><path d="M12 2c3 4-2 5-2 9a4 4 0 0 0 8 0c0-2-1-3-1-3s2 1 2 5a7 7 0 1 1-14 0c0-5 4-7 7-11z"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  dumbbell: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="2" stroke-linecap="round"><path d="M4 9v6M20 9v6M2 10v4M22 10v4M7 12h10"/></svg>',
  chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--steel)" stroke-width="2" stroke-linecap="round" style="transform:rotate(180deg)"><path d="M9 6l6 6-6 6"/></svg>',
  up: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.2" stroke-linecap="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
  down: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--steel)" stroke-width="2.2" stroke-linecap="round"><path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/></svg>',
  flat: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--steel)" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  chevronsLeft: '<img src="./assets/icon-chevrons.png" alt="" width="11" height="10" style="transform:scaleX(-1); vertical-align:middle;" />',
};

// ---------- Rendering ----------
function renderBarbell(w) {
  const plates = calcPlates(w);
  const left = [...plates].reverse();
  const right = plates;
  const renderSide = (list) => list.map((p) =>
    `<div class="plate" style="width:${p.w}px;height:${p.h}px;background:${p.color};"></div>`
  ).join("");
  return `
    <div class="barbell">
      <div class="bar-row">
        ${renderSide(left)}
        <div class="collar"></div><div class="sleeve"></div>
        <div class="bar-center">${w}</div>
        <div class="sleeve"></div><div class="collar"></div>
        ${renderSide(right)}
      </div>
      <span class="bar-caption">${w < BAR_KG ? "מתחת למשקל המוט (20 ק\"ג)" : `מוט אולימפי + ${plates.length} משקולות`}</span>
    </div>`;
}

function renderChart(data) {
  if (!data.length) return `<div class="flex col items-center" style="padding:32px 0; gap:8px;">${ICONS.dumbbell}<span style="color:var(--steel); font-size:13px;">אין עדיין נתונים לתרגיל הזה</span></div>`;
  const w = 300, h = 150, pad = 26;
  const xs = data.map((d, i) => pad + i * ((w - 2 * pad) / Math.max(1, data.length - 1)));
  const ys = data.map((d) => d.est1RM);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const range = maxY - minY || 1;
  const pts = data.map((d, i) => ({ x: xs[i], y: h - pad - ((d.est1RM - minY) / range) * (h - 2 * pad), isPR: d.isPR, v: d.est1RM }));
  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const dots = pts.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.isPR ? 5 : 2.5}" fill="${p.isPR ? "#E8B98A" : "#F2ECE1"}" ${p.isPR ? 'stroke="#101B30" stroke-width="2"' : ""}/>`).join("");
  const firstLabel = `<text x="${xs[0]}" y="${h - 6}" font-size="9" fill="#8891A6" text-anchor="start">${data[0].dateLabel}</text>`;
  const lastLabel = `<text x="${xs[xs.length - 1]}" y="${h - 6}" font-size="9" fill="#8891A6" text-anchor="end">${data[data.length - 1].dateLabel}</text>`;
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%; height:170px;">
    <polyline points="${polyline}" fill="none" stroke="#E8B98A" stroke-width="2"/>
    ${dots}${firstLabel}${lastLabel}
  </svg>`;
}

function renderLogTab() {
  const selected = movementById(selectedId);
  const est = bestEst1RM(selectedId);
  const last = entriesFor(selectedId)[0];
  const todaysEntries = entries.filter((e) => e.date === todayISO());

  return `
    <button class="exercise-select" data-action="open-picker">
      <div class="flex items-center gap-8">
        <div class="dot" style="background:${CATEGORY_COLORS[selected.category]}"></div>
        <span style="font-weight:800; font-size:16px;">${esc(selected.name)}</span>
      </div>
      <span class="flex items-center gap-6" style="color:var(--steel); font-size:12px; font-weight:600;">שינוי${ICONS.chevronsLeft}</span>
    </button>

    ${(est || last) ? `
    <div class="stat-row">
      ${est ? `<div class="stat-card"><div class="stat-label">1RM משוער</div><div class="stat-value mono" style="color:var(--brass);">${est} kg</div></div>` : ""}
      ${last ? `<div class="stat-card"><div class="stat-label">אימון אחרון</div><div class="stat-value mono">${last.weight}×${last.reps}</div></div>` : ""}
    </div>` : ""}

    <div class="bar-wrap" id="barWrap">
      <div class="pr-flash" id="prFlash" style="display:none;">${ICONS.flame}<span>שיא חדש!</span></div>
      <div id="barbellVisual">${renderBarbell(weight)}</div>
    </div>

    <div class="steppers">
      ${renderStepper("weight", "משקל (ק\"ג)", weight, 2.5, 0)}
      ${renderStepper("reps", "חזרות", reps, 1, 1)}
      ${renderStepper("sets", "סטים", sets, 1, 1)}
    </div>

    <div class="est-line">‹ הסט הזה מעריך 1RM של <b id="estLineValue">${estimate1RM(weight, reps)} kg</b></div>

    ${todaysEntries.length === 0 ? `
    <div class="empty">עדיין לא נרשמו סטים היום. קדימה למוט.</div>` : `
    <button class="exercise-row" data-action="view-today-calendar" style="margin-bottom:0;">
      <div class="flex items-center gap-8">
        ${todaysEntries[0].isPR ? ICONS.flame : ""}
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:13px;">אחרון: ${esc(movementById(todaysEntries[0].exerciseId) ? movementById(todaysEntries[0].exerciseId).name : "?")} — ${todaysEntries[0].sets}×${todaysEntries[0].reps} @ ${todaysEntries[0].weight}</div>
          <div style="color:var(--steel); font-size:11px;">${todaysEntries.length} סט${todaysEntries.length === 1 ? "" : "ים"} נרשמו היום</div>
        </div>
      </div>
      <span class="flex items-center gap-6" style="color:var(--steel); font-size:12px; font-weight:600;">צפייה ביום${ICONS.chevronsLeft}</span>
    </button>`}
  `;
}

function renderStepper(field, label, value, step, min, action) {
  action = action || "step";
  return `
    <div class="stepper">
      <span class="stepper-label">${label}</span>
      <div class="stepper-box">
        <button class="stepper-btn" data-action="${action}" data-field="${field}" data-dir="-1" data-step="${step}" data-min="${min}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>
        </button>
        <span class="stepper-val mono">${value}</span>
        <button class="stepper-btn" data-action="${action}" data-field="${field}" data-dir="1" data-step="${step}" data-min="${min}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>`;
}

function renderDetailCard(m) {
  const hEntries = entriesFor(m.id);
  if (hEntries.length === 0) return "";
  let max = -Infinity;
  const chartData = hEntries.slice().sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts).map((e) => {
    const isPR = e.est1RM >= max;
    if (e.est1RM > max) max = e.est1RM;
    return { dateLabel: fmtDate(e.date), est1RM: e.est1RM, isPR };
  });
  const prPoints = chartData.filter((d) => d.isPR);
  const trend = prPoints.length >= 2 ? +(prPoints[prPoints.length - 1].est1RM - prPoints[prPoints.length - 2].est1RM).toFixed(1) : null;
  return `
    <div class="chart-card" style="margin-top:-4px; border-top-left-radius:0; border-top-right-radius:0; border-top:none;">
      <div class="flex items-center justify-between" style="margin-bottom:12px;">
        <span style="font-weight:800; font-size:15px;">${esc(m.name)}</span>
        ${trend !== null ? `<span class="flex items-center gap-6" style="font-weight:700; font-size:12px;">${trend > 0 ? ICONS.up : trend < 0 ? ICONS.down : ICONS.flat}<span class="mono">${trend > 0 ? "+" : ""}${trend} kg</span> 1RM משוער</span>` : ""}
      </div>
      ${renderChart(chartData)}
      <div class="rep-table">
        ${STANDARD_REPS.map((r) => {
          const rec = repRecordFor(m.id, r);
          return `<div class="rep-cell"><div class="rep-cell-label">${r}RM</div><div class="rep-cell-val mono" style="color:${rec ? "var(--chalk)" : "var(--border)"};">${rec ?? "—"}</div></div>`;
        }).join("")}
      </div>
    </div>`;
}

function renderHistoryListArea() {
  const area = document.getElementById("historyListArea");
  if (!area) return;
  const q = historySearch.trim().toLowerCase();
  const active = activeExercises().filter((m) => m.name.toLowerCase().includes(q));
  if (activeExercises().length === 0) {
    area.innerHTML = `<div class="flex col items-center" style="padding:40px 0; gap:8px;">${ICONS.dumbbell}<span style="color:var(--steel); font-size:13px;">רשמו סט כדי להתחיל לראות התקדמות</span></div>`;
    return;
  }
  if (active.length === 0) {
    area.innerHTML = `<div style="color:var(--steel); text-align:center; padding:20px 0; font-size:13px;">לא נמצא תרגיל התואם ל-"${esc(historySearch)}"</div>`;
    return;
  }
  area.innerHTML = active.map((m) => {
    const row = `
      <button class="exercise-row ${historyId === m.id ? "active" : ""}" data-action="select-history" data-id="${m.id}" style="${historyId === m.id ? "margin-bottom:0; border-bottom-left-radius:0; border-bottom-right-radius:0;" : ""}">
        <div class="flex items-center gap-8">
          ${ICONS.chevron}
          <div class="dot" style="background:${CATEGORY_COLORS[m.category]}"></div>
          <span style="font-weight:700; font-size:14px;">${esc(m.name)}</span>
        </div>
        <span class="mono" style="color:var(--brass); font-weight:700; font-size:14px;">${bestEst1RM(m.id)} kg</span>
      </button>`;
    const detail = historyId === m.id ? renderDetailCard(m) + `<div style="height:8px;"></div>` : "";
    return row + detail;
  }).join("");
}

// ---------- Calendar tab ----------
const MONTH_NAMES = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const REPORT_CATEGORIES = ["Squat","Deadlift","Press","Olympic","Pull","Other"];

function isoDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function renderCalendarGrid() {
  const grid = document.getElementById("calGrid");
  const label = document.getElementById("calMonthLabel");
  if (!grid || !label) return;
  label.textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstWeekday = new Date(calYear, calMonth, 1).getDay();
  const today = todayISO();
  let cells = "";
  for (let i = 0; i < firstWeekday; i++) cells += `<div class="cal-cell empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoDate(calYear, calMonth, d);
    const dayEntries = entries.filter((e) => e.date === iso);
    const dayWods = wodEntries.filter((e) => e.date === iso);
    const hasData = dayEntries.length > 0 || dayWods.length > 0;
    const hasPR = dayEntries.some((e) => e.isPR) || dayWods.some((e) => e.isPR);
    const cls = ["cal-cell"];
    if (iso === today) cls.push("today");
    if (iso === calSelectedDate) cls.push("selected");
    cells += `<button class="${cls.join(" ")}" data-action="cal-select-day" data-date="${iso}">
      <span class="cal-daynum">${d}</span>
      ${hasData ? `<div class="cal-dot ${hasPR ? "pr" : ""}"></div>` : ""}
    </button>`;
  }
  grid.innerHTML = cells;
  renderCalDetail();
}

function renderCalDetail() {
  const el = document.getElementById("calDetail");
  if (!el) return;
  const dayEntries = entries.filter((e) => e.date === calSelectedDate).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const dayWods = wodEntries.filter((e) => e.date === calSelectedDate).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const d = new Date(calSelectedDate + "T00:00:00");
  const label = d.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  el.innerHTML = `
    <div class="section-label" style="margin-top:4px;">${label.toUpperCase()}</div>
    ${(dayEntries.length === 0 && dayWods.length === 0) ? `<div class="empty">לא נרשם דבר ביום הזה.</div>` : `
    <div class="log-list">
      ${dayEntries.map((e) => `
        <div class="log-row">
          <div class="flex items-center gap-8">
            ${e.isPR ? ICONS.flame : ""}
            <span style="font-weight:700; font-size:14px;">${esc(movementById(e.exerciseId) ? movementById(e.exerciseId).name : "?")}</span>
          </div>
          <div class="flex items-center gap-10">
            <span class="mono" style="color:var(--steel); font-size:13px;">${e.sets}×${e.reps} @ ${e.weight}</span>
            <button data-action="delete-entry" data-id="${e.id}" style="color:var(--steel); padding:4px;">${ICONS.trash}</button>
          </div>
        </div>`).join("")}
      ${dayWods.map((e) => {
        const w = wodById(e.wodId);
        return `
        <div class="log-row" style="${e.notes ? "flex-direction:column; align-items:stretch; gap:4px;" : ""}">
          <div class="flex items-center justify-between" style="width:100%;">
            <div class="flex items-center gap-8">
              ${e.isPR ? ICONS.flame : ""}
              <span style="font-weight:700; font-size:14px;">${esc(w ? w.name : "?")}</span>
              <span style="color:var(--steel); font-size:11px;">${e.rx ? "Rx" : "Scaled"}</span>
            </div>
            <div class="flex items-center gap-10">
              <span class="mono" style="color:var(--steel); font-size:13px;">${formatWodEntry(e)}</span>
              <button data-action="delete-wod-entry" data-id="${e.id}" style="color:var(--steel); padding:4px;">${ICONS.trash}</button>
            </div>
          </div>
          ${e.notes ? `<div style="color:var(--steel); font-size:12px; padding-left:23px;">${esc(e.notes)}</div>` : ""}
        </div>`;
      }).join("")}
    </div>`}
  `;
}

function daysAgoLabel(iso) {
  if (!iso) return "מעולם לא";
  const diff = Math.round((new Date(todayISO()) - new Date(iso)) / 86400000);
  if (diff === 0) return "היום";
  if (diff === 1) return "לפני יום";
  return `לפני ${diff} ימים`;
}

function renderVolumeReport() {
  const now = new Date();
  const cutoff7 = new Date(now); cutoff7.setDate(now.getDate() - 6);
  const cutoff7ISO = localISODate(cutoff7);
  const cutoff30 = new Date(now); cutoff30.setDate(now.getDate() - 29);
  const cutoff30ISO = localISODate(cutoff30);

  const cats = REPORT_CATEGORIES.concat(customMovements.length ? ["Custom"] : []);
  const rows = cats.map((cat) => {
    const catEntries = entries.filter((e) => { const m = movementById(e.exerciseId); return m && m.category === cat; });
    const setsWeek = catEntries.filter((e) => e.date >= cutoff7ISO).reduce((s, e) => s + e.sets, 0);
    const setsMonth = catEntries.filter((e) => e.date >= cutoff30ISO).reduce((s, e) => s + e.sets, 0);
    const lastDate = catEntries.length ? catEntries.map((e) => e.date).sort().slice(-1)[0] : null;
    const diff = lastDate ? Math.round((new Date(todayISO()) - new Date(lastDate)) / 86400000) : null;
    let flagColor = "var(--steel)", flagBg = "rgba(138,143,151,.15)", flagText = daysAgoLabel(lastDate);
    if (diff === null) { flagColor = "var(--red)"; flagBg = "rgba(216,69,60,.15)"; }
    else if (diff <= 7) { flagColor = "var(--green)"; flagBg = "rgba(75,155,95,.15)"; }
    else if (diff > 14) { flagColor = "var(--red)"; flagBg = "rgba(216,69,60,.15)"; }
    return `
      <div class="report-row">
        <div class="flex items-center gap-8">
          <div class="dot" style="background:${CATEGORY_COLORS[cat]}"></div>
          <span style="font-weight:700; font-size:14px;">${CATEGORY_LABELS[cat] || cat}</span>
        </div>
        <div class="flex items-center gap-10">
          <span class="mono" style="color:var(--steel); font-size:12px;">${setsWeek}/${setsMonth} סטים</span>
          <span class="report-flag" style="color:${flagColor}; background:${flagBg};">${flagText}</span>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="section-label">נפח ותדירות לפי קטגוריה</div>
    <div style="color:var(--steel); font-size:11px; margin-bottom:10px;">סטים ב-7 / 30 הימים האחרונים, וזמן מאז האימון האחרון</div>
    ${rows}
  `;
}

function renderCalendarTab() {
  return `
    <div class="cal-header">
      <button class="cal-nav-btn" data-action="cal-prev">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--chalk)" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>
      </button>
      <span class="cal-month-label" id="calMonthLabel"></span>
      <button class="cal-nav-btn" data-action="cal-next">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--chalk)" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>
      </button>
    </div>
    <div class="cal-weekdays">${["א","ב","ג","ד","ה","ו","ש"].map((d) => `<div class="cal-weekday">${d}</div>`).join("")}</div>
    <div class="cal-grid" id="calGrid"></div>
    <div id="calDetail" style="margin-bottom:20px;"></div>
    ${renderVolumeReport()}
  `;
}
function renderBodyweightCard() {
  const sorted = bodyweightEntries.slice().sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
  const last = bodyweightEntries.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
  const chartData = sorted.map((e) => ({ dateLabel: fmtDate(e.date), est1RM: e.weight, isPR: false }));
  return `
    <div class="chart-card" style="margin-bottom:16px;">
      <div class="flex items-center justify-between" style="margin-bottom:${chartData.length ? "12px" : "0"};">
        <span style="font-weight:800; font-size:15px;">משקל גוף</span>
        ${last ? `<span class="mono" style="color:var(--brass); font-weight:700; font-size:13px;">${last.weight} kg · ${fmtDate(last.date)}</span>` : `<span style="color:var(--steel); font-size:12px;">אין עדיין מדידות</span>`}
      </div>
      ${chartData.length ? renderChart(chartData) : ""}
      <div class="steppers" style="margin-top:14px; margin-bottom:0;">
        ${renderStepper("bwWeight", "משקל (ק\"ג)", bwWeight, 0.5, 0, "bw-step")}
      </div>
      <button data-action="save-bw" class="save-btn" style="max-width:none; margin-top:14px;">רישום משקל גוף — היום</button>
    </div>`;
}

function renderAllTimePRs() {
  const rows = activeExercises()
    .map((m) => ({ id: m.id, name: m.name, category: m.category, value: `${bestEst1RM(m.id)} kg` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!rows.length) return "";
  return `
    <div class="section-label">שיאים כלל-זמנים</div>
    <div class="log-list" style="margin-bottom:16px;">
      ${rows.map((r) => `
        <button class="log-row" data-action="select-history" data-id="${r.id}" style="width:100%; text-align:right;">
          <div class="flex items-center gap-8">
            <div class="dot" style="background:${CATEGORY_COLORS[r.category]}"></div>
            <span style="font-weight:700; font-size:13px;">${esc(r.name)}</span>
          </div>
          <span class="mono" style="color:var(--brass); font-weight:700; font-size:13px;">${r.value}</span>
        </button>`).join("")}
    </div>`;
}

function renderHistoryTab() {
  const now = new Date();
  const monthPrefix = localISODate(now).slice(0, 7);
  const prCountThisMonth = entries.filter((e) => e.isPR && e.date.startsWith(monthPrefix)).length;
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  const startISO = localISODate(start);
  const sessionsThisWeek = new Set(entries.filter((e) => e.date >= startISO).map((e) => e.date)).size;
  const totalSetsLogged = entries.reduce((sum, e) => sum + e.sets, 0);

  return `
    <div class="stat-row">
      <div class="stat-card" style="text-align:center;"><div class="stat-value mono" style="color:var(--brass); font-size:20px;">${prCountThisMonth}</div><div class="stat-label">שיאים החודש</div></div>
      <div class="stat-card" style="text-align:center;"><div class="stat-value mono" style="font-size:20px;">${sessionsThisWeek}</div><div class="stat-label">אימונים השבוע</div></div>
      <div class="stat-card" style="text-align:center;"><div class="stat-value mono" style="font-size:20px;">${totalSetsLogged}</div><div class="stat-label">סטים שנרשמו</div></div>
    </div>

    ${renderBodyweightCard()}
    ${renderAllTimePRs()}

    ${activeExercises().length > 0 ? `
    <div class="search-box" style="margin:0 0 12px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8891A6" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input id="historySearch" dir="auto" placeholder="חיפוש בתרגילים שלך" value="${esc(historySearch)}" />
    </div>` : ""}

    <div id="historyListArea"></div>
  `;
}

function renderFooter() {
  return `
    <div class="footer">
      <div class="footer-note">${storageOK ? "נשמר במכשיר הזה בלבד, ללא שרת" : "שמירה נכשלה — בדקו את מקום האחסון"}</div>
      ${(() => {
        const hasData = entries.length || wodEntries.length || bodyweightEntries.length;
        if (!hasData) return "";
        const days = daysSinceLastExport();
        if (days !== null && days < 30) return "";
        const msg = days === null ? "עדיין לא ביצעתם גיבוי" : `הגיבוי האחרון לפני ${days} ימים`;
        return `<div class="footer-note" style="color:var(--yellow); margin-bottom:8px;">${msg} — ייצוא גיבוי למטה</div>`;
      })()}
      <div class="flex items-center justify-center gap-10" style="margin-bottom:8px;">
        <button class="link-btn" data-action="export-data">ייצוא גיבוי</button>
        <span style="color:var(--border); font-size:11px;">·</span>
        <button class="link-btn" data-action="import-data">ייבוא גיבוי</button>
      </div>
      ${importMessage ? `<div class="footer-note" style="color:var(--brass); margin-bottom:8px;">${esc(importMessage)}</div>` : ""}
      ${!confirmClear ? `<button class="link-btn" data-action="ask-clear">מחיקת כל הנתונים</button>` : `
        <div class="flex items-center justify-center gap-10">
          <span style="color:var(--steel); font-size:11px;">למחוק הכל?</span>
          <button data-action="do-clear" style="color:var(--red); font-size:11px; font-weight:700;">כן, מחיקה</button>
          <button data-action="cancel-clear" style="color:var(--steel); font-size:11px;">ביטול</button>
        </div>`}
      <div class="footer-note" style="margin-top:10px;">© ${new Date().getFullYear()} Shahaf Rachmany · v${APP_VERSION}</div>
    </div>`;
}

function updateLogQuickUI(field) {
  const valMap = { weight, reps, sets };
  document.querySelectorAll(`.stepper-btn[data-field="${field}"]`).forEach((btn) => {
    const valSpan = btn.parentElement.querySelector(".stepper-val");
    if (valSpan) valSpan.textContent = valMap[field];
  });
  if (field === "weight") {
    const bv = document.getElementById("barbellVisual");
    if (bv) bv.innerHTML = renderBarbell(weight);
  }
  const estEl = document.getElementById("estLineValue");
  if (estEl) estEl.textContent = estimate1RM(weight, reps) + " kg";
}

function render() {
  let content;
  try {
    if (tab === "add") {
      const selected = movementById(selectedId);
      content = renderLogTab();
      if (selected) document.getElementById("saveBtnLabel").textContent = "רישום סט — " + selected.name;
    } else if (tab === "history") {
      content = renderHistoryTab();
    } else if (tab === "calendar") {
      content = renderCalendarTab();
    } else {
      content = renderWodTab();
    }
  } catch (err) {
    console.error("render error:", err);
    content = `<div style="padding:40px 16px; text-align:center;">
      <div style="color:var(--red); font-weight:700; margin-bottom:8px;">משהו השתבש בהצגת הטאב הזה</div>
      <div style="color:var(--steel); font-size:12px;">${(err && err.message) ? err.message : String(err)}</div>
    </div>`;
  }
  document.getElementById("tabAddBtn").className = "tabbtn" + (tab === "add" ? " active" : "");
  document.getElementById("tabHistoryBtn").className = "tabbtn" + (tab === "history" ? " active" : "");
  document.getElementById("tabCalendarBtn").className = "tabbtn" + (tab === "calendar" ? " active" : "");
  document.getElementById("tabWodBtn").className = "tabbtn" + (tab === "wod" ? " active" : "");
  document.getElementById("bottomBar").style.display = tab === "add" ? "flex" : "none";
  document.getElementById("content").innerHTML = content + renderFooter();
  try {
    if (tab === "history") {
      renderHistoryListArea();
      const search = document.getElementById("historySearch");
      if (search) search.addEventListener("input", (e) => { historySearch = e.target.value; renderHistoryListArea(); });
    }
    if (tab === "calendar") renderCalendarGrid();
    if (tab === "wod") renderWodContent();
  } catch (err) {
    console.error("post-render error:", err);
  }
}

// ---------- WOD tab ----------
function renderWodLogSection() {
  const w = wodById(selectedWodId);
  const best = formatWodBest(selectedWodId);
  const todaysWods = wodEntries.filter((e) => e.date === todayISO());
  const lastScaled = lastScaledAttempt(selectedWodId);
  const history = wodEntriesFor(selectedWodId).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));

  let inputsHtml = "";
  if (w.scoreType === "time") {
    inputsHtml = `<div class="steppers">
      ${renderStepper("wodMinutes", "דקות", wodMinutes, 1, 0, "wod-step")}
      ${renderStepper("wodSeconds", "שניות", wodSeconds, 5, 0, "wod-step")}
    </div>`;
  } else if (w.scoreType === "amrap") {
    inputsHtml = `<div class="steppers">
      ${renderStepper("wodRounds", "סבבים", wodRounds, 1, 0, "wod-step")}
      ${renderStepper("wodReps", "+ חזרות", wodReps, 1, 0, "wod-step")}
    </div>`;
  } else {
    inputsHtml = `<div class="steppers">
      ${renderStepper("wodWeight", "משקל (ק\"ג)", wodWeight, 2.5, 0, "wod-step")}
    </div>`;
  }

  return `
    <button class="exercise-select" data-action="open-wod-picker">
      <div class="flex items-center gap-8">
        <div class="dot" style="background:${CATEGORY_COLORS[w.category]}"></div>
        <div>
          <span style="font-weight:800; font-size:16px;">${esc(w.name)}</span>
          ${w.desc ? `<div class="wod-desc">${esc(w.desc)}</div>` : ""}
        </div>
      </div>
      <span class="flex items-center gap-6" style="color:var(--steel); font-size:12px; font-weight:600;">שינוי${ICONS.chevronsLeft}</span>
    </button>

    ${history.length > 0 ? `
    <div style="background:rgba(232,185,138,.12); border:1px solid var(--brass); border-radius:14px; padding:12px 14px; margin-bottom:16px;">
      <div style="color:var(--brass); font-weight:800; font-size:13px; margin-bottom:8px;">↺ עשית את זה ${history.length} פעמים בעבר — השוואה למטה</div>
      <div class="flex items-center justify-between">
        <div>
          <div class="stat-label">שיא</div>
          <div class="mono" style="color:var(--brass); font-weight:800; font-size:16px;">${best}</div>
        </div>
        <div style="text-align:left;">
          <div class="stat-label">אחרון (${fmtDate(history[0].date)})</div>
          <div class="mono" style="font-weight:700; font-size:16px;">${formatWodEntry(history[0])} ${history[0].rx ? "" : "· Scaled"}</div>
        </div>
      </div>
    </div>` : `
    <div class="stat-row">
      <div class="stat-card"><div class="stat-label">שיא</div><div class="stat-value mono" style="color:var(--brass);">${best}</div></div>
      <div class="stat-card"><div class="stat-label">סוג ניקוד</div><div class="stat-value" style="font-size:14px;">${w.scoreType === "time" ? "For Time" : w.scoreType === "amrap" ? "AMRAP" : "Load"}</div></div>
    </div>`}

    <div id="wodFlashBox" class="flex items-center justify-center" style="display:none; gap:6px; color:var(--brass); font-weight:800; font-size:14px; background:rgba(232,185,138,.14); border:1px solid var(--brass); border-radius:14px; padding:10px 0; margin-bottom:16px;">${ICONS.flame}<span>שיא חדש!</span></div>

    <div class="rx-toggle">
      <button class="rx-btn ${wodRx ? "active-rx" : ""}" data-action="set-rx" data-rx="1">Rx</button>
      <button class="rx-btn ${!wodRx ? "active-scaled" : ""}" data-action="set-rx" data-rx="0">Scaled</button>
    </div>

    ${!wodRx ? `
    <div class="steppers" style="margin-bottom:16px;">
      ${renderStepper("wodScaledWeight", "משקל מותאם (ק\"ג)", wodScaledWeight, 2.5, 0, "wod-step")}
    </div>
    <input id="wodNotesInput" class="text-input" dir="auto" style="margin-bottom:8px;" placeholder="שינוי בתרגיל? (אופציונלי, לדוגמה מתח עם רצועה)" value="${esc(wodNotes)}" />
    <div class="flex items-center justify-between" style="margin-bottom:16px;">
      ${lastScaled ? `<button data-action="copy-last-scaled" style="color:var(--steel); font-size:12px; text-align:right;">↺ בפעם הקודמת: ${lastScaled.notes ? esc(lastScaled.notes) + " — " : ""}${formatWodEntry(lastScaled)}</button>` : `<span style="color:var(--steel); font-size:12px;">פעם ראשונה שמתאימים את זה</span>`}
    </div>` : ""}

    ${inputsHtml}

    <button data-action="save-wod" class="save-btn" style="max-width:none; margin:20px 0 24px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      רישום אימון — ${esc(w.name)}
    </button>

    ${todaysWods.length === 0 ? `
    <div class="empty">עדיין לא נרשמו אימונים היום.</div>` : `
    <button class="exercise-row" data-action="view-today-calendar" style="margin-bottom:0;">
      <div class="flex items-center gap-8">
        ${todaysWods[0].isPR ? ICONS.flame : ""}
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:13px;">אחרון: ${esc(wodById(todaysWods[0].wodId) ? wodById(todaysWods[0].wodId).name : "?")} — ${formatWodEntry(todaysWods[0])} (${todaysWods[0].rx ? "Rx" : "Scaled"})</div>
          <div style="color:var(--steel); font-size:11px;">${todaysWods.length} אימון${todaysWods.length === 1 ? "" : "ים"} נרשמו היום</div>
        </div>
      </div>
      <span class="flex items-center gap-6" style="color:var(--steel); font-size:12px; font-weight:600;">צפייה ביום${ICONS.chevronsLeft}</span>
    </button>`}
  `;
}

function renderWodDetailCard(w) {
  const list = wodEntriesFor(w.id);
  if (list.length === 0) return "";
  const sorted = list.slice().sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
  let bestSoFar = w.scoreType === "time" ? Infinity : -Infinity;
  const chartData = sorted.map((e) => {
    const val = scoreValue(e);
    const isPR = w.scoreType === "time" ? val <= bestSoFar : val >= bestSoFar;
    bestSoFar = w.scoreType === "time" ? Math.min(bestSoFar, val) : Math.max(bestSoFar, val);
    return { dateLabel: fmtDate(e.date), est1RM: val, isPR };
  });
  const recent = list.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 8);
  return `
    <div class="chart-card" style="margin-top:-4px; border-top-left-radius:0; border-top-right-radius:0; border-top:none;">
      <div class="flex items-center justify-between" style="margin-bottom:12px;">
        <span style="font-weight:800; font-size:15px;">${esc(w.name)}</span>
        <span class="mono" style="color:var(--brass); font-weight:700; font-size:13px;">שיא: ${formatWodBest(w.id)}</span>
      </div>
      ${renderChart(chartData)}
      <div class="log-list" style="margin-top:12px;">
        ${recent.map((e) => `
          <div class="log-row" style="${e.notes ? "flex-direction:column; align-items:stretch; gap:4px;" : ""}">
            <div class="flex items-center justify-between" style="width:100%;">
              <div class="flex items-center gap-8">
                ${e.isPR ? ICONS.flame : ""}
                <span style="color:var(--steel); font-size:12px;">${fmtDate(e.date)}</span>
                <span style="color:var(--steel); font-size:11px;">${e.rx ? "Rx" : "Scaled"}</span>
              </div>
              <span class="mono" style="font-size:13px;">${formatWodEntry(e)}</span>
            </div>
            ${e.notes ? `<div style="color:var(--steel); font-size:12px;">${esc(e.notes)}</div>` : ""}
          </div>`).join("")}
      </div>
    </div>`;
}

function renderWodHistoryListArea() {
  const area = document.getElementById("wodHistoryListArea");
  if (!area) return;
  const q = wodHistorySearch.trim().toLowerCase();
  const active = activeWods().filter((w) => w.name.toLowerCase().includes(q));
  if (activeWods().length === 0) {
    area.innerHTML = `<div class="flex col items-center" style="padding:40px 0; gap:8px;">${ICONS.dumbbell}<span style="color:var(--steel); font-size:13px;">רשמו אימון כדי להתחיל לראות התקדמות</span></div>`;
    return;
  }
  if (active.length === 0) {
    area.innerHTML = `<div style="color:var(--steel); text-align:center; padding:20px 0; font-size:13px;">לא נמצא אימון התואם ל-"${esc(wodHistorySearch)}"</div>`;
    return;
  }
  area.innerHTML = active.map((w) => {
    const row = `
      <button class="exercise-row ${wodHistoryId === w.id ? "active" : ""}" data-action="select-wod-history" data-id="${w.id}" style="${wodHistoryId === w.id ? "margin-bottom:0; border-bottom-left-radius:0; border-bottom-right-radius:0;" : ""}">
        <div class="flex items-center gap-8">
          ${ICONS.chevron}
          <div class="dot" style="background:${CATEGORY_COLORS[w.category]}"></div>
          <span style="font-weight:700; font-size:14px;">${esc(w.name)}</span>
        </div>
        <span class="mono" style="color:var(--brass); font-weight:700; font-size:14px;">${formatWodBest(w.id)}</span>
      </button>`;
    const detail = wodHistoryId === w.id ? renderWodDetailCard(w) + `<div style="height:8px;"></div>` : "";
    return row + detail;
  }).join("");
}

function renderAllTimeWodPRs() {
  const rows = activeWods()
    .map((w) => ({ id: w.id, name: w.name, category: w.category, value: formatWodBest(w.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!rows.length) return "";
  return `
    <div class="section-label">שיאים כלל-זמנים</div>
    <div class="log-list" style="margin-bottom:16px;">
      ${rows.map((r) => `
        <button class="log-row" data-action="select-wod-history" data-id="${r.id}" style="width:100%; text-align:right;">
          <div class="flex items-center gap-8">
            <div class="dot" style="background:${CATEGORY_COLORS[r.category]}"></div>
            <span style="font-weight:700; font-size:13px;">${esc(r.name)}</span>
          </div>
          <span class="mono" style="color:var(--brass); font-weight:700; font-size:13px;">${r.value}</span>
        </button>`).join("")}
    </div>`;
}

function renderWodHistorySection() {
  return `
    ${renderAllTimeWodPRs()}
    ${activeWods().length > 0 ? `
    <div class="search-box" style="margin:0 0 12px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8891A6" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input id="wodHistorySearch" dir="auto" placeholder="חיפוש באימונים שלך" value="${esc(wodHistorySearch)}" />
    </div>` : ""}
    <div id="wodHistoryListArea"></div>
  `;
}

function renderWodTab() {
  return `
    <div class="subtabbar">
      <button class="subtabbtn ${wodSubTab === "log" ? "active" : ""}" data-action="switch-wod-subtab" data-subtab="log">רישום</button>
      <button class="subtabbtn ${wodSubTab === "history" ? "active" : ""}" data-action="switch-wod-subtab" data-subtab="history">היסטוריה</button>
    </div>
    <div id="wodContent"></div>
  `;
}

function renderWodContent() {
  const el = document.getElementById("wodContent");
  if (!el) return;
  el.innerHTML = wodSubTab === "log" ? renderWodLogSection() : renderWodHistorySection();
  if (wodSubTab === "log") {
    const notesInput = document.getElementById("wodNotesInput");
    if (notesInput) notesInput.addEventListener("input", (e) => { wodNotes = e.target.value; });
  }
  if (wodSubTab === "history") {
    renderWodHistoryListArea();
    const search = document.getElementById("wodHistorySearch");
    if (search) search.addEventListener("input", (e) => { wodHistorySearch = e.target.value; renderWodHistoryListArea(); });
  }
}

// ---------- Picker ----------
let pickerOpen = false;
function syncPickerViewport() {
  const overlay = document.getElementById("pickerOverlay");
  if (!overlay) return;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  overlay.style.height = vh + "px";
}
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => { if (pickerOpen) syncPickerViewport(); });
}
function openPicker() {
  pickerOpen = true;
  document.body.style.overflow = "hidden";
  syncPickerViewport();
  document.getElementById("pickerOverlay").classList.add("open");
  const search = document.getElementById("pickerSearch");
  search.value = "";
  renderPickerList("");
  setTimeout(() => search.focus(), 50);
}
function closePicker() {
  pickerOpen = false;
  document.body.style.overflow = "";
  document.getElementById("pickerOverlay").classList.remove("open");
}
function renderPickerList(query) {
  const q = query.toLowerCase();
  const filtered = allMovements().filter((m) => m.name.toLowerCase().includes(q));
  const exactMatch = allMovements().some((m) => m.name.toLowerCase() === q);
  const byCategory = {};
  filtered.forEach((m) => { (byCategory[m.category] = byCategory[m.category] || []).push(m); });
  const list = document.getElementById("pickerList");
  const addRow = query.trim() && !exactMatch
    ? `<button class="movement-btn" data-action="add-movement" data-name="${esc(query.trim())}" style="border-color:var(--brass); margin-top:4px;">
         <span style="font-weight:700; font-size:14px; color:var(--brass);">+ הוספת "${esc(query.trim())}" כתרגיל חדש</span>
       </button>`
    : "";
  if (Object.keys(byCategory).length === 0) {
    list.innerHTML = addRow + `<div style="color:var(--steel); text-align:center; padding:16px 0; font-size:13px;">לא נמצא תרגיל</div>`;
    return;
  }
  list.innerHTML = addRow + Object.entries(byCategory).map(([cat, items]) => `
    <div class="cat-group">
      <div class="cat-head"><div class="dot" style="background:${CATEGORY_COLORS[cat]}"></div><span class="cat-name">${CATEGORY_LABELS[cat] || cat}</span></div>
      ${items.map((m) => `
        <button class="movement-btn ${selectedId === m.id ? "active" : ""}" data-action="pick-movement" data-id="${m.id}">
          <span style="font-weight:600; font-size:14px;">${esc(m.name)}</span>
          ${selectedId === m.id ? `<div class="dot" style="background:var(--brass);"></div>` : ""}
        </button>`).join("")}
    </div>`).join("");
}

let wodPickerOpen = false;
function syncWodPickerViewport() {
  const overlay = document.getElementById("wodPickerOverlay");
  if (!overlay) return;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  overlay.style.height = vh + "px";
}
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => { if (wodPickerOpen) syncWodPickerViewport(); });
  window.visualViewport.addEventListener("resize", () => {
    if (wodBuilderOpen) {
      const overlay = document.getElementById("wodBuilderOverlay");
      if (overlay) overlay.style.height = window.visualViewport.height + "px";
    }
  });
}
function openWodPicker() {
  wodPickerOpen = true;
  document.body.style.overflow = "hidden";
  syncWodPickerViewport();
  document.getElementById("wodPickerOverlay").classList.add("open");
  const search = document.getElementById("wodPickerSearch");
  search.value = "";
  renderWodPickerList("");
  setTimeout(() => search.focus(), 50);
}
function closeWodPicker() {
  wodPickerOpen = false;
  document.body.style.overflow = "";
  document.getElementById("wodPickerOverlay").classList.remove("open");
}
function renderWodPickerList(query) {
  const q = query.toLowerCase();
  const filtered = allWods().filter((w) => w.name.toLowerCase().includes(q));
  const exactMatch = allWods().some((w) => w.name.toLowerCase() === q);
  const byCategory = {};
  filtered.forEach((w) => { (byCategory[w.category] = byCategory[w.category] || []).push(w); });
  const list = document.getElementById("wodPickerList");
  const addRow = query.trim() && !exactMatch
    ? `<button class="movement-btn" data-action="open-wod-builder" data-name="${esc(query.trim())}" style="border-color:var(--energy); margin-top:4px;">
         <span style="font-weight:700; font-size:14px; color:var(--energy);">+ בניית "${esc(query.trim())}" כאימון חדש</span>
       </button>`
    : `<button class="movement-btn" data-action="open-wod-builder" data-name="" style="border-color:var(--energy); margin-top:4px;">
         <span style="font-weight:700; font-size:14px; color:var(--energy);">+ בניית אימון מותאם אישית</span>
       </button>`;
  if (Object.keys(byCategory).length === 0) {
    list.innerHTML = addRow + `<div style="color:var(--steel); text-align:center; padding:16px 0; font-size:13px;">לא נמצא אימון</div>`;
    return;
  }
  const order = ["Girls", "Heroes", "Custom"];
  const cats = Object.keys(byCategory).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  list.innerHTML = addRow + `<div style="height:12px;"></div>` + cats.map((cat) => `
    <div class="cat-group">
      <div class="cat-head"><div class="dot" style="background:${CATEGORY_COLORS[cat]}"></div><span class="cat-name">${CATEGORY_LABELS[cat] || cat}</span></div>
      ${byCategory[cat].map((w) => `
        <button class="movement-btn ${selectedWodId === w.id ? "active" : ""}" data-action="pick-wod" data-id="${w.id}">
          <div>
            <span style="font-weight:600; font-size:14px;">${esc(w.name)}</span>
            ${w.desc ? `<div class="wod-desc">${esc(w.desc)}</div>` : ""}
          </div>
          ${selectedWodId === w.id ? `<div class="dot" style="background:var(--brass);"></div>` : ""}
        </button>`).join("")}
    </div>`).join("");
}

// ---------- Event delegation ----------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  if (action === "reload-app") { location.reload(); }
  else if (action === "switch-tab") { tab = el.dataset.tab; render(); }
  else if (action === "view-today-calendar") {
    tab = "calendar";
    const t = new Date();
    calYear = t.getFullYear();
    calMonth = t.getMonth();
    calSelectedDate = todayISO();
    render();
  }
  else if (action === "open-picker") { openPicker(); }
  else if (action === "close-picker") {
    if (el.id === "pickerOverlay" && e.target !== el) return;
    closePicker();
  }
  else if (action === "pick-movement") { selectedId = el.dataset.id; closePicker(); render(); }
  else if (action === "add-movement") { addMovement(el.dataset.name); }
  else if (action === "step") {
    const field = el.dataset.field, dir = +el.dataset.dir, step = +el.dataset.step, min = +el.dataset.min;
    if (field === "weight") weight = Math.max(min, +(weight + dir * step).toFixed(2));
    if (field === "reps") reps = Math.max(min, reps + dir * step);
    if (field === "sets") sets = Math.max(min, sets + dir * step);
    updateLogQuickUI(field);
  }
  else if (action === "save-set") { saveSet(); }
  else if (action === "delete-entry") { deleteEntry(el.dataset.id); }
  else if (action === "cal-prev") { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendarGrid(); }
  else if (action === "cal-next") { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendarGrid(); }
  else if (action === "cal-select-day") { calSelectedDate = el.dataset.date; renderCalendarGrid(); }
  else if (action === "select-history") { historyId = el.dataset.id; renderHistoryListArea(); }
  else if (action === "export-data") { exportData(); }
  else if (action === "import-data") { triggerImport(); }
  else if (action === "ask-clear") { confirmClear = true; render(); }
  else if (action === "do-clear") { clearAllData(); }
  else if (action === "cancel-clear") { confirmClear = false; render(); }
  else if (action === "switch-wod-subtab") { wodSubTab = el.dataset.subtab; renderWodContent(); }
  else if (action === "open-wod-picker") { openWodPicker(); }
  else if (action === "close-wod-picker") {
    if (el.id === "wodPickerOverlay" && e.target !== el) return;
    closeWodPicker();
  }
  else if (action === "pick-wod") {
    selectedWodId = el.dataset.id;
    wodNotes = "";
    closeWodPicker();
    renderWodContent();
  }
  else if (action === "add-wod") { addCustomWod(el.dataset.name, el.dataset.scoretype || "time"); }
  else if (action === "open-wod-builder") { openWodBuilder(el.dataset.name || ""); }
  else if (action === "close-wod-builder") {
    if (el.id === "wodBuilderOverlay" && e.target !== el) return;
    closeWodBuilder();
  }
  else if (action === "builder-set-format") { builderFormat = el.dataset.format; renderWodBuilderFormats(); }
  else if (action === "toggle-builder-movement") {
    const name = el.dataset.name;
    if (Object.prototype.hasOwnProperty.call(builderMovements, name)) delete builderMovements[name];
    else builderMovements[name] = { reps: 10, weight: 0 };
    renderWodBuilderMovements();
  }
  else if (action === "builder-movement-reps") {
    const name = el.dataset.field, dir = +el.dataset.dir, step = +el.dataset.step, min = +el.dataset.min;
    if (!builderMovements[name]) return;
    builderMovements[name].reps = Math.max(min, builderMovements[name].reps + dir * step);
    renderWodBuilderMovements();
  }
  else if (action === "builder-movement-weight") {
    const name = el.dataset.field, dir = +el.dataset.dir, step = +el.dataset.step, min = +el.dataset.min;
    if (!builderMovements[name]) return;
    builderMovements[name].weight = Math.max(min, +(builderMovements[name].weight + dir * step).toFixed(2));
    renderWodBuilderMovements();
  }
  else if (action === "create-wod") { createWodFromBuilder(); }
  else if (action === "wod-step") {
    const field = el.dataset.field, dir = +el.dataset.dir, step = +el.dataset.step, min = +el.dataset.min;
    if (field === "wodMinutes") wodMinutes = Math.max(min, wodMinutes + dir * step);
    if (field === "wodSeconds") wodSeconds = Math.max(min, wodSeconds + dir * step);
    if (field === "wodRounds") wodRounds = Math.max(min, wodRounds + dir * step);
    if (field === "wodReps") wodReps = Math.max(min, wodReps + dir * step);
    if (field === "wodWeight") wodWeight = Math.max(min, +(wodWeight + dir * step).toFixed(2));
    if (field === "wodScaledWeight") wodScaledWeight = Math.max(min, +(wodScaledWeight + dir * step).toFixed(2));
    const valMap = { wodMinutes, wodSeconds, wodRounds, wodReps, wodWeight, wodScaledWeight };
    document.querySelectorAll(`.stepper-btn[data-field="${field}"]`).forEach((btn) => {
      const valSpan = btn.parentElement.querySelector(".stepper-val");
      if (valSpan) valSpan.textContent = valMap[field];
    });
  }
  else if (action === "bw-step") {
    const field = el.dataset.field, dir = +el.dataset.dir, step = +el.dataset.step, min = +el.dataset.min;
    if (field === "bwWeight") bwWeight = Math.max(min, +(bwWeight + dir * step).toFixed(2));
    document.querySelectorAll(`.stepper-btn[data-field="${field}"]`).forEach((btn) => {
      const valSpan = btn.parentElement.querySelector(".stepper-val");
      if (valSpan) valSpan.textContent = bwWeight;
    });
  }
  else if (action === "save-bw") { saveBodyweight(); }
  else if (action === "set-rx") {
    wodRx = el.dataset.rx === "1";
    renderWodContent();
  }
  else if (action === "copy-last-scaled") {
    const last = lastScaledAttempt(selectedWodId);
    wodNotes = last && last.notes ? last.notes : "";
    if (last && last.scaledWeight) wodScaledWeight = last.scaledWeight;
    renderWodContent();
  }
  else if (action === "save-wod") { saveWod(); }
  else if (action === "delete-wod-entry") { deleteWodEntry(el.dataset.id); }
  else if (action === "select-wod-history") { wodHistoryId = el.dataset.id; renderWodHistoryListArea(); }
});
document.getElementById("pickerSearch").addEventListener("input", (e) => renderPickerList(e.target.value));
document.getElementById("pickerSearch").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const q = e.target.value.trim();
  if (!q) return;
  const exact = allMovements().find((m) => m.name.toLowerCase() === q.toLowerCase());
  if (exact) { selectedId = exact.id; closePicker(); render(); }
  else addMovement(q);
});
document.getElementById("wodPickerSearch").addEventListener("input", (e) => renderWodPickerList(e.target.value));
document.getElementById("wodBuilderMoveSearch").addEventListener("input", (e) => renderWodBuilderMovements(e.target.value));
document.getElementById("wodPickerSearch").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const q = e.target.value.trim();
  if (!q) return;
  const exact = allWods().find((w) => w.name.toLowerCase() === q.toLowerCase());
  if (exact) { selectedWodId = exact.id; closeWodPicker(); renderWodContent(); }
  else openWodBuilder(q);
});

// ---------- Init ----------
async function init() {
  document.getElementById("dateLabel").textContent = new Date().toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "short" });
  try {
    entries = await dbLoadAll();
    entries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    customMovements = await dbLoadMovements();
    wodEntries = await dbLoadWodEntries();
    wodEntries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    customWods = await dbLoadCustomWods();
    bodyweightEntries = await dbLoadBodyweight();
    bodyweightEntries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (bodyweightEntries[0]) bwWeight = bodyweightEntries[0].weight;
  } catch (e) {
    storageOK = false;
  }
  document.getElementById("loading").style.display = "none";
  document.getElementById("app").style.display = "block";
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner();
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) showUpdateBanner();
        });
      });
    }).catch(() => {});
  }
}
init();
