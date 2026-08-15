import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// POST /api/report { target_type, target_ref, reason }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.target_type || !body.reason || !body.reason.trim()) {
    return badRequest("target_type and reason are required.");
  }

  await env.DB.prepare(
    "INSERT INTO reports (reporter_id, target_type, target_ref, reason, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(user.id, body.target_type, (body.target_ref || "").trim(), body.reason.trim(), Date.now()).run();

  return json({ ok: true });
}
