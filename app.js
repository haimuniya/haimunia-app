// ---------- Suppress accidental double-tap zoom ----------
// Deliberate pinch-zoom is left working: blocking it (the previous
// touchmove/gesturestart handlers plus user-scalable=no) is a WCAG 1.4.4
// failure and makes the app unusable for low-vision users. Only the
// double-tap-to-zoom gesture is suppressed, since it fires by accident when
// tapping the +/- steppers quickly.
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
  { id: "box-squat", name: "Box Squat", category: "Squat" },
  { id: "pause-squat", name: "Pause Squat", category: "Squat" },
  { id: "zercher-squat", name: "Zercher Squat", category: "Squat" },
  { id: "bulgarian-split-squat", name: "Bulgarian Split Squat", category: "Squat" },
  { id: "deadlift", name: "Deadlift", category: "Deadlift" },
  { id: "sumo-deadlift", name: "Sumo Deadlift", category: "Deadlift" },
  { id: "deficit-deadlift", name: "Deficit Deadlift", category: "Deadlift" },
  { id: "romanian-deadlift", name: "Romanian Deadlift", category: "Deadlift" },
  { id: "trap-bar-deadlift", name: "Trap Bar Deadlift", category: "Deadlift" },
  { id: "stiff-leg-deadlift", name: "Stiff-Leg Deadlift", category: "Deadlift" },
  { id: "snatch-grip-deadlift", name: "Snatch-Grip Deadlift", category: "Deadlift" },
  { id: "strict-press", name: "Strict Press", category: "Press" },
  { id: "push-press", name: "Push Press", category: "Press" },
  { id: "bench-press", name: "Bench Press", category: "Press" },
  { id: "push-jerk", name: "Push Jerk", category: "Press" },
  { id: "split-jerk", name: "Split Jerk", category: "Press" },
  { id: "seated-press", name: "Seated Press", category: "Press" },
  { id: "z-press", name: "Z-Press", category: "Press" },
  { id: "single-arm-db-press", name: "Single-Arm DB Press", category: "Press" },
  { id: "incline-bench-press", name: "Incline Bench Press", category: "Press" },
  { id: "close-grip-bench-press", name: "Close-Grip Bench Press", category: "Press" },
  { id: "landmine-press", name: "Landmine Press", category: "Press" },
  { id: "clean", name: "Clean (Squat Clean)", category: "Olympic" },
  { id: "power-clean", name: "Power Clean", category: "Olympic" },
  { id: "hang-clean", name: "Hang Clean", category: "Olympic" },
  { id: "clean-and-jerk", name: "Clean and Jerk", category: "Olympic" },
  { id: "snatch", name: "Snatch", category: "Olympic" },
  { id: "power-snatch", name: "Power Snatch", category: "Olympic" },
  { id: "hang-snatch", name: "Hang Snatch", category: "Olympic" },
  { id: "muscle-snatch", name: "Muscle Snatch", category: "Olympic" },
  { id: "muscle-clean", name: "Muscle Clean", category: "Olympic" },
  { id: "snatch-pull", name: "Snatch Pull", category: "Olympic" },
  { id: "clean-pull", name: "Clean Pull", category: "Olympic" },
  { id: "snatch-balance", name: "Snatch Balance", category: "Olympic" },
  { id: "pause-snatch", name: "Pause Snatch", category: "Olympic" },
  { id: "pause-clean", name: "Pause Clean", category: "Olympic" },
  { id: "weighted-pullup", name: "Weighted Pull-Up", category: "Pull" },
  { id: "weighted-chinup", name: "Weighted Chin-Up", category: "Pull" },
  { id: "bent-over-row", name: "Bent-Over Row", category: "Pull" },
  { id: "barbell-row", name: "Barbell Row", category: "Pull" },
  { id: "pendlay-row", name: "Pendlay Row", category: "Pull" },
  { id: "single-arm-db-row", name: "Single-Arm DB Row", category: "Pull" },
  { id: "t-bar-row", name: "T-Bar Row", category: "Pull" },
  { id: "face-pull", name: "Face Pull", category: "Pull" },
  { id: "lat-pulldown", name: "Lat Pulldown", category: "Pull" },
  { id: "thruster", name: "Thruster", category: "Other" },
  { id: "front-rack-lunge", name: "Front Rack Lunge", category: "Other" },
  { id: "weighted-dip", name: "Weighted Dip", category: "Other" },
  { id: "turkish-getup", name: "Turkish Get-Up", category: "Other" },
  { id: "good-mornings", name: "Good Mornings", category: "Other" },
  { id: "hip-thrust", name: "Hip Thrust", category: "Other" },
  { id: "barbell-lunge", name: "Barbell Lunge", category: "Other" },
  { id: "weighted-step-up", name: "Weighted Step-Up", category: "Other" },
  { id: "nordic-curl", name: "Nordic Curl", category: "Other" },
  { id: "ghd-hip-extension", name: "GHD Hip Extension", category: "Other" },
  { id: "weighted-plank", name: "Weighted Plank", category: "Other" },
  { id: "ab-wheel-rollout", name: "Ab Wheel Rollout", category: "Other" },
  { id: "leg-press", name: "Leg Press", category: "Other" },
  { id: "leg-curl", name: "Leg Curl", category: "Other" },
  { id: "leg-extension", name: "Leg Extension", category: "Other" },
  { id: "calf-raise", name: "Calf Raise", category: "Other" },
];

const STANDARD_REPS = [1, 2, 3, 5, 10];
const BAR_OPTIONS = [20, 15, 8];
let barWeight = 20;
const APP_VERSION = "2.11.0";

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
  { name: "Pike Push-Ups", category: "Gymnastics" },
  { name: "Deficit Push-Ups", category: "Gymnastics" },
  { name: "Ring Rows", category: "Gymnastics" },
  { name: "Australian Pull-Ups", category: "Gymnastics" },
  { name: "Banded Pull-Ups", category: "Gymnastics" },
  { name: "Kipping Pull-Ups", category: "Gymnastics" },
  { name: "Ring Support Hold", category: "Gymnastics" },
  { name: "Ring Push-Ups", category: "Gymnastics" },
  { name: "Broad Jump", category: "Gymnastics" },
  { name: "Tuck-Ups", category: "Gymnastics" },
  { name: "V-Ups", category: "Gymnastics" },
  { name: "Hollow Rocks", category: "Gymnastics" },
  { name: "Superman Hold", category: "Gymnastics" },
  { name: "Plank Hold", category: "Gymnastics" },
  { name: "Side Plank", category: "Gymnastics" },
  { name: "Bear Crawl", category: "Gymnastics" },
  { name: "Crab Walk", category: "Gymnastics" },
  { name: "Inchworm", category: "Gymnastics" },
  { name: "Mountain Climbers", category: "Gymnastics" },
  { name: "Jumping Lunges", category: "Gymnastics" },
  { name: "Jump Squats", category: "Gymnastics" },
  { name: "Star Jumps", category: "Gymnastics" },
  { name: "Skater Jumps", category: "Gymnastics" },
  { name: "Wall Sit", category: "Gymnastics" },
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
  { name: "Muscle Snatch", category: "Weightlifting" },
  { name: "Muscle Clean", category: "Weightlifting" },
  { name: "Snatch Balance", category: "Weightlifting" },
  { name: "Snatch Pull", category: "Weightlifting" },
  { name: "Clean Pull", category: "Weightlifting" },
  { name: "Tall Clean", category: "Weightlifting" },
  { name: "Tall Snatch", category: "Weightlifting" },
  { name: "Front Rack Lunge", category: "Weightlifting" },
  { name: "Overhead Lunge", category: "Weightlifting" },
  { name: "Zercher Squat", category: "Weightlifting" },
  { name: "Bulgarian Split Squat", category: "Weightlifting" },
  { name: "Box Squat", category: "Weightlifting" },
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
  { name: "DB Hang Clean", category: "Dumbbell" },
  { name: "DB Hang Snatch", category: "Dumbbell" },
  { name: "DB Renegade Row", category: "Dumbbell" },
  { name: "DB Bench Press", category: "Dumbbell" },
  { name: "DB Single-Arm Overhead Squat", category: "Dumbbell" },
  { name: "DB Walking Lunge", category: "Dumbbell" },
  { name: "DB Floor Press", category: "Dumbbell" },
  // Kettlebell
  { name: "KB Swings (Russian)", category: "Kettlebell" },
  { name: "KB Swings (American)", category: "Kettlebell" },
  { name: "KB Snatch", category: "Kettlebell" },
  { name: "KB Clean", category: "Kettlebell" },
  { name: "KB Goblet Squat", category: "Kettlebell" },
  { name: "KB Overhead Squat", category: "Kettlebell" },
  { name: "Turkish Get-Up", category: "Kettlebell" },
  { name: "KB Single-Arm Swing", category: "Kettlebell" },
  { name: "KB Windmill", category: "Kettlebell" },
  { name: "KB Lunge", category: "Kettlebell" },
  { name: "KB Press", category: "Kettlebell" },
  { name: "KB Thruster", category: "Kettlebell" },
  // Odd object / carries
  { name: "Wall Balls", category: "Odd Object" },
  { name: "Farmers Carry", category: "Odd Object" },
  { name: "Sandbag Cleans", category: "Odd Object" },
  { name: "Sandbag Carry", category: "Odd Object" },
  { name: "Sled Push", category: "Odd Object" },
  { name: "Sled Pull", category: "Odd Object" },
  { name: "Yoke Carry", category: "Odd Object" },
  { name: "Atlas Stone to Shoulder", category: "Odd Object" },
  { name: "Tire Flip", category: "Odd Object" },
  { name: "Sledgehammer Swings", category: "Odd Object" },
  { name: "Sandbag Over Shoulder", category: "Odd Object" },
  { name: "Keg Carry", category: "Odd Object" },
  { name: "D-Ball Cleans", category: "Odd Object" },
  { name: "Zercher Carry", category: "Odd Object" },
  // Monostructural
  { name: "Run (Meters)", category: "Monostructural" },
  { name: "Row (Meters)", category: "Monostructural" },
  { name: "Row (Calories)", category: "Monostructural" },
  { name: "Bike (Calories)", category: "Monostructural" },
  { name: "Assault Bike (Calories)", category: "Monostructural" },
  { name: "Ski Erg (Calories)", category: "Monostructural" },
  { name: "Swim (Meters)", category: "Monostructural" },
  { name: "Echo Bike (Calories)", category: "Monostructural" },
  { name: "Shuttle Runs (Meters)", category: "Monostructural" },
  { name: "Sprint (Meters)", category: "Monostructural" },
];
const WOD_MOVE_CATEGORIES_WITH_WEIGHT = new Set(["Weightlifting", "Dumbbell", "Kettlebell", "Odd Object"]);
const WOD_MOVE_CATEGORIES = ["Gymnastics", "Weightlifting", "Dumbbell", "Kettlebell", "Odd Object", "Monostructural"];

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
  let perSide = Math.max(0, (total - barWeight) / 2);
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

