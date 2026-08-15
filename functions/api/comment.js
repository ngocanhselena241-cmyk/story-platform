import { getUser, json, badRequest, unauthorized, forbidden } from "../_lib/auth.js";

// POST /api/comment  { chapter_id, content }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.chapter_id || !body.content || !body.content.trim()) {
    return badRequest("chapter_id and content are required.");
  }

  const now = Date.now();
  const parentId = Number.isInteger(body.parent_id) ? body.parent_id : null;

  const result = await env.DB.prepare(
    "INSERT INTO comments (chapter_id, user_id, content, paragraph_index, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(body.chapter_id, user.id, body.content.trim(),
    Number.isInteger(body.paragraph_index) ? body.paragraph_index : null, parentId, now).run();

  // Notify the person being replied to
  if (parentId) {
    const parent = await env.DB.prepare("SELECT user_id FROM comments WHERE id = ?").bind(parentId).first();
    if (parent && parent.user_id !== user.id) {
      const ctx = await env.DB.prepare(
        `SELECT s.id AS story_id, s.title, ch.chapter_number
         FROM chapters ch JOIN stories s ON s.id = ch.story_id WHERE ch.id = ?`
      ).bind(body.chapter_id).first();
      await env.DB.prepare(
        "INSERT INTO notifications (user_id, story_id, chapter_number, message, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(parent.user_id, ctx ? ctx.story_id : null, ctx ? ctx.chapter_number : null,
        `${user.username} replied to your comment${ctx ? ` on ${ctx.title} Ch. ${ctx.chapter_number}` : ""}`, now).run();
    }
  }

  return json({ id: result.meta.last_row_id });
}

// DELETE /api/comment?id=789  -- comment author or admin
export async function onRequestDelete({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing comment id.");

  const comment = await env.DB.prepare("SELECT user_id FROM comments WHERE id = ?").bind(id).first();
  if (!comment) return json({ error: "Comment not found." }, 404);
  if (comment.user_id !== user.id && user.role !== "admin") return forbidden();

  await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
