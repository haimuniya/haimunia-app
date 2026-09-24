// This edition has no cloud, so there is nothing to mock. The name is kept so
// the checks carried over from the community edition read the same, but the
// job is inverted: every request that leaves the page's own origin is
// ABORTED and remembered, so each check also proves the app works with no
// network beyond its own files. page.__foreignRequests lists what was tried.
//
// No-op defaults keep the community edition's call shapes valid
// (installMockCloud(page, seedTables, opts), withMock(page, fn, arg)).
export async function installMockCloud(page) {
  page.__foreignRequests = [];
  await page.route("**/*", (route) => {
    const url = route.request().url();
    let sameOrigin = false;
    try {
      const u = new URL(url);
      sameOrigin = u.hostname === "127.0.0.1" || u.hostname === "localhost" || u.protocol === "data:" || u.protocol === "blob:";
    } catch (e) { sameOrigin = false; }
    if (sameOrigin) return route.continue();
    page.__foreignRequests.push(url);
    return route.abort();
  });
}

export async function withMock(page, fn, arg) {
  return page.evaluate(fn, arg);
}