// ---------- Safety helpers ----------
// Escape a value for use inside a CSS attribute selector.
function cssSel(v) {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(String(v ?? ""));
  return String(v ?? "").replace(/["\\\]]/g, "\\$&");
}
// Prototype-safe lookup tables. A record whose category is "__proto__" (only
// reachable through an imported backup) must never resolve to Object.prototype.
function catColor(cat) {
  return Object.prototype.hasOwnProperty.call(CATEGORY_COLORS, cat) ? CATEGORY_COLORS[cat] : "var(--steel)";
}
function catLabel(cat) {
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, cat) ? CATEGORY_LABELS[cat] : String(cat ?? "");
}
// Accumulator objects keyed by untrusted strings must have no prototype.
function bag() { return Object.create(null); }

const WOD_SCORE_TYPES = ["time", "amrap", "load"];
const LIMITS = {
  nameLen: 80, notesLen: 300, idLen: 128, importItems: 20000,
  weight: 1000, reps: 1000, sets: 100, minutes: 999, seconds: 59,
  rounds: 9999, bodyweight: 500,
};
const FIELD_MAX = {
  weight: LIMITS.weight, reps: LIMITS.reps, sets: LIMITS.sets,
  wodMinutes: LIMITS.minutes, wodSeconds: LIMITS.seconds, wodRounds: LIMITS.rounds,
  wodReps: LIMITS.reps, wodWeight: LIMITS.weight, wodScaledWeight: LIMITS.weight,
  bwWeight: LIMITS.bodyweight,
};
function fieldMax(action, field) {
  if (action === "bw-step") return LIMITS.bodyweight;
  if (action === "builder-movement-reps") return LIMITS.reps;
  if (action === "builder-movement-weight") return LIMITS.weight;
  return Object.prototype.hasOwnProperty.call(FIELD_MAX, field) ? FIELD_MAX[field] : LIMITS.weight;
}
function cleanStr(v, max) {
  if (typeof v !== "string") return "";
  // strip control chars, collapse runaway whitespace, hard-cap length
  return v.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}
function cleanNum(v, min, max, fallback) {
  const n = typeof v === "number" ? v : parseFloat(v);
  if (!isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
}
function cleanId(v) {
  const raw = typeof v === "string" ? v : "";
  // opaque identifier: conservative charset, never reaches HTML as markup
  const id = raw.replace(/[^A-Za-z0-9._:-]/g, "").slice(0, LIMITS.idLen);
  return id || null;
}
function cleanISODate(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(v + "T00:00:00");
  return isNaN(d.getTime()) ? null : v;
}
function cleanTs(v) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0 || n > 4102444800000) return Date.now(); // cap at year 2100
  return Math.floor(n);
}
function uid(prefix) {
  let r;
  try { r = (self.crypto && self.crypto.randomUUID) ? self.crypto.randomUUID() : null; } catch (e) { r = null; }
  if (!r) {
    try {
      const a = new Uint8Array(16); self.crypto.getRandomValues(a);
      r = Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) { r = Date.now().toString(36) + Math.random().toString(36).slice(2); }
  }
  return prefix + "-" + r;
}
// ---------- Record sanitizers ----------
// Applied to every record that comes off disk or out of an imported file.
// Nothing else in the app is allowed to trust these shapes.
function sanitizeMovement(m) {
  if (!m || typeof m !== "object") return null;
  const id = cleanId(m.id), name = cleanStr(m.name, LIMITS.nameLen);
  if (!id || !name) return null;
  return { id, name, category: MOVEMENT_CATEGORIES.includes(m.category) ? m.category : "Other" };
}
function sanitizeCustomWod(w) {
  if (!w || typeof w !== "object") return null;
  const id = cleanId(w.id), name = cleanStr(w.name, LIMITS.nameLen);
  if (!id || !name) return null;
  return {
    id, name, category: "Custom",
    scoreType: WOD_SCORE_TYPES.includes(w.scoreType) ? w.scoreType : "time",
    desc: cleanStr(w.desc, LIMITS.notesLen),
  };
}
function sanitizeEntry(e) {
  if (!e || typeof e !== "object") return null;
  const id = cleanId(e.id), exerciseId = cleanId(e.exerciseId), date = cleanISODate(e.date);
  if (!id || !exerciseId || !date) return null;
  const weight = cleanNum(e.weight, 0, LIMITS.weight, null);
  const reps = cleanNum(e.reps, 0, LIMITS.reps, null);
  const sets = cleanNum(e.sets, 0, LIMITS.sets, null);
  if (weight === null || reps === null || sets === null) return null;
  return {
    id, exerciseId, date, weight, reps, sets: Math.round(sets),
    ts: cleanTs(e.ts), isPR: e.isPR === true,
    est1RM: cleanNum(e.est1RM, 0, LIMITS.weight * 2, estimate1RM(weight, reps)),
  };
}
function sanitizeWodEntry(e) {
  if (!e || typeof e !== "object") return null;
  const id = cleanId(e.id), wodId = cleanId(e.wodId), date = cleanISODate(e.date);
  if (!id || !wodId || !date) return null;
  const scoreType = WOD_SCORE_TYPES.includes(e.scoreType) ? e.scoreType : "time";
  const out = { id, wodId, date, scoreType, ts: cleanTs(e.ts), rx: e.rx !== false, isPR: e.isPR === true };
  if (scoreType === "time") out.timeSeconds = cleanNum(e.timeSeconds, 0, LIMITS.minutes * 60 + 59, 0);
  else if (scoreType === "amrap") {
    out.rounds = Math.round(cleanNum(e.rounds, 0, LIMITS.rounds, 0));
    out.reps = Math.round(cleanNum(e.reps, 0, LIMITS.reps, 0));
  } else out.weight = cleanNum(e.weight, 0, LIMITS.weight, 0);
  if (!out.rx) {
    const sw = cleanNum(e.scaledWeight, 0, LIMITS.weight, 0);
    if (sw) out.scaledWeight = sw;
    const notes = cleanStr(e.notes, LIMITS.notesLen);
    out.notes = notes || null;
  }
  return out;
}
function sanitizeBodyweight(e) {
  if (!e || typeof e !== "object") return null;
  const id = cleanId(e.id), date = cleanISODate(e.date);
  const weight = cleanNum(e.weight, 0, LIMITS.bodyweight, null);
  if (!id || !date || weight === null) return null;
  return { id, date, weight, ts: cleanTs(e.ts) };
}
function sanitizeList(list, fn) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, LIMITS.importItems).map(fn).filter(Boolean);
}

let customMovements = [];
function allMovements() { return MOVEMENTS.concat(customMovements); }
function movementById(id) { return allMovements().find((m) => m.id === id); }

