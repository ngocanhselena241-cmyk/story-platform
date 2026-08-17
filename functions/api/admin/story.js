import { getUser, json, badRequest, unauthorized, forbidden } from "../../_lib/auth.js";

// GET /api/admin/story  -- list stories pending approval
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const { results } = await env.DB.prepare(
    `SELECT s.id, s.title, s.alt_title, s.approval_status, u.username AS author_name
     FROM stories s JOIN users u ON u.id = s.author_id
     WHERE s.approval_status = 'pending' ORDER BY s.created_at ASC`
  ).all();

  return json({ stories: results });
}

// DELETE /api/admin/story?id=  -- permanently remove a story and its chapters
export async function onRequestDelete({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing story id.");

  await env.DB.prepare(
    "DELETE FROM chapter_images WHERE chapter_id IN (SELECT id FROM chapters WHERE story_id = ?)"
  ).bind(id).run();
  await env.DB.prepare(
    "DELETE FROM comment_votes WHERE comment_id IN (SELECT id FROM comments WHERE chapter_id IN (SELECT id FROM chapters WHERE story_id = ?))"
  ).bind(id).run();
  await env.DB.prepare("DELETE FROM comments WHERE chapter_id IN (SELECT id FROM chapters WHERE story_id = ?)").bind(id).run();
  await env.DB.prepare("DELETE FROM quotes WHERE story_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM reading_log WHERE story_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM reading_progress WHERE story_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM ratings WHERE story_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM library_items WHERE story_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM chapters WHERE story_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM stories WHERE id = ?").bind(id).run();

  return json({ ok: true });
}
