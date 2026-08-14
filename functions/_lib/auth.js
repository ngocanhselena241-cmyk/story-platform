// Shared helpers for hashing passwords, sessions, and reading the logged-in user.

const encoder = new TextEncoder();

export async function hashPassword(password, salt) {
  const saltBytes = salt ? hexToBytes(salt) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const hashHex = bytesToHex(new Uint8Array(derived));
  const saltHex = bytesToHex(saltBytes);
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex] = stored.split(":");
  const check = await hashPassword(password, saltHex);
  return check === stored;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

export function newToken() {
  return crypto.randomUUID() + crypto.randomUUID();
}

export function sessionCookie(token) {
  return `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`;
}

export function clearCookie() {
  return `session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

// Returns the logged-in user row, or null.
export async function getUser(request, env) {
  const token = getCookie(request, "session");
  if (!token) return null;
  const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE token = ?")
    .bind(token).first();
  if (!session) return null;
  const user = await env.DB.prepare(
    "SELECT id, username, email, role, bio, created_at FROM users WHERE id = ?"
  ).bind(session.user_id).first();
  return user;
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}

export function badRequest(message) {
  return json({ error: message }, 400);
}

export function unauthorized() {
  return json({ error: "You need to be logged in." }, 401);
}

export function forbidden() {
  return json({ error: "You don't have permission to do that." }, 403);
}
