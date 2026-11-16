// Fed for a Fiver · forget-me (08/11/2026): the app's "Forget me" button.
// In: {device_id}. Deletes every row of that ID in public.visit_events and public.events. Nothing else is read or kept.
// Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, which Supabase gives every function: the service key never leaves the server.
// Contributions (menus people added) are not touched: they hold no visits and other people's searches use them.
const URL_ = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "content-type": "application/json" } });
let hits: number[] = [];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!URL_ || !SERVICE) return json({ error: "no_config" }, 500);
  const now = Date.now();
  hits = hits.filter((t) => now - t < 60_000);
  if (hits.length >= 30) return json({ error: "rate_limited" }, 429);
  hits.push(now);
  let body: { device_id?: unknown } = {};
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const id = typeof body.device_id === "string" ? body.device_id.trim() : "";
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return json({ error: "bad_id" }, 400);
  const h = { apikey: SERVICE, Authorization: "Bearer " + SERVICE, Prefer: "return=minimal" };
  const out: Record<string, number> = {};
  for (const t of ["visit_events", "events"]) {
    const r = await fetch(`${URL_}/rest/v1/${t}?device_id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: h });
    if (!r.ok) return json({ error: "delete_failed", table: t, status: r.status }, 502);
    out[t] = r.status;
  }
  return json({ ok: true });
});
