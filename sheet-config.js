// Live data source for the link finder.
// The page reads these Google Sheet tabs every time it opens, so new rows show up automatically.
// If the sheet can't be reached, the page falls back to the saved copy in finds-data.js.
//
// Requirements:
//  - Sheet sharing: "Anyone with the link" → Viewer.
//  - `sheet` must match the tab name exactly (as shown on the tab at the bottom of the sheet).
//  - `category` is the name shown on the page. Tabs that share a category are merged.
//  - Each tab needs a header row with a "Link" column, plus "Item" or "Product Name".
//    "Age" / "Age Group" and "Type" columns are optional.
const SHEET_CONFIG = {
  id: "16mPoe4ApdCN7iZZM0d9RECypOqogasCfQLRKX_LMNkQ",
  tabs: [
    { sheet: "Books",              category: "Books" },
    { sheet: "Toys",               category: "Toys" },
    { sheet: "Art & Craft",        category: "Art & Craft" },
    { sheet: "Travel",             category: "Travel" },
    { sheet: "Games & Gifts",      category: "Games & Gifts" },
    { sheet: "Active Play",        category: "Active Play & Kids' Room" },
    { sheet: "Pretend Play",       category: "Pretend Play" },
    { sheet: "Feeding",            category: "Feeding" },
    { sheet: "Baby Care",          category: "Baby Care" },
    { sheet: "Mom & Pregnancy",    category: "Mom & Pregnancy" },
    { sheet: "Home",               category: "Home" },
    { sheet: "Healthy Food",       category: "Kitchen & Food" },
    { sheet: "Kitchen",            category: "Kitchen & Food" },
    { sheet: "School",             category: "School" },
    { sheet: "Rainy Season",       category: "Rainy Season" }
  ]
};
