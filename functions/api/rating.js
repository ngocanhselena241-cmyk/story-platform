import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// POST /api/rating  { story_id, rating }  (1-10)
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const rating = Number(body && body.rating);
  if (!body || !body.story_id || !rating || rating < 1 || rating > 10) {
    return badRequest("story_id and a rating from 1-10 are required.");
  }

  await env.DB.prepare(
    `INSERT INTO ratings (story_id, user_id, rating) VALUES (?, ?, ?)
     ON CONFLICT(story_id, user_id) DO UPDATE SET rating = excluded.rating`
  ).bind(body.story_id, user.id, rating).run();

  return json({ ok: true });
}
