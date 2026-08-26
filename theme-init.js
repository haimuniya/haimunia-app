// Runs before first paint (loaded early in <head>, blocking) so there is no
// flash of the wrong theme. Kept as its own tiny file rather than an inline
// <script> because the CSP's script-src 'self' has no 'unsafe-inline'.
//
// Default (nothing chosen yet) is "dark" — that's the app's original,
// established look, and existing users shouldn't see a surprise theme
// change. "light" and "dark" stamp the attribute explicitly; "auto" leaves
// it unstamped so the prefers-color-scheme media query in index.html decides.
(function () {
  var t = "dark";
  try {
    var stored = localStorage.getItem("haimunia:theme");
    if (stored) t = stored;
  } catch (e) {}
  if (t === "light" || t === "dark") {
    document.documentElement.setAttribute("data-theme", t);
  }
  var s = "normal";
  try {
    var storedScale = localStorage.getItem("haimunia:textScale");
    if (storedScale) s = storedScale;
  } catch (e) {}
  if (s === "large") {
    document.documentElement.setAttribute("data-text-scale", s);
  }
})();
