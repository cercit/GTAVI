// GTAVI hub.
// days.js says which days are live. Each live page carries its own "day-meta" block
// (category, PM concept, connections), and this script reads it from the page itself.
// So nothing about a product can be drawn here before its page is published.
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wide = matchMedia("(min-width: 900px)");

  // Local review only: ?preview=4 treats days 1 to 4 as live and reads queued pages from _queue/.
  // It does nothing on the live site, where queued pages are not served.
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const PREVIEW = LOCAL ? Math.min(9, parseInt(new URLSearchParams(location.search).get("preview"), 10) || 0) : 0;

  const days = DAYS.map(d => ({ ...d, live: d.live || d.n <= PREVIEW, href: d.file, meta: null }));
  const byN = n => days[n - 1];
  const liveDays = () => days.filter(d => d.live);

  /* ---------- Countdown to 19 November ---------- */
  function countdown() {
    const launch = new Date(2026, 10, 19, 0, 0, 0);
    const tick = () => {
      const ms = launch - new Date();
      if (ms <= 0) { $$(".countdown").forEach(c => { c.innerHTML = "<div><b>Out now</b><span>19 Nov 2026</span></div>"; }); return false; }
      const m = Math.floor(ms / 60000);
      $$(".cd-d").forEach(e => { e.textContent = Math.floor(m / 1440); });
      $$(".cd-h").forEach(e => { e.textContent = Math.floor((m % 1440) / 60); });
      $$(".cd-m").forEach(e => { e.textContent = m % 60; });
      return true;
    };
    if (tick()) { const t = setInterval(() => { if (!tick()) clearInterval(t); }, 30000); }
  }

  /* ---------- Nine-day rail in the opening ---------- */
  function rail() {
    const el = $("#rail");
    el.innerHTML = days.map(d => `<li><a href="#select" data-n="${d.n}"${d.live ? ' class="live"' : ""} aria-label="Product ${d.n}: ${esc(d.title)}, ${d.live ? "live" : "locked until " + esc(d.date)}"><b>${pad(d.n)}</b><span>${d.live ? "Live" : esc(d.date)}</span></a></li>`).join("");
    el.addEventListener("click", e => { const a = e.target.closest("a[data-n]"); if (a) setActive(+a.dataset.n); });
  }

  /* ---------- Select a product: menu on the left, stage on the right ---------- */
  let active = 0;

  function rowHTML(d) {
    const n = pad(d.n);
    return d.live
      ? `<li><a class="item live" href="${esc(d.href)}" data-n="${d.n}"><span class="thumb" style="background-image:url('assets/t-d${n}.jpg')"></span><span class="n">${n}</span><span class="tt"><span class="t">${esc(d.title)}</span><span class="h">${esc(d.hook)}</span><span class="tags"></span></span><span class="s">Play ›</span></a></li>`
      : `<li><button type="button" class="item locked" data-n="${d.n}"><span class="n">${n}</span><span class="tt"><span class="t">${esc(d.title)}</span><span class="h">${esc(d.hook)}</span></span><span class="s">Locked · ${esc(d.date)}</span></button></li>`;
  }

  function stageHTML(d) {
    const n = pad(d.n), m = d.meta;
    if (!d.live) return `
      <div class="sealed-art"><b>${n}</b><span><i class="lock"></i>Unlocks ${esc(d.date)}</span></div>
      <div class="stage-body">
        <p class="stage-meta">Product ${n} / 09 <span class="pill line">Locked</span></p>
        <h3>${esc(d.title)}</h3>
        <p class="hook">${esc(d.hook)}</p>
        <p class="wait">The breakdown, its numbers and its PM concept open on ${esc(d.date)}.</p>
      </div>`;
    const facts = m && m.concept && m.stat ? `
        <dl class="facts">
          <div><dt>PM concept</dt><dd>${esc(m.concept.name)}</dd></div>
          <div><dt>One number</dt><dd><b>${esc(m.stat.value)}</b><small>${esc(m.stat.label)}</small></dd></div>
          <div><dt>Published</dt><dd>${esc(d.date)} 2026</dd></div>
        </dl>` : "";
    return `
      <div class="stage-art"></div>
      <div class="stage-body">
        <p class="stage-meta">Product ${n} / 09 ${m && m.category ? `<span class="pill">${esc(m.category)}</span>` : ""}<span class="pill line">Live</span></p>
        <h3>${esc(d.title)}</h3>
        <p class="hook">${esc(d.hook)}</p>${facts}
        <p class="go"><a class="btn primary" href="${esc(d.href)}">Open the breakdown ›</a></p>
      </div>`;
  }

  function paintStage(d) {
    const st = $("#stage"), th = (d.live && d.meta && d.meta.theme) || {};
    st.className = "stage" + (d.live ? "" : " sealed") + (th.plain ? " plain" : "");
    [["--s-bg", th.bg], ["--s-ink", th.ink], ["--s-soft", th.soft], ["--s-muted", th.muted], ["--s-accent", th.accent], ["--s-on", th.on], ["--s-line", th.line]]
      .forEach(([k, v]) => { if (v) st.style.setProperty(k, v); else st.style.removeProperty(k); });
    st.innerHTML = stageHTML(d);
    if (d.live) {
      const img = new Image(); img.alt = "";
      img.onload = () => requestAnimationFrame(() => img.classList.add("on"));
      img.src = (d.meta && d.meta.art) || `assets/t-d${pad(d.n)}.jpg`;
      if (d.meta && d.meta.artPos) img.style.objectPosition = d.meta.artPos;
      $(".stage-art", st).append(img);
    }
  }

  function setActive(n) {
    if (!byN(n)) return;
    active = n;
    $$("#menu .item").forEach(el => el.classList.toggle("on", +el.dataset.n === n));
    $$("#rail a").forEach(el => el.classList.toggle("on", +el.dataset.n === n));
    if (wide.matches) paintStage(byN(n));
  }

  function picker() {
    const menu = $("#menu");
    menu.innerHTML = days.map(rowHTML).join("");
    const pick = e => { const it = e.target.closest(".item"); if (it && +it.dataset.n !== active) setActive(+it.dataset.n); };
    menu.addEventListener("mouseover", pick);
    menu.addEventListener("focusin", pick);
    menu.addEventListener("click", e => { const it = e.target.closest("button.item"); if (it) setActive(+it.dataset.n); });
    menu.addEventListener("keydown", e => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = $$(".item", menu), i = items.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus();
    });
    wide.addEventListener("change", () => setActive(active));
    const newest = liveDays().pop();
    setActive(newest ? newest.n : 1);
    $("#progress").textContent = liveDays().length + " / 9 unlocked";
  }

  // Once the pages have been read: fix links, add tags to phone cards, repaint the stage.
  function enrichPicker() {
    liveDays().forEach(d => {
      const a = $(`#menu .item[data-n="${d.n}"]`); if (!a) return;
      a.href = d.href;
      if (d.meta) $(".tags", a).innerHTML = [d.meta.category, d.meta.concept && d.meta.concept.name].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join("");
    });
    setActive(active);
    const newest = liveDays().pop(), cta = $("#cta-latest");
    if (newest && cta) { cta.href = newest.href; cta.textContent = `Read the latest: ${newest.title} ›`; }
  }

  /* ---------- Read each live page's own data ---------- */
  async function loadMeta(d) {
    const tries = PREVIEW && !DAYS[d.n - 1].live ? ["_queue/" + d.file, d.file] : [d.file];
    for (const url of tries) {
      try {
        const r = await fetch(url); if (!r.ok) continue;
        const doc = new DOMParser().parseFromString(await r.text(), "text/html");
        d.href = url;
        const el = doc.getElementById("day-meta");
        if (el) d.meta = JSON.parse(el.textContent);
        return;
      } catch (e) { /* page not readable (for example opened from a file): keep the plain card */ }
    }
  }

  /* ---------- How the nine connect ---------- */
  const LAYERS = [
    { id: "games", name: "The games", note: "What players buy and play" },
    { id: "money", name: "The money", note: "How spending carries on after the sale" },
    { id: "platform", name: "The platform", note: "How Rockstar reaches and keeps players" },
    { id: "tech", name: "The technology", note: "What everything is built on" },
  ];
  const TYPES = {
    revenue: ["Revenue", "#ffd166"], distribution: ["Distribution", "#ff7a45"], audience: ["Shared audience", "#ff5fa2"],
    platform: ["Data and platform", "#b890ff"], tech: ["Technology", "#5fd0ff"], strategy: ["Strategy", "#e9e3d9"],
  };
  const BASIS = { fact: "Checked fact", view: "My read", open: "Open question" };
  let links = [], sel = null;
  const show = { type: {}, basis: { fact: true, view: true, open: true } };
  Object.keys(TYPES).forEach(k => { show.type[k] = true; });
  const visible = l => show.type[l.type] && show.basis[l.basis];
  const touches = (l, n) => l.a === n || l.b === n;

  function eco() {
    const placed = liveDays().filter(d => d.meta && d.meta.layer);
    links = [];
    placed.forEach(d => (d.meta.links || []).forEach(l => {
      const o = byN(l.to);
      if (o && o.live && o.meta && o.meta.layer && TYPES[l.type] && BASIS[l.basis]) links.push({ a: d.n, b: l.to, type: l.type, basis: l.basis, text: l.text, from: d.n });
    }));

    const locked = days.filter(d => !d.live), unplaced = liveDays().filter(d => !(d.meta && d.meta.layer));
    const board = $("#board");
    board.innerHTML = LAYERS.map(L => {
      const inL = placed.filter(d => d.meta.layer === L.id);
      return `<div class="band"><div class="band-name"><b>${L.name}</b><span>${L.note}</span></div><div class="band-nodes">${
        inL.map(d => `<button type="button" class="node" data-n="${d.n}" aria-pressed="false"><span class="art" style="background-image:url('assets/t-d${pad(d.n)}.jpg')"></span><span><small>${pad(d.n)}</small>${esc(d.title)}</span></button>`).join("") || "<em>Nothing live here yet</em>"
      }</div></div>`;
    }).join("") + (locked.length || unplaced.length ? `<div class="tray">${locked.length ? "Still locked:" : ""}${locked.map(d => `<span>${pad(d.n)} · ${esc(d.date)}</span>`).join("")}${unplaced.map(d => `<span>${pad(d.n)} · live, not placed yet</span>`).join("")}</div>` : "") +
      '<svg class="wires" aria-hidden="true"></svg>';
    $("#eco-count").textContent = placed.length + " of 9 on the map";

    const used = new Set(links.map(l => l.type));
    $("#eco-types").innerHTML = Object.entries(TYPES).map(([k, [name, c]]) => `<button type="button" class="chip" data-type="${k}" aria-pressed="true" style="--c:${c}"${used.has(k) ? "" : ' disabled title="No live connection of this kind yet"'}><i></i>${name}</button>`).join("");
    $("#eco-basis").innerHTML = Object.entries(BASIS).map(([k, name]) => `<button type="button" class="chip" data-basis="${k}" aria-pressed="true"><i class="${k}"></i>${name}</button>`).join("");

    $(".eco-tools").addEventListener("click", e => {
      const c = e.target.closest(".chip"); if (!c || c.disabled) return;
      const on = c.getAttribute("aria-pressed") !== "true"; c.setAttribute("aria-pressed", on);
      if (c.dataset.type) show.type[c.dataset.type] = on; else show.basis[c.dataset.basis] = on;
      if (sel && sel.kind === "link" && !visible(links[sel.i])) sel = null;
      ecoDraw();
    });
    board.addEventListener("click", e => {
      const node = e.target.closest(".node"), hit = e.target.closest(".hit");
      if (node) { const n = +node.dataset.n; sel = sel && sel.kind === "node" && sel.n === n ? null : { kind: "node", n }; }
      else if (hit) sel = { kind: "link", i: +hit.dataset.i };
      else return;
      ecoApply();
    });
    $("#eco-panel").addEventListener("click", e => { if (e.target.closest(".back")) { sel = null; ecoApply(); } });
    if ("ResizeObserver" in window) new ResizeObserver(ecoDraw).observe(board);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ecoDraw);
    ecoDraw();
  }

  // Lines are drawn from where the boxes actually sit, so the layout is left to CSS.
  function ecoDraw() {
    const board = $("#board"), svg = $(".wires", board); if (!svg) return;
    const R = board.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${R.width} ${R.height}`);
    const box = {};
    $$(".node", board).forEach(el => { const r = el.getBoundingClientRect(); box[el.dataset.n] = { t: r.top - R.top, b: r.bottom - R.top, l: r.left - R.left, r: r.right - R.left, cx: r.left - R.left + r.width / 2, cy: r.top - R.top + r.height / 2, w: r.width }; });
    const groups = {};
    links.forEach((l, i) => { if (visible(l) && box[l.a] && box[l.b]) { const k = Math.min(l.a, l.b) + "-" + Math.max(l.a, l.b); (groups[k] = groups[k] || []).push(i); } });
    let out = "";
    Object.values(groups).forEach(g => g.forEach((i, k) => {
      const l = links[i]; let P = box[l.a], Q = box[l.b];
      const spread = (k - (g.length - 1) / 2) * 18, lim = Math.min(P.w, Q.w) / 2 - 14, off = Math.max(-lim, Math.min(lim, spread));
      let d;
      if (Math.abs(P.cy - Q.cy) < 24) {                       // same layer: an arc over the top
        if (P.cx > Q.cx) [P, Q] = [Q, P];
        const top = Math.min(P.t, Q.t) - 26 - k * 12;
        d = `M${P.cx + off} ${P.t} Q${(P.cx + Q.cx) / 2 + off} ${top} ${Q.cx + off} ${Q.t}`;
      } else {                                                 // different layers: a soft S from box to box
        if (P.cy > Q.cy) [P, Q] = [Q, P];
        const x1 = P.cx + off, x2 = Q.cx + off, dy = Q.t - P.b;
        // Boxes in the layers between: go round them, on whichever side is nearer.
        const mid = Object.values(box).filter(b => b.t > P.b + 4 && b.b < Q.t - 4 && b.l - 24 < Math.max(x1, x2) && b.r + 24 > Math.min(x1, x2));
        if (mid.length) {
          const left = Math.min(...mid.map(b => b.l)) - 30 - k * 10, right = Math.max(...mid.map(b => b.r)) + 30 + k * 10, avg = (x1 + x2) / 2;
          const lx = Math.abs(avg - left) <= Math.abs(right - avg) ? left : right;
          const my = (Math.min(...mid.map(b => b.t)) + Math.max(...mid.map(b => b.b))) / 2, h1 = my - P.b, h2 = Q.t - my;
          d = `M${x1} ${P.b} C${x1} ${P.b + h1 * 0.6} ${lx} ${my - h1 * 0.5} ${lx} ${my} C${lx} ${my + h2 * 0.5} ${x2} ${Q.t - h2 * 0.6} ${x2} ${Q.t}`;
        } else d = `M${x1} ${P.b} C${x1} ${P.b + dy * 0.55} ${x2} ${Q.t - dy * 0.55} ${x2} ${Q.t}`;
      }
      out += `<path class="w ${l.basis}" data-i="${i}" stroke="${TYPES[l.type][1]}" d="${d}"/><path class="hit" data-i="${i}" d="${d}"><title>${esc(byN(l.a).title)} and ${esc(byN(l.b).title)}: ${TYPES[l.type][0]}</title></path>`;
    }));
    svg.innerHTML = out;
    ecoApply();
  }

  function connHTML(l, me) {
    const other = me ? byN(l.a === me ? l.b : l.a) : null, src = byN(l.from);
    return `<div class="conn">
      <p class="who">${other ? "With " + esc(other.title) : esc(byN(l.a).title) + " and " + esc(byN(l.b).title)}</p>
      <div class="tags"><span class="tag" style="--c:${TYPES[l.type][1]}">${TYPES[l.type][0]}</span><span class="tag ${l.basis}">${BASIS[l.basis]}</span></div>
      <p>${esc(l.text)}</p>
      <a href="${esc(src.href)}">From ${pad(src.n)}: ${esc(src.title)} ›</a>
    </div>`;
  }

  function ecoApply() {
    const board = $("#board"), panel = $("#eco-panel");
    const rel = l => sel && (sel.kind === "node" ? touches(l, sel.n) : l === links[sel.i]);
    const relN = n => sel && links.some(l => visible(l) && rel(l) && touches(l, n));
    board.classList.toggle("focus", !!sel);
    $$(".node", board).forEach(el => {
      const n = +el.dataset.n, on = !!sel && sel.kind === "node" && sel.n === n;
      el.classList.toggle("on", on); el.classList.toggle("rel", !!relN(n)); el.setAttribute("aria-pressed", on);
    });
    $$(".w", board).forEach(p => p.classList.toggle("rel", !!rel(links[+p.dataset.i])));

    const shown = links.filter(visible), nodes = $$(".node", board).length;
    if (!sel) {
      panel.innerHTML = `<p class="label">How to read it</p><h3>${nodes > 1 ? "Pick a product" : "One product so far"}</h3>
        <p>${nodes > 1 ? "Select a product on the map to see what it connects to, and which breakdown each connection comes from. You can also select a line." : "Connections appear when the second product unlocks. Each new breakdown adds its own lines to this map."}</p>
        ${nodes > 1 ? `<div class="conn"><p class="who">${nodes} products · ${shown.length} ${shown.length === 1 ? "connection" : "connections"} showing</p><p>Solid lines are checked facts. Dashed lines are my read. Dotted lines are open questions.</p></div>` : ""}`;
    } else if (sel.kind === "node") {
      const d = byN(sel.n), mine = shown.filter(l => touches(l, d.n));
      panel.innerHTML = `<p class="label">Product ${pad(d.n)} · ${esc(d.meta.category)}</p><h3>${esc(d.title)}</h3><p>${esc(d.hook)}</p>
        ${mine.map(l => connHTML(l, d.n)).join("") || '<div class="conn"><p>No live connection to show with these filters.</p></div>'}
        <button type="button" class="back">Clear selection</button>`;
    } else {
      panel.innerHTML = `<p class="label">One connection</p>${connHTML(links[sel.i], 0)}<button type="button" class="back">Clear selection</button>`;
    }
  }

  /* ---------- PM concepts: one question per product ---------- */
  function concepts() {
    const list = $("#plays");
    let got = 0;
    list.innerHTML = days.map(d => {
      const n = pad(d.n), c = d.live && d.meta && d.meta.concept;
      if (!d.live) return `<li class="play locked"><span class="n">${n}</span><p><i class="lock"></i>Unlocks ${esc(d.date)}</p></li>`;
      if (!c) return `<li class="play locked"><span class="n">${n}</span><p><a href="${esc(d.href)}">Open ${esc(d.title)} for its PM concept ›</a></p></li>`;
      got++;
      return `<li class="play"><button type="button" aria-expanded="false" aria-controls="play-${d.n}"><span class="n">${n}</span><span class="q">${esc(c.question)}</span><span class="c">${esc(c.name)}</span><span class="x" aria-hidden="true"></span></button>
        <div class="body" id="play-${d.n}"><div>
          <div class="cols"><div><h4>The concept</h4><p><b>${esc(c.name)}.</b> ${esc(c.what)}</p></div><div><h4>The short answer</h4><p>${esc(c.answer)}</p></div></div>
          <a class="more" href="${esc(d.href)}#concept">Read it in ${n}: ${esc(d.title)} ›</a>
        </div></div></li>`;
    }).join("");
    $("#concepts-count").textContent = got + " of 9 open";
    const toggle = (li, open) => { li.classList.toggle("open", open); $("button", li).setAttribute("aria-expanded", open); };
    list.addEventListener("click", e => { const b = e.target.closest(".play > button"); if (b) toggle(b.parentElement, !b.parentElement.classList.contains("open")); });
    const first = $$(".play:not(.locked)", list).pop(); if (first) toggle(first, true);
  }

  /* ---------- A line from each live breakdown ---------- */
  function pull() {
    const qs = liveDays().filter(d => d.meta && d.meta.pull); if (!qs.length) return;
    const fig = $("#pull"), q = $("#pull-q"), from = $("#pull-from"), dots = $("#pull-dots");
    let i = qs.length - 1, timer = 0;
    dots.innerHTML = qs.length > 1 ? qs.map((d, k) => `<button type="button" data-k="${k}" aria-label="Line from ${esc(d.title)}"></button>`).join("") : "";
    const go = k => {
      i = (k + qs.length) % qs.length; const d = qs[i];
      q.textContent = d.meta.pull;
      from.innerHTML = `From <a href="${esc(d.href)}">${pad(d.n)} · ${esc(d.title)}</a>`;
      $$("button", dots).forEach((b, k2) => b.setAttribute("aria-pressed", k2 === i));
      if (!reduce) { q.style.animation = "none"; void q.offsetWidth; q.style.animation = "rise .6s cubic-bezier(.2,.7,.2,1) both"; }
    };
    dots.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { clearInterval(timer); go(+b.dataset.k); } });
    fig.hidden = false; go(i);
    if (qs.length > 1 && !reduce) timer = setInterval(() => go(i + 1), 7000);
  }

  /* ---------- Page furniture ---------- */
  function navSpy() {
    const map = {}; $$(".links a").forEach(a => { map[a.getAttribute("href").slice(1)] = a; });
    const io = new IntersectionObserver(es => es.forEach(e => { const a = map[e.target.id]; if (a) a.classList.toggle("here", e.isIntersecting); }), { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  function sheet() {
    const btn = $(".menu-btn"), sh = $("#sheet"); if (!btn || !sh) return;
    const set = open => { sh.hidden = !open; btn.setAttribute("aria-expanded", open); btn.textContent = open ? "Close" : "Menu"; document.body.style.overflow = open ? "hidden" : ""; };
    btn.addEventListener("click", () => set(sh.hidden));
    sh.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
    addEventListener("keydown", e => { if (e.key === "Escape" && !sh.hidden) { set(false); btn.focus(); } });
    wide.addEventListener("change", () => set(false));
  }

  // Blocks below the fold fade up once. Anything already on screen is left alone,
  // so nothing is hidden if this script never runs.
  function reveal() {
    if (reduce || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$("[data-reveal]").forEach(el => { if (el.getBoundingClientRect().top > innerHeight * 0.92) { el.classList.add("reveal"); io.observe(el); } });
  }

  countdown(); rail(); picker(); navSpy(); sheet(); reveal();
  Promise.all(liveDays().map(loadMeta)).then(() => { enrichPicker(); eco(); concepts(); pull(); });
})();
