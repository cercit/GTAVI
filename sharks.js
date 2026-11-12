// Day 6 (Shark Cards) effects.
// 1. Card fan: five cards, drawn in code; tap/hover flips a card to its price side.
// 2. GTA$ counters that roll up when they scroll into view.
// 3. "Grind or pay?": hours of play vs the cheapest set of cards for a target amount.
// 4. Price ladder and before/after bars, built from the CARDS table below.
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // GTA$ since 6 Dec 2022 (Rockstar FAQ); old = before that date. Prices = US store listings.
  const CARDS = [
    { k: "tiger", name: "Tiger Shark", gta: 250000, old: 200000, usd: 4.99 },
    { k: "bull", name: "Bull Shark", gta: 600000, old: 500000, usd: 9.99 },
    { k: "white", name: "Great White Shark", gta: 1500000, old: 1250000, usd: 19.99 },
    { k: "whale", name: "Whale Shark", gta: 4250000, old: 3500000, usd: 49.99 },
    { k: "mega", name: "Megalodon Shark", gta: 10000000, old: 8000000, usd: 99.99 }
  ];
  const fmt = n => n.toLocaleString("en-US");
  const short = n => n >= 1e6 ? (n / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 }) + "M" : (n / 1e3).toLocaleString("en-US") + "k";

  /* ---------- 1. Card fan ---------- */
  function fan() {
    const box = document.getElementById("fan"); if (!box) return;
    box.innerHTML = CARDS.map((c, i) => `
      <button class="scard s-${c.k}" style="--i:${i}" aria-label="${c.name}: GTA$${fmt(c.gta)}, ${"$" + c.usd} in US stores">
        <span class="sc-in">
          <span class="sc-face sc-front">
            <span class="sc-top">Shark Cash Card</span>
            <svg class="sc-fin" viewBox="0 0 120 70" aria-hidden="true"><path d="M4 66 C 40 62, 62 40, 74 4 C 80 26, 92 48, 116 66 Z"/></svg>
            <span class="sc-name">${c.name.replace(" Shark", "")}</span>
            <span class="sc-gta">GTA$${short(c.gta)}</span>
          </span>
          <span class="sc-face sc-back">
            <span class="sc-top">US store price</span>
            <span class="sc-usd">$${c.usd}</span>
            <span class="sc-rate">GTA$${fmt(Math.round(c.gta / c.usd / 10) * 10)} per $1</span>
            <span class="sc-old">Was GTA$${short(c.old)} before Dec 2022</span>
          </span>
        </span>
      </button>`).join("");
    box.querySelectorAll(".scard").forEach(b => b.addEventListener("click", () => b.classList.toggle("flip")));
  }

  /* ---------- 2. Rolling counters ---------- */
  function counters() {
    const els = [...document.querySelectorAll("[data-count]")];
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, pre = el.dataset.pre || "";
      if (reduce) { el.textContent = pre + fmt(to); return; }
      const t0 = performance.now(), dur = 1400;
      (function step(t) { const p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
        el.textContent = pre + fmt(v); if (p < 1) requestAnimationFrame(step); })(t0);
    }), { threshold: 0.6 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- 3. Grind or pay ---------- */
  // Cheapest set of cards (any number of each) that reaches at least the target.
  function cheapest(target) {
    const U = 50000, need = Math.ceil(target / U), max = need + 200;
    const cost = new Array(max + 1).fill(Infinity), pick = new Array(max + 1).fill(-1); cost[0] = 0;
    for (let v = 1; v <= max; v++) CARDS.forEach((c, i) => {
      const u = c.gta / U; if (u <= v && cost[v - u] + c.usd < cost[v]) { cost[v] = cost[v - u] + c.usd; pick[v] = i; }
    });
    let best = need; for (let v = need; v <= max; v++) if (cost[v] < cost[best]) best = v;
    const n = CARDS.map(() => 0); for (let v = best; v > 0; v -= CARDS[pick[v]].gta / U) n[pick[v]]++;
    return { usd: cost[best], n };
  }
  function grind() {
    const t = document.getElementById("g-target"), r = document.getElementById("g-rate"); if (!t) return;
    const out = { tv: document.getElementById("g-target-v"), rv: document.getElementById("g-rate-v"), hours: document.getElementById("g-hours"),
      usd: document.getElementById("g-usd"), mix: document.getElementById("g-mix"), per: document.getElementById("g-per") };
    function update() {
      const target = +t.value * 1e6 / 10, rate = +r.value * 1000;
      out.tv.textContent = "GTA$" + fmt(target); out.rv.textContent = "GTA$" + fmt(rate) + " an hour";
      const h = target / rate; out.hours.textContent = h < 10 ? h.toFixed(1) : Math.round(h);
      const c = cheapest(target); out.usd.textContent = "$" + c.usd.toFixed(2);
      out.mix.textContent = c.n.map((k, i) => k ? `${k} × ${CARDS[i].name.replace(" Shark", "")}` : "").filter(Boolean).join(" + ");
      out.per.textContent = "$" + (c.usd / h).toFixed(2);
    }
    t.addEventListener("input", update); r.addEventListener("input", update); update();
  }

  /* ---------- 4. Ladder + before/after ---------- */
  function ladder() {
    const box = document.getElementById("ladder"); if (!box) return;
    const rates = CARDS.map(c => c.gta / c.usd), top = Math.max(...rates);
    box.innerHTML = CARDS.map((c, i) => `
      <div class="lr s-${c.k}"><span class="ln">${c.name.replace(" Shark", "")} <small>$${c.usd}</small></span>
      <span class="lt"><i style="--w:${(rates[i] / top * 100).toFixed(1)}%"></i></span><b>GTA$${fmt(Math.round(rates[i] / 10) * 10)}</b></div>`).join("");
    const ba = document.getElementById("beforeafter"); if (!ba) return;
    const mx = Math.max(...CARDS.map(c => c.gta));
    ba.innerHTML = `<div class="ba-row ba-red"><span class="ln">Red Shark</span><span class="ba-bars"><i class="o" style="--w:${(100000 / mx * 100).toFixed(2)}%"></i><em>Dropped</em></span><b>GTA$100k → gone</b></div>` +
      CARDS.map(c => `<div class="ba-row"><span class="ln">${c.name.replace(" Shark", "")}</span>
      <span class="ba-bars"><i class="o" style="--w:${(c.old / mx * 100).toFixed(2)}%"></i><i class="n" style="--w:${(c.gta / mx * 100).toFixed(2)}%"></i></span>
      <b>${short(c.old)} → ${short(c.gta)}</b></div>`).join("");
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("grow"); io.unobserve(e.target); } }), { threshold: 0.3 });
    [box, ba].forEach(el => io.observe(el));
  }

  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.2 });
    document.querySelectorAll(".rise").forEach(el => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => { fan(); counters(); grind(); ladder(); reveal(); });
})();
