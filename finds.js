const state = { q: "", cat: "all", age: "all" };

const AGE_ORDER = [
  "0–6 months", "0+ months", "3+ months", "6+ months", "9+ months",
  "1+ years", "1.5+ years", "1.5–4 years", "2+ years", "3+ years", "3–7 years",
  "4+ years", "4–5+ years", "5+ years", "6+ years", "6–16 years", "7+ years", "8+ years", "Any age"
];

const $ = id => document.getElementById(id);
const catName = id => (CATEGORIES.find(c => c.id === id) || {}).name || id;

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

function matchesSearch(item) {
  if (!state.q) return true;
  const hay = `${item.n} ${item.t} ${item.a || ""} ${catName(item.c)}`.toLowerCase();
  return state.q.toLowerCase().split(/\s+/).every(word => hay.includes(word));
}

function inCategory(item) { return state.cat === "all" || item.c === state.cat; }
function inAge(item) { return state.age === "all" || item.a === state.age; }

function visibleItems() {
  return FINDS.filter(i => inCategory(i) && inAge(i) && matchesSearch(i));
}

function renderCategoryChips() {
  const counts = {};
  FINDS.filter(matchesSearch).forEach(i => (counts[i.c] = (counts[i.c] || 0) + 1));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const chips = [{ id: "all", name: "All" }, ...CATEGORIES];
  $("cat-chips").innerHTML = chips.map(c => {
    const n = c.id === "all" ? total : counts[c.id] || 0;
    return `<button type="button" class="chip${state.cat === c.id ? " active" : ""}" data-cat="${c.id}"${n ? "" : " disabled"}>
      ${escapeHTML(c.name)} <span class="n">${n}</span></button>`;
  }).join("");
}

function renderAgeChips() {
  const ages = new Set(FINDS.filter(i => inCategory(i) && matchesSearch(i) && i.a).map(i => i.a));
  const box = $("age-chips");
  if (!ages.size) {
    box.hidden = true;
    state.age = "all";
    return;
  }
  if (state.age !== "all" && !ages.has(state.age)) state.age = "all";
  box.hidden = false;
  const sorted = AGE_ORDER.filter(a => ages.has(a));
  box.innerHTML = `<span class="label">Age:</span>` +
    ["all", ...sorted].map(a => `<button type="button" class="chip small${state.age === a ? " active" : ""}" data-age="${escapeHTML(a)}">${a === "all" ? "All ages" : escapeHTML(a)}</button>`).join("");
}

function renderList() {
  const items = visibleItems();
  const linked = items.filter(i => i.l).length;
  $("result-count").textContent = `${items.length} item${items.length === 1 ? "" : "s"} · ${linked} link${linked === 1 ? "" : "s"}`;
  $("copy-all").disabled = !linked;

  if (!items.length) {
    $("list").innerHTML = `<li class="empty">No matches. Try a shorter search or pick “All”.</li>`;
    return;
  }

  $("list").innerHTML = items.map(item => {
    const idx = FINDS.indexOf(item);
    const meta = [
      state.cat === "all" ? catName(item.c) : "",
      item.t && item.t !== item.n ? item.t : "",
      item.a || "",
      item.x || ""
    ].filter(Boolean).map(m => `<span>${escapeHTML(m)}</span>`).join("");
    const actions = item.l
      ? `<a class="link-text" href="${escapeHTML(item.l)}" target="_blank" rel="sponsored noopener noreferrer">${escapeHTML(item.l.replace(/^https?:\/\//, ""))}</a>
         <button type="button" class="copy" data-idx="${idx}">Copy</button>`
      : `<span class="missing">No link yet</span>`;
    return `<li class="row">
      <div class="info"><div class="name">${escapeHTML(item.n)}</div><div class="meta">${meta}</div></div>
      <div class="actions">${actions}</div>
    </li>`;
  }).join("");
}

function syncURL() {
  const p = new URLSearchParams();
  if (state.cat !== "all") p.set("cat", state.cat);
  if (state.age !== "all") p.set("age", state.age);
  if (state.q) p.set("q", state.q);
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

function render() {
  renderCategoryChips();
  renderAgeChips();
  renderList();
  syncURL();
}

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 1800);
}

async function copy(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    toast(msg);
  } catch {
    toast("Couldn't copy — long-press the link to copy it instead.");
  }
}

function init() {
  $("total-count").textContent = FINDS.filter(i => i.l).length;

  const p = new URLSearchParams(location.search);
  if (CATEGORIES.some(c => c.id === p.get("cat"))) state.cat = p.get("cat");
  if (p.get("age")) state.age = p.get("age");
  if (p.get("q")) state.q = $("search").value = p.get("q");

  $("search").addEventListener("input", e => { state.q = e.target.value.trim(); render(); });

  $("cat-chips").addEventListener("click", e => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.cat = btn.dataset.cat;
    state.age = "all";
    render();
  });

  $("age-chips").addEventListener("click", e => {
    const btn = e.target.closest("[data-age]");
    if (!btn) return;
    state.age = btn.dataset.age;
    render();
  });

  $("list").addEventListener("click", e => {
    const btn = e.target.closest(".copy");
    if (!btn) return;
    const item = FINDS[btn.dataset.idx];
    copy(item.l, "Link copied");
  });

  $("copy-all").addEventListener("click", () => {
    const lines = visibleItems().filter(i => i.l).map(i => `${i.n} — ${i.l}`);
    copy(lines.join("\n"), `${lines.length} links copied`);
  });

  $("copy-view").addEventListener("click", () => copy(location.href, "Page link copied"));

  render();
  const active = document.querySelector("#cat-chips .active");
  if (active) active.scrollIntoView({ block: "nearest", inline: "center" });
}

document.addEventListener("DOMContentLoaded", init);
