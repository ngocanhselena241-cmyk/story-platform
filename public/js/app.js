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

// ---- Icons ----
// Minimal line icons, drawn on a 24x24 grid and inheriting the surrounding
// text colour and size. Use icon("eye") anywhere a string of HTML is built.
const ICONS = {
  eye: `<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.75"/>`,
  comment: `<path d="M21 14.5a2.5 2.5 0 0 1-2.5 2.5H8.5L4 21V5.5A2.5 2.5 0 0 1 6.5 3h12A2.5 2.5 0 0 1 21 5.5Z"/>`,
  star: `<path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.73L6.8 19.65l1-5.8-4.2-4.1 5.8-.85Z"/>`,
  bell: `<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 8-2.5 8h17S18 14.5 18 8.5"/><path d="M13.7 20.5a2 2 0 0 1-3.4 0"/>`,
  bellOff: `<path d="M18 8.5a6 6 0 0 0-9.3-5M5.2 7A6 6 0 0 0 6 8.5c0 6-2.5 8-2.5 8h13"/><path d="M13.7 20.5a2 2 0 0 1-3.4 0"/><path d="M3 3l18 18"/>`,
  trash: `<path d="M3.5 6h17M9 6V4.2A1.2 1.2 0 0 1 10.2 3h3.6A1.2 1.2 0 0 1 15 4.2V6m3.5 0v13.3A1.7 1.7 0 0 1 16.8 21H7.2a1.7 1.7 0 0 1-1.7-1.7V6"/><path d="M10 10.5v6M14 10.5v6"/>`,
  pencil: `<path d="M12 20.5h8.5"/><path d="M16.4 3.9a2.1 2.1 0 0 1 3 3L7.6 18.7l-4 1 1-4Z"/>`,
  close: `<path d="M18 6 6 18M6 6l12 12"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  search: `<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16"/>`,
  arrowLeft: `<path d="M19 12H5M11.5 5 5 12l6.5 7"/>`,
  arrowRight: `<path d="M5 12h14M12.5 5 19 12l-6.5 7"/>`,
  arrowUp: `<path d="M12 19V5M5 11.5 12 5l7 6.5"/>`,
  arrowDown: `<path d="M12 5v14M5 12.5 12 19l7-6.5"/>`,
  book: `<path d="M4 19.2V5.4A2.4 2.4 0 0 1 6.4 3H20v14H6.4A2.4 2.4 0 0 0 4 19.4 2.4 2.4 0 0 0 6.4 21H20"/>`,
  bookOpen: `<path d="M12 7.2A4.2 4.2 0 0 0 7.8 4H2.5v13.5h5.8A3.7 3.7 0 0 1 12 21a3.7 3.7 0 0 1 3.7-3.5h5.8V4h-5.3A4.2 4.2 0 0 0 12 7.2Zm0 0V21"/>`,
  quill: `<path d="M20.2 12.2a6 6 0 0 0-8.5-8.5L5 10.5V19h8.5Z"/><path d="M16 8 2.5 21.5M17.5 15H9"/>`,
  library: `<path d="M4 4.5h3.5V21H4zM10.2 4.5h3.5V21h-3.5z"/><path d="m17.2 5.8 3.3.9L17 21"/>`,
  flame: `<path d="M12 21.5c3.6 0 6.5-2.6 6.5-6.3 0-4.6-4-6.3-4-10.2-2 1-3.3 3-3.3 5.2-1-1-1.6-2.4-1.7-3.8C7.2 8.2 5.5 11 5.5 15.2c0 3.7 2.9 6.3 6.5 6.3Z"/>`,
  sun: `<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>`,
  moon: `<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.8 6.8 0 0 0 10 10Z"/>`,
  contrast: `<circle cx="12" cy="12" r="8.75"/><path d="M12 3.25a8.75 8.75 0 0 1 0 17.5Z" fill="currentColor" stroke="none"/>`,
  thumbUp: `<path d="M7 10.5v10H4.7A1.2 1.2 0 0 1 3.5 19.3v-7.6a1.2 1.2 0 0 1 1.2-1.2Z"/><path d="M7 10.5 11 3.5a2.4 2.4 0 0 1 2.4 3l-.7 4h5.4a2 2 0 0 1 2 2.4l-1.3 5.7a2 2 0 0 1-2 1.4H7Z"/>`,
  thumbDown: `<g transform="rotate(180 12 12)"><path d="M7 10.5v10H4.7A1.2 1.2 0 0 1 3.5 19.3v-7.6a1.2 1.2 0 0 1 1.2-1.2Z"/><path d="M7 10.5 11 3.5a2.4 2.4 0 0 1 2.4 3l-.7 4h5.4a2 2 0 0 1 2 2.4l-1.3 5.7a2 2 0 0 1-2 1.4H7Z"/></g>`,
  image: `<rect x="3" y="4.5" width="18" height="15" rx="2.2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m3.6 17.8 4.9-4 3.5 2.8 3.2-2.4 5.2 4.4"/>`
};

