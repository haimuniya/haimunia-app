// THE MOVE TO THE NEW CLUB APP, FROM THE MEMBER'S SIDE.
//
// Owner decision (2026-11-12): this app keeps working with no end date; every
// member chooses if and when to move. The invitation and the transfer code are
// built, and OFF until HAIMUNIA_CONFIG.newApp.enabled is turned on.
//
// The transfer code: the backup (body weight included) is encrypted on this
// phone with a key that exists only in the code. Only ciphertext leaves.
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { bootApp } from "./helpers/boot.mjs";

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// The new app's decoder (shahafrach/haimunia-club src/transfer.js decodeCode), verbatim in logic.
function decodeCode(text) {
  const s = String(text).toUpperCase().replace(/[\s-]/g, "");
  if (s.length !== 21) return null;
  let bits = 0, acc = 0; const out = [];
  for (const ch of s) {
    const v = ALPHABET.indexOf(ch); if (v < 0) return null;
    acc = (acc << 5) | v; bits += 5;
    if (bits >= 8) { bits -= 8; out.push((acc >> bits) & 255); acc &= (1 << bits) - 1; }
  }
  return out.length === 13 ? new Uint8Array(out) : null;
}
async function derive(codeBytes) {
  const subtle = globalThis.crypto.subtle;
  const enc = (t) => new TextEncoder().encode(t);
  const base = await subtle.importKey("raw", codeBytes, "HKDF", false, ["deriveBits", "deriveKey"]);
  const salt = new Uint8Array(0);
  const lookup = Buffer.from(await subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: enc("haimunia-transfer:lookup:v1") }, base, 256)).toString("hex");
  const key = await subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: enc("haimunia-transfer:key:v1") }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  return { lookup, key };
}

// Node's web platform for the parts jsdom lacks, and the flag turned on for the tests that need it.
function platform({ enabled = false, respond = () => Promise.resolve({ ok: true, status: 200 }) } = {}) {
  const calls = [];
  return {
    calls,
    beforeScripts: (w) => {
      w.scrollTo = () => {};
      Object.defineProperty(w, "crypto", { value: globalThis.crypto, configurable: true });
      w.CompressionStream = globalThis.CompressionStream;
      w.Blob = globalThis.Blob;
      w.Response = globalThis.Response;
      w.fetch = (url, init) => {
        calls.push({ url: String(url), init });
        return String(url).includes("/functions/v1/transfer-put") ? respond(url, init) : Promise.resolve({ ok: true, status: 201 });
      };
      if (enabled) {
        let cfg;
        Object.defineProperty(w, "HAIMUNIA_CONFIG", {
          configurable: true,
          get: () => cfg,
          set: (v) => { cfg = Object.freeze({ ...v, newApp: Object.freeze({ enabled: true, url: "https://haimunia.pages.dev/" }) }); },
        });
      }
    },
  };
}

test("shipped OFF: no invitation, no transfer row, and the action does nothing", async () => {
  const p = platform();
  const window = await bootApp({ beforeScripts: p.beforeScripts });
  assert.equal(window.HAIMUNIA_CONFIG.newApp.enabled, false);
  assert.equal(window.document.getElementById("newAppBanner"), null);
  assert.ok(!window.document.body.innerHTML.includes("יצירת קוד העברה"));
  window.openTransfer();
  assert.ok(!window.document.getElementById("transferOverlay").classList.contains("open"));
  const src = readFileSync(new URL("../app-config.js", import.meta.url), "utf8");
  assert.match(src, /newApp: Object\.freeze\(\{\n\s+enabled: false,/);
});

test("ON: a dismissible invitation on the home screen that stays dismissed", async () => {
  const p = platform({ enabled: true });
  const window = await bootApp({ beforeScripts: p.beforeScripts });
  const card = window.document.getElementById("newAppBanner");
  assert.ok(card, "the invitation is there");
  assert.match(card.textContent, /האפליקציה הזאת ממשיכה לעבוד/);
  card.querySelector('[data-action="new-app-dismiss"]').click();
  await tick();
  assert.equal(window.document.getElementById("newAppBanner"), null);
  assert.equal(window.localStorage.getItem("haimunia:newAppBannerDismissed"), "1");
  window.render();
  assert.equal(window.document.getElementById("newAppBanner"), null, "not back on the next render");
});

test("ON: the code carries the whole log, body weight and settings, and only ciphertext leaves", async () => {
  const p = platform({ enabled: true });
  const window = await bootApp({ beforeScripts: p.beforeScripts });
  window.choosePickedMovement("back-squat");
  window.applyFieldValue("step", "weight", 100);
  window.applyFieldValue("step", "reps", 5);
  await window.saveSet();
  const before = await window.buildBackupPayload();

  const code = await window.createTransferCode();
  assert.match(code, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{5}$/);

  const put = p.calls.filter((c) => c.url.includes("transfer-put"));
  assert.equal(put.length, 1);
  assert.equal(put[0].url, window.HAIMUNIA_CONFIG.usage.url + "/functions/v1/transfer-put");
  assert.equal(put[0].init.credentials, "omit");
  const body = JSON.parse(put[0].init.body);
  assert.deepEqual(Object.keys(body).sort(), ["ciphertext", "iv", "lookup"]);
  const ct = Buffer.from(body.ciphertext, "base64");
  for (const word of ["entries", "bodyweightEntries", "back-squat", "prefs"]) {
    assert.equal(ct.indexOf(Buffer.from(word)), -1, `no "${word}" in what is sent`);
  }

  const bytes = decodeCode(code);
  assert.ok(bytes, "the new app's decoder reads the code");
  const { lookup, key } = await derive(bytes);
  assert.equal(body.lookup, lookup, "the new app finds the blob with this code");
  const plain = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(body.iv, "base64"), additionalData: new TextEncoder().encode("haimunia-transfer:v1") }, key, ct);
  const payload = JSON.parse(gunzipSync(Buffer.from(plain)).toString("utf8"));
  assert.deepEqual(payload.entries, JSON.parse(JSON.stringify(before.entries)));
  assert.ok(Array.isArray(payload.bodyweightEntries));
  assert.deepEqual(Object.keys(payload.prefs).sort(), ["barWeight", "boxStartDate", "pctIncrement", "textScale", "theme", "userName", "wodRxDefault"]);
});

test("ON: the dialog shows the code once, and failures say what to do", async () => {
  let status = 429;
  const p = platform({ enabled: true, respond: () => Promise.resolve({ ok: status < 300, status }) });
  const window = await bootApp({ beforeScripts: p.beforeScripts });
  window.openTransfer();
  const overlay = window.document.getElementById("transferOverlay");
  assert.ok(overlay.classList.contains("open"));
  await window.runCreateTransfer();
  assert.match(overlay.textContent, /יותר מדי קודים/);
  status = 200;
  await window.runCreateTransfer();
  assert.match(overlay.textContent, /הקוד שלכם/);
  window.closeTransfer();
  window.openTransfer();
  assert.ok(!overlay.textContent.includes("הקוד שלכם"), "the code is not shown again");
});
