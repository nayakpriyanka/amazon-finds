const $ = id => document.getElementById(id);
const KEY_STORE = "reels-github-token";

const UNLOCK_STORE = "reels-editor-unlocked";

// Editing is hidden behind a password. Only a salted PBKDF2 hash is stored here, never the password.
// This only hides the editing controls; saving still requires a GitHub token with write access.
const EDITOR_LOCK = { salt: "61382fd31322a5cf59c983583fe1812e", iterations: 310000, hash: "50afc500f756c4407d7f11ffe9a051742a72641069943ec4a3c7ef9df34de86b" };

let unlocked = false;
let reels = [];
let editingId = null;
let query = "";
let category = "all";

const REEL_CATEGORIES = [
  { id: "toys",     name: "🧸 Toys" },
  { id: "food",     name: "🍎 Food" },
  { id: "travel",   name: "✈️ Travel" },
  { id: "books",    name: "📚 Books" },
  { id: "babycare", name: "👶 Baby Care" },
  { id: "home",     name: "🏠 Home" },
  { id: "other",    name: "✨ Other" }
];
const catOf = r => (REEL_CATEGORIES.some(c => c.id === r.category) ? r.category : "other");
const catLabel = id => (REEL_CATEGORIES.find(c => c.id === id) || {}).name || id;

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

// ── Preview ──

function embedURL(link) {
  let m = link.match(/instagram\.com\/(?:[\w.]+\/)?(reels?|p|tv)\/([\w-]+)/i);
  if (m) return `https://www.instagram.com/${m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase()}/${m[2]}/embed`;
  m = link.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  return "";
}

function previewHTML(r) {
  const src = embedURL(r.reel);
  if (src) {
    return `<div class="preview"><iframe src="${escapeHTML(src)}" loading="lazy" allowfullscreen
      title="${escapeHTML(r.title || "Reel preview")}"></iframe></div>`;
  }
  return `<a class="preview fallback" href="${escapeHTML(r.reel)}" target="_blank" rel="noopener noreferrer">
    <span>▶</span>Open reel</a>`;
}

// ── Links text ⇄ list ──

function parseLinks(text) {
  return String(text || "").split("\n").map(l => l.trim()).filter(Boolean).map(line => {
    const m = line.match(/https?:\/\/\S+/);
    const url = m ? m[0] : "";
    const name = line.replace(url, "").replace(/[\s\-–—|:]+$/, "").trim();
    return { name, url };
  });
}

function linksToText(links) {
  return (links || []).map(l => (l.name ? `${l.name} - ${l.url}` : l.url)).join("\n");
}

// ── Rendering ──

const reelText = r => `${r.title} ${catLabel(catOf(r))} ${(r.links || []).map(l => l.name).join(" ")}`;

// Typo-tolerant match (see fuzzy.js).
// Recomputed on every render (the list is small): typo matches only when nothing matches exactly.
let exactOnly = false;
function updateExactOnly() {
  exactOnly = !!query && hasExactMatch(query, reels.map(reelText));
}

function matches(r) {
  return !query || fuzzyScore(query, reelText(r), exactOnly) > 0;
}

// Links to copy for the current view. When searching, a reel that matches by title gives all its
// links; otherwise only the products whose names match the search.
function linksInView(list) {
  const out = [];
  for (const r of list) {
    const linked = (r.links || []).filter(l => l.url);
    const byTitle = !query || fuzzyScore(query, `${r.title} ${catLabel(catOf(r))}`, exactOnly) > 0;
    for (const l of linked) if (byTitle || fuzzyScore(query, l.name, exactOnly) > 0) out.push(l);
  }
  const seen = new Set();
  return out.filter(l => !seen.has(l.url) && seen.add(l.url));
}

const hasLink = r => (r.links || []).some(l => l.url);

function renderCategoryChips(pool) {
  const counts = {};
  pool.filter(matches).forEach(r => (counts[catOf(r)] = (counts[catOf(r)] || 0) + 1));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const shown = REEL_CATEGORIES.filter(c => counts[c.id] || c.id === category);
  $("cat-chips").hidden = !pool.length;
  $("cat-chips").innerHTML = [{ id: "all", name: "All" }, ...shown].map(c =>
    `<button type="button" class="chip${category === c.id ? " active" : ""}" data-cat="${c.id}">
      ${escapeHTML(c.name)} <span class="n">${c.id === "all" ? total : counts[c.id] || 0}</span></button>`).join("");
}

