# GTA VI: 9 product decisions

A 9-day product breakdown of the decisions behind GTA VI, one page per day from 11 to 19 November 2026.

## Publishing a day

Each day publishes itself (GitHub Action `publish-day.yml`): 2:45 pm IST on 12 and 15–19 Nov, 1:45 pm IST on 13 Nov, 11:45 am IST on 14 Nov.

1. Build the page ahead in `drafts/` (not pushed), then move it to `_queue/day-NN.html` and push.
   `_queue/` starts with `_`, so GitHub Pages doesn't serve it: it stays hidden.
2. At the scheduled time the Action runs `tools/publish-day.sh`: moves the page to the root, sets `live: true`
   in `days.js`, links the previous day's "Up next" strip, commits and pushes.
3. To test without publishing: Actions → "Publish today's product" → Run workflow (dry run ticked).

Artwork in `assets/` comes from the official GTA VI wallpaper pack, resized for the web. Spare postcards (Vice City, Leonida Keys, Port Gellhorn, Ambrosia, Grassrivers, Mount Kalaga) are kept outside the repo for later days.

Independent product breakdown by Sameer Mittimani.
