// One entry per day = one Rockstar product, broken down from a PM's view.
// Days publish themselves at 2:45 pm IST from _queue/ (see README and tools/publish-day.sh).
// Art: assets/dNN.jpg (full) and assets/t-dNN.jpg (thumbnail).
const DAYS = [
  { n: 1, date: "11 Nov", file: "day-01.html", live: true,  title: "GTA V",
    hook: "The game that kept earning for 13 years." },
  { n: 2, date: "12 Nov", file: "day-02.html", live: false, title: "GTA Online",
    hook: "The free mode that turned a game into a business." },
  { n: 3, date: "13 Nov", file: "day-03.html", live: true, title: "RAGE engine",
    hook: "Rockstar's own engine, under every game they make." },
  { n: 4, date: "14 Nov", file: "day-04.html", live: false, title: "Social Club",
    hook: "The account layer that ties players together." },
  { n: 5, date: "15 Nov", file: "day-05.html", live: false, title: "Rockstar Games Launcher",
    hook: "Owning the PC store instead of renting one." },
  { n: 6, date: "16 Nov", file: "day-06.html", live: false, title: "Shark Cards",
    hook: "Selling in-game money for real money." },
  { n: 7, date: "17 Nov", file: "day-07.html", live: false, title: "GTA+",
    hook: "A monthly subscription inside a game people already own." },
  { n: 8, date: "18 Nov", file: "day-08.html", live: false, title: "FiveM",
    hook: "The mod platform Rockstar bought instead of shutting down." },
  { n: 9, date: "19 Nov", file: "day-09.html", live: false, title: "GTA VI",
    hook: "Launch day, and how the other eight come together." },
];

const pad = n => String(n).padStart(2, "0");

// Shared: nav turns solid once you scroll past the top of the artwork
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const set = () => nav.classList.toggle("solid", scrollY > 80);
  set(); addEventListener("scroll", set, { passive: true });
});
