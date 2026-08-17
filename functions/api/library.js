import { getUser, json, unauthorized } from "../_lib/auth.js";

// GET /api/library  -- continue-reading list for the logged-in user.
// Libraries themselves live in /api/libraries and /api/library-items.
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { results: continueReading } = await env.DB.prepare(
    `SELECT s.id AS story_id, s.title, s.alt_title, c.chapter_number,
            (SELECT COUNT(*) FROM chapters c2 WHERE c2.story_id = s.id) AS total_chapters,
            rp.updated_at
     FROM reading_progress rp
     JOIN stories s ON s.id = rp.story_id
     JOIN chapters c ON c.id = rp.chapter_id
     WHERE rp.user_id = ?
     ORDER BY rp.updated_at DESC LIMIT 5`
  ).bind(user.id).all();

  return json({ continue_reading: continueReading });
}
