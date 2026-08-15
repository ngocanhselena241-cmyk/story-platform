import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// GET /api/thread?id= -> thread + comments + my vote
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing thread id.");

  const thread = await env.DB.prepare(
    `SELECT t.*, u.username, u.avatar,
            (SELECT COUNT(*) FROM thread_votes v WHERE v.thread_id = t.id AND v.vote = 1) AS likes,
            (SELECT COUNT(*) FROM thread_votes v WHERE v.thread_id = t.id AND v.vote = -1) AS dislikes
     FROM threads t JOIN users u ON u.id = t.user_id WHERE t.id = ?`
  ).bind(id).first();
  if (!thread) return json({ error: "Thread not found." }, 404);

  const user = await getUser(request, env);

  const { results: comments } = await env.DB.prepare(
    `SELECT c.id, c.content, c.created_at, c.parent_id, u.username, u.avatar, u.display_badge,
            (SELECT COUNT(*) FROM thread_comment_votes v WHERE v.comment_id = c.id AND v.vote = 1) AS likes,
            (SELECT COUNT(*) FROM thread_comment_votes v WHERE v.comment_id = c.id AND v.vote = -1) AS dislikes,
            COALESCE((SELECT v.vote FROM thread_comment_votes v WHERE v.comment_id = c.id AND v.user_id = ?), 0) AS my_vote
     FROM thread_comments c JOIN users u ON u.id = c.user_id
     WHERE c.thread_id = ? ORDER BY c.created_at ASC`
  ).bind(user ? user.id : 0, id).all();

  let myVote = 0;
  if (user) {
    const row = await env.DB.prepare("SELECT vote FROM thread_votes WHERE thread_id = ? AND user_id = ?")
      .bind(id, user.id).first();
    myVote = row ? row.vote : 0;
  }

  return json({ thread, comments, my_vote: myVote });
}

// POST /api/thread { thread_id, content } -> comment; notifies thread author
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.thread_id || !body.content || !body.content.trim()) {
    return badRequest("thread_id and content are required.");
  }

  const now = Date.now();
  const parentId = Number.isInteger(body.parent_id) ? body.parent_id : null;

  const result = await env.DB.prepare(
    "INSERT INTO thread_comments (thread_id, user_id, content, parent_id, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(body.thread_id, user.id, body.content.trim(), parentId, now).run();

  const thread = await env.DB.prepare("SELECT user_id, title FROM threads WHERE id = ?").bind(body.thread_id).first();

  // A reply pings the person replied to; a top-level comment pings the author.
  if (parentId) {
    const parent = await env.DB.prepare("SELECT user_id FROM thread_comments WHERE id = ?").bind(parentId).first();
    if (parent && parent.user_id !== user.id) {
      await env.DB.prepare(
        "INSERT INTO notifications (user_id, message, created_at) VALUES (?, ?, ?)"
      ).bind(parent.user_id,
        `${user.username} replied to your comment${thread ? ` on "${thread.title}"` : ""}`, now).run();
    }
  } else if (thread && thread.user_id !== user.id) {
    await env.DB.prepare(
      "INSERT INTO notifications (user_id, message, created_at) VALUES (?, ?, ?)"
    ).bind(thread.user_id, `${user.username} commented on your post "${thread.title}"`, now).run();
  }

  return json({ id: result.meta.last_row_id });
}
