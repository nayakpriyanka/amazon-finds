const $ = id => document.getElementById(id);
const KEY_STORE = "reels-team-key";

let reels = [];
let editingId = null;
let query = "";

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

function matches(r) {
  if (!query) return true;
  const hay = `${r.title} ${r.reel} ${(r.links || []).map(l => `${l.name} ${l.url}`).join(" ")}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).every(w => hay.includes(w));
}

function render() {
  const list = reels.filter(matches);
  $("result-count").textContent = `${list.length} reel${list.length === 1 ? "" : "s"}`;

  if (!reels.length) {
    $("reels").innerHTML = `<div class="empty-state">
      <h3>No reels yet</h3>
      <p>Click <strong>＋ Add reel</strong>, paste the reel link, give it a title and list the Amazon links shown in it.</p>
    </div>`;
    return;
  }
  if (!list.length) {
    $("reels").innerHTML = `<p class="empty">No reels match “${escapeHTML(query)}”.</p>`;
    return;
  }

  $("reels").innerHTML = list.map(r => {
    const links = (r.links || []).filter(l => l.url || l.name);
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
        <h3>${escapeHTML(r.title || "Untitled reel")}</h3>
        <a class="reel-link" href="${escapeHTML(r.reel)}" target="_blank" rel="noopener noreferrer">${escapeHTML(r.reel)}</a>
        <ol class="reel-links">${linkItems}</ol>
        <div class="card-actions">
          <button type="button" data-act="copy-all" ${links.some(l => l.url) ? "" : "disabled"}>📋 Copy all links</button>
          <button type="button" data-act="edit">✏️ Edit</button>
          <button type="button" data-act="delete" class="danger">🗑 Delete</button>
        </div>
      </div>
    </article>`;
  }).join("");
}

// ── Backend (Google Apps Script web app) ──

const configured = () => typeof REELS_CONFIG !== "undefined" && /^https:\/\//.test(REELS_CONFIG.scriptUrl || "");

async function api(body) {
  const res = body
    ? await fetch(REELS_CONFIG.scriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
    : await fetch(REELS_CONFIG.scriptUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`The sheet returned an error (HTTP ${res.status}).`);
  const data = await res.json();
  if (!data.ok) { const e = new Error(data.error || "Something went wrong."); e.code = data.code; throw e; }
  return data.reels || [];
}

function setStatus(text, warn) {
  const el = $("source-status");
  el.textContent = text;
  el.classList.toggle("warn", !!warn);
}

async function load() {
  if (!configured()) {
    setStatus("Not connected to the Google Sheet yet — see apps-script/Reels.gs to set it up.", true);
    render();
    return;
  }
  try {
    reels = (await api()).reverse();
    setStatus("Live from Google Sheet");
  } catch (err) {
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
  $("f-title").value = reel ? reel.title : "";
  $("f-links").value = reel ? linksToText(reel.links) : "";
  try { $("f-key").value = localStorage.getItem(KEY_STORE) || ""; } catch {}
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
  const key = $("f-key").value.trim();
  const err = $("form-error");

  if (!/^https?:\/\/\S+$/.test(reelLink)) { err.textContent = "Enter the full reel link, starting with https://"; $("f-reel").focus(); return; }
  if (!configured()) { err.textContent = "The page isn't connected to the Google Sheet yet, so it can't save. Set up apps-script/Reels.gs first."; return; }
  if (!key) { err.textContent = "Enter the team passcode to save."; $("f-key").focus(); return; }

  const reel = { id: editingId || undefined, reel: reelLink, title: $("f-title").value.trim(), links: parseLinks($("f-links").value) };
  $("save-btn").disabled = true;
  err.textContent = "";
  try {
    reels = (await api({ action: editingId ? "update" : "create", key, reel })).reverse();
    try { localStorage.setItem(KEY_STORE, key); } catch {}
    toast(editingId ? "Reel updated" : "Reel added");
    closeEditor();
    render();
  } catch (ex) {
    if (ex.code === "bad_key") { try { localStorage.removeItem(KEY_STORE); } catch {} }
    err.textContent = ex.message;
  } finally {
    $("save-btn").disabled = false;
  }
}

async function remove(reel, btn) {
  if (!confirm(`Delete “${reel.title || reel.reel}”? This removes it from the Google Sheet too.`)) return;
  let key = "";
  try { key = localStorage.getItem(KEY_STORE) || ""; } catch {}
  if (!key) key = (prompt("Team passcode") || "").trim();
  if (!key) return;
  btn.disabled = true;
  try {
    reels = (await api({ action: "delete", key, reel: { id: reel.id } })).reverse();
    try { localStorage.setItem(KEY_STORE, key); } catch {}
    toast("Reel deleted");
    render();
  } catch (ex) {
    if (ex.code === "bad_key") { try { localStorage.removeItem(KEY_STORE); } catch {} }
    toast(ex.message);
    btn.disabled = false;
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
  $("add-btn").addEventListener("click", () => openEditor(null));
  $("cancel-btn").addEventListener("click", closeEditor);
  $("reel-form").addEventListener("submit", save);
  $("f-links").addEventListener("input", updateLinkCount);
  $("search").addEventListener("input", e => { query = e.target.value.trim(); render(); });

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
