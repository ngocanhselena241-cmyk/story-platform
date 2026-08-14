// ---- Theme (light/dark) ----
function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}
initTheme();

// ---- API helper ----
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include"
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

// ---- Nav bar (shared across all pages) ----
async function renderNav() {
  const el = document.getElementById("nav");
  if (!el) return;
  let user = null;
  try { ({ user } = await api("/api/me")); } catch (e) {}

  const links = [`<a href="/index.html">Home</a>`];
  if (user) {
    if (user.role === "uploader" || user.role === "admin") links.push(`<a href="/upload.html">Upload</a>`);
    if (user.role === "admin") links.push(`<a href="/admin.html">Admin</a>`);
    links.push(`<a href="/quotes.html">My Quotes</a>`);
    links.push(`<a href="/stats.html">Stats</a>`);
    links.push(`<span class="muted">Hi, ${escapeHtml(user.username)}</span>`);
    links.push(`<a href="#" id="logout-link">Log out</a>`);
  } else {
    links.push(`<a href="/login.html">Log in</a>`);
    links.push(`<a href="/signup.html">Sign up</a>`);
  }
  links.push(`<button class="theme-toggle" id="theme-btn">🌓</button>`);

  el.innerHTML = `
    <nav class="topnav"><div class="container">
      <a class="brand" href="/index.html">My Stories</a>
      <div class="nav-links">${links.join("")}</div>
    </div></nav>`;

  document.getElementById("theme-btn").onclick = toggleTheme;
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.onclick = async (e) => {
      e.preventDefault();
      await api("/api/logout", { method: "POST" });
      window.location.href = "/index.html";
    };
  }
  return user;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [name, secs] of units) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val} ${name}${val > 1 ? "s" : ""} ago`;
  }
  return "just now";
}
