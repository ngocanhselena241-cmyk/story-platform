import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// GET /api/library  -- continue-reading list + full library for the logged-in user
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { results: continueReading } = await env.DB.prepare(
    `SELECT s.id AS story_id, s.title, c.chapter_number,
            (SELECT COUNT(*) FROM chapters c2 WHERE c2.story_id = s.id) AS total_chapters,
            rp.updated_at
     FROM reading_progress rp
     JOIN stories s ON s.id = rp.story_id
     JOIN chapters c ON c.id = rp.chapter_id
     WHERE rp.user_id = ?
     ORDER BY rp.updated_at DESC LIMIT 5`
  ).bind(user.id).all();

  const { results: library } = await env.DB.prepare(
    `SELECT l.status, s.id AS story_id, s.title
     FROM library l JOIN stories s ON s.id = l.story_id
     WHERE l.user_id = ? ORDER BY l.id DESC`
  ).bind(user.id).all();

  return json({ continue_reading: continueReading, library });
}

// POST /api/library  { story_id, status }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.story_id || !body.status) return badRequest("story_id and status are required.");

  await env.DB.prepare(
    `INSERT INTO library (user_id, story_id, status) VALUES (?, ?, ?)
     ON CONFLICT(user_id, story_id) DO UPDATE SET status = excluded.status`
  ).bind(user.id, body.story_id, body.status).run();

  return json({ ok: true });
}