function render() {
  // Visitors only see reels with at least one affiliate link; editors see everything so they can fix gaps.
  updateExactOnly();
  const pool = reels.filter(r => unlocked || hasLink(r));
  renderCategoryChips(pool);
  let list = pool.filter(r => matches(r) && (category === "all" || catOf(r) === category));
  if (query) list = list.map(r => [r, fuzzyScore(query, reelText(r), exactOnly)]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const viewLinks = linksInView(list);
  $("copy-view").hidden = !viewLinks.length;
  $("copy-view").textContent = query
    ? `📋 Copy ${viewLinks.length} link${viewLinks.length === 1 ? "" : "s"} for “${query}”`
    : `📋 Copy all ${viewLinks.length} links`;
  $("result-count").textContent = `${list.length} reel${list.length === 1 ? "" : "s"}`;

  if (!reels.some(x => unlocked || hasLink(x))) {
    $("reels").innerHTML = `<div class="empty-state">
      <h3>No reels yet</h3>
      <p>${unlocked ? "Click <strong>＋ Add reel</strong>, paste the reel link, give it a title and list the Amazon links shown in it." : "Reels added by the team will show up here."}</p>
    </div>`;
    return;
  }
  if (!list.length) {
    $("reels").innerHTML = `<p class="empty">No ${category === "all" ? "" : escapeHTML(catLabel(category).replace(/^\S+\s/, "")) + " "}reels${query ? ` match “${escapeHTML(query)}”` : " yet"}.</p>`;
    return;
  }

  $("reels").innerHTML = list.map(r => {
    const links = (r.links || []).filter(l => (unlocked ? l.url || l.name : l.url));
    const linkItems = links.length
      ? links.map((l, i) => `<li>
          <span class="lname">${escapeHTML(l.name || "Amazon link")}</span>
          ${l.url
            ? `<span class="lrow"><a class="link-text" href="${escapeHTML(l.url)}" target="_blank" rel="sponsored noopener noreferrer">${escapeHTML(l.url.replace(/^https?:\/\//, ""))}</a>
               <button type="button" class="copy" data-copy="${escapeHTML(r.id)}:${i}">Copy</button></span>`
            : `<span class="missing">No link yet</span>`}
        </li>`).join("")
      : `<li class="missing">No Amazon links added yet.</li>`;

    return `<article class="reel-card" data-id="${escapeHTML(r.id)}">
      ${previewHTML(r)}
      <div class="reel-body">
        <span class="cat-badge">${escapeHTML(catLabel(catOf(r)))}</span>
        <h3>${escapeHTML(r.title || "Untitled reel")}</h3>
        ${unlocked && !hasLink(r) ? `<p class="hidden-note">Hidden from visitors until it has at least one Amazon link.</p>` : ""}
        <a class="reel-link" href="${escapeHTML(r.reel)}" target="_blank" rel="noopener noreferrer">${escapeHTML(r.reel)}</a>
        <ol class="reel-links">${linkItems}</ol>
        <div class="card-actions">
          <button type="button" data-act="copy-all" ${links.some(l => l.url) ? "" : "disabled"}>📋 Copy all links</button>
          ${unlocked ? `<button type="button" data-act="edit">✏️ Edit</button>
          <button type="button" data-act="delete" class="danger">🗑 Delete</button>` : ""}
        </div>
      </div>
    </article>`;
  }).join("");
}

// ── Storage: reels.json in the GitHub repo ──
// Anyone can read it. Saving commits the updated file through the GitHub API,
// using a fine-grained token (Contents: read & write on this repo) kept in the editor's browser.

const REPO = { owner: "nayakpriyanka", repo: "amazon-finds", branch: "main", path: "reels.json" };
const API_URL = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${REPO.path}`;

const getToken = () => { try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; } };
const setToken = t => { try { t ? localStorage.setItem(KEY_STORE, t) : localStorage.removeItem(KEY_STORE); } catch {} };

const toBase64 = text => btoa(String.fromCharCode(...new TextEncoder().encode(text)));
const fromBase64 = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), c => c.charCodeAt(0)));

function githubError(res, data) {
  if (res.status === 401) return Object.assign(new Error("GitHub didn't accept that token. Check it and try again."), { code: "bad_token" });
  if (res.status === 403 || res.status === 404) return Object.assign(new Error("That token can't edit this repo. It needs Contents: Read and write access to nayakpriyanka/amazon-finds."), { code: "bad_token" });
  return new Error((data && data.message) || `GitHub returned an error (HTTP ${res.status}).`);
}

// Latest file straight from GitHub (needs a token; avoids the site's cache).
async function fetchRemote(token) {
  const res = await fetch(`${API_URL}?ref=${REPO.branch}&t=${Date.now()}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }, cache: "no-store"
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw githubError(res, data);
  return { sha: data.sha, list: JSON.parse(fromBase64(data.content) || "[]") };
}

// Applies one change to the latest file and commits it. Retries once if someone saved in between.
async function commitChange(token, change, message) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { sha, list } = await fetchRemote(token);
    const next = change(list);
    const res = await fetch(API_URL, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({ message, branch: REPO.branch, sha, content: toBase64(JSON.stringify(next, null, 2) + "\n") })
    });
    const data = await res.json().catch(() => null);
    if (res.ok) return next;
    if ((res.status === 409 || res.status === 422) && attempt === 0) continue;
    throw githubError(res, data);
  }
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `r${Date.now()}${Math.random().toString(36).slice(2, 8)}`);
const sorted = list => [...list].sort((a, b) => String(b.added || "").localeCompare(String(a.added || "")));

