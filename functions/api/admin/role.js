import { getUser, json, badRequest, unauthorized, forbidden } from "../../_lib/auth.js";

// POST /api/admin/role  { username, role }  role: reader | uploader | admin
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const body = await request.json().catch(() => null);
  if (!body || !body.username || !body.role) return badRequest("username and role are required.");
  if (!["reader", "uploader", "admin"].includes(body.role)) return badRequest("Invalid role.");

  const result = await env.DB.prepare("UPDATE users SET role = ? WHERE username = ?")
    .bind(body.role, body.username).run();

  if (result.meta.changes === 0) return json({ error: "User not found." }, 404);
  return json({ ok: true });
}
