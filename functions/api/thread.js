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

  const { results: comments } = await env.DB.prepare(
    `SELECT c.id, c.content, c.created_at, u.username, u.avatar, u.display_badge
     FROM thread_comments c JOIN users u ON u.id = c.user_id
     WHERE c.thread_id = ? ORDER BY c.created_at ASC`
  ).bind(id).all();

  const user = await getUser(request, env);
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
  await env.DB.prepare(
    "INSERT INTO thread_comments (thread_id, user_id, content, created_at) VALUES (?, ?, ?, ?)"
  ).bind(body.thread_id, user.id, body.content.trim(), now).run();

  const thread = await env.DB.prepare("SELECT user_id, title FROM threads WHERE id = ?").bind(body.thread_id).first();
  if (thread && thread.user_id !== user.id) {
    await env.DB.prepare(
      "INSERT INTO notifications (user_id, message, created_at) VALUES (?, ?, ?)"
    ).bind(thread.user_id, `${user.username} commented on your post "${thread.title}"`, now).run();
  }

  return json({ ok: true });
}
