// Day 5 (Rockstar Games Launcher) effects.
// 1. Hero app window: library tiles you can select; a download bar fills, then turns into PLAY.
// 2. Store-fee calculator: what the publisher keeps per sale on Steam, Epic, or its own launcher.
// 3. Sidebar: highlights the section you're reading.
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. App window ---------- */
  function app() {
    const tiles = [...document.querySelectorAll(".lib-tile")];
    const title = document.getElementById("app-title"), sub = document.getElementById("app-sub");
    const bar = document.getElementById("dl-bar"), pct = document.getElementById("dl-pct"), btn = document.getElementById("dl-btn"), state = document.getElementById("dl-size");
    if (!tiles.length) return;
    let timer = null, p = 0, auto = true, idx = 0;
    function select(t) {
      tiles.forEach(x => x.setAttribute("aria-pressed", x === t ? "true" : "false"));
      title.textContent = t.dataset.title; sub.textContent = t.dataset.sub; state.textContent = t.dataset.size;
      run(t.dataset.installed === "yes");
    }
    function run(installed) {
      clearInterval(timer);
      if (installed || reduce) { p = 100; paint(true); return; }
      p = 0; paint(false);
      timer = setInterval(() => { p = Math.min(100, p + 1.6 + Math.random() * 2.4); paint(p >= 100); if (p >= 100) clearInterval(timer); }, 90);
    }
    function paint(done) {
      bar.style.width = p.toFixed(1) + "%";
      pct.textContent = done ? "Ready" : "Downloading " + Math.floor(p) + "%";
      btn.textContent = done ? "Play" : "Pause";
      btn.classList.toggle("ready", done);
    }
    tiles.forEach(t => t.addEventListener("click", () => { auto = false; select(t); }));
    btn.addEventListener("click", () => { if (btn.classList.contains("ready")) { btn.textContent = "Launching…"; setTimeout(() => btn.textContent = "Play", 1400); } });
    select(tiles[0]);
    if (!reduce) setInterval(() => { if (!auto) return; idx = (idx + 1) % tiles.length; select(tiles[idx]); }, 6500);
  }

  /* ---------- 2. Store-fee calculator ---------- */
  function fees() {
    const price = document.getElementById("fee-price"), copies = document.getElementById("fee-copies");
    if (!price) return;
    const out = { steam: document.getElementById("keep-steam"), epic: document.getElementById("keep-epic"), own: document.getElementById("keep-own") };
    const bars = { steam: document.getElementById("bar-steam"), epic: document.getElementById("bar-epic"), own: document.getElementById("bar-own") };
    const pv = document.getElementById("fee-price-v"), cv = document.getElementById("fee-copies-v"), gap = document.getElementById("fee-gap");
    const fmt = n => n >= 1e9 ? "$" + (n / 1e9).toFixed(2) + "B" : "$" + (n / 1e6).toFixed(1) + "M";
    // Steam's published tiers apply to each game's lifetime revenue: 30% up to $10M, 25% to $50M, 20% above.
    function steamKeep(gross) {
      const a = Math.min(gross, 10e6), b = Math.min(Math.max(gross - 10e6, 0), 40e6), c = Math.max(gross - 50e6, 0);
      return a * 0.70 + b * 0.75 + c * 0.80;
    }
    function update() {
      const pr = +price.value, n = +copies.value * 1e6, gross = pr * n;
      pv.textContent = "$" + pr.toFixed(2); cv.textContent = (+copies.value) + " million copies";
      const k = { steam: steamKeep(gross), epic: gross * 0.88, own: gross };
      for (const s of ["steam", "epic", "own"]) { out[s].textContent = fmt(k[s]); bars[s].style.width = (k[s] / gross * 100) + "%"; }
      gap.textContent = fmt(gross - k.steam);
    }
    price.addEventListener("input", update); copies.addEventListener("input", update); update();
  }

  /* ---------- 3. Sidebar ---------- */
  function sidebar() {
    const links = [...document.querySelectorAll(".l-side a")];
    if (!links.length) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-40% 0px -55% 0px" });
    links.forEach(a => { const s = document.querySelector(a.getAttribute("href")); if (s) io.observe(s); });
  }

  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.2 });
    document.querySelectorAll(".rise").forEach(el => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => { app(); fees(); sidebar(); reveal(); });
})();
