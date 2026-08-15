import { getUser, hashPassword, verifyPassword, json, badRequest, unauthorized } from "../_lib/auth.js";

// POST /api/password  { current_password, new_password }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.current_password || !body.new_password) {
    return badRequest("Both your current and new password are required.");
  }
  if (body.new_password.length < 8) {
    return badRequest("New password must be at least 8 characters.");
  }
  if (body.new_password === body.current_password) {
    return badRequest("That's already your password.");
  }

  const row = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(user.id).first();
  if (!row || !(await verifyPassword(body.current_password, row.password_hash))) {
    return badRequest("Your current password isn't right.");
  }

  const hash = await hashPassword(body.new_password);
  await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(hash, user.id).run();

  // Sign out anyone else holding an old session, but keep this one alive.
  const token = (request.headers.get("Cookie") || "").match(/session=([^;]+)/);
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND token != ?")
    .bind(user.id, token ? token[1] : "").run();

  return json({ ok: true });
}
