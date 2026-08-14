import { getUser, json, badRequest, unauthorized, forbidden } from "../../_lib/auth.js";

// POST /api/admin/approve  { story_id, approve: true|false }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const body = await request.json().catch(() => null);
  if (!body || !body.story_id) return badRequest("Missing story_id.");

  const status = body.approve === false ? "rejected" : "approved";
  await env.DB.prepare("UPDATE stories SET approval_status = ? WHERE id = ?")
    .bind(status, body.story_id).run();

  return json({ ok: true });
}
