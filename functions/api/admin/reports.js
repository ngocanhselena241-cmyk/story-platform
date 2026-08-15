import { getUser, json, badRequest, unauthorized, forbidden } from "../../_lib/auth.js";

// GET /api/admin/reports -> open reports
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const { results } = await env.DB.prepare(
    `SELECT r.*, u.username AS reporter_name
     FROM reports r JOIN users u ON u.id = r.reporter_id
     WHERE r.status = 'open' ORDER BY r.created_at ASC`
  ).all();
  return json({ reports: results });
}

// PUT /api/admin/reports { id } -> mark resolved
export async function onRequestPut({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const body = await request.json().catch(() => null);
  if (!body || !body.id) return badRequest("Missing report id.");

  await env.DB.prepare("UPDATE reports SET status = 'resolved' WHERE id = ?").bind(body.id).run();
  return json({ ok: true });
}
