import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// Chapter comments and discussion comments vote the same way, they just live
// in different tables.
const TABLES = {
  chapter: { comments: "comments", votes: "comment_votes" },
  thread: { comments: "thread_comments", votes: "thread_comment_votes" }
};

async function tally(env, votesTable, commentId) {
  const likes = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ${votesTable} WHERE comment_id = ? AND vote = 1`
  ).bind(commentId).first();
  const dislikes = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ${votesTable} WHERE comment_id = ? AND vote = -1`
  ).bind(commentId).first();
  return { likes: likes.n, dislikes: dislikes.n };
}

// POST /api/comment-vote  { comment_id, vote: 1 | -1, kind: "chapter" | "thread" }
// Clicking the same button again clears the vote.
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const vote = Number(body && body.vote);
  const kind = (body && body.kind) || "chapter";
  if (!body || !body.comment_id || ![1, -1].includes(vote)) {
    return badRequest("comment_id and vote (1 or -1) are required.");
  }
  const tables = TABLES[kind];
  if (!tables) return badRequest("Unknown comment kind.");

  const comment = await env.DB.prepare(
    `SELECT id FROM ${tables.comments} WHERE id = ?`
  ).bind(body.comment_id).first();
  if (!comment) return json({ error: "Comment not found." }, 404);

  const existing = await env.DB.prepare(
    `SELECT id, vote FROM ${tables.votes} WHERE comment_id = ? AND user_id = ?`
  ).bind(body.comment_id, user.id).first();

  let myVote = vote;
  if (existing && existing.vote === vote) {
    await env.DB.prepare(`DELETE FROM ${tables.votes} WHERE id = ?`).bind(existing.id).run();
    myVote = 0;
  } else if (existing) {
    await env.DB.prepare(`UPDATE ${tables.votes} SET vote = ? WHERE id = ?`).bind(vote, existing.id).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO ${tables.votes} (comment_id, user_id, vote) VALUES (?, ?, ?)`
    ).bind(body.comment_id, user.id, vote).run();
  }

  const counts = await tally(env, tables.votes, body.comment_id);
  return json({ ...counts, my_vote: myVote });
}
