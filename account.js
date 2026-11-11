// Day 4 (Rockstar Games account) effects.
// 1. Hero ID card: tilts towards the cursor with a moving light glare; flips between
//    "Social Club" (before Nov 2023) and "Rockstar Games account" (after).
// 2. Notifications that slide in like a game overlay.
// 3. Network map: one account in the middle; each game you add brings its players in
//    and links them to everyone already there. An illustration, not real data.
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hover = matchMedia("(hover: hover)").matches;

  /* ---------- 1. ID card ---------- */
  function card() {
    const wrap = document.getElementById("idcard"); if (!wrap) return;
    const inner = wrap.querySelector(".id-inner");
    const toggle = document.querySelectorAll("[data-era]");
    let flipped = false, rx = 0, ry = 0, auto = true;
    function set(era) {
      flipped = era === "now";
      wrap.classList.toggle("flipped", flipped);
      toggle.forEach(b => b.setAttribute("aria-pressed", b.dataset.era === era));
    }
    toggle.forEach(b => b.addEventListener("click", () => { auto = false; set(b.dataset.era); }));
    function apply() { inner.style.transform = `rotateX(${rx}deg) rotateY(${ry + (flipped ? 180 : 0)}deg)`; }
    if (hover && !reduce) {
      wrap.addEventListener("pointermove", e => {
        const r = wrap.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        ry = (x - 0.5) * 18; rx = (0.5 - y) * 14;
        wrap.style.setProperty("--gx", (x * 100) + "%"); wrap.style.setProperty("--gy", (y * 100) + "%");
        apply();
      });
      wrap.addEventListener("pointerleave", () => { rx = ry = 0; apply(); });
    }
    const mo = new MutationObserver(apply); mo.observe(wrap, { attributes: true, attributeFilter: ["class"] });
    set("then");
    if (!reduce) setInterval(() => { if (auto) set(flipped ? "then" : "now"); }, 4200);
  }

  /* ---------- 2. Notifications ---------- */
  function toasts() {
    const box = document.getElementById("toasts"); if (!box || reduce) return;
    const items = [...box.querySelectorAll(".toast")]; let i = 0;
    function next() {
      items.forEach(t => t.classList.remove("show"));
      items[i % items.length].classList.add("show");
      i++;
    }
    next(); setInterval(next, 3000);
  }

  /* ---------- 3. Network map ---------- */
  function network() {
    const cv = document.getElementById("net"); if (!cv) return;
    const ctx = cv.getContext("2d"), btns = [...document.querySelectorAll("[data-game]")];
    const countEl = document.getElementById("net-links"), noteEl = document.getElementById("net-note");
    const games = btns.map((b, k) => ({ name: b.dataset.game, year: b.dataset.year, note: b.dataset.note, n: +b.dataset.players, on: false, k }));
    let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), nodes = [], t0 = performance.now();
    function size() {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); layout();
    }
    function hubPos(k) {
      const a = -Math.PI / 2 + k / games.length * Math.PI * 2, R = Math.min(W, H) * 0.34;
      return { x: W / 2 + Math.cos(a) * R, y: H / 2 + Math.sin(a) * R };
    }
    function layout() {
      nodes.forEach(n => { const h = hubPos(n.g); n.hx = h.x; n.hy = h.y; });
    }
    function rand(seed) { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }
    function addGame(g) {
      if (g.on) return; g.on = true;
      const h = hubPos(g.k);
      for (let j = 0; j < g.n; j++) {
        const a = rand(g.k * 100 + j) * Math.PI * 2, d = 18 + rand(g.k * 77 + j) * Math.min(W, H) * 0.12;
        nodes.push({ g: g.k, hx: h.x, hy: h.y, a, d, born: performance.now() + j * 25 });
      }
      btns[g.k].setAttribute("aria-pressed", "true");
      if (noteEl) noteEl.textContent = g.year + " · " + g.note;
      const live = games.filter(x => x.on).length, players = nodes.length;
      if (countEl) countEl.textContent = live + (live === 1 ? " game" : " games") + " · one login";
    }
    btns.forEach(b => b.addEventListener("click", () => {
      const g = games[+b.dataset.k];
      for (const x of games) { if (x.k <= g.k) addGame(x); }
    }));
    document.getElementById("net-reset")?.addEventListener("click", () => {
      nodes = []; games.forEach(g => g.on = false); btns.forEach(b => b.setAttribute("aria-pressed", "false"));
      if (countEl) countEl.textContent = "0 games"; if (noteEl) noteEl.textContent = noteEl.dataset.start;
    });
    function draw(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      // links: player to account (faint), game hub to account
      ctx.lineWidth = 1;
      for (const n of nodes) {
        const p = Math.min(1, Math.max(0, (now - n.born) / 500)); if (p <= 0) continue;
        const wob = reduce ? 0 : Math.sin(t * 0.8 + n.a * 3) * 3;
        n.x = n.hx + Math.cos(n.a) * (n.d + wob); n.y = n.hy + Math.sin(n.a) * (n.d + wob);
        ctx.strokeStyle = `rgba(17,19,24,${0.07 * p})`;
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(cx, cy); ctx.stroke();
      }
      // cross-game friendships: each player links to one player of an earlier game
      ctx.strokeStyle = "rgba(252,175,23,.35)";
      for (let i = 0; i < nodes.length; i += 3) {
        const a = nodes[i], b = nodes[(i * 7 + 11) % nodes.length];
        if (!a.x || !b.x || a.g === b.g) continue;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y); ctx.stroke();
      }
      for (const n of nodes) {
        const p = Math.min(1, Math.max(0, (now - n.born) / 500)); if (p <= 0 || !n.x) continue;
        ctx.fillStyle = `rgba(17,19,24,${0.75 * p})`; ctx.beginPath(); ctx.arc(n.x, n.y, 2.6 * p, 0, 7); ctx.fill();
      }
      for (const g of games) {
        const h = hubPos(g.k);
        ctx.fillStyle = g.on ? "#111318" : "#ffffff"; ctx.strokeStyle = g.on ? "#111318" : "rgba(17,19,24,.25)";
        ctx.beginPath(); ctx.arc(h.x, h.y, 9, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = g.on ? "#111318" : "rgba(17,19,24,.55)";
        ctx.font = "600 12px Inter, system-ui, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(g.name, h.x, h.y + (h.y > cy ? 28 : -18));
      }
      // the account
      const pulse = reduce ? 0 : (Math.sin(t * 2) + 1) * 4;
      ctx.fillStyle = "rgba(252,175,23,.25)"; ctx.beginPath(); ctx.arc(cx, cy, 30 + pulse, 0, 7); ctx.fill();
      ctx.fillStyle = "#fcaf17"; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 7); ctx.fill();
      ctx.fillStyle = "#111318"; ctx.font = "800 15px Inter, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("ID", cx, cy + 1); ctx.textBaseline = "alphabetic";
      requestAnimationFrame(draw);
    }
    size(); addEventListener("resize", size); requestAnimationFrame(draw);
    // start with the first game added once the map scrolls into view
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { addGame(games[0]); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(cv);
  }

  /* ---------- reveal on scroll ---------- */
  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.2 });
    document.querySelectorAll(".rise").forEach(el => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => { card(); toasts(); network(); reveal(); });
})();
