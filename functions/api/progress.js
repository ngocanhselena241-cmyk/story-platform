import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// POST /api/progress  { story_id, chapter_id }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.story_id || !body.chapter_id) return badRequest("story_id and chapter_id are required.");

  await env.DB.prepare(
    `INSERT INTO reading_progress (user_id, story_id, chapter_id, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, story_id) DO UPDATE SET chapter_id = excluded.chapter_id, updated_at = excluded.updated_at`
  ).bind(user.id, body.story_id, body.chapter_id, Date.now()).run();

  return json({ ok: true });
}
