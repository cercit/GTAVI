"""Make the 1200x630 link-preview images (what LinkedIn shows when a page is shared).

Needs Python with playwright and pillow, and a local server on this folder, for example:
    python -m http.server 4620          (run inside the GTAVI folder)
    python tools/make-share-cards.py    (makes every card)
    python tools/make-share-cards.py 5  (makes only day 5)

To add a day, add one line to CARDS: which artwork to use and where to anchor it.
Output: assets/share-hub.jpg and assets/share-dNN.jpg.
"""
import io, os, sys
from urllib.parse import urlencode
from PIL import Image
from playwright.sync_api import sync_playwright

BASE = os.environ.get("GTAVI_BASE", "http://localhost:4620")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# key: (artwork, background-position)
CARDS = {
    "hub": ("assets/h-rooftop.jpg", "88% 30%"),
    1: ("assets/v-cover.jpg", "10% 50%"),
    2: ("assets/o-cover.jpg", "10% 50%"),
    3: ("assets/r-share.jpg", "70% 50%"),
    4: ("assets/a-hero.jpg", "60% 20%"),
}


def main():
    want = [int(a) for a in sys.argv[1:] if a.isdigit()]
    keys = [k for k in CARDS if not want or k in want]
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch()
        except Exception:
            browser = p.chromium.launch(channel="msedge")
        page = browser.new_page(viewport={"width": 1200, "height": 630})
        for k in keys:
            art, pos = CARDS[k]
            q = {"hub": 1, "art": art, "pos": pos} if k == "hub" else {"n": k, "art": art, "pos": pos}
            page.goto(f"{BASE}/tools/share-card.html?{urlencode(q)}", wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(600)
            png = page.locator("#card").screenshot()
            name = "share-hub.jpg" if k == "hub" else f"share-d{k:02d}.jpg"
            out = os.path.join(ROOT, "assets", name)
            Image.open(io.BytesIO(png)).convert("RGB").save(out, "JPEG", quality=88, optimize=True, progressive=True)
            print(name, os.path.getsize(out) // 1024, "KB")
        browser.close()


if __name__ == "__main__":
    main()