function setStatus(text, warn) {
  const el = $("source-status");
  el.textContent = text;
  el.classList.toggle("warn", !!warn);
}

async function load() {
  const token = getToken();
  try {
    if (token) {
      reels = sorted((await fetchRemote(token)).list);
      setStatus("Saved in GitHub · you can edit");
    } else {
      const res = await fetch(`reels.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      reels = sorted(await res.json());
      setStatus("Saved in GitHub");
    }
  } catch (err) {
    if (err.code === "bad_token") { setToken(""); return load(); }
    setStatus(`Couldn't load reels: ${err.message}`, true);
  }
  render();
}

// ── Editor ──

function openEditor(reel) {
  editingId = reel ? reel.id : null;
  $("editor-title").textContent = reel ? "Edit reel" : "Add a reel";
  $("save-btn").textContent = reel ? "Save changes" : "Save reel";
  $("f-reel").value = reel ? reel.reel : "";
  $("f-cat").value = reel ? catOf(reel) : (category !== "all" ? category : "toys");
  $("f-title").value = reel ? reel.title : "";
  $("f-links").value = reel ? linksToText(reel.links) : "";
  $("f-key").value = getToken();
  $("token-help").hidden = !!getToken();
  $("form-error").textContent = "";
  updateLinkCount();
  $("editor").hidden = false;
  $("editor").scrollIntoView({ behavior: "smooth", block: "start" });
  $("f-reel").focus({ preventScroll: true });
}

function closeEditor() {
  $("editor").hidden = true;
  editingId = null;
}

function updateLinkCount() {
  const links = parseLinks($("f-links").value);
  const bad = links.filter(l => !l.url).length;
  $("f-links-count").textContent = links.length
    ? `${links.length} link${links.length === 1 ? "" : "s"}${bad ? ` · ${bad} line${bad === 1 ? "" : "s"} without a URL` : ""}`
    : "";
}

async function save(e) {
  e.preventDefault();
  const reelLink = $("f-reel").value.trim();
  const token = $("f-key").value.trim();
  const err = $("form-error");

  if (!/^https?:\/\/\S+$/.test(reelLink)) { err.textContent = "Enter the full reel link, starting with https://"; $("f-reel").focus(); return; }
  if (!token) { err.textContent = "Enter your GitHub token to save (see the help link above)."; $("f-key").focus(); return; }

  const fields = { reel: reelLink, category: $("f-cat").value, title: $("f-title").value.trim(), links: parseLinks($("f-links").value) };
  const id = editingId;
  $("save-btn").disabled = true;
  $("save-btn").textContent = "Saving…";
  err.textContent = "";
  try {
    const next = await commitChange(token, list => {
      if (!id) return [...list, { id: newId(), ...fields, added: new Date().toISOString() }];
      if (!list.some(r => r.id === id)) throw new Error("That reel was deleted by someone else. Reload the page.");
      return list.map(r => (r.id === id ? { ...r, ...fields, updated: new Date().toISOString() } : r));
    }, id ? `Update reel: ${fields.title || fields.reel}` : `Add reel: ${fields.title || fields.reel}`);
    setToken(token);
    reels = sorted(next);
    setStatus("Saved in GitHub · you can edit");
    toast(id ? "Reel updated" : "Reel added");
    closeEditor();
    render();
  } catch (ex) {
    if (ex.code === "bad_token") setToken("");
    err.textContent = ex.message;
  } finally {
    $("save-btn").disabled = false;
    $("save-btn").textContent = editingId ? "Save changes" : "Save reel";
  }
}

async function remove(reel, btn) {
  if (!confirm(`Delete “${reel.title || reel.reel}”?`)) return;
  const token = getToken() || (prompt("Your GitHub token (needed to save changes)") || "").trim();
  if (!token) return;
  btn.disabled = true;
  try {
    const next = await commitChange(token, list => list.filter(r => r.id !== reel.id),
      `Delete reel: ${reel.title || reel.reel}`);
    setToken(token);
    reels = sorted(next);
    toast("Reel deleted");
    render();
  } catch (ex) {
    if (ex.code === "bad_token") setToken("");
    toast(ex.message);
    btn.disabled = false;
  }
}

// ── Editor lock ──

const hexToBytes = hex => Uint8Array.from(hex.match(/../g), b => parseInt(b, 16));
const bytesToHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

async function passwordMatches(pw) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(EDITOR_LOCK.salt), iterations: EDITOR_LOCK.iterations }, key, 256);
  return bytesToHex(bits) === EDITOR_LOCK.hash;
}

