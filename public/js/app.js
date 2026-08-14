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

  let profile = null;
  if (user) {
    try { ({ profile } = await api("/api/profile")); } catch (e) {}
  }

  const mainLinks = [`<a href="/index.html">Home</a>`];
  if (user && (user.role === "uploader" || user.role === "admin")) mainLinks.push(`<a href="/upload.html">Upload</a>`);
  if (user && user.role === "admin") mainLinks.push(`<a href="/admin.html">Admin</a>`);

  let rightSide;
  if (user) {
    const avatarEl = profile && profile.avatar
      ? `<img class="profile-avatar" src="${profile.avatar}" alt="">`
      : `<div class="profile-avatar">${escapeHtml(user.username[0].toUpperCase())}</div>`;
    rightSide = `
      <div class="profile-menu">
        <div class="profile-trigger">${avatarEl}<span>${escapeHtml(user.username)}</span></div>
        <div class="profile-dropdown">
          <a href="/profile.html">Your profile</a>
          <a href="/library.html">Library</a>
          <a href="/stats.html">Stats</a>
          <a href="/quotes.html">My Quotes</a>
          <a href="/settings.html">Settings</a>
          <a href="#" id="logout-link">Log out</a>
        </div>
      </div>`;
  } else {
    rightSide = `<a href="/login.html">Log in</a> <a href="/signup.html" class="btn small">Sign up</a>`;
  }

  el.innerHTML = `
    <nav class="topnav"><div class="container">
      <a class="brand" href="/index.html">Nayedaba</a>
      <div class="nav-links">${mainLinks.join("")}<button class="theme-toggle" id="theme-btn">🌓</button>${rightSide}</div>
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

// ---- Image helper: pick a file, resize it, return base64 data URL ----
function pickAndResizeImage(maxWidth, callback) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = URL.createObjectURL(file);
  };
  input.click();
}

// ---- Cover card renderer (used on homepage grids) ----
function renderCoverCard(s) {
  const rating = s.avg_rating ? Number(s.avg_rating).toFixed(1) : "—";
  const coverEl = s.cover
    ? `<img src="${s.cover}" alt="">`
    : `<div class="cover-placeholder">${escapeHtml(s.title)}</div>`;
  const tags = (s.genres || "").split(",").map(g => g.trim()).filter(Boolean).slice(0, 5)
    .map(g => `<span class="tag">${escapeHtml(g)}</span>`).join(" ");
  return `<div class="cover-wrap">
    <a class="cover-card" href="/story.html?id=${s.id}">
      ${coverEl}
      <div class="cover-info">
        <div class="cover-title">${escapeHtml(s.title)}</div>
        ⭐ ${rating} · 👁 ${s.views}${s.latest_chapter ? ` · Ch. ${s.latest_chapter}` : ""}
      </div>
    </a>
    <div class="cover-side">
      <div class="cover-side-title">${escapeHtml(s.title)}</div>
      <div>${tags}</div>
      <div class="cover-side-desc">${escapeHtml((s.description || "").slice(0, 400))}</div>
    </div>
  </div>`;
}

// Flip the side panel to the left for cards near the right edge
document.addEventListener("mouseover", (e) => {
  const wrap = e.target.closest && e.target.closest(".cover-wrap");
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  wrap.classList.toggle("flip", rect.right + 245 > window.innerWidth);
});

// ---- Scroll to top/bottom buttons (all pages) ----
(function initScrollButtons() {
  const el = document.createElement("div");
  el.id = "scroll-btns";
  el.innerHTML = `<button id="scroll-top" title="Top of page">↑</button><button id="scroll-bottom" title="Bottom of page">↓</button>`;
  document.body.appendChild(el);
  el.querySelector("#scroll-top").onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  el.querySelector("#scroll-bottom").onclick = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
})();
