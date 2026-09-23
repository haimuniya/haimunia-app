// NOTHING LEAVES THE PHONE ON OPEN.
//
// This edition has no server of its own. Two layers say so: the CSP in
// index.html allows no origin but 'self' for anything, so even an injected
// script has nowhere to send data; and booting the app, with a history,
// through every screen, makes no fetch, XHR, beacon or WebSocket at all.
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootApp, SCRIPT_FILES } from "./helpers/boot.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => readFileSync(path.join(root, f), "utf8");

test("the CSP names no origin but 'self'", () => {
  const csp = read("index.html").match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.doesNotMatch(csp, /https?:|wss?:|\*/, csp);
});

test("no shipped script names a remote host", () => {
  for (const f of SCRIPT_FILES) {
    const code = read(f).replace(/^\s*\/\/.*$/gm, "");
    const hosts = [...code.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1])
      // wa.me and mailto are the member's own hand-off in the support sheet,
      // opened only when they tap it; w3.org is the SVG namespace string.
      .filter((h) => !/^(wa\.me|www\.w3\.org)$/.test(h));
    assert.deepEqual(hosts, [], `${f} names ${hosts.join(", ")}`);
  }
});

test("booting and visiting every screen makes no network request", async () => {
  const calls = [];
  const window = await bootApp({
    beforeScripts: (w) => {
      w.fetch = (...a) => { calls.push(["fetch", String(a[0])]); return Promise.reject(new Error("offline")); };
      const Xhr = w.XMLHttpRequest;
      w.XMLHttpRequest = function () { const x = new Xhr(); const o = x.open; x.open = (m, u, ...r) => { calls.push(["xhr", String(u)]); return o.call(x, m, u, ...r); }; return x; };
      w.navigator.sendBeacon = (u) => { calls.push(["beacon", String(u)]); return true; };
      w.WebSocket = function (u) { calls.push(["ws", String(u)]); throw new Error("no"); };
      w.scrollTo = () => {};
    },
  });
  for (const t of ["add", "history", "calendar", "wod", "add"]) {
    window.document.querySelector(`[data-action='switch-tab'][data-tab='${t}']`).click();
    await new Promise((r) => setTimeout(r, 30));
  }
  assert.deepEqual(calls, []);
});
