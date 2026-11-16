// Day 8 (FiveM) effects.
// 1. "Run your own server": pick player slots and monthly store sales; shows the Element Club plan,
//    Tebex's 15% fee and what the server keeps.
// 2. Sections rise in as you scroll.
(function () {
  // Element Club list prices on fivem.net (US$ a month, before VAT), checked 16 Nov 2026.
  // Default server is free up to 48 players. 128 needs Aurum (OneSync Infinity); 2,048 needs Platinum.
  const PLANS = [
    { max: 48, name: "Free", cost: 0 },
    { max: 64, name: "Argentum", cost: 15 },
    { max: 128, name: "Aurum", cost: 25 },
    { max: 2048, name: "Platinum", cost: 50 }
  ];
  const FEE = 0.15;   // Tebex fee on FiveM sales (5% for other games)
  const usd = n => "$" + Math.round(n).toLocaleString("en-US");

  function server() {
    const sales = document.getElementById("s-sales"); if (!sales) return;
    const radios = [...document.querySelectorAll('input[name="slots"]')];
    const o = id => document.getElementById(id);
    function update() {
      const slots = +(radios.find(r => r.checked) || radios[0]).value;
      const plan = PLANS.find(p => slots <= p.max), s = +sales.value;
      const fee = s * FEE, platform = plan.cost + fee, keep = s - fee - plan.cost;
      o("s-sales-v").textContent = usd(s);
      o("s-tier").textContent = plan.name;
      o("s-plan").textContent = usd(plan.cost);
      o("s-fee").textContent = usd(fee);
      o("s-platform").textContent = usd(platform);
      o("s-keep").textContent = (keep < 0 ? "-" : "") + usd(Math.abs(keep));
      let note;
      if (s === 0 && plan.cost === 0) note = "A small free server with no store pays the platform nothing. It still needs someone to host it.";
      else if (s === 0) note = "No store yet, so the plan is the only cost: " + usd(plan.cost) + " a month for room to grow.";
      else if (fee > plan.cost) note = "The 15% store fee is " + (plan.cost ? Math.round(fee / plan.cost) + "x" : "more than") + " the plan here. Once a server sells, the fee on its sales is the bigger cost.";
      else note = "At these sales the plan costs more than the store fee. The fee takes over as sales grow.";
      o("s-note").textContent = note;
    }
    radios.forEach(r => r.addEventListener("change", update)); sales.addEventListener("input", update); update();
  }

  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    document.querySelectorAll(".rise").forEach(el => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => { server(); reveal(); });
})();
