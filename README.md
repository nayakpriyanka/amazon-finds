# Amazon Finds

Static site hosted on GitHub Pages.

- **Link finder:** https://nayakpriyanka.github.io/amazon-finds/finds.html — search 800+ Amazon affiliate links by category and age, copy one or all.
- **Reels:** https://nayakpriyanka.github.io/amazon-finds/reels.html — add, edit and delete reels with their Amazon links; shows a video preview.
- **Tiny Testers:** https://nayakpriyanka.github.io/amazon-finds/ — age-wise toy and book picks with shareable lists.

## Updating links

The link finder reads the Google Sheet live every time it opens (see `sheet-config.js`):

- Add rows to the sheet with the full Amazon URL in the **Link** column (links hidden behind text like "Option 1" can't be read).
- The sheet must be shared as **Anyone with the link → Viewer**.
- A new tab needs an entry in `sheet-config.js` with its exact tab name.
- If the sheet can't be reached, the page shows the saved copy in `finds-data.js`.

Tiny Testers picks live in `toys.js`.

## Reels

Reels are stored in `reels.json` in this repo. Anyone can view them on the Reels page.

To add, edit or delete from the page, each editor needs a GitHub token once per browser:
[create a fine-grained token](https://github.com/settings/personal-access-tokens/new) →
Repository access: **Only select repositories → amazon-finds** → Permissions: **Contents → Read and write**.
Paste it into the "GitHub token" field when saving; the browser remembers it.

Each save is a commit to `reels.json`, so the change appears for everyone after the site redeploys (about a minute).
You can also edit `reels.json` directly on GitHub.
