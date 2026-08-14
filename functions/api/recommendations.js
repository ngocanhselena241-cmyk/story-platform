import { getUser, json, unauthorized } from "../_lib/auth.js";

// GET /api/recommendations -> stories sharing a genre with what the user has read, excluding those already read
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { results: readGenres } = await env.DB.prepare(
    `SELECT DISTINCT s.genres FROM reading_log rl JOIN stories s ON s.id = rl.story_id WHERE rl.user_id = ?`
  ).bind(user.id).all();

  if (!readGenres.length) return json({ stories: [], based_on: null });

  const genreSet = new Set();
  readGenres.forEach(row => (row.genres || "").split(",").map(g => g.trim()).filter(Boolean).forEach(g => genreSet.add(g)));
  const genres = [...genreSet];
  if (!genres.length) return json({ stories: [], based_on: null });

  const conditions = genres.map(() => "s.genres LIKE ?").join(" OR ");
  const params = genres.map(g => `%${g}%`);

  const { results } = await env.DB.prepare(
    `SELECT s.id, s.title, s.genres, s.views,
            (SELECT AVG(rating) FROM ratings r WHERE r.story_id = s.id) AS avg_rating
     FROM stories s
     WHERE s.approval_status = 'approved'
       AND (${conditions})
       AND s.id NOT IN (SELECT story_id FROM reading_log WHERE user_id = ?)
     ORDER BY avg_rating DESC
     LIMIT 6`
  ).bind(...params, user.id).all();

  return json({ stories: results, based_on: genres[0] });
}
