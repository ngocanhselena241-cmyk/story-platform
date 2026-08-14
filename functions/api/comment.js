import { getUser, json, badRequest, unauthorized, forbidden } from "../_lib/auth.js";

// POST /api/comment  { chapter_id, content }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.chapter_id || !body.content || !body.content.trim()) {
    return badRequest("chapter_id and content are required.");
  }

  const result = await env.DB.prepare(
    "INSERT INTO comments (chapter_id, user_id, content, paragraph_index, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(body.chapter_id, user.id, body.content.trim(),
    Number.isInteger(body.paragraph_index) ? body.paragraph_index : null, Date.now()).run();

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
