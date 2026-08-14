import { verifyPassword, newToken, sessionCookie, json, badRequest } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.password) {
    return badRequest("Email and password are required.");
  }

  const user = await env.DB.prepare(
    "SELECT id, username, password_hash, role FROM users WHERE email = ?"
  ).bind(body.email).first();

  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    return badRequest("Incorrect email or password.");
  }

  const token = newToken();
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)"
  ).bind(token, user.id, Date.now()).run();

  return json(
    { id: user.id, username: user.username, role: user.role },
    200,
    { "Set-Cookie": sessionCookie(token) }
  );
}
