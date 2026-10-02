// Typo-tolerant search shared by the link finder and the reels page.
// Every word in the query must match the text: exactly, as part of a word, or within a small
// number of typos (1 for words of 4–6 letters, 2 for longer words). Higher score = closer match.
// Typo matching is only used when nothing matches exactly ("pasta" shouldn't also find "paste").

const fuzzyCache = new Map();

function normalizeForSearch(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

// Levenshtein distance, stopping early once it exceeds `max`.
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function prepareText(text) {
  let entry = fuzzyCache.get(text);
  if (!entry) {
    const norm = normalizeForSearch(text);
    entry = { norm, words: [...new Set(norm.split(" "))] };
    if (fuzzyCache.size > 5000) fuzzyCache.clear();
    fuzzyCache.set(text, entry);
  }
  return entry;
}

function wordScore(q, { norm, words }) {
  if (norm.includes(q)) return words.includes(q) ? 4 : 3;        // whole word, or part of one
  const singular = q.replace(/(es|s)$/, "");
  if (singular.length >= 3 && norm.includes(singular)) return 3;  // "puzzles" → "puzzle"
  const tol = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  if (!tol) return 0;
  let best = 0;
  for (const w of words) {
    if (editDistance(q, w, tol) <= tol) return 2;                 // typo in a whole word
    if (w.length > q.length && editDistance(q, w.slice(0, q.length), tol) <= tol) best = 1; // typo while still typing
  }
  return best;
}

// Returns 0 when the text doesn't match the query, otherwise a score (higher is closer).
// With `exactOnly`, typo matches don't count.
function fuzzyScore(query, text, exactOnly = false) {
  const terms = normalizeForSearch(query).split(" ").filter(Boolean);
  if (!terms.length) return 1;
  const prepared = prepareText(text);
  let total = 0;
  for (const t of terms) {
    const s = wordScore(t, prepared);
    if (!s || (exactOnly && s < 3)) return 0;
    total += s;
  }
  return total;
}

// True when at least one text matches the query without typos — then typo matches are left out.
function hasExactMatch(query, texts) {
  return texts.some(t => fuzzyScore(query, t, true) > 0);
}
