import { getUser, json, unauthorized } from "../_lib/auth.js";

// GET /api/my-stories -> all stories authored by the logged-in user, any approval status
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { results } = await env.DB.prepare(
    `SELECT s.id, s.title, s.alt_title, s.status, s.approval_status, s.genres, s.description, s.cover,
            (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS chapter_count
     FROM stories s WHERE s.author_id = ? ORDER BY s.updated_at DESC`
  ).bind(user.id).all();

  return json({ stories: results });
}
