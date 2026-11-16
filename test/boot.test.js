// The built app starts in jsdom without errors, shows each screen, and the ranking keeps its rules.
// Needs dist/index.html (run test/build.test.js or python3 build.py first). No network: Supabase and Google are off.
const assert = require("assert");
const load = require("./_load.js");
let n = 0; const ok = (name, fn) => { fn(); n++; console.log("ok -", name); };

(async () => {
  const { w, doc, errors } = await load();
  const F = w.__fiver;
  const view = () => doc.getElementById("view").textContent.replace(/\s+/g, " ");

  ok("boots with no script errors", () => { assert(F, "window.__fiver"); assert.deepStrictEqual(errors, []); });
  ok("first screen is the hello", () => { assert.strictEqual(F.state.step, F.S.hello); assert(view().length > 0); });

  // Gower Street, a Tuesday-ish lunchtime: fixed so the result does not depend on when the test runs.
  F.state.where = { lat: 51.5246, lon: -0.1340, label: "UCL" };
  F.state.cats = new w.Set(["hot"]);
  F.state.minute = 12 * 60 + 30;
  F.state.step = F.S.results;
  F.render();
  ok("results screen renders with a pick", () => {
    assert.deepStrictEqual(errors, []);
    assert(/places? fit/.test(view()), view().slice(0, 200));
    assert(/Fiver.s pick/.test(view()));
  });

  for (const budget of [3, 5, 10, 15]) {
    F.state.budget = budget;
    const r = F.rank();
    ok("budget £" + budget + ": every fit is priced, within budget, open and within the walk", () => {
      assert(r.fit.length > 0, "nothing fits");
      for (const x of r.fit) {
        assert.strictEqual(typeof (x.pr && x.pr.price), "number", x.p.name + " has no price");
        assert(x.pr.price <= budget + 1e-9, x.p.name + " £" + x.pr.price + " over £" + budget);
        assert(x.o && x.o.open, x.p.name + " is closed");
        assert(x.walk <= F.state.mins, x.p.name + " is " + x.walk + " min away");
      }
    });
    ok("budget £" + budget + ": a place without a price is never the pick", () => {
      const ids = new Set(r.unpriced.map(x => x.p.id));
      assert(!ids.has(r.fit[0].p.id));
    });
  }

  ok("re-render after every budget left no errors", () => { F.render(); assert.deepStrictEqual(errors, []); });
  w.close();
  console.log(n + " passed");
})().catch(e => { console.error("FAIL -", e.message); process.exit(1); });
