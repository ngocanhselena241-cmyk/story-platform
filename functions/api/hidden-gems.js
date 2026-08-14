import { json } from "../_lib/auth.js";

// GET /api/hidden-gems -> approved stories with a high rating but low view count
export async function onRequestGet({ request, env }) {
  const { results } = await env.DB.prepare(
    `SELECT s.id, s.title, s.views,
            (SELECT AVG(rating) FROM ratings r WHERE r.story_id = s.id) AS avg_rating,
            (SELECT COUNT(*) FROM ratings r WHERE r.story_id = s.id) AS rating_count
     FROM stories s
     WHERE s.approval_status = 'approved'
     HAVING avg_rating >= 7 AND rating_count >= 1 AND s.views < 50
     ORDER BY avg_rating DESC
     LIMIT 6`
  ).all();
  return json({ stories: results });
}