// ---------- IndexedDB ----------
const DB_NAME = "box-log-db", STORE = "entries", MOVSTORE = "movements", WODSTORE = "wodEntries", CUSTOMWODSTORE = "customWods", BWSTORE = "bodyweight", SETTINGSTORE = "settings";
let _dbPromise = null;
function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 6);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(MOVSTORE)) db.createObjectStore(MOVSTORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(WODSTORE)) db.createObjectStore(WODSTORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(CUSTOMWODSTORE)) db.createObjectStore(CUSTOMWODSTORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(BWSTORE)) db.createObjectStore(BWSTORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(SETTINGSTORE)) db.createObjectStore(SETTINGSTORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { _dbPromise = null; reject(req.error); };
  });
  return _dbPromise;
}
// Settings live in IndexedDB alongside everything else. userName is the only
// PII in the app and previously sat in localStorage, which "clear all data"
// never touched.
async function dbGetSetting(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(SETTINGSTORE, "readonly").objectStore(SETTINGSTORE).get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}
async function dbSetSetting(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGSTORE, "readwrite");
    tx.objectStore(SETTINGSTORE).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbClearSettings() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGSTORE, "readwrite");
    tx.objectStore(SETTINGSTORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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
let logDate = todayISO();
let editingEntryId = null;
// Never allow a future-dated set, even if a user bypasses the date input's
// max attribute (e.g. via devtools) or the device clock is off.
function clampLogDate(v) {
  const clean = cleanISODate(v);
  if (!clean) return todayISO();
  return clean > todayISO() ? todayISO() : clean;
}
let historyId = null;
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
let wodLogDate = todayISO();
let editingWodEntryId = null;
let wodHistoryId = null;
let wodHistorySearch = "";
let wodBuilderOpen = false;
let builderFormat = null;
let builderMovements = bag();
let builderMoveSearch = "";
let confirmClear = false;
let storageOK = true;
let storageErrMsg = "";
// Surface write failures instead of swallowing them — a user whose saves are
// silently failing otherwise believes the log is being kept.
function noteStorageError(e) {
  storageOK = false;
  const quota = e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED");
  storageErrMsg = quota
    ? "אין מקום אחסון פנוי — ייצאו גיבוי ומחקו נתונים ישנים"
    : "השמירה במכשיר נכשלה — הנתונים האחרונים אולי לא נשמרו";
  console.error("storage write failed:", e);
}

// Bodyweight tab state
let bodyweightEntries = [];
let bwWeight = 70;
let bodyweightExpanded = false;

let importMessage = "";
let importMsgTimeout = null;
function setImportMessage(msg) {
  importMessage = msg;
  clearTimeout(importMsgTimeout);
  importMsgTimeout = setTimeout(() => { importMessage = ""; render(); }, 5000);
}

// ---------- Derived helpers ----------
function entriesFor(id, excludeId) { return entries.filter((e) => e.exerciseId === id && e.id !== excludeId); }
function bestEst1RM(id, excludeId) {
  const list = entriesFor(id, excludeId);
  return list.length ? Math.max(...list.map((e) => e.est1RM)) : null;
}
function repRecordFor(id, repCount, excludeId) {
  const list = entriesFor(id, excludeId).filter((e) => e.reps === repCount);
  return list.length ? Math.max(...list.map((e) => e.weight)) : null;
}
function activeExercises() {
  const ids = [...new Set(entries.map((e) => e.exerciseId))];
  return ids.map(movementById).filter(Boolean);
}

const MOVEMENT_CATEGORIES = ["Squat", "Deadlift", "Press", "Olympic", "Pull", "Other"];

async function addMovement(name, category) {
  const trimmed = cleanStr(name, LIMITS.nameLen);
  if (!trimmed) return;
  const existing = allMovements().find((m) => m.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    selectedId = existing.id;
    closePicker();
    render();
    return;
  }
  // Collision-free and charset-safe. The old slug scheme collapsed to a bare
  // "custom--<ts>" for Hebrew names, since the regex stripped every character.
  const id = uid("custom");
  const movement = { id, name: trimmed, category: MOVEMENT_CATEGORIES.includes(category) ? category : "Other" };
  customMovements.push(movement);
  try { await dbAddMovement(movement); } catch (e) { noteStorageError(e); }
  selectedId = id;
  closePicker();
  render();
}
async function saveSet() {
  if (!isFinite(weight) || !isFinite(reps) || !isFinite(sets)) return;
  const date = clampLogDate(logDate);
  const editId = editingEntryId;
  const prevRepRecord = repRecordFor(selectedId, reps, editId) || 0;
  const prevEst1RM = bestEst1RM(selectedId, editId) || 0;
  const est = estimate1RM(weight, reps);
  const isPR = weight > prevRepRecord || est > prevEst1RM;
  const existing = editId ? entries.find((e) => e.id === editId) : null;
  const entry = {
    id: existing ? existing.id : uid("set"),
    ts: existing ? existing.ts : Date.now(),
    exerciseId: selectedId, weight, reps, sets, date, isPR, est1RM: est,
  };
  entries = entries.filter((e) => e.id !== entry.id);
  entries.unshift(entry);
  entries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  try { await dbPut(entry); storageOK = true; } catch (e) { noteStorageError(e); }
  editingEntryId = null;
  logDate = todayISO();
  if (isPR) flashPR();
  render();
}
function startEditEntry(id) {
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  selectedId = entry.exerciseId;
  weight = entry.weight;
  reps = entry.reps;
  sets = entry.sets;
  logDate = entry.date;
  editingEntryId = entry.id;
  tab = "add";
  render();
}
function cancelEditEntry() {
  editingEntryId = null;
  logDate = todayISO();
  render();
}
async function deleteEntry(id) {
  entries = entries.filter((e) => e.id !== id);
  if (editingEntryId === id) { editingEntryId = null; logDate = todayISO(); }
  try { await dbDelete(id); } catch (e) { noteStorageError(e); }
  render();
}

// ---------- Bodyweight ----------
async function saveBodyweight() {
  if (!isFinite(bwWeight)) return;
  const today = todayISO();
  const existing = bodyweightEntries.find((e) => e.date === today);
  const entry = existing
    ? { ...existing, weight: bwWeight, ts: Date.now() }
    : { id: uid("bw"), date: today, ts: Date.now(), weight: bwWeight };
  bodyweightEntries = bodyweightEntries.filter((e) => e.id !== entry.id);
  bodyweightEntries.unshift(entry);
  try { await dbPutBodyweight(entry); storageOK = true; } catch (e) { noteStorageError(e); }
  render();
}
const USER_NAME_KEY = "haimunia:userName";
let userName = null;
async function loadUserName() {
  try {
    const stored = await dbGetSetting(USER_NAME_KEY);
    if (stored !== null && stored !== undefined) { userName = cleanStr(stored, LIMITS.nameLen); return; }
  } catch (e) { /* fall through to migration */ }
  // one-time migration off localStorage
  let legacy = null;
  try { legacy = localStorage.getItem(USER_NAME_KEY); } catch (e) {}
  if (legacy !== null) {
    userName = cleanStr(legacy, LIMITS.nameLen);
    try { await dbSetSetting(USER_NAME_KEY, userName); } catch (e) {}
    try { localStorage.removeItem(USER_NAME_KEY); } catch (e) {}
  }
}

function renderUserGreeting() {
  const el = document.getElementById("userGreeting");
  if (el) el.textContent = userName ? `שלום ${userName}` : "";
}
function openWelcomeModal() {
  document.body.style.overflow = "hidden";
  const overlay = document.getElementById("welcomeOverlay");
  if (overlay) overlay.classList.add("open");
  const input = document.getElementById("welcomeNameInput");
  if (input) setTimeout(() => input.focus(), 50);
}
function closeWelcomeModal() {
  document.body.style.overflow = "";
  const overlay = document.getElementById("welcomeOverlay");
  if (overlay) overlay.classList.remove("open");
}
function saveUserName(name) {
  const trimmed = cleanStr(name, LIMITS.nameLen);
  userName = trimmed;
  dbSetSetting(USER_NAME_KEY, trimmed).catch(noteStorageError);
  closeWelcomeModal();
  renderUserGreeting();
}

const BAR_WEIGHT_KEY = "haimunia:barWeight";
async function loadBarWeight() {
  try {
    const stored = await dbGetSetting(BAR_WEIGHT_KEY);
    if (BAR_OPTIONS.includes(stored)) barWeight = stored;
  } catch (e) { /* keep the default */ }
}
function setBarWeight(kg) {
  if (!BAR_OPTIONS.includes(kg)) return;
  barWeight = kg;
  dbSetSetting(BAR_WEIGHT_KEY, kg).catch(noteStorageError);
  const bv = document.getElementById("barbellVisual");
  if (bv) bv.innerHTML = renderBarbell(weight);
  const barRow = document.getElementById("barWeightRow");
  if (barRow) barRow.outerHTML = renderBarWeightRow();
}

const LAST_EXPORT_KEY = "boxlog:lastExportAt";
let lastExportAt = null;
async function loadLastExport() {
  try {
    const v = await dbGetSetting(LAST_EXPORT_KEY);
    if (v) { lastExportAt = Number(v); return; }
  } catch (e) {}
  try {
    const legacy = localStorage.getItem(LAST_EXPORT_KEY);
    if (legacy) {
      lastExportAt = Number(legacy);
      await dbSetSetting(LAST_EXPORT_KEY, lastExportAt).catch(() => {});
      localStorage.removeItem(LAST_EXPORT_KEY);
    }
  } catch (e) {}
}
function markExported() {
  lastExportAt = Date.now();
  dbSetSetting(LAST_EXPORT_KEY, lastExportAt).catch(() => {});
}
function daysSinceLastExport() {
  if (!lastExportAt || !isFinite(lastExportAt)) return null;
  return Math.floor((Date.now() - lastExportAt) / 86400000);
}
const BACKUP_APP_ID = "box-log";
const BACKUP_VERSION = 1;

function buildBackupPayload() {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
    customMovements,
    wodEntries,
    customWods,
    bodyweightEntries,
  };
}

