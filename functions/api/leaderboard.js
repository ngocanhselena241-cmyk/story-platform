import { json } from "../_lib/auth.js";

// GET /api/leaderboard
export async function onRequestGet({ request, env }) {
  const { results: uploaders } = await env.DB.prepare(
    `SELECT u.id, u.username, u.avatar,
            COUNT(s.id) AS story_count, COALESCE(SUM(s.views), 0) AS total_views
     FROM users u JOIN stories s ON s.author_id = u.id AND s.approval_status = 'approved'
     GROUP BY u.id ORDER BY total_views DESC LIMIT 10`
  ).all();

  const { results: readers } = await env.DB.prepare(
    `SELECT u.id, u.username, u.avatar, COUNT(rl.id) AS chapters_read
     FROM users u JOIN reading_log rl ON rl.user_id = u.id
     GROUP BY u.id ORDER BY chapters_read DESC LIMIT 10`
  ).all();

  return json({ uploaders, readers });
}
