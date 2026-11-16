// Loads dist/index.html in jsdom as if on a phone at localhost: no network, no Supabase, no Google (ON_SITE is false there).
const fs = require("fs"), path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");
module.exports = async function load(opts = {}) {
  const html = fs.readFileSync(path.join(__dirname, "..", "dist", "index.html"), "utf8");
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push(String(e && (e.detail || e.message) || e)));
  vc.on("error", (...a) => errors.push(a.map(String).join(" ")));
  const dom = new JSDOM(html, {
    url: "http://localhost/index.html", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.fetch = () => Promise.reject(new Error("offline in tests"));
      w.matchMedia = q => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.HTMLElement.prototype.scrollTo = function () {};
      w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
      w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      Object.defineProperty(w.navigator, "geolocation", { value: { getCurrentPosition(_, err) { err && err({ code: 1 }); }, watchPosition() { return 0; }, clearWatch() {} } });
      if (opts.storage) for (const [k, v] of Object.entries(opts.storage)) w.localStorage.setItem(k, v);
    },
  });
  await new Promise(r => setTimeout(r, opts.wait || 300));
  return { dom, w: dom.window, doc: dom.window.document, errors };
};