function downloadBackup(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the download a tick to start before tearing down the blob URL.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function exportData() {
  downloadBackup(buildBackupPayload(), `box-log-backup-${todayISO()}.json`);
  markExported();
  render();
}

const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

function triggerImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.addEventListener("change", () => {
    if (input.files && input.files[0]) importDataFromFile(input.files[0]);
  });
  input.click();
}

// A backup file is untrusted input — it may have been edited, corrupted, or
// received from someone else. Every record is rebuilt field by field from a
// whitelist; nothing from the file object is ever stored or rendered as-is.
async function importDataFromFile(file) {
  const bad = (msg) => { setImportMessage(msg || "הייבוא נכשל — הקובץ אינו קובץ גיבוי תקין"); render(); };

  if (!file || file.size > MAX_BACKUP_BYTES) {
    return bad("הייבוא נכשל — הקובץ גדול מדי (מעל 25MB)");
  }

  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (e) { return bad(); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return bad();
  if (data.app !== BACKUP_APP_ID) return bad("הייבוא נכשל — הקובץ אינו גיבוי של האימוניה");
  if (Number(data.version) > BACKUP_VERSION) {
    return bad("הייבוא נכשל — הגיבוי נוצר בגרסה חדשה יותר של האפליקציה");
  }

  const clean = {
    customMovements: sanitizeList(data.customMovements, sanitizeMovement),
    customWods: sanitizeList(data.customWods, sanitizeCustomWod),
    entries: sanitizeList(data.entries, sanitizeEntry),
    wodEntries: sanitizeList(data.wodEntries, sanitizeWodEntry),
    bodyweightEntries: sanitizeList(data.bodyweightEntries, sanitizeBodyweight),
  };
  const incoming = Object.values(clean).reduce((n, l) => n + l.length, 0);
  const rawCount = ["customMovements", "customWods", "entries", "wodEntries", "bodyweightEntries"]
    .reduce((n, k) => n + (Array.isArray(data[k]) ? data[k].length : 0), 0);
  const rejected = Math.max(0, rawCount - incoming);

  if (incoming === 0) return bad("הייבוא נכשל — לא נמצאו רשומות תקינות בקובץ");

  // The import merges into existing data and cannot be undone from inside the
  // app, so confirm first and drop a rollback backup on the way in.
  const hasExisting = entries.length || wodEntries.length || bodyweightEntries.length || customMovements.length || customWods.length;
  const question = hasExisting
    ? `הייבוא יוסיף ${incoming} רשומות לנתונים הקיימים ולא ניתן לבטל אותו.\nלפני כן יורד גיבוי של המצב הנוכחי.\n\nלהמשיך?`
    : `לייבא ${incoming} רשומות?`;
  if (!window.confirm(question)) { setImportMessage("הייבוא בוטל"); render(); return; }

  if (hasExisting) {
    try { downloadBackup(buildBackupPayload(), `box-log-rollback-${todayISO()}.json`); } catch (e) {}
  }

  let ok = 0, failed = 0;
  const write = async (list, fn) => {
    for (const rec of list) {
      try { await fn(rec); ok++; } catch (e) { failed++; if (failed === 1) noteStorageError(e); }
    }
  };
  await write(clean.customMovements, dbAddMovement);
  await write(clean.customWods, dbAddCustomWod);
  await write(clean.entries, dbPut);
  await write(clean.wodEntries, dbPutWodEntry);
  await write(clean.bodyweightEntries, dbPutBodyweight);

  await reloadFromDb();

  const parts = [`יובאו ${ok} רשומות`];
  if (rejected) parts.push(`${rejected} נפסלו`);
  if (failed) parts.push(`${failed} נכשלו בשמירה`);
  setImportMessage(parts.join(", "));
  render();
}

// Single source of truth for pulling state out of IndexedDB. Everything is
// re-sanitized on the way in, so records written by an older build of the app
// cannot poison the render path either.
async function reloadFromDb() {
  try {
    entries = sanitizeList(await dbLoadAll(), sanitizeEntry).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    customMovements = sanitizeList(await dbLoadMovements(), sanitizeMovement);
    wodEntries = sanitizeList(await dbLoadWodEntries(), sanitizeWodEntry).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    customWods = sanitizeList(await dbLoadCustomWods(), sanitizeCustomWod);
    bodyweightEntries = sanitizeList(await dbLoadBodyweight(), sanitizeBodyweight).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (bodyweightEntries[0]) bwWeight = bodyweightEntries[0].weight;
    storageOK = true;
    storageErrMsg = "";
    return true;
  } catch (e) {
    noteStorageError(e);
    return false;
  }
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
    // "delete everything" must also drop the stored name and export marker.
    await dbClearSettings();
    try { localStorage.removeItem(USER_NAME_KEY); localStorage.removeItem(LAST_EXPORT_KEY); } catch (e) {}
    userName = null;
    lastExportAt = null;
  } catch (e) {
    noteStorageError(e);
  }
  selectedId = MOVEMENTS[0].id;
  historyId = null;
  selectedWodId = WOD_LIBRARY[0].id;
  wodHistoryId = null;
  bwWeight = 70;
  barWeight = 20;
  logDate = todayISO();
  editingEntryId = null;
  wodLogDate = todayISO();
  editingWodEntryId = null;
  confirmClear = false;
  renderUserGreeting();
  render();
  if (userName === null) openWelcomeModal();
}

// ---------- WOD helpers & actions ----------
function allWods() { return WOD_LIBRARY.concat(customWods); }
function wodById(id) { return allWods().find((w) => w.id === id); }
function wodEntriesFor(id, excludeId) { return wodEntries.filter((e) => e.wodId === id && e.id !== excludeId); }
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
function bestWodScore(id, excludeId) {
  const w = wodById(id);
  const list = wodEntriesFor(id, excludeId);
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
  const trimmed = cleanStr(name, LIMITS.nameLen);
  if (!trimmed) return;
  if (!WOD_SCORE_TYPES.includes(scoreType)) return;
  const existing = allWods().find((w) => w.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) { selectedWodId = existing.id; closeWodPicker(); closeWodBuilder(); render(); return; }
  const id = uid("customwod");
  const wod = { id, name: trimmed, category: "Custom", scoreType, desc: cleanStr(desc, LIMITS.notesLen) };
  customWods.push(wod);
  try { await dbAddCustomWod(wod); } catch (e) { noteStorageError(e); }
  selectedWodId = id;
  closeWodPicker();
  closeWodBuilder();
  render();
}

