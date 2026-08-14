import { json } from "../_lib/auth.js";

// GET /api/tags -> distinct tags used by approved stories
export async function onRequestGet({ request, env }) {
  const { results } = await env.DB.prepare(
    "SELECT genres FROM stories WHERE approval_status = 'approved' AND genres != ''"
  ).all();

  const set = new Set();
  results.forEach(r => (r.genres || "").split(",").map(g => g.trim()).filter(Boolean).forEach(g => set.add(g)));
  return json({ tags: [...set].sort() });
}
