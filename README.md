# Amazon Finds

Static site hosted on GitHub Pages.

- **Link finder:** https://nayakpriyanka.github.io/amazon-finds/finds.html — search 800+ Amazon affiliate links by category and age, copy one or all.
- **Tiny Testers:** https://nayakpriyanka.github.io/amazon-finds/ — age-wise toy and book picks with shareable lists.

## Updating links

The link finder reads the Google Sheet live every time it opens (see `sheet-config.js`):

- Add rows to the sheet with the full Amazon URL in the **Link** column (links hidden behind text like "Option 1" can't be read).
- The sheet must be shared as **Anyone with the link → Viewer**.
- A new tab needs an entry in `sheet-config.js` with its exact tab name.
- If the sheet can't be reached, the page shows the saved copy in `finds-data.js`.

Tiny Testers picks live in `toys.js`.
