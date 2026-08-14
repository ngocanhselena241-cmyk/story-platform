import { hashPassword, newToken, sessionCookie, json, badRequest } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || !body.username || !body.email || !body.password) {
    return badRequest("Username, email, and password are all required.");
  }
  if (body.password.length < 8) {
    return badRequest("Password must be at least 8 characters.");
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE email = ? OR username = ?"
  ).bind(body.email, body.username).first();
  if (existing) return badRequest("That username or email is already taken.");

  const hash = await hashPassword(body.password);
  const now = Date.now();
  const result = await env.DB.prepare(
    "INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, 'reader', ?)"
  ).bind(body.username, body.email, hash, now).run();

  const userId = result.meta.last_row_id;
  const token = newToken();
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)"
  ).bind(token, userId, now).run();

  return json(
    { id: userId, username: body.username, role: "reader" },
    200,
    { "Set-Cookie": sessionCookie(token) }
  );
}
