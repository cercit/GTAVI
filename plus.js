// Day 7 (GTA+) effects.
// 1. GTA$ counters that roll up when they scroll into view.
// 2. "Just the cash": months as a member vs the cheapest Shark Cards for the same GTA$.
// 3. "Try to cancel": a cancel screen with what a member loses and what they keep.
// 4. Sections rise in as you scroll.
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PRICE_CENTS = 799;       // US price a month since April 2024
  const MONTHLY_GTA = 500000;    // paid into the member's bank every billing cycle
  // Shark Cards: GTA$ since 6 Dec 2022 (Rockstar FAQ), US store prices. Same table as Day 6.
  const CARDS = [
    { name: "Tiger", gta: 250000, cents: 499 },
    { name: "Bull", gta: 600000, cents: 999 },
    { name: "Great White", gta: 1500000, cents: 1999 },
    { name: "Whale", gta: 4250000, cents: 4999 },
    { name: "Megalodon", gta: 10000000, cents: 9999 }
  ];
  const fmt = n => n.toLocaleString("en-US");
  const usd = cents => "$" + (cents / 100).toFixed(2);

  /* ---------- 1. Rolling counters ---------- */
  function counters() {
    const els = [...document.querySelectorAll("[data-count]")];
    if (!els.length) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, pre = el.dataset.pre || "";
      if (reduce) { el.textContent = pre + fmt(to); return; }
      const t0 = performance.now(), dur = 1400;
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
        el.textContent = pre + fmt(v); if (p < 1) requestAnimationFrame(step);
      })(t0);
    }), { threshold: 0.6 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- 2. Just the cash ---------- */
  // Cheapest set of cards (any number of each) that reaches at least the target. Works in GTA$50,000 units.
  function cheapest(target) {
    const U = 50000, need = Math.ceil(target / U), max = need + 200;
    const cost = new Array(max + 1).fill(Infinity), pick = new Array(max + 1).fill(-1); cost[0] = 0;
    for (let v = 1; v <= max; v++) CARDS.forEach((c, i) => {
      const u = c.gta / U;
      if (u <= v && cost[v - u] + c.cents < cost[v]) { cost[v] = cost[v - u] + c.cents; pick[v] = i; }
    });
    let best = need; for (let v = need; v <= max; v++) if (cost[v] < cost[best]) best = v;
    const n = CARDS.map(() => 0); for (let v = best; v > 0; v -= CARDS[pick[v]].gta / U) n[pick[v]]++;
    return { cents: cost[best], n };
  }
  function cash() {
    const m = document.getElementById("c-months"); if (!m) return;
    const free = document.getElementById("c-free");
    const o = id => document.getElementById(id);
    function update() {
      const months = +m.value, paid = Math.max(months - (free && free.checked ? 1 : 0), 0);
      const gta = months * MONTHLY_GTA, plus = PRICE_CENTS * paid, c = cheapest(gta);
      o("c-months-v").textContent = months + (months === 1 ? " month" : " months");
      o("c-gta").textContent = "GTA$" + fmt(gta);
      o("c-plus").textContent = usd(plus);
      o("c-cards").textContent = usd(c.cents);
      o("c-mix").textContent = c.n.map((k, i) => k ? k + " × " + CARDS[i].name : "").filter(Boolean).join(" + ");
      const diff = plus - c.cents, v = o("c-verdict");
      if (diff < 0) v.innerHTML = "For the cash alone, GTA+ is <b>" + usd(-diff) + " cheaper</b>. Small, regular top-ups are where the membership wins.";
      else if (diff === 0) v.innerHTML = "For the cash alone, it's <b>a tie</b>. Everything else in the membership comes free at this point.";
      else v.innerHTML = "For the cash alone, Shark Cards are <b>" + usd(diff) + " cheaper</b>. That " + usd(diff) + " is what the garage, the monthly car and the games cost you.";
    }
    m.addEventListener("input", update); if (free) free.addEventListener("change", update); update();
  }

  /* ---------- 3. Try to cancel ---------- */
  function cancel() {
    const dlg = document.getElementById("cancel-dlg"), open = document.getElementById("try-cancel");
    if (!dlg || !open) return;
    const acts = dlg.querySelector(".acts"), stayMsg = dlg.querySelector(".r-stay"), leaveMsg = dlg.querySelector(".r-leave"), closeRow = dlg.querySelector(".close-row");
    const reset = () => { acts.hidden = false; stayMsg.hidden = true; leaveMsg.hidden = true; closeRow.hidden = true; };
    const shut = () => { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); open.focus(); };
    const result = which => { acts.hidden = true; (which === "stay" ? stayMsg : leaveMsg).hidden = false; closeRow.hidden = false; closeRow.querySelector("button").focus(); };
    open.addEventListener("click", () => { reset(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); });
    dlg.querySelector(".stay").addEventListener("click", () => result("stay"));
    dlg.querySelector(".leave").addEventListener("click", () => result("leave"));
    closeRow.querySelector("button").addEventListener("click", shut);
    dlg.addEventListener("click", e => { if (e.target === dlg) shut(); });   // click on the dark backdrop
  }

  /* ---------- 4. Reveal ---------- */
  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    document.querySelectorAll(".rise").forEach(el => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => { counters(); cash(); cancel(); reveal(); });
})();
