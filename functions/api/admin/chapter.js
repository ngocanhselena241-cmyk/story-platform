import { getUser, json, badRequest, unauthorized, forbidden } from "../../_lib/auth.js";

// DELETE /api/admin/chapter?id=  -- remove a chapter and its comments
export async function onRequestDelete({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing chapter id.");

  await env.DB.prepare("DELETE FROM chapter_images WHERE chapter_id = ?").bind(id).run();
  await env.DB.prepare(
    "DELETE FROM comment_votes WHERE comment_id IN (SELECT id FROM comments WHERE chapter_id = ?)"
  ).bind(id).run();
  await env.DB.prepare("DELETE FROM comments WHERE chapter_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM chapter_moods WHERE chapter_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM quotes WHERE chapter_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM reading_progress WHERE chapter_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM reading_log WHERE chapter_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM chapters WHERE id = ?").bind(id).run();

  return json({ ok: true });
}