// ---------- WOD builder ----------
function openWodBuilder(prefillName) {
  wodBuilderOpen = true;
  builderFormat = null;
  builderMovements = bag();
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
  const exactMatch = WOD_MOVEMENT_TAGS.some((m) => m.name.toLowerCase() === q);
  const byCategory = bag();
  filtered.forEach((m) => { (byCategory[m.category] = byCategory[m.category] || []).push(m); });
  const addRow = builderMoveSearch.trim() && !exactMatch
    ? `<div style="border:1px solid var(--brass); border-radius:12px; padding:10px 12px; margin-bottom:10px;">
         <div style="font-weight:700; font-size:13px; color:var(--brass); margin-bottom:8px;">הוספת "${esc(builderMoveSearch.trim())}" — לאיזו קטגוריה?</div>
         <div class="flex wrap gap-8">
           ${WOD_MOVE_CATEGORIES.map((cat) => `<button class="format-chip" style="flex:0 0 auto; padding:8px 14px;" data-action="add-builder-movement-tag" data-name="${esc(builderMoveSearch.trim())}" data-category="${cat}">${esc(catLabel(cat))}</button>`).join("")}
         </div>
       </div>`
    : `<button class="movement-btn" data-action="focus-wod-builder-search" style="border-color:var(--brass); margin-bottom:10px;">
         <span style="font-weight:700; font-size:14px; color:var(--brass);">+ הוספת תרגיל/סקילס חדש</span>
       </button>`;
  if (Object.keys(byCategory).length === 0) {
    el.innerHTML = addRow + (builderMoveSearch.trim() ? `<div style="color:var(--steel); text-align:center; padding:16px 0; font-size:13px;">לא נמצא תרגיל התואם ל-"${esc(builderMoveSearch)}"</div>` : "");
    return;
  }
  el.innerHTML = addRow + Object.entries(byCategory).map(([cat, items]) => `
    <div class="cat-group">
      <div class="cat-head"><div class="dot" style="background:${esc(catColor(cat))}"></div><span class="cat-name">${esc(catLabel(cat))}</span></div>
      ${items.map((m) => {
        const checked = Object.prototype.hasOwnProperty.call(builderMovements, m.name);
        const data = builderMovements[m.name] || { reps: 10, weight: 0 };
        const hasWeight = WOD_MOVE_CATEGORIES_WITH_WEIGHT.has(m.category);
        return `
        <button class="movecheck-row ${checked ? "checked" : ""}" data-action="toggle-builder-movement" data-name="${esc(m.name)}">
          <span style="font-weight:600; font-size:14px;">${esc(m.name)}</span>
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
  const name = nameInput ? cleanStr(nameInput.value, LIMITS.nameLen) : "";
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
  if (!isFinite(wodMinutes) || !isFinite(wodSeconds) || !isFinite(wodRounds) || !isFinite(wodReps) || !isFinite(wodWeight) || !isFinite(wodScaledWeight)) return;
  const editId = editingWodEntryId;
  const existing = editId ? wodEntries.find((e) => e.id === editId) : null;
  const prevBest = bestWodScore(selectedWodId, editId);
  const entry = {
    id: existing ? existing.id : uid("wod"),
    ts: existing ? existing.ts : Date.now(),
    date: clampLogDate(wodLogDate),
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

  wodEntries = wodEntries.filter((e) => e.id !== entry.id);
  wodEntries.unshift(entry);
  wodEntries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  try { await dbPutWodEntry(entry); storageOK = true; } catch (e) { noteStorageError(e); }
  wodNotes = "";
  editingWodEntryId = null;
  wodLogDate = todayISO();
  if (isPR) flashWodPR();
  render();
}
function startEditWodEntry(id) {
  const entry = wodEntries.find((e) => e.id === id);
  if (!entry) return;
  const w = wodById(entry.wodId);
  if (!w) return;
  selectedWodId = entry.wodId;
  wodRx = entry.rx;
  wodNotes = entry.notes || "";
  wodScaledWeight = entry.scaledWeight || 20;
  if (entry.scoreType === "time") { wodMinutes = Math.floor((entry.timeSeconds || 0) / 60); wodSeconds = (entry.timeSeconds || 0) % 60; }
  else if (entry.scoreType === "amrap") { wodRounds = entry.rounds || 0; wodReps = entry.reps || 0; }
  else wodWeight = entry.weight || 0;
  wodLogDate = entry.date;
  editingWodEntryId = entry.id;
  tab = "wod";
  wodSubTab = "log";
  render();
}
function cancelEditWodEntry() {
  editingWodEntryId = null;
  wodLogDate = todayISO();
  wodNotes = "";
  render();
}
async function deleteWodEntry(id) {
  wodEntries = wodEntries.filter((e) => e.id !== id);
  if (editingWodEntryId === id) { editingWodEntryId = null; wodLogDate = todayISO(); }
  try { await dbDeleteWodEntry(id); } catch (e) { noteStorageError(e); }
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
  edit: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  dumbbell: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="2" stroke-linecap="round"><path d="M4 9v6M20 9v6M2 10v4M22 10v4M7 12h10"/></svg>',
  chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--steel)" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  up: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.2" stroke-linecap="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
  down: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--steel)" stroke-width="2.2" stroke-linecap="round"><path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/></svg>',
  flat: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--steel)" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  chevronsLeft: '<img src="./assets/icon-chevrons.png" alt="" width="11" height="10" style="transform:scaleX(-1); vertical-align:middle;" />',
};

// ---------- Rendering ----------
function renderBarWeightRow() {
  return `<div id="barWeightRow">
    <div style="color:var(--steel); font-size:11px; font-weight:700; letter-spacing:.5px; margin-bottom:6px;">משקל המוט</div>
    <div class="flex gap-8" style="margin-bottom:12px;">
      ${BAR_OPTIONS.map((kg) => `<button class="format-chip ${barWeight === kg ? "active" : ""}" data-action="set-bar-weight" data-kg="${kg}">${kg} ק"ג</button>`).join("")}
    </div>
  </div>`;
}
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
      <span class="bar-caption">${w < barWeight ? `מתחת למשקל המוט (${barWeight} ק"ג)` : `מוט ${barWeight} ק"ג + ${plates.length} משקולות`}</span>
    </div>`;
}

function renderChart(data) {
  if (!data.length) return `<div class="flex col items-center" style="padding:32px 0; gap:8px;">${ICONS.dumbbell}<span style="color:var(--steel); font-size:13px;">אין עדיין נתונים לתרגיל הזה</span></div>`;
  const n = data.length;
  // Every point gets its own date label now (rotated, to fit more before they
  // overlap). Few points still render at the original full-width 300 viewBox;
  // once labels would start crowding, the chart grows wide instead of
  // cramming, and scrolls horizontally so every date stays readable.
  const padTop = 20, padBottom = 44, plotH = 110, padX = 24, spacing = 44;
  const h = padTop + plotH + padBottom;
  const naturalW = padX * 2 + Math.max(0, n - 1) * spacing;
  const wide = naturalW > 300;
  const w = wide ? naturalW : 300;
  const xs = data.map((d, i) => padX + i * ((w - 2 * padX) / Math.max(1, n - 1)));
  const ys = data.map((d) => d.est1RM);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const range = maxY - minY || 1;
  const pts = data.map((d, i) => ({
    x: xs[i],
    y: padTop + plotH - ((d.est1RM - minY) / range) * plotH,
    isPR: d.isPR,
    label: d.dateLabel,
  }));
  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const dots = pts.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.isPR ? 5 : 2.5}" fill="${p.isPR ? "#E8B98A" : "#F2ECE1"}" ${p.isPR ? 'stroke="#1F3057" stroke-width="2"' : ""}/>`).join("");
  const labelY = padTop + plotH + 12;
  const labels = pts.map((p) => `<text x="${p.x.toFixed(1)}" y="${labelY}" font-size="9" fill="#8891A6" text-anchor="end" transform="rotate(-45 ${p.x.toFixed(1)} ${labelY})">${esc(p.label)}</text>`).join("");
  const svg = `<svg viewBox="0 0 ${w} ${h}" style="${wide ? `width:${w}px;` : "width:100%;"} height:${h}px; display:block;">
    <polyline points="${polyline}" fill="none" stroke="#E8B98A" stroke-width="2"/>
    ${dots}${labels}
  </svg>`;
  return wide ? `<div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">${svg}</div>` : svg;
}

function renderLogTab() {
  const selected = movementById(selectedId);
  const est = bestEst1RM(selectedId);
  const last = entriesFor(selectedId)[0];
  const isToday = logDate === todayISO();
  const dayEntries = entries.filter((e) => e.date === logDate);
  const dayLabel = isToday ? "היום" : fmtDate(logDate);

  return `
    ${editingEntryId ? `
    <div style="background:rgba(232,185,138,.12); border:1px solid var(--brass); border-radius:12px; padding:10px 14px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
      <span style="color:var(--brass); font-weight:700; font-size:13px;">עריכת סט קיים</span>
      <button data-action="cancel-edit-entry" style="color:var(--steel); font-size:12px; text-decoration:underline;">ביטול</button>
    </div>` : ""}

    <button class="exercise-select" data-action="open-picker">
      <div class="flex items-center gap-8">
        <div class="dot" style="background:${esc(catColor(selected.category))}"></div>
        <span style="font-weight:800; font-size:16px;">${esc(selected.name)}</span>
      </div>
      <span class="flex items-center gap-6" style="color:var(--steel); font-size:12px; font-weight:600;">שינוי${ICONS.chevronsLeft}</span>
    </button>

    <div class="flex items-center gap-8" style="margin-bottom:12px;">
      <input type="date" id="logDateInput" value="${esc(logDate)}" max="${todayISO()}" style="flex:1; min-width:0; background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:12px 14px; color:var(--chalk); font-size:14px; font-weight:700; font-family:inherit;" />
      ${logDate !== todayISO() ? `<button data-action="reset-log-date" style="background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:12px 16px; color:var(--steel); font-weight:700; font-size:13px; white-space:nowrap;">היום</button>` : ""}
    </div>

    ${(est || last) ? `
    <div class="stat-row">
      ${est ? `<div class="stat-card"><div class="stat-label">1RM משוער</div><div class="stat-value mono" style="color:var(--brass);">${est} kg</div></div>` : ""}
      ${last ? `<div class="stat-card"><div class="stat-label">אימון אחרון</div><div class="stat-value mono">${last.weight}×${last.reps}</div></div>` : ""}
    </div>` : ""}

    ${renderBarWeightRow()}

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

    ${dayEntries.length === 0 ? `
    <div class="empty">${isToday ? "עדיין לא נרשמו סטים היום. קדימה למוט." : `עדיין לא נרשמו סטים ב-${esc(dayLabel)}.`}</div>` : `
    <button class="exercise-row" data-action="view-log-date-calendar" style="margin-bottom:0;">
      <div class="flex items-center gap-8">
        ${dayEntries[0].isPR ? ICONS.flame : ""}
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:13px;">אחרון: ${esc(movementById(dayEntries[0].exerciseId) ? movementById(dayEntries[0].exerciseId).name : "?")} — ${dayEntries[0].sets}×${dayEntries[0].reps} @ ${dayEntries[0].weight}</div>
          <div style="color:var(--steel); font-size:11px;">${dayEntries.length} סט${dayEntries.length === 1 ? "" : "ים"} נרשמו ${isToday ? "היום" : `ב-${esc(dayLabel)}`}</div>
        </div>
      </div>
      <span class="flex items-center gap-6" style="color:var(--steel); font-size:12px; font-weight:600;">צפייה ביום${ICONS.chevronsLeft}</span>
    </button>`}
  `;
}

