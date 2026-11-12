# 9 Rockstar products

A 9-day product breakdown, one Rockstar product a day from 11 to 19 November 2026, ending on GTA VI's launch day. Each page reads one product the way a product manager would. Independent portfolio project by Sameer Mittimani. Not an official Rockstar Games site.

Live at https://cercit.github.io/GTAVI/

Plain HTML, CSS and JavaScript on GitHub Pages. No build step, no backend.

## What is where

| File | What it does |
|---|---|
| `index.html`, `hub.css`, `hub.js` | The hub: opening, Select a product, How the nine connect, PM concepts, About |
| `days.js` | The list of nine days and which are live. Also loads the shared tools on day pages |
| `day-NN.html` | One page per product, once it is live |
| `_queue/day-NN.html` | Pages built ahead and waiting for their day |
| `style.css` | Day pages and their themes (one look per product) |
| `shell.css`, `shell.js` | Shared tools on every day page: reading progress, "checked facts" and "my view" labels, share links |
| `engine.js`, `account.js` | Effects for Day 3 and Day 4 |
| `tools/publish-day.sh` | Publishes one day (used by the GitHub Action) |
| `tools/share-card.html`, `tools/make-share-cards.py` | Make the link-preview images |

## Publishing a day

Each day publishes itself (GitHub Action `publish-day.yml`): 2:45 pm IST on 12 and 16–19 Nov, 1:45 pm IST on 13 Nov, 11:45 am IST on 14 Nov, 10:45 am IST on 15 Nov.

1. Build the page ahead in `drafts/` (not pushed), then move it to `_queue/day-NN.html` and push.
   `_queue/` starts with `_`, so GitHub Pages doesn't serve it: it stays hidden.
2. At the scheduled time the Action runs `tools/publish-day.sh`: moves the page to the root, sets `live: true`
   in `days.js`, links the previous day's "Up next" strip, commits and pushes.
3. To test without publishing: `tools/publish-day.sh N --dry-run`, or Actions → "Publish today's product" → Run workflow (dry run ticked).

Do not rename `days.js`, its `file` and `live` fields, the `#select` anchor on the hub, or the "Up next" strip markup. The script depends on them.

## How the hub knows about a day

The hub shows a product, its PM concept and its connections only after that day is live. It does this by reading a small block at the bottom of the day page itself, so nothing about a day is on the site before its page is.

Every day page needs this block just before `</body>`, and `id="concept"` on its PM concept section:

```html
<script type="application/json" id="day-meta">
{
  "n": 5,
  "category": "Short label, 1 to 3 words",
  "layer": "games | money | platform | tech",
  "art": "assets/wide-image-for-the-hub-stage.jpg",
  "theme": { "bg": "#0b0712", "ink": "#f5f0fa", "soft": "#ddd3e8", "muted": "#a99bb8", "accent": "#ff4f9f", "on": "#16060e", "line": "rgba(255,255,255,.14)" },
  "stat": { "value": "One number", "label": "what it counts" },
  "pull": "One line from the page, shown on the hub.",
  "concept": { "name": "...", "what": "...", "question": "...", "answer": "..." },
  "links": [
    { "to": 2, "type": "revenue", "basis": "fact", "text": "One sentence the page itself supports." }
  ]
}
</script>
```

- `type` is one of: `revenue`, `distribution`, `audience`, `platform`, `tech`, `strategy`.
- `basis` is one of: `fact` (checked fact on the page), `view` (my read), `open` (open question).
- A link is drawn only when both products are live. Links to days that are not live yet simply wait.
- Every sentence must come from that page. Nothing new is written here.
- `theme.plain: true` shows the title in sentence case (used by Day 4). `artPos` moves the stage image, for example `"50% 8%"`.

A page without the block still works: it shows as a plain live card, with no connections or concept on the hub.

## Link-preview images

Each page's `og:image` is a 1200x630 card in `assets/` (`share-hub.jpg`, `share-dNN.jpg`). To make one for a new day, add a line to `CARDS` in `tools/make-share-cards.py`, then:

```
python -m http.server 4620
python tools/make-share-cards.py 5
```

Needs Python with `playwright` and `pillow`.

## Looking at it locally

Serve the folder (`python -m http.server 4620`) and open http://localhost:4620/. Add `?preview=4` to see the hub as it will look with days 1 to 4 live. That switch works on localhost only.

## Artwork

Artwork and logos © Rockstar Games / Take-Two Interactive, from the official GTA VI wallpaper pack and official game art, resized for the web. Every page footer carries the credit. Spare artwork is kept outside the repo for later days.
