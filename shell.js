// Shared tools for every day page. Loaded by days.js, so a page needs no extra tags.
// 1. Reading progress bar along the top.
// 2. A small label on sections: "Checked facts" (numbers, timeline) and "My view" (What I'd change).
// 3. Share links and ways back into the hub, after the sources line.
(function () {
  function init() {
    if (!document.querySelector("main") || document.querySelector(".read-bar")) return;

    /* 1. Reading progress */
    const bar = document.createElement("div");
    bar.className = "read-bar"; bar.setAttribute("aria-hidden", "true"); bar.innerHTML = "<i></i>";
    document.body.append(bar);
    const fill = bar.firstChild; let queued = false;
    const paint = () => { queued = false; const max = document.documentElement.scrollHeight - innerHeight; fill.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")"; };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
    addEventListener("resize", paint); paint();

    /* 2. Fact or view. Worked out from what the section holds, so pages need no extra markup. */
    document.querySelectorAll(".chapter").forEach(ch => {
      const head = ch.querySelector(".chapter-head"), h2 = head && head.querySelector("h2");
      if (!h2 || head.querySelector(".kind")) return;
      const view = /what i.?d change/i.test(h2.textContent), fact = !view && ch.querySelector(".stats, .ledger, .feed");
      if (!view && !fact) return;
      const tag = document.createElement("span");
      tag.className = "kind " + (view ? "view" : "fact");
      tag.textContent = view ? "My view" : "Checked facts";
      tag.title = view ? "My opinion as a product manager, not a fact" : "From this day's checked fact sheet";
      head.append(tag);
    });

    /* 3. Share and onward links */
    const src = document.querySelector(".sources");
    if (!src) return;
    const canon = document.querySelector('link[rel="canonical"]');
    const url = canon ? canon.href : location.href.split(/[?#]/)[0].replace("/_queue/", "/");
    const row = document.createElement("div"); row.className = "share";
    row.innerHTML =
      '<div><span class="label">Share this breakdown</span><div class="share-btns">' +
        '<a href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) + '" target="_blank" rel="noopener">LinkedIn</a>' +
        '<button type="button" data-act="copy">Copy link</button>' +
        (navigator.share ? '<button type="button" data-act="share">Share</button>' : "") +
      "</div></div>" +
      '<div><span class="label">Keep going</span><div class="share-btns">' +
        '<a href="index.html#ecosystem">How it connects</a><a href="index.html#concepts">All PM concepts</a><a href="index.html#select">All nine products</a>' +
      "</div></div>";
    src.after(row);
    row.addEventListener("click", e => {
      const b = e.target.closest("button[data-act]"); if (!b) return;
      if (b.dataset.act === "share") { navigator.share({ title: document.title, url }).catch(() => {}); return; }
      const ok = () => { b.textContent = "Link copied"; b.classList.add("done"); setTimeout(() => { b.textContent = "Copy link"; b.classList.remove("done"); }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, () => prompt("Copy this link", url));
      else prompt("Copy this link", url);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