function renderStepper(field, label, value, step, min, action) {
  action = action || "step";
  // Every attribute below is escaped: `field` can be a user-authored movement
  // name coming from the WOD builder, and `value` can come off disk.
  const f = esc(field), a = esc(action), st = esc(step), mn = esc(min), v = esc(value);
  return `
    <div class="stepper">
      <span class="stepper-label">${esc(label)}</span>
      <div class="stepper-box">
        <button class="stepper-btn" data-action="${a}" data-field="${f}" data-dir="-1" data-step="${st}" data-min="${mn}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>
        </button>
        <input class="stepper-val mono" type="text" inputmode="decimal" data-action="${a}" data-field="${f}" data-min="${mn}" value="${v}" />
        <button class="stepper-btn" data-action="${a}" data-field="${f}" data-dir="1" data-step="${st}" data-min="${mn}">
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
  const active = activeExercises().filter((m) => m.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
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
      <button class="exercise-row ${historyId === m.id ? "active" : ""}" data-action="select-history" data-id="${esc(m.id)}" style="${historyId === m.id ? "margin-bottom:0; border-bottom-left-radius:0; border-bottom-right-radius:0;" : ""}">
        <div class="flex items-center gap-8">
          <span style="display:inline-flex; transition:transform .2s; transform:rotate(${historyId === m.id ? "90deg" : "180deg"});">${ICONS.chevron}</span>
          <div class="dot" style="background:${esc(catColor(m.category))}"></div>
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
    cells += `<button class="${cls.join(" ")}" data-action="cal-select-day" data-date="${esc(iso)}">
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
            <button data-action="edit-entry" data-id="${esc(e.id)}" style="color:var(--steel); padding:4px;">${ICONS.edit}</button>
            <button data-action="delete-entry" data-id="${esc(e.id)}" style="color:var(--steel); padding:4px;">${ICONS.trash}</button>
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
              <button data-action="edit-wod-entry" data-id="${esc(e.id)}" style="color:var(--steel); padding:4px;">${ICONS.edit}</button>
              <button data-action="delete-wod-entry" data-id="${esc(e.id)}" style="color:var(--steel); padding:4px;">${ICONS.trash}</button>
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
          <div class="dot" style="background:${esc(catColor(cat))}"></div>
          <span style="font-weight:700; font-size:14px;">${esc(catLabel(cat))}</span>
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
function renderBodyweightArea() {
  const el = document.getElementById("bodyweightArea");
  if (!el) return;
  const sorted = bodyweightEntries.slice().sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
  const last = bodyweightEntries.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
  const chartData = sorted.map((e) => ({ dateLabel: fmtDate(e.date), est1RM: e.weight, isPR: false }));
  const header = `
    <button class="exercise-row ${bodyweightExpanded ? "active" : ""}" data-action="toggle-bodyweight" style="${bodyweightExpanded ? "margin-bottom:0; border-bottom-left-radius:0; border-bottom-right-radius:0;" : ""}">
      <div class="flex items-center gap-8">
        <span style="display:inline-flex; transition:transform .2s; transform:rotate(${bodyweightExpanded ? "90deg" : "180deg"});">${ICONS.chevron}</span>
        <span style="font-weight:700; font-size:14px;">משקל גוף</span>
      </div>
      ${last ? `<span class="mono" style="color:var(--brass); font-weight:700; font-size:14px;">${last.weight} kg</span>` : `<span style="color:var(--steel); font-size:12px;">אין עדיין מדידות</span>`}
    </button>`;
  const detail = bodyweightExpanded ? `
    <div class="chart-card" style="margin-top:-4px; border-top-left-radius:0; border-top-right-radius:0; border-top:none;">
      ${last ? `<div style="color:var(--steel); font-size:12px; margin-bottom:${chartData.length ? "12px" : "0"};">עודכן לאחרונה: ${fmtDate(last.date)}</div>` : ""}
      ${chartData.length ? renderChart(chartData) : ""}
      <div class="steppers" style="margin-top:14px; margin-bottom:0;">
        ${renderStepper("bwWeight", "משקל (ק\"ג)", bwWeight, 0.5, 0, "bw-step")}
      </div>
      <button data-action="save-bw" class="save-btn" style="max-width:none; margin-top:14px;">רישום משקל גוף — היום</button>
    </div>
    <div style="height:8px;"></div>` : "";
  el.innerHTML = header + detail;
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

    ${activeExercises().length > 0 ? `
    <div class="section-label">שיאים כלל-זמנים</div>
    <div class="search-box" style="margin:0 0 12px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8891A6" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input id="historySearch" dir="auto" placeholder="חיפוש בתרגילים שלך" value="${esc(historySearch)}" />
    </div>` : ""}

    <div id="historyListArea"></div>

    <div id="bodyweightArea"></div>
  `;
}

function renderFooter() {
  return `
    <div class="footer">
      <div class="footer-note"${storageOK ? "" : ' style="color:var(--red);"'}>${storageOK ? "נשמר במכשיר הזה בלבד, ללא שרת" : esc(storageErrMsg || "שמירה נכשלה — בדקו את מקום האחסון")}</div>
      ${(() => {
        const hasData = entries.length || wodEntries.length || bodyweightEntries.length;
        if (!hasData) return "";
        const days = daysSinceLastExport();
        if (days !== null && days < 30) return "";
        const msg = days === null ? "עדיין לא ביצעתם גיבוי" : `הגיבוי האחרון לפני ${days} ימים`;
        return `<div class="footer-note" style="color:var(--yellow); margin-bottom:8px;">${esc(msg)} — ייצוא גיבוי למטה</div>`;
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
  const inp = document.querySelector(`.stepper-val[data-action="step"][data-field="${cssSel(field)}"]`);
  if (inp) inp.value = valMap[field];
  if (field === "weight") {
    const bv = document.getElementById("barbellVisual");
    if (bv) bv.innerHTML = renderBarbell(weight);
  }
  const estEl = document.getElementById("estLineValue");
  if (estEl) estEl.textContent = estimate1RM(weight, reps) + " kg";
}

// Bound every numeric field at both ends. Previously only a floor was applied,
// so "1e12" typed into a weight box propagated straight through the app state.
function clampField(action, field, value, min) {
  const lo = isFinite(min) ? min : 0;
  const hi = fieldMax(action, field);
  if (typeof value !== "number" || !isFinite(value)) return lo;
  return Math.min(hi, Math.max(lo, +value.toFixed(2)));
}

function getFieldValue(action, field) {
  if (action === "step") return { weight, reps, sets }[field];
  if (action === "wod-step") return { wodMinutes, wodSeconds, wodRounds, wodReps, wodWeight, wodScaledWeight }[field];
  if (action === "bw-step") return bwWeight;
  if (action === "builder-movement-reps") return builderMovements[field] ? builderMovements[field].reps : 0;
  if (action === "builder-movement-weight") return builderMovements[field] ? builderMovements[field].weight : 0;
  return 0;
}

// Pure state write, no DOM side effects — safe to call on every keystroke.
function setFieldState(action, field, value) {
  if (action === "step") {
    if (field === "weight") weight = value;
    else if (field === "reps") reps = value;
    else if (field === "sets") sets = value;
  } else if (action === "wod-step") {
    if (field === "wodMinutes") wodMinutes = value;
    else if (field === "wodSeconds") wodSeconds = value;
    else if (field === "wodRounds") wodRounds = value;
    else if (field === "wodReps") wodReps = value;
    else if (field === "wodWeight") wodWeight = value;
    else if (field === "wodScaledWeight") wodScaledWeight = value;
  } else if (action === "bw-step") {
    bwWeight = value;
  } else if (action === "builder-movement-reps") {
    if (builderMovements[field]) builderMovements[field].reps = value;
  } else if (action === "builder-movement-weight") {
    if (builderMovements[field]) builderMovements[field].weight = value;
  }
}

// Full commit: validates, writes state, and resyncs every dependent display
// (including the field's own text) — used by +/- buttons and on blur.
function applyFieldValue(action, field, value) {
  if (typeof value !== "number" || !isFinite(value)) {
    value = getFieldValue(action, field);
    if (typeof value !== "number" || !isFinite(value)) value = 0;
  }
  setFieldState(action, field, value);
  if (action === "step") {
    updateLogQuickUI(field);
  } else if (action === "wod-step") {
    const valMap = { wodMinutes, wodSeconds, wodRounds, wodReps, wodWeight, wodScaledWeight };
    const inp = document.querySelector(`.stepper-val[data-action="wod-step"][data-field="${cssSel(field)}"]`);
    if (inp) inp.value = valMap[field];
  } else if (action === "bw-step") {
    const inp = document.querySelector(`.stepper-val[data-action="bw-step"][data-field="bwWeight"]`);
    if (inp) inp.value = bwWeight;
  } else if (action === "builder-movement-reps" || action === "builder-movement-weight") {
    renderWodBuilderMovements();
  }
}

function render() {
  let content;
  try {
    if (tab === "add") {
      const selected = movementById(selectedId);
      content = renderLogTab();
      if (selected) document.getElementById("saveBtnLabel").textContent = (editingEntryId ? "עדכון סט — " : "רישום סט — ") + selected.name;
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
      <div style="color:var(--steel); font-size:12px;">${esc((err && err.message) ? err.message : String(err))}</div>
    </div>`;
  }
  document.getElementById("tabAddBtn").className = "tabbtn" + (tab === "add" ? " active" : "");
  document.getElementById("tabHistoryBtn").className = "tabbtn" + (tab === "history" ? " active" : "");
  document.getElementById("tabCalendarBtn").className = "tabbtn" + (tab === "calendar" ? " active" : "");
  document.getElementById("tabWodBtn").className = "tabbtn" + (tab === "wod" ? " active" : "");
  document.getElementById("bottomBar").style.display = tab === "add" ? "flex" : "none";
  document.getElementById("content").innerHTML = content + renderFooter();
  try {
    if (tab === "add") {
      const dateInput = document.getElementById("logDateInput");
      if (dateInput) dateInput.addEventListener("change", (e) => {
        logDate = clampLogDate(e.target.value);
        render();
      });
    }
    if (tab === "history") {
      renderHistoryListArea();
      renderBodyweightArea();
      const search = document.getElementById("historySearch");
      if (search) search.addEventListener("input", (e) => { historySearch = cleanStr(e.target.value, LIMITS.nameLen); renderHistoryListArea(); });
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
  const isToday = wodLogDate === todayISO();
  const dayWods = wodEntries.filter((e) => e.date === wodLogDate);
  const dayLabel = isToday ? "היום" : fmtDate(wodLogDate);
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
    ${editingWodEntryId ? `
    <div style="background:rgba(232,185,138,.12); border:1px solid var(--brass); border-radius:12px; padding:10px 14px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
      <span style="color:var(--brass); font-weight:700; font-size:13px;">עריכת אימון קיים</span>
      <button data-action="cancel-edit-wod-entry" style="color:var(--steel); font-size:12px; text-decoration:underline;">ביטול</button>
    </div>` : ""}

    <button class="exercise-select" data-action="open-wod-picker">
      <div class="flex items-center gap-8">
        <div class="dot" style="background:${esc(catColor(w.category))}"></div>
        <div>
          <span style="font-weight:800; font-size:16px;">${esc(w.name)}</span>
          ${w.desc ? `<div class="wod-desc">${esc(w.desc)}</div>` : ""}
        </div>
      </div>
      <span class="flex items-center gap-6" style="color:var(--steel); font-size:12px; font-weight:600;">שינוי${ICONS.chevronsLeft}</span>
    </button>

    <div class="flex items-center gap-8" style="margin-bottom:12px;">
      <input type="date" id="wodLogDateInput" value="${esc(wodLogDate)}" max="${todayISO()}" style="flex:1; min-width:0; background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:12px 14px; color:var(--chalk); font-size:14px; font-weight:700; font-family:inherit;" />
      ${wodLogDate !== todayISO() ? `<button data-action="reset-wod-log-date" style="background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:12px 16px; color:var(--steel); font-weight:700; font-size:13px; white-space:nowrap;">היום</button>` : ""}
    </div>

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

    <div id="wodFlashBox" class="flex items-center justify-center" style="display:none; gap:6px; color:#fff; font-weight:800; font-size:14px; background-image:var(--stripe); border-radius:14px; padding:10px 0; margin-bottom:16px; text-shadow:0 1px 3px rgba(0,0,0,.5);">${ICONS.flame}<span>שיא חדש!</span></div>

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
      ${editingWodEntryId ? "עדכון" : "רישום"} אימון — ${esc(w.name)}
    </button>

    ${dayWods.length === 0 ? `
    <div class="empty">${isToday ? "עדיין לא נרשמו אימונים היום." : `עדיין לא נרשמו אימונים ב-${esc(dayLabel)}.`}</div>` : `
    <button class="exercise-row" data-action="view-log-wod-date-calendar" style="margin-bottom:0;">
      <div class="flex items-center gap-8">
        ${dayWods[0].isPR ? ICONS.flame : ""}
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:13px;">אחרון: ${esc(wodById(dayWods[0].wodId) ? wodById(dayWods[0].wodId).name : "?")} — ${formatWodEntry(dayWods[0])} (${dayWods[0].rx ? "Rx" : "Scaled"})</div>
          <div style="color:var(--steel); font-size:11px;">${dayWods.length} אימון${dayWods.length === 1 ? "" : "ים"} נרשמו ${isToday ? "היום" : `ב-${esc(dayLabel)}`}</div>
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
  const active = activeWods().filter((w) => w.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
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
      <button class="exercise-row ${wodHistoryId === w.id ? "active" : ""}" data-action="select-wod-history" data-id="${esc(w.id)}" style="${wodHistoryId === w.id ? "margin-bottom:0; border-bottom-left-radius:0; border-bottom-right-radius:0;" : ""}">
        <div class="flex items-center gap-8">
          <span style="display:inline-flex; transition:transform .2s; transform:rotate(${wodHistoryId === w.id ? "90deg" : "180deg"});">${ICONS.chevron}</span>
          <div class="dot" style="background:${esc(catColor(w.category))}"></div>
          <span style="font-weight:700; font-size:14px;">${esc(w.name)}</span>
        </div>
        <span class="mono" style="color:var(--brass); font-weight:700; font-size:14px;">${formatWodBest(w.id)}</span>
      </button>`;
    const detail = wodHistoryId === w.id ? renderWodDetailCard(w) + `<div style="height:8px;"></div>` : "";
    return row + detail;
  }).join("");
}

function renderWodHistorySection() {
  return `
    ${activeWods().length > 0 ? `
    <div class="section-label">שיאים כלל-זמנים</div>
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
    if (notesInput) notesInput.addEventListener("input", (e) => { wodNotes = cleanStr(e.target.value, LIMITS.notesLen); });
    const dateInput = document.getElementById("wodLogDateInput");
    if (dateInput) dateInput.addEventListener("change", (e) => {
      wodLogDate = clampLogDate(e.target.value);
      renderWodContent();
    });
  }
  if (wodSubTab === "history") {
    renderWodHistoryListArea();
    const search = document.getElementById("wodHistorySearch");
    if (search) search.addEventListener("input", (e) => { wodHistorySearch = cleanStr(e.target.value, LIMITS.nameLen); renderWodHistoryListArea(); });
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
  const byCategory = bag();
  filtered.forEach((m) => { (byCategory[m.category] = byCategory[m.category] || []).push(m); });
  const list = document.getElementById("pickerList");
  const addRow = query.trim() && !exactMatch
    ? `<div style="border:1px solid var(--brass); border-radius:12px; padding:10px 12px; margin-top:4px; margin-bottom:8px;">
         <div style="font-weight:700; font-size:13px; color:var(--brass); margin-bottom:8px;">הוספת "${esc(query.trim())}" — לאיזו קטגוריה?</div>
         <div class="flex wrap gap-8">
           ${MOVEMENT_CATEGORIES.map((cat) => `<button class="format-chip" style="flex:0 0 auto; padding:8px 14px;" data-action="add-movement" data-name="${esc(query.trim())}" data-category="${cat}">${cat}</button>`).join("")}
         </div>
       </div>`
    : `<button class="movement-btn" data-action="focus-picker-search" style="border-color:var(--brass); margin-top:4px; margin-bottom:8px;">
         <span style="font-weight:700; font-size:14px; color:var(--brass);">+ הוספת תרגיל חדש</span>
       </button>`;
  if (Object.keys(byCategory).length === 0) {
    list.innerHTML = addRow + `<div style="color:var(--steel); text-align:center; padding:16px 0; font-size:13px;">לא נמצא תרגיל</div>`;
    return;
  }
  list.innerHTML = addRow + Object.entries(byCategory).map(([cat, items]) => `
    <div class="cat-group">
      <div class="cat-head"><div class="dot" style="background:${esc(catColor(cat))}"></div><span class="cat-name">${esc(catLabel(cat))}</span></div>
      ${items.map((m) => `
        <button class="movement-btn ${selectedId === m.id ? "active" : ""}" data-action="pick-movement" data-id="${esc(m.id)}">
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
  const byCategory = bag();
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
      <div class="cat-head"><div class="dot" style="background:${esc(catColor(cat))}"></div><span class="cat-name">${esc(catLabel(cat))}</span></div>
      ${byCategory[cat].map((w) => `
        <button class="movement-btn ${selectedWodId === w.id ? "active" : ""}" data-action="pick-wod" data-id="${esc(w.id)}">
          <div>
            <span style="font-weight:600; font-size:14px;">${esc(w.name)}</span>
            ${w.desc ? `<div class="wod-desc">${esc(w.desc)}</div>` : ""}
          </div>
          ${selectedWodId === w.id ? `<div class="dot" style="background:var(--brass);"></div>` : ""}
        </button>`).join("")}
    </div>`).join("");
}

// ---------- Service worker update handshake ----------
let pendingWorker = null;
function applyUpdate() {
  // Ask the waiting worker to take over; controllerchange then reloads us.
  if (pendingWorker) {
    try { pendingWorker.postMessage({ type: "SKIP_WAITING" }); return; } catch (e) {}
  }
  location.reload();
}

// ---------- Event delegation ----------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  if (action === "reload-app") { applyUpdate(); }
  else if (action === "switch-tab") { tab = el.dataset.tab; render(); }
  else if (action === "view-today-calendar") {
    tab = "calendar";
    const t = new Date();
    calYear = t.getFullYear();
    calMonth = t.getMonth();
    calSelectedDate = todayISO();
    render();
  }
  else if (action === "view-log-date-calendar") {
    tab = "calendar";
    const d = new Date(logDate + "T00:00:00");
    calYear = d.getFullYear();
    calMonth = d.getMonth();
    calSelectedDate = logDate;
    render();
  }
  else if (action === "reset-log-date") { logDate = todayISO(); render(); }
  else if (action === "cancel-edit-entry") { cancelEditEntry(); }
  else if (action === "edit-entry") { startEditEntry(el.dataset.id); }
  else if (action === "view-log-wod-date-calendar") {
    tab = "calendar";
    const d = new Date(wodLogDate + "T00:00:00");
    calYear = d.getFullYear();
    calMonth = d.getMonth();
    calSelectedDate = wodLogDate;
    render();
  }
  else if (action === "reset-wod-log-date") { wodLogDate = todayISO(); renderWodContent(); }
  else if (action === "cancel-edit-wod-entry") { cancelEditWodEntry(); }
  else if (action === "edit-wod-entry") { startEditWodEntry(el.dataset.id); }
  else if (action === "open-picker") { openPicker(); }
  else if (action === "close-picker") {
    if (el.id === "pickerOverlay" && e.target !== el) return;
    closePicker();
  }
  else if (action === "pick-movement") { selectedId = el.dataset.id; closePicker(); render(); }
  else if (action === "add-movement") { addMovement(el.dataset.name, el.dataset.category); }
  else if (action === "focus-picker-search") { document.getElementById("pickerSearch").focus(); }
  else if (action === "step" || action === "wod-step" || action === "bw-step" || action === "builder-movement-reps" || action === "builder-movement-weight") {
    const field = el.dataset.field, dir = +el.dataset.dir, step = +el.dataset.step, min = +el.dataset.min;
    const current = getFieldValue(action, field);
    const base = (typeof current === "number" && isFinite(current)) ? current : 0;
    const next = clampField(action, field, +(base + dir * step).toFixed(2), min);
    applyFieldValue(action, field, next);
  }
  else if (action === "save-set") { saveSet(); }
  else if (action === "set-bar-weight") { setBarWeight(+el.dataset.kg); }
  else if (action === "delete-entry") { deleteEntry(el.dataset.id); }
  else if (action === "cal-prev") { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendarGrid(); }
  else if (action === "cal-next") { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendarGrid(); }
  else if (action === "cal-select-day") { calSelectedDate = el.dataset.date; renderCalendarGrid(); }
  else if (action === "select-history") { historyId = historyId === el.dataset.id ? null : el.dataset.id; renderHistoryListArea(); }
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
  else if (action === "add-builder-movement-tag") {
    const name = cleanStr(el.dataset.name, LIMITS.nameLen), category = el.dataset.category;
    if (!name) return;
    if (WOD_MOVEMENT_TAGS.length >= 500) return;
    if (!WOD_MOVEMENT_TAGS.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      WOD_MOVEMENT_TAGS.push({ name, category: WOD_MOVE_CATEGORIES.includes(category) ? category : "Gymnastics" });
    }
    builderMovements[name] = { reps: 10, weight: 0 };
    builderMoveSearch = "";
    const moveSearch = document.getElementById("wodBuilderMoveSearch");
    if (moveSearch) moveSearch.value = "";
    renderWodBuilderMovements("");
  }
  else if (action === "focus-wod-builder-search") { document.getElementById("wodBuilderMoveSearch").focus(); }
  else if (action === "create-wod") { createWodFromBuilder(); }
  else if (action === "save-bw") { saveBodyweight(); }
  else if (action === "toggle-bodyweight") { bodyweightExpanded = !bodyweightExpanded; renderBodyweightArea(); }
  else if (action === "save-user-name") { saveUserName(document.getElementById("welcomeNameInput").value); }
  else if (action === "skip-user-name") { saveUserName(""); }
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
  else if (action === "select-wod-history") { wodHistoryId = wodHistoryId === el.dataset.id ? null : el.dataset.id; renderWodHistoryListArea(); }
});
document.getElementById("pickerSearch").addEventListener("input", (e) => renderPickerList(cleanStr(e.target.value, LIMITS.nameLen)));
document.getElementById("pickerSearch").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const q = e.target.value.trim();
  if (!q) return;
  const exact = allMovements().find((m) => m.name.toLowerCase() === q.toLowerCase());
  if (exact) { selectedId = exact.id; closePicker(); render(); }
  else e.target.blur();
});
document.getElementById("wodPickerSearch").addEventListener("input", (e) => renderWodPickerList(cleanStr(e.target.value, LIMITS.nameLen)));
document.getElementById("wodBuilderMoveSearch").addEventListener("input", (e) => renderWodBuilderMovements(cleanStr(e.target.value, LIMITS.nameLen)));
document.getElementById("wodBuilderMoveSearch").addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.target.blur();
});
document.getElementById("welcomeNameInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); saveUserName(e.target.value); }
});

document.addEventListener("focusin", (e) => {
  if (e.target.classList && e.target.classList.contains("stepper-val")) e.target.value = "";
});
document.addEventListener("keydown", (e) => {
  if (e.target.classList && e.target.classList.contains("stepper-val") && e.key === "Enter") {
    e.preventDefault();
    e.target.blur();
  }
});
document.addEventListener("input", (e) => {
  const el = e.target;
  if (!el.classList || !el.classList.contains("stepper-val")) return;
  const raw = String(el.value).trim().replace(",", ".");
  if (raw === "" || raw === "-" || raw === ".") return;
  const val = parseFloat(raw);
  if (!isFinite(val)) return;
  const action = el.dataset.action, field = el.dataset.field;
  setFieldState(action, field, clampField(action, field, val, +el.dataset.min));
  if (action === "step" && field === "weight") {
    const bv = document.getElementById("barbellVisual");
    if (bv) bv.innerHTML = renderBarbell(weight);
  }
  if (action === "step") {
    const estEl = document.getElementById("estLineValue");
    if (estEl) estEl.textContent = estimate1RM(weight, reps) + " kg";
  }
});
document.addEventListener("focusout", (e) => {
  const el = e.target;
  if (!el.classList || !el.classList.contains("stepper-val")) return;
  const action = el.dataset.action, field = el.dataset.field, min = +el.dataset.min;
  const current = getFieldValue(action, field);
  const safe = (typeof current === "number" && isFinite(current)) ? current : 0;
  applyFieldValue(action, field, clampField(action, field, +safe.toFixed(2), min));
});
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
  await reloadFromDb();
  await loadUserName();
  await loadLastExport();
  await loadBarWeight();
  document.getElementById("loading").style.display = "none";
  document.getElementById("app").style.display = "block";
  renderUserGreeting();
  render();
  if (userName === null) openWelcomeModal();

  if ("serviceWorker" in navigator) {
    // The SW no longer calls skipWaiting() on install, so a new version parks
    // in "waiting" until the user taps the banner. That keeps the running page
    // and its cached assets on the same version.
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      const offerUpdate = (worker) => { pendingWorker = worker; showUpdateBanner(); };
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) offerUpdate(nw);
        });
      });
    }).catch((e) => console.warn("sw registration failed:", e));

    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  }
}
init();
