import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// POST /api/thread-vote { thread_id, vote: 1 | -1 } -> toggles/switches
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const vote = Number(body && body.vote);
  if (!body || !body.thread_id || ![1, -1].includes(vote)) return badRequest("thread_id and vote (1 or -1) required.");

  const existing = await env.DB.prepare(
    "SELECT id, vote FROM thread_votes WHERE thread_id = ? AND user_id = ?"
  ).bind(body.thread_id, user.id).first();

  if (existing && existing.vote === vote) {
    await env.DB.prepare("DELETE FROM thread_votes WHERE id = ?").bind(existing.id).run();
  } else if (existing) {
    await env.DB.prepare("UPDATE thread_votes SET vote = ? WHERE id = ?").bind(vote, existing.id).run();
  } else {
    await env.DB.prepare("INSERT INTO thread_votes (thread_id, user_id, vote) VALUES (?, ?, ?)")
      .bind(body.thread_id, user.id, vote).run();
  }

  const likes = await env.DB.prepare("SELECT COUNT(*) AS n FROM thread_votes WHERE thread_id = ? AND vote = 1").bind(body.thread_id).first();
  const dislikes = await env.DB.prepare("SELECT COUNT(*) AS n FROM thread_votes WHERE thread_id = ? AND vote = -1").bind(body.thread_id).first();
  return json({ likes: likes.n, dislikes: dislikes.n });
}