function icon(name, cls = "") {
  const body = ICONS[name];
  return body ? `<svg class="icon${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>` : "";
}

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

  const mainLinks = [`<a href="/index.html">Home</a>`, `<a href="/discussion.html">Discussion</a>`, `<a href="/top.html">Ranking</a>`];
  if (user) mainLinks.push(`<a href="/report.html">Report</a>`);
  if (user && (user.role === "uploader" || user.role === "admin")) mainLinks.push(`<a href="/upload.html">Upload</a>`);
  if (user && user.role === "admin") mainLinks.push(`<a href="/admin.html">Admin</a>`);

  let bellHtml = "";
  if (user) {
    bellHtml = `<div class="bell-wrap">
      <button class="bell-btn" id="bell-btn">${icon("bell")}<span class="bell-count" id="bell-count" style="display:none;"></span></button>
      <div class="bell-dropdown" id="bell-dropdown"></div>
    </div>`;
  }

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
    rightSide = `<a href="/login.html">Log in</a> <a href="/signup.html" class="btn small signup-btn">Sign up</a>`;
  }

  el.innerHTML = `
    <nav class="topnav"><div class="container">
      <a class="brand" href="/index.html">Nayedaba</a>
      <div class="nav-links">${mainLinks.join("")}${bellHtml}<button class="theme-toggle" id="theme-btn" title="Switch theme">${icon("contrast", "icon-lg")}</button>${rightSide}</div>
    </div></nav>`;

  document.getElementById("theme-btn").onclick = toggleTheme;

  if (user) {
    const bellBtn = document.getElementById("bell-btn");
    const dropdown = document.getElementById("bell-dropdown");
    try {
      const { notifications, unread } = await api("/api/notifications");
      const count = document.getElementById("bell-count");
      if (unread > 0) { count.textContent = unread > 9 ? "9+" : unread; count.style.display = "inline-block"; }
      dropdown.innerHTML = notifications.length
        ? notifications.map(n => `<a class="${n.is_read ? "" : "unread"}"
            href="${n.story_id ? `/read.html?story=${n.story_id}&chapter=${n.chapter_number}` : "#"}">
            ${escapeHtml(n.message)}<div class="muted" style="font-size:0.72rem;">${timeAgo(n.created_at)}</div></a>`).join("")
        : `<div style="padding:14px;" class="muted">No notifications yet.</div>`;
      bellBtn.onclick = async () => {
        dropdown.classList.toggle("open");
        if (dropdown.classList.contains("open") && unread > 0) {
          await api("/api/notifications", { method: "POST" });
          document.getElementById("bell-count").style.display = "none";
        }
      };
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".bell-wrap")) dropdown.classList.remove("open");
      });
    } catch (e) {}
  }
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
        <span class="meta-icon">${icon("star")}${rating}</span> · <span class="meta-icon">${icon("eye")}${s.views}</span>${s.latest_chapter ? ` · Ch. ${s.latest_chapter}` : ""}
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
  el.innerHTML = `<button id="scroll-top" title="Top of page">${icon("arrowUp")}</button><button id="scroll-bottom" title="Bottom of page">${icon("arrowDown")}</button>`;
  document.body.appendChild(el);
  el.querySelector("#scroll-top").onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  el.querySelector("#scroll-bottom").onclick = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
})();
