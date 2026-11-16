// The build: python3 build.py makes dist/index.html and dist/sw.js from src/, with nothing left over and no secrets.
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
execFileSync("python3", ["build.py"], { cwd: ROOT, stdio: "pipe" });
const html = fs.readFileSync(path.join(ROOT, "dist", "index.html"), "utf8");
const sw = fs.readFileSync(path.join(ROOT, "dist", "sw.js"), "utf8");
const version = fs.readFileSync(path.join(ROOT, "VERSION"), "utf8").trim();
let n = 0; const ok = (name, fn) => { fn(); n++; console.log("ok -", name); };

ok("no build marks left", () => {
  for (const m of ["/*STYLE*/", "/*SCRIPT*/", "WORDMARK_B64", "{{VERSION}}"]) assert(!html.includes(m) && !sw.includes(m), m);
});
ok("one inline script, and it parses", () => {
  const blocks = [...html.matchAll(/<script>\n([\s\S]*?)<\/script>/g)];
  assert.strictEqual(blocks.length, 1);
  new vm.Script(blocks[0][1], { filename: "index.html" });
});
ok("sw.js parses and its cache is fiver-v" + version, () => {
  new vm.Script(sw, { filename: "sw.js" });
  assert(sw.includes('const CACHE="fiver-v' + version + '";'));
});
ok("sw.js keeps index.html, the manifest and the 3 icons", () => {
  for (const f of ["./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"]) assert(sw.includes('"' + f + '"'), f);
});
ok("no secrets in the page", () => {
  assert(!/sk-ant-[A-Za-z0-9_-]{20,}/.test(html), "an Anthropic key");
  assert(!/service_role|SERVICE_ROLE/.test(html), "a Supabase service key");
  assert(!/sb_secret_/.test(html), "a Supabase secret key");
  for (const m of html.matchAll(/eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\./g)) {
    const role = JSON.parse(Buffer.from(m[1], "base64url").toString()).role;
    assert.strictEqual(role, "anon", "a JWT that is not the public anon key");
  }
});
ok("the app model is claude-haiku-5-5 wherever a model is named", () => {
  const models = new Set([...html.matchAll(/"(claude-[a-z0-9.-]+)"/g)].map(m => m[1]));
  for (const m of models) assert.strictEqual(m, "claude-haiku-5-5", m);
});
ok("CNAME and the manifest are untouched by the build", () => {
  assert.strictEqual(fs.readFileSync(path.join(ROOT, "CNAME"), "utf8").trim(), "fedforafiver.com");
  JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.webmanifest"), "utf8"));
});
console.log(n + " passed");
