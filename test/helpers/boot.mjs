// Boots the real app (index.html + app.js, byte-for-byte off disk) inside a
// jsdom window backed by a fresh, isolated in-memory IndexedDB per call — so
// tests exercise the actual production code path, not a reimplementation of
// it, with no state leaking between tests.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import FDBFactory from "fake-indexeddb/lib/FDBFactory";
import FDBKeyRange from "fake-indexeddb/lib/FDBKeyRange";

const testDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const root = path.dirname(testDir);
const htmlPath = path.join(root, "index.html");
const appJsPath = path.join(root, "app.js");

export async function bootApp() {
  const html = readFileSync(htmlPath, "utf8");
  const dom = new JSDOM(html, {
    url: "https://example.test/",
    // "outside-only" parses the document but does NOT auto-run its <script>
    // tags (no network/file fetch needed for ./app.js or ./theme-init.js);
    // it still exposes window.eval so we can run app.js ourselves below.
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const { window } = dom;

  window.indexedDB = new FDBFactory();
  window.IDBKeyRange = FDBKeyRange;

  // jsdom implements neither matchMedia nor a full randomUUID-capable crypto.
  window.matchMedia = () => ({
    matches: false,
    media: "",
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  window.crypto = globalThis.crypto;

  // window.confirm has no jsdom implementation; default to "yes" for tests
  // that go through confirmation flows (e.g. import merge).
  window.confirm = () => true;
  window.alert = () => {};

  // jsdom doesn't implement URL.createObjectURL/revokeObjectURL either —
  // exportData()'s real download path needs them to exist, not to actually
  // produce a working blob: URL (nothing in a test environment can click
  // through a real download anyway).
  if (!window.URL.createObjectURL) window.URL.createObjectURL = () => "blob:test-url";
  if (!window.URL.revokeObjectURL) window.URL.revokeObjectURL = () => {};

  // A real browser never navigates for an <a download> click — it saves the
  // file instead. jsdom doesn't know that distinction and tries to
  // "navigate" to the blob: URL, which it doesn't support either, logging
  // a noisy (and here, harmless) "Not implemented: navigation" error. Skip
  // jsdom's navigation entirely for download links, same as a real browser.
  const origAnchorClick = window.HTMLAnchorElement.prototype.click;
  window.HTMLAnchorElement.prototype.click = function () {
    if (this.hasAttribute("download")) return;
    return origAnchorClick.call(this);
  };

  // exportData()'s only long timer is a 30s "give the download a moment
  // before revoking the blob: URL" cleanup — harmless in a real tab, but a
  // real 30s Node timer that keeps a short-lived test process alive until
  // it fires. Every other setTimeout in the app is well under 10s (UI
  // delays: focus, flash messages). Clamp only the ones at or above that,
  // so this doesn't change the timing any test actually depends on.
  const origSetTimeout = window.setTimeout;
  window.setTimeout = (fn, delay, ...args) => (delay >= 10000 ? origSetTimeout(fn, 10, ...args) : origSetTimeout(fn, delay, ...args));

  const appJs = readFileSync(appJsPath, "utf8");
  window.eval(appJs);

  await waitFor(() => window.document.getElementById("loading").style.display === "none", 5000);
  return window;
}

export function waitFor(check, timeoutMs = 2000, intervalMs = 5) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      let result;
      try { result = check(); } catch (e) { return reject(e); }
      if (result) return resolve(result);
      if (Date.now() - start > timeoutMs) return reject(new Error("waitFor timed out"));
      setTimeout(poll, intervalMs);
    })();
  });
}
