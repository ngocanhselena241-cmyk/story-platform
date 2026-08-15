import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// GET /api/follow?story=ID -> { following, count }
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const storyId = url.searchParams.get("story");
  if (!storyId) return badRequest("Missing story id.");

  const countRow = await env.DB.prepare("SELECT COUNT(*) AS n FROM follows WHERE story_id = ?").bind(storyId).first();
  const user = await getUser(request, env);
  let following = false;
  if (user) {
    const row = await env.DB.prepare("SELECT id FROM follows WHERE story_id = ? AND user_id = ?").bind(storyId, user.id).first();
    following = !!row;
  }
  return json({ following, count: countRow.n });
}

// POST /api/follow { story_id } -> toggles
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.story_id) return badRequest("story_id is required.");

  const existing = await env.DB.prepare("SELECT id FROM follows WHERE story_id = ? AND user_id = ?")
    .bind(body.story_id, user.id).first();

  if (existing) {
    await env.DB.prepare("DELETE FROM follows WHERE id = ?").bind(existing.id).run();
    return json({ following: false });
  }
  await env.DB.prepare("INSERT INTO follows (user_id, story_id, created_at) VALUES (?, ?, ?)")
    .bind(user.id, body.story_id, Date.now()).run();
  return json({ following: true });
}
