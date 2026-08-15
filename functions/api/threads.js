import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// GET /api/threads?category=general|stories -> list with vote + comment counts
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");

  let sql = `
    SELECT t.id, t.title, t.category, t.created_at, u.username, u.avatar,
           (SELECT COUNT(*) FROM thread_votes v WHERE v.thread_id = t.id AND v.vote = 1) AS likes,
           (SELECT COUNT(*) FROM thread_votes v WHERE v.thread_id = t.id AND v.vote = -1) AS dislikes,
           (SELECT COUNT(*) FROM thread_comments c WHERE c.thread_id = t.id) AS comment_count
    FROM threads t JOIN users u ON u.id = t.user_id
  `;
  const params = [];
  if (category) { sql += " WHERE t.category = ?"; params.push(category); }
  sql += " ORDER BY t.created_at DESC LIMIT 50";

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return json({ threads: results });
}

// POST /api/threads { title, category, content, image? }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.title || !body.title.trim() || !body.content || !body.content.trim()) {
    return badRequest("Title and content are required.");
  }
  const category = ["general", "stories"].includes(body.category) ? body.category : "general";
  if (body.image && body.image.length > 400000) return badRequest("Image is too large.");

  const result = await env.DB.prepare(
    "INSERT INTO threads (user_id, title, category, content, image, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(user.id, body.title.trim(), category, body.content.trim(), body.image || null, Date.now()).run();

  return json({ id: result.meta.last_row_id });
}