function setUnlocked(on) {
  unlocked = on;
  try { on ? localStorage.setItem(UNLOCK_STORE, EDITOR_LOCK.hash.slice(0, 16)) : localStorage.removeItem(UNLOCK_STORE); } catch {}
  $("add-btn").hidden = !on;
  $("lock-btn").textContent = on ? "🔓 Lock editing" : "🔒 Editor login";
  $("unlock-form").hidden = true;
  if (!on) closeEditor();
  render();
}

async function unlock(e) {
  e.preventDefault();
  const pw = $("unlock-pw").value;
  $("unlock-error").textContent = "";
  if (await passwordMatches(pw)) {
    $("unlock-pw").value = "";
    setUnlocked(true);
    toast("Editing unlocked");
  } else {
    $("unlock-error").textContent = "That password isn't right.";
    $("unlock-pw").select();
  }
}

// ── Copy & toast ──

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2000);
}

async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch { toast("Couldn't copy — long-press the link to copy it instead."); }
}

function init() {
  $("add-btn").addEventListener("click", () => { if (unlocked) openEditor(null); });
  $("lock-btn").addEventListener("click", () => {
    if (unlocked) { setUnlocked(false); toast("Editing locked"); return; }
    $("unlock-form").hidden = !$("unlock-form").hidden;
    if (!$("unlock-form").hidden) $("unlock-pw").focus();
  });
  $("unlock-form").addEventListener("submit", unlock);
  $("unlock-cancel").addEventListener("click", () => { $("unlock-form").hidden = true; });
  try { unlocked = localStorage.getItem(UNLOCK_STORE) === EDITOR_LOCK.hash.slice(0, 16); } catch {}
  if (unlocked) setUnlocked(true);
  $("cancel-btn").addEventListener("click", closeEditor);
  $("reel-form").addEventListener("submit", save);
  $("f-links").addEventListener("input", updateLinkCount);
  $("search").addEventListener("input", e => { query = e.target.value.trim(); render(); });
  $("copy-view").addEventListener("click", () => {
    const list = reels.filter(x => (unlocked || hasLink(x)) && matches(x) && (category === "all" || catOf(x) === category));
    const lines = linksInView(list).map(l => (l.name ? `${l.name} — ${l.url}` : l.url));
    copy(lines.join("\n"), `${lines.length} links copied`);
  });
  $("f-cat").innerHTML = REEL_CATEGORIES.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join("");
  $("cat-chips").addEventListener("click", e => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    category = btn.dataset.cat;
    render();
  });

  $("reels").addEventListener("click", e => {
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      const [id, i] = copyBtn.dataset.copy.split(":");
      const r = reels.find(x => x.id === id);
      if (r) copy(r.links[i].url, "Link copied");
      return;
    }
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const r = reels.find(x => x.id === btn.closest(".reel-card").dataset.id);
    if (!r) return;
    if (!unlocked && btn.dataset.act !== "copy-all") return;
    if (btn.dataset.act === "edit") openEditor(r);
    if (btn.dataset.act === "delete") remove(r, btn);
    if (btn.dataset.act === "copy-all") {
      const lines = r.links.filter(l => l.url).map(l => (l.name ? `${l.name} — ${l.url}` : l.url));
      copy(`${r.title ? r.title + "\n" : ""}${lines.join("\n")}`, `${lines.length} links copied`);
    }
  });

  load();
}

document.addEventListener("DOMContentLoaded", init);
