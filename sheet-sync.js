// Loads the link finder's items live from Google Sheets (see sheet-config.js).
// Tabs that fail to load keep the saved items from finds-data.js for that category.

const AGE_LABELS = {
  "0-6 months": "0–6 months", "0+ months": "0+ months", "3+ months": "3+ months",
  "6+ months": "6+ months", "9+ months": "9+ months",
  "1+ age": "1+ years", "1+ years": "1+ years", "1+": "1+ years",
  "1.5 age": "1.5+ years", "1.5+": "1.5+ years",
  "2+": "2+ years", "2+ years": "2+ years", "2+ year old": "2+ years", "2+ age": "2+ years",
  "3+": "3+ years", "3+ years": "3+ years", "3+ age": "3+ years",
  "4+": "4+ years", "4+ years": "4+ years", "4+ age": "4+ years", "4+ or 5+ age": "4–5+ years",
  "5+": "5+ years", "5+ years": "5+ years", "5+ age": "5+ years",
  "6+": "6+ years", "6+ years": "6+ years", "6+ age": "6+ years",
  "7+": "7+ years", "7+ years": "7+ years", "8+": "8+ years", "8+ years": "8+ years",
  "you can start at any change": "Any age", "any age": "Any age",
  "3-7 year old": "3–7 years", "6-16 year old": "6–16 years", "1.5 yr to 4 yr": "1.5–4 years"
};

const URL_RE = /https?:\/\/\S+/g;
const HAS_URL = /https?:\/\//;
const clean = s => String(s || "").replace(/\s+/g, " ").trim();

function sheetURL(id, tab) {
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(tab)}`;
}

// Minimal RFC 4180 CSV parser (handles quotes, commas and newlines inside cells).
function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function normalizeAge(raw) {
  const key = clean(raw).toLowerCase();
  return AGE_LABELS[key] || clean(raw);
}

// Turns one tab's rows into items, following the workbook's layout:
// a header row with "Link", ages written once per block, and occasional rows that only add another link.
function rowsToItems(rows, categoryId) {
  const items = [];
  let cols = null, age = "", prev = null;

  for (const raw of rows) {
    const cells = raw.map(clean);
    const lower = cells.map(c => c.toLowerCase());
    const linkHeader = lower.indexOf("link");

    if (linkHeader !== -1 && !cells.some(c => HAS_URL.test(c))) {
      const find = (...names) => names.map(n => lower.indexOf(n)).find(i => i !== -1) ?? -1;
      let item = find("item", "product name", "product");
      let type = find("type");
      if (type === -1 && item > 0 && lower[item - 1] === "") type = item - 1;
      cols = { link: linkHeader, item, type, age: find("age group", "age"), width: cells.length };
      continue;
    }
    if (!cols) continue;

    const at = i => (i >= 0 ? cells[i] || "" : "");
    const urls = cells.join(" ").match(URL_RE) || [];
    const link = (at(cols.link).match(URL_RE) || urls)[0] || "";
    let name = clean(at(cols.item).replace(URL_RE, ""));
    let type = clean(at(cols.type).replace(URL_RE, ""));
    const note = cells.filter((c, i) => i > cols.link && c && !HAS_URL.test(c)).join(" · ");

    if (cols.age >= 0 && at(cols.age)) age = normalizeAge(at(cols.age));
    if (!name && !type && !link) continue;

    const item = { c: categoryId, n: name, t: type, l: link };
    if (!name && type) item.n = type;
    if (!item.n && prev) { item.n = prev.n; item.x = "another option"; }
    if (!item.n) continue;
    if (age) item.a = age;
    if (note) item.x = item.x ? `${item.x} · ${note}` : note;
    items.push(item);
    prev = item;
  }
  return items;
}

const slugify = name => name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function fetchTab(tab) {
  const res = await fetch(sheetURL(SHEET_CONFIG.id, tab.sheet), { cache: "no-store" });
  if (!res.ok) throw new Error(`${tab.sheet}: HTTP ${res.status}`);
  const text = await res.text();
  if (/^\s*</.test(text)) throw new Error(`${tab.sheet}: sheet is not shared publicly`);
  return parseCSV(text);
}

// Returns { loaded, failed } tab names. Updates FINDS and CATEGORIES in place.
async function loadSheet() {
  if (typeof SHEET_CONFIG === "undefined" || !SHEET_CONFIG.tabs.length) return { loaded: [], failed: [] };

  const results = await Promise.allSettled(SHEET_CONFIG.tabs.map(fetchTab));
  const loaded = [], failed = [], live = [];
  const liveCats = new Set();

  results.forEach((r, i) => {
    const tab = SHEET_CONFIG.tabs[i];
    const id = slugify(tab.category);
    if (r.status === "fulfilled") {
      const items = rowsToItems(r.value, id);
      if (items.length) { live.push(...items); liveCats.add(id); loaded.push(tab.sheet); return; }
    }
    failed.push(tab.sheet);
  });

  if (!live.length) return { loaded, failed };

  // Map saved categories to the configured names so fallbacks merge cleanly.
  const savedName = id => (CATEGORIES.find(c => c.id === id) || {}).name || id;
  const saved = FINDS.map(i => ({ ...i, c: slugify(savedName(i.c)) }))
    .filter(i => !liveCats.has(i.c));

  const order = [];
  SHEET_CONFIG.tabs.forEach(t => { if (!order.some(c => c.name === t.category)) order.push({ id: slugify(t.category), name: t.category }); });
  CATEGORIES.forEach(c => { const id = slugify(c.name); if (!order.some(o => o.id === id)) order.push({ id, name: c.name }); });

  const merged = [...live, ...saved];
  const used = new Set(merged.map(i => i.c));
  CATEGORIES.splice(0, CATEGORIES.length, ...order.filter(c => used.has(c.id)));
  FINDS.splice(0, FINDS.length, ...merged);
  return { loaded, failed };
}
