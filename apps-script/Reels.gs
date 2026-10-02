/**
 * Reels backend for the Amazon Finds site.
 *
 * Setup (one time, ~5 minutes):
 *  1. Open the Google Sheet → Extensions → Apps Script.
 *  2. Replace everything in Code.gs with this file. Change TEAM_KEY below to your own passcode.
 *  3. Deploy → New deployment → type "Web app".
 *     Execute as: Me.  Who has access: Anyone.  → Deploy, and allow access when asked.
 *  4. Copy the Web app URL (ends in /exec) into reels-config.js on the website.
 *
 * Data lives in a "Reels" tab (created automatically), one row per reel:
 *   ID | Reel Link | Title | Amazon Links | Updated
 * "Amazon Links" holds one link per line, e.g. "Busy board - https://amzn.to/abc".
 * Rows added by hand in the sheet show up on the site too (an ID is filled in automatically).
 */

const SHEET_NAME = 'Reels';
const TEAM_KEY = 'change-me';   // passcode the team types on the site to add, edit or delete
const HEADERS = ['ID', 'Reel Link', 'Title', 'Amazon Links', 'Updated'];

function doGet() {
  return json_({ ok: true, reels: readAll_() });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'Bad request.' });
  }
  if (String(body.key || '') !== TEAM_KEY) {
    return json_({ ok: false, error: 'Wrong team passcode.', code: 'bad_key' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const reel = body.reel || {};

    if (body.action === 'create' || body.action === 'update') {
      const link = String(reel.reel || '').trim();
      if (!/^https?:\/\//.test(link)) return json_({ ok: false, error: 'Reel link must start with http:// or https://' });
      const row = [reel.id || Utilities.getUuid(), link, String(reel.title || '').trim(), formatLinks_(reel.links), new Date()];

      if (body.action === 'create') {
        sh.appendRow(row);
      } else {
        const r = findRow_(sh, reel.id);
        if (!r) return json_({ ok: false, error: 'That reel no longer exists. Reload the page.' });
        sh.getRange(r, 1, 1, row.length).setValues([row]);
      }
    } else if (body.action === 'delete') {
      const r = findRow_(sh, reel.id);
      if (r) sh.deleteRow(r);
    } else {
      return json_({ ok: false, error: 'Unknown action.' });
    }
    return json_({ ok: true, reels: readAll_() });
  } finally {
    lock.releaseLock();
  }
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function readAll_() {
  const sh = sheet_();
  const values = sh.getDataRange().getValues();
  const reels = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[1] && !r[2] && !r[3]) continue;
    if (!r[0]) {
      r[0] = Utilities.getUuid();
      sh.getRange(i + 1, 1).setValue(r[0]);
    }
    reels.push({
      id: String(r[0]),
      reel: String(r[1]).trim(),
      title: String(r[2]).trim(),
      links: parseLinks_(r[3]),
      updated: r[4] instanceof Date ? r[4].toISOString() : String(r[4] || '')
    });
  }
  return reels;
}

function findRow_(sh, id) {
  if (!id) return 0;
  const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  for (let i = 1; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 1;
  return 0;
}

function parseLinks_(text) {
  return String(text || '').split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const m = line.match(/https?:\/\/\S+/);
    const url = m ? m[0] : '';
    const name = line.replace(url, '').replace(/[\s\-–—|:]+$/, '').trim();
    return { name: name, url: url };
  });
}

function formatLinks_(links) {
  return (links || [])
    .filter(l => l && (l.url || l.name))
    .map(l => (l.name ? l.name + ' - ' + (l.url || '') : l.url).trim())
    .join('\n');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
