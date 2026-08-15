import { getUser, json, badRequest, unauthorized, forbidden } from "../../_lib/auth.js";

// GET /api/admin/users?q= -> list users (filtered)
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  let sql = "SELECT id, username, role, created_at FROM users";
  const params = [];
  if (q) { sql += " WHERE username LIKE ?"; params.push(`%${q}%`); }
  sql += " ORDER BY username ASC LIMIT 100";

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return json({ users: results });
}

// DELETE /api/admin/users?id= -> delete an account and their activity
export async function onRequestDelete({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return badRequest("Missing user id.");
  if (id === user.id) return badRequest("You can't delete your own account from here.");

  const target = await env.DB.prepare("SELECT id, role FROM users WHERE id = ?").bind(id).first();
  if (!target) return json({ error: "User not found." }, 404);

  const hasStories = await env.DB.prepare("SELECT COUNT(*) AS n FROM stories WHERE author_id = ?").bind(id).first();
  if (hasStories.n > 0) {
    return badRequest("This user has published stories. Delete their stories first, then delete the account.");
  }

  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM comments WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM ratings WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM reading_progress WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM reading_log WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM library WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM quotes WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM chapter_moods WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM follows WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM notifications WHERE user_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

  return json({ ok: true });
}
