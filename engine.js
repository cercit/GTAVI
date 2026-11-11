// Day 3 (RAGE engine) effects.
// 1. Hero: the city starts as a wireframe; a light (your cursor, or an automatic sweep) "renders" it lit.
// 2. Frame demo: step through simplified render passes on an in-engine screenshot.
// 3. Page light: a soft glow follows the cursor; headings catch a light sweep when they scroll in.
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(hover: none)").matches;

  const load = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

  // Draw an image like CSS background-size: cover
  function cover(ctx, img, w, h, focusY = 0.5) {
    const s = Math.max(w / img.width, h / img.height);
    const dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) * focusY, dw, dh);
  }

  // Pixel helpers on an offscreen canvas (no ctx.filter, so it works in every browser)
  function canvasOf(img, w) {
    const h = Math.round(img.height * (w / img.width));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    return c;
  }
  function mapPixels(src, fn) {
    const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
    const x = c.getContext("2d"); x.drawImage(src, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height); fn(d.data, c.width, c.height);
    x.putImageData(d, 0, 0); return c;
  }
  function edges(src) {
    return mapPixels(src, (p, w, h) => {
      const g = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) g[i] = 0.3 * p[i * 4] + 0.59 * p[i * 4 + 1] + 0.11 * p[i * 4 + 2];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; let m = 0;
        if (y > 0 && y < h - 1 && x > 0 && x < w - 1) {
          const gx = -g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1] + g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1];
          const gy = -g[i - w - 1] - 2 * g[i - w] - g[i - w + 1] + g[i + w - 1] + 2 * g[i + w] + g[i + w + 1];
          m = Math.min(255, Math.hypot(gx, gy) * 1.3); if (m < 26) m = 0;
        }
        p[i * 4] = m * 0.35; p[i * 4 + 1] = m * 0.88; p[i * 4 + 2] = m; p[i * 4 + 3] = 255;
      }
    });
  }

  /* ---------- 1. Hero light ---------- */
  async function hero() {
    const cv = document.getElementById("rage-hero"); if (!cv) return;
    const img = await load(cv.dataset.src);
    const wire = edges(canvasOf(img, 1100));
    const ctx = cv.getContext("2d");
    const lit = document.createElement("canvas"), lx = lit.getContext("2d");
    const hud = document.getElementById("hud-light"), fpsEl = document.getElementById("hud-fps");
    let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, touch ? 1 : 1.5);
    function size() {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = lit.width = Math.round(W * dpr); cv.height = lit.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); lx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); addEventListener("resize", size);

    const L = { x: W * 0.7, y: H * 0.4, tx: W * 0.7, ty: H * 0.4 };
    let lastMove = -1e9, t0 = performance.now(), frames = 0, fpsT = t0;
    cv.parentElement.addEventListener("pointermove", e => {
      const r = cv.getBoundingClientRect(); L.tx = e.clientX - r.left; L.ty = e.clientY - r.top; lastMove = performance.now();
    });

    function frame(now) {
      const t = (now - t0) / 1000;
      if (now - lastMove > 2500) { // nobody steering: sweep on its own
        L.tx = W * (0.5 + 0.32 * Math.sin(t * 0.45)); L.ty = H * (0.42 + 0.14 * Math.sin(t * 0.9 + 1));
      }
      L.x += (L.tx - L.x) * 0.08; L.y += (L.ty - L.y) * 0.08;
      const R = Math.max(W, H) * (reduce ? 2 : Math.min(0.42, 0.08 + t * 0.22));

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#06080b"; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.9; cover(ctx, wire, W, H, 0.6); ctx.globalAlpha = 1;

      // Lit render, only where the light reaches
      lx.globalCompositeOperation = "source-over"; lx.clearRect(0, 0, W, H); cover(lx, img, W, H, 0.6);
      lx.globalCompositeOperation = "destination-in";
      const m = lx.createRadialGradient(L.x, L.y, 0, L.x, L.y, R);
      m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(0.55, "rgba(0,0,0,.95)"); m.addColorStop(1, "rgba(0,0,0,0)");
      lx.fillStyle = m; lx.fillRect(0, 0, W, H);
      ctx.drawImage(lit, 0, 0, W, H);

      // Additive glow and soft light shafts
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, R * 0.55);
      g.addColorStop(0, "rgba(255,236,200,.38)"); g.addColorStop(1, "rgba(255,236,200,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (!reduce) {
        for (let k = 0; k < 14; k++) {
          const a = k / 14 * Math.PI * 2 + t * 0.06, len = R * (1.4 + 0.4 * Math.sin(t + k));
          ctx.beginPath(); ctx.moveTo(L.x, L.y);
          ctx.lineTo(L.x + Math.cos(a - 0.03) * len, L.y + Math.sin(a - 0.03) * len);
          ctx.lineTo(L.x + Math.cos(a + 0.03) * len, L.y + Math.sin(a + 0.03) * len);
          const s = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, len);
          s.addColorStop(0, "rgba(127,233,255,.10)"); s.addColorStop(1, "rgba(127,233,255,0)");
          ctx.fillStyle = s; ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      frames++;
      if (now - fpsT > 500) {
        if (fpsEl) fpsEl.textContent = Math.round(frames * 1000 / (now - fpsT));
        frames = 0; fpsT = now;
        if (hud) hud.textContent = Math.round(L.x) + ", " + Math.round(L.y);
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 2. Frame demo: simplified render passes ---------- */
  async function passes() {
    const cv = document.getElementById("rage-passes"); if (!cv) return;
    const img = await load(cv.dataset.src);
    const base = canvasOf(img, 960);
    const lum = (p, i) => 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2];
    const P = {
      wire: edges(base),
      depth: mapPixels(base, (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, v = 40 + 190 * (y / h) * (0.6 + 0.4 * lum(p, i) / 255);
        p[i] = v * 0.85; p[i + 1] = v * 0.95; p[i + 2] = v; } }),
      albedo: mapPixels(base, p => { for (let i = 0; i < p.length; i += 4) {
        const l = lum(p, i), k = 0.55; for (let c = 0; c < 3; c++) p[i + c] = Math.min(255, (p[i + c] - l) * 1.1 + 150 * k + l * (1 - k) * 0.6); } }),
      light: mapPixels(base, p => { for (let i = 0; i < p.length; i += 4) {
        const l = lum(p, i), v = Math.min(255, Math.pow(l / 255, 1.6) * 330); p[i] = v; p[i + 1] = v * 0.93; p[i + 2] = v * 0.8; } }),
      final: (() => { const c = document.createElement("canvas"); c.width = base.width; c.height = base.height;
        const x = c.getContext("2d"); x.drawImage(base, 0, 0);
        const bright = mapPixels(base, p => { for (let i = 0; i < p.length; i += 4) { const l = lum(p, i); const k = l > 185 ? 1 : 0; for (let q = 0; q < 3; q++) p[i + q] *= k; } });
        x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.35;
        for (const o of [[-4, 0], [4, 0], [0, -4], [0, 4], [-8, -8], [8, 8]]) x.drawImage(bright, o[0], o[1]);
        return c; })()
    };
    const ctx = cv.getContext("2d"); cv.width = base.width; cv.height = base.height;
    const btns = [...document.querySelectorAll("[data-pass]")], note = document.getElementById("pass-note");
    let cur = "wire", from = null, a = 1, auto = true, i = 0;
    function draw() {
      ctx.globalAlpha = 1; ctx.drawImage(from ? P[from] : P[cur], 0, 0);
      if (from) { ctx.globalAlpha = a; ctx.drawImage(P[cur], 0, 0); ctx.globalAlpha = 1; }
    }
    function show(name) {
      if (name === cur) return; from = cur; cur = name; a = reduce ? 1 : 0;
      btns.forEach(b => b.setAttribute("aria-pressed", b.dataset.pass === name));
      const b = btns.find(b => b.dataset.pass === name); if (note && b) note.textContent = b.dataset.note;
      (function fade() { a = Math.min(1, a + 0.08); draw(); if (a < 1) requestAnimationFrame(fade); else from = null; })();
    }
    btns.forEach(b => b.addEventListener("click", () => { auto = false; show(b.dataset.pass); }));
    draw(); if (note) note.textContent = btns[0].dataset.note;
    const order = btns.map(b => b.dataset.pass);
    const io = new IntersectionObserver(es => es.forEach(e => { cv.dataset.visible = e.isIntersecting ? "1" : ""; }), { threshold: 0.4 });
    io.observe(cv);
    setInterval(() => { if (auto && cv.dataset.visible && !reduce) { i = (i + 1) % order.length; show(order[i]); } }, 2200);
  }

  /* ---------- 3. Page light + heading sweeps ---------- */
  function pageLight() {
    if (!touch && !reduce) addEventListener("pointermove", e => {
      document.body.style.setProperty("--mx", e.clientX + "px"); document.body.style.setProperty("--my", e.clientY + "px");
    }, { passive: true });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("lit"); io.unobserve(e.target); } }), { threshold: 0.6 });
    document.querySelectorAll(".sweep").forEach(el => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => { pageLight(); hero().catch(() => {}); passes().catch(() => {}); });
})();
