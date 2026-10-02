const STAR_LABELS = { 5: "★★★★★", 4: "★★★★☆", 3: "★★★☆☆", 2: "★★☆☆☆", 1: "★☆☆☆☆" };
const TAG_LABELS  = { hit: "⭐ Top Pick", budget: "💰 Budget-Friendly", skip: "👎 Skip It" };

const SECTIONS = {
  "0-3":  "grid-0-3",
  "3-6":  "grid-3-6",
  "6-9":  "grid-6-9",
  "9-12": "grid-9-12",
  "1-2":  "grid-1-2",
  "2-3":  "grid-2-3",
  "3-4":  "grid-3-4"
};

const AGE_LABELS = {
  "0-3":  "0–3 months",
  "3-6":  "3–6 months",
  "6-9":  "6–9 months",
  "9-12": "9–12 months",
  "1-2":  "1–2 years",
  "2-3":  "2–3 years",
  "3-4":  "3–4 years"
};

function cardHTML(toy) {
  return `
      <article class="toy-card">
        <div class="toy-emoji">${toy.emoji}</div>
        <div class="toy-body">
          <div class="toy-name">${toy.name}</div>
          <div class="toy-desc">${toy.desc}</div>
          <div class="toy-meta">
            <span class="stars" title="${toy.stars} / 5">${STAR_LABELS[toy.stars] || ""}</span>
            <span class="tags">
              ${(toy.tags || []).map(t => `<span class="tag ${t}">${TAG_LABELS[t] || t}</span>`).join("")}
            </span>
          </div>
          ${toy.link ? `<a class="buy-btn" href="${toy.link}" target="_blank" rel="sponsored noopener noreferrer">🛒 Buy on Amazon</a>` : ""}
        </div>
      </article>
    `;
}

function renderToys() {
  for (const [key, gridId] of Object.entries(SECTIONS)) {
    const grid = document.getElementById(gridId);
    const toys = TOYS[key] || [];

    if (!toys.length) {
      grid.innerHTML = '<p class="empty">No toys added yet — check back soon!</p>';
      continue;
    }

    grid.innerHTML = toys.map(cardHTML).join("");
  }
}

// ── Age finder & sharing ──

function ageToKey(value, unit) {
  const months = unit === "years" ? value * 12 : value;
  if (months < 3)  return "0-3";
  if (months < 6)  return "3-6";
  if (months < 9)  return "6-9";
  if (months < 12) return "9-12";
  if (months < 24) return "1-2";
  if (months < 36) return "2-3";
  return "3-4";
}

const finder = { key: null, type: "all" };

function currentItems() {
  const items = TOYS[finder.key] || [];
  if (finder.type === "all") return items;
  return items.filter(item => (item.type || "toy") === finder.type);
}

function shareURL() {
  const url = new URL(location.href);
  url.search = "";
  url.hash = "finder";
  url.searchParams.set("age", finder.key);
  if (finder.type !== "all") url.searchParams.set("type", finder.type);
  return url.toString();
}

function shareText() {
  const what = finder.type === "book" ? "books" : finder.type === "toy" ? "toys" : "toys & books";
  const lines = currentItems().map(item => `• ${item.name}${item.link ? " — " + item.link : ""}`);
  return `Our favourite ${what} for ${AGE_LABELS[finder.key]} 🧸📚\n\n${lines.join("\n")}\n\nFull list: ${shareURL()}`;
}

function setStatus(msg) {
  const el = document.getElementById("share-status");
  el.textContent = msg;
  clearTimeout(setStatus.timer);
  setStatus.timer = setTimeout(() => (el.textContent = ""), 2500);
}

async function copy(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(msg);
  } catch {
    setStatus("Couldn't copy — please copy the link from the address bar.");
  }
}

function renderFinder() {
  const results = document.getElementById("finder-results");
  if (!finder.key) { results.hidden = true; return; }
  results.hidden = false;

  document.getElementById("results-title").textContent = `Picks for ${AGE_LABELS[finder.key]}`;
  document.querySelectorAll(".type-tabs button").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.type === finder.type));

  const items = currentItems();
  document.getElementById("results-grid").innerHTML = items.length
    ? items.map(cardHTML).join("")
    : '<p class="empty">Nothing in this category for this age yet — check back soon!</p>';

  const linked = items.filter(item => item.link);
  document.getElementById("link-list").innerHTML = linked.length
    ? linked.map(item => `
        <li>
          <span class="link-name">${item.name}</span>
          <a href="${item.link}" target="_blank" rel="sponsored noopener noreferrer">${item.link}</a>
        </li>`).join("")
    : `<li class="empty-links">${items.length ? "No links added for these items yet." : "Nothing in this category yet."}</li>`;

  document.getElementById("share-whatsapp").href =
    "https://wa.me/?text=" + encodeURIComponent(shareText());
  history.replaceState(null, "", shareURL());
}

function initFinder() {
  document.getElementById("finder-form").addEventListener("submit", e => {
    e.preventDefault();
    const value = Number(document.getElementById("age-value").value);
    const unit = document.getElementById("age-unit").value;
    finder.key = ageToKey(value, unit);
    renderFinder();
  });

  document.querySelectorAll(".type-tabs button").forEach(btn =>
    btn.addEventListener("click", () => { finder.type = btn.dataset.type; renderFinder(); }));

  const nativeBtn = document.getElementById("share-native");
  if (navigator.share) {
    nativeBtn.hidden = false;
    nativeBtn.addEventListener("click", () =>
      navigator.share({ title: "Tiny Testers picks", text: shareText() }).catch(() => {}));
  }
  document.getElementById("share-copy-link").addEventListener("click", () => copy(shareURL(), "Link copied!"));
  document.getElementById("share-copy-list").addEventListener("click", () => copy(shareText(), "List copied!"));

  // Open a shared link directly, e.g. ?age=6-9&type=book
  const params = new URLSearchParams(location.search);
  if (TOYS[params.get("age")]) {
    finder.key = params.get("age");
    if (["toy", "book"].includes(params.get("type"))) finder.type = params.get("type");
    renderFinder();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderToys();
  initFinder();
});
