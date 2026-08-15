import { getUser, json, badRequest } from "../_lib/auth.js";

// GET /api/comments?chapter=456
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const chapterId = url.searchParams.get("chapter");
  if (!chapterId) return badRequest("Missing chapter id.");

  const user = await getUser(request, env);

  const { results } = await env.DB.prepare(
    `SELECT c.id, c.content, c.created_at, c.paragraph_index, c.parent_id,
            u.username, u.avatar, u.display_badge,
            (SELECT COUNT(*) FROM comment_votes v WHERE v.comment_id = c.id AND v.vote = 1) AS likes,
            (SELECT COUNT(*) FROM comment_votes v WHERE v.comment_id = c.id AND v.vote = -1) AS dislikes,
            COALESCE((SELECT v.vote FROM comment_votes v WHERE v.comment_id = c.id AND v.user_id = ?), 0) AS my_vote
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.chapter_id = ? ORDER BY c.created_at DESC`
  ).bind(user ? user.id : 0, chapterId).all();

  return json({ comments: results });
}
