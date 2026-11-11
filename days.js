// One entry per day. To publish a day: move drafts/day-0N.html to the root,
// set live: true below, commit and push.
const DAYS = [
  { n: 1, date: "11 Nov", file: "day-01.html", live: true,
    title: "The 13-year wait",
    hook: "Why Rockstar could afford 13 years between two main releases." },
  { n: 2, date: "12 Nov", file: "day-02.html", live: false,
    title: "GTA Online: the money engine",
    hook: "How a one-time sale became a product that kept paying." },
  { n: 3, date: "13 Nov", file: "day-03.html", live: false,
    title: "RAGE: build vs buy",
    hook: "Owning the engine instead of licensing one, and tuning one world for two consoles." },
  { n: 4, date: "14 Nov", file: "day-04.html", live: false,
    title: "No PC at launch",
    hook: "The platform call, and who it leaves waiting." },
  { n: 5, date: "15 Nov", file: "day-05.html", live: false,
    title: "Delayed twice",
    hook: "Choosing late over broken, two times." },
  { n: 6, date: "16 Nov", file: "day-06.html", live: false,
    title: "Marketing by silence",
    hook: "Two trailers in about three years, and the world still watched." },
  { n: 7, date: "17 Nov", file: "day-07.html", live: false,
    title: "The $79.99 call",
    hook: "Pricing the biggest launch of the decade." },
  { n: 8, date: "18 Nov", file: "day-08.html", live: false,
    title: "Everyone else moves",
    hook: "How one launch date reshapes a whole industry's calendar." },
  { n: 9, date: "19 Nov", file: "day-09.html", live: false,
    title: "Launch day",
    hook: "What a product manager watches in the first 24 hours." },
];

// Hide a logo image if its file isn't in assets/ yet, and show the text wordmark instead.
function logoFallback(img) {
  img.style.display = "none";
  const alt = img.nextElementSibling;
  if (alt) alt.style.display = "";
}
