import { json, badRequest } from "../_lib/auth.js";

// GET /api/comments?chapter=456
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const chapterId = url.searchParams.get("chapter");
  if (!chapterId) return badRequest("Missing chapter id.");

  const { results } = await env.DB.prepare(
    `SELECT c.id, c.content, c.created_at, c.paragraph_index, u.username
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.chapter_id = ? ORDER BY c.created_at DESC`
  ).bind(chapterId).all();

  return json({ comments: results });
}
