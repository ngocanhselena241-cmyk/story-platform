import { getUser, json, badRequest, unauthorized, forbidden } from "../../_lib/auth.js";

// DELETE /api/admin/comment?id=
export async function onRequestDelete({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing comment id.");

  await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
