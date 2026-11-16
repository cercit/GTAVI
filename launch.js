// Day 9 (GTA VI) effects.
// 1. Countdown to midnight on 19 November 2026 in the visitor's own time zone (Rockstar launches at
//    midnight local time). After that it says "Out now".
// 2. "How the eight come together": tap a product to highlight what it means for GTA VI.
// 3. Sections rise in as you scroll.
(function () {
  const LAUNCH = new Date(2026, 10, 19, 0, 0, 0);   // months count from 0: 10 = November
  const pad = n => String(n).padStart(2, "0");

  function countdown() {
    const box = document.getElementById("countdown"); if (!box) return;
    const el = id => document.getElementById(id);
    function tick() {
      const left = LAUNCH - new Date();
      if (left <= 0) { box.classList.add("done"); el("cd-out").hidden = false; box.querySelector(".cd-label").textContent = "Launched 19 November 2026"; return false; }
      const s = Math.floor(left / 1000);
      el("cd-d").textContent = Math.floor(s / 86400);
      el("cd-h").textContent = pad(Math.floor(s / 3600) % 24);
      el("cd-m").textContent = pad(Math.floor(s / 60) % 60);
      el("cd-s").textContent = pad(s % 60);
      return true;
    }
    if (tick()) { const t = setInterval(() => { if (!tick()) clearInterval(t); }, 1000); }
  }

  function eight() {
    const nodes = [...document.querySelectorAll(".e-node")], list = document.querySelector(".e-list");
    if (!nodes.length || !list) return;
    const rows = [...list.querySelectorAll("li")];
    let cur = null;
    function pick(n) {
      cur = cur === n ? null : n;
      list.classList.toggle("focus", cur !== null);
      nodes.forEach(b => { const on = b.dataset.n === cur; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      rows.forEach(r => r.classList.toggle("on", r.dataset.n === cur));
      const row = rows.find(r => r.dataset.n === cur);
      if (row && matchMedia("(max-width: 900px)").matches) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    nodes.forEach(b => { b.setAttribute("aria-pressed", "false"); b.addEventListener("click", () => pick(b.dataset.n)); });
  }

  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    document.querySelectorAll(".rise").forEach(el => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => { countdown(); eight(); reveal(); });
})();
