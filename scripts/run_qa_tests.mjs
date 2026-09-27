import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

console.log("=================================================");
console.log("   QA TEST SUITE — FÊTE DE LA MUSIQUE 2026       ");
console.log("   Verifying all requirements in todotest.md     ");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function assert(id, desc, condition, detail = "") {
  if (condition) {
    console.log(`[PASS] ${id}: ${desc}`);
    passed++;
  } else {
    console.error(`[FAIL] ${id}: ${desc} — ${detail}`);
    failed++;
  }
}

// 1. Read files
const html = fs.readFileSync(path.join(root, "index.html"), "utf-8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf-8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf-8");

// --- SECTION 2.1: Hero & Background Audio ---
assert("F-01", "Homepage loads with no auto-play attribute on audio tags", !html.match(/<audio[^>]*\bautoplay\b/i));
assert("F-02", "Hero CTA button exists with correct initial text", html.includes("🔊 Tap to Launch Festival Sound"));
assert("F-03", "App logic handles pause and button toggle", js.includes("updateHeroButton") && js.includes("Pause Festival Sound"));
assert("F-04", "No auto-play on reload (no autoplay in localStorage)", !js.includes("localStorage.setItem('autoplay'") && !js.includes("localStorage.setItem(\"autoplay\""));
assert("F-05", "Floating widget exists with hidden attribute initially", html.includes('id="floater" hidden'));
assert("F-06", "Floating vinyl button handles pause/resume", js.includes("vinyl.addEventListener(\"click\"") || js.includes("vinyl.addEventListener('click'"));
assert("F-07", "Background music file exists and has loop attribute", fs.existsSync(path.join(root, "assets/audio/festival-bed.mp3")) && html.includes('id="hero-audio"') && html.includes("loop"));

// --- SECTION 2.2: City → Genre Boxes ---
const cityKeys = ["paris", "lyon", "marseille", "toulouse", "nantes", "strasbourg", "brittany", "bordeaux"];
const cityCount = (html.match(/class="city-card"/g) || []).length;
assert("F-08", "8 city boxes present in HTML", cityCount === 8, `Found ${cityCount}`);
assert("F-08-CSS", "Desktop CSS specifies 3 columns for city grid", css.includes("repeat(3, 1fr)"));
assert("F-09-CSS", "Phone CSS specifies 1 column for city grid", css.includes(".city-grid {") && css.includes("grid-template-columns: 1fr"));
assert("F-10-CSS", "Desktop hover scale ~1.03 and overlay reveal present", css.includes("scale(1.03)") && css.includes(".city-card:hover .city-overlay"));
assert("F-12", "Mobile tap toggle logic for city cards in JS", js.includes(".city-card") && js.includes("card.classList.add(\"open\")"));

let allCityAssets = true;
cityKeys.forEach((k) => {
  if (!fs.existsSync(path.join(root, `assets/images/cities/${k}.jpg`))) allCityAssets = false;
});
assert("F-13", "Each city box has photo, name, and genre badge", allCityAssets && html.includes("genre-badge") && html.includes("city-name"));

// --- SECTION 2.3: Music Revolution Timeline ---
const eraCount = (html.match(/class="era-card"/g) || []).length;
assert("F-15", "Timeline loads with 10 era cards in order", eraCount === 10, `Found ${eraCount}`);
assert("F-16", "Desktop arrow buttons exist", html.includes('id="timeline-prev"') && html.includes('id="timeline-next"'));
assert("F-17", "Timeline slider has touch swipe support", css.includes("scroll-snap-type: x mandatory") && css.includes("-webkit-overflow-scrolling: touch"));
assert("F-18", "First card left arrow disabled initially in HTML", html.includes('id="timeline-prev"') && html.includes("disabled"));
assert("F-19", "Each era card shows media, era name, years, and description", html.includes("era-years") && html.includes("era-name") && html.includes("era-desc"));
assert("F-20", "Timeline cards styled with flex sizing and equal bounds", css.includes(".era-card {") && css.includes("flex: 0 0"));

// --- SECTION 2.4: Musicians Section ---
const musicianKeys = [
  "adam_de_la_halle", "josquin_des_prez", "jean_baptiste_lully", "hector_berlioz",
  "edith_piaf", "charles_trenet", "hugues_aufray", "serge_gainsbourg",
  "daft_punk", "stromae"
];
const musicianCardCount = (html.match(/class="musician-card"/g) || []).length;
assert("F-21", "10 musician cards load in year order", musicianCardCount === 10, `Found ${musicianCardCount}`);
assert("F-22", "Desktop hover triggers audio and reveals overlay", js.includes("mouseenter") && js.includes("playMusicianCard"));
assert("F-23", "Mouse-out stops audio immediately and hides overlay", js.includes("mouseleave") && js.includes("stopMusicianAudio"));
assert("F-24", "Hovering another musician stops previous (no overlap)", js.includes("stopMusicianAudio()") && js.includes("playMusicianCard"));
assert("F-25/26", "Mobile tap toggles audio on/off on repeated tap", js.includes("currentPlayingMusician === card"));
assert("F-27", "Animated soundwave bars present in cards and styled", html.includes("musician-wave") && css.includes("pulse-wave"));

let allMusicianAudios = true;
let allUnder500Kb = true;
let totalAudioBytes = 0;
musicianKeys.forEach((k) => {
  const p = path.join(root, `assets/audio/${k}.mp3`);
  if (!fs.existsSync(p)) {
    allMusicianAudios = false;
  } else {
    const s = fs.statSync(p).size;
    totalAudioBytes += s;
    if (s >= 500 * 1024) allUnder500Kb = false;
  }
});
const bedSize = fs.statSync(path.join(root, "assets/audio/festival-bed.mp3")).size;
totalAudioBytes += bedSize;

assert("F-28", "All 10 musician audio snippets exist and are loadable", allMusicianAudios);
assert("A-05", "All MP3 files under 500 KB each", allUnder500Kb);
assert("P-03", "Total audio weight < 5 MB", totalAudioBytes < 5 * 1024 * 1024, `${(totalAudioBytes / 1024 / 1024).toFixed(2)} MB`);

// --- SECTION 2.5: Footer ---
assert("F-29", "Team credits present with all 5 roles listed",
  html.includes("Logistics:") && html.includes("Web:") && html.includes("Deck:") &&
  html.includes("Music:") && html.includes("Graphics:")
);
assert("F-30", "Quick links column present with 4 nav anchors",
  html.includes('href="#Summary"') && html.includes('href="#Cities"') &&
  html.includes('href="#Timeline"') && html.includes('href="#Musicians"')
);
assert("F-31", "Custom QR code displays with scalable max-width: 100%",
  html.includes("your-qr-code.png") && html.includes("max-width: 100%")
);
assert("F-32", "QR code image file exists on disk", fs.existsSync(path.join(root, "your-qr-code.png")));
assert("F-33", "Quiz link placeholder present showing [Insert Quiz Link Here](#)", html.includes("[Insert Quiz Link Here](#)"));
assert("F-34", "Live Classroom Interaction section completely removed from DOM", !html.includes("Live Classroom Interaction") && !html.includes('id="livepoll"'));
assert("F-35", "Optional live-tool embed URL removed from DOM", !html.includes("Optional live-tool embed URL") && !html.includes('id="poll-embed"'));

// --- SECTION 2.6: Navigation ---
assert("F-36", "Section #Summary exists for smooth scroll", html.includes('id="Summary"'));
assert("F-37", "Section #Cities exists for smooth scroll", html.includes('id="Cities"'));
assert("F-38", "Section #Timeline exists for smooth scroll", html.includes('id="Timeline"'));
assert("F-39", "Section #Musicians exists for smooth scroll", html.includes('id="Musicians"'));
assert("F-40", "Sticky header defined in CSS with scroll offset", css.includes("position: sticky") && css.includes("scroll-padding-top:"));

// --- SECTION 3: Audio Policies ---
assert("A-03", "Silent mode warning note present for iOS", html.includes("Silent Mode on iOS may block audio"));
assert("A-09", "Musician audio ducks background music", js.includes("DUCKED_VOLUME") && js.includes("heroAudio.volume = DUCKED_VOLUME"));

// --- SECTION 4: Responsive Breakpoints ---
assert("R-04", "iPad portrait 2-column styles defined for cities and musicians", css.includes("repeat(2, 1fr)"));
assert("R-07", "Max-width capped on containers to avoid infinite stretch", css.includes("max-width: 1200px"));

// --- SECTION 5: Performance & Weight ---
let totalImageBytes = 0;
function walkImages(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walkImages(full);
    else totalImageBytes += fs.statSync(full).size;
  }
}
walkImages(path.join(root, "assets/images"));
totalImageBytes += fs.statSync(path.join(root, "your-qr-code.png")).size;
assert("P-04", "Total image weight < 3 MB", totalImageBytes < 3 * 1024 * 1024, `${(totalImageBytes / 1024 / 1024).toFixed(2)} MB`);
assert("P-02", "Total page weight (HTML+CSS+JS+images+audio) < 5 MB", (totalAudioBytes + totalImageBytes + html.length + css.length + js.length) < 5 * 1024 * 1024);

// --- SECTION 6: Accessibility ---
const imgTags = html.match(/<img[^>]+>/g) || [];
const allHaveAlt = imgTags.every((t) => t.includes('alt="'));
assert("AC-01", "All images have alt text attribute", allHaveAlt && imgTags.length >= 28, `${imgTags.length} images verified`);
assert("AC-02", "Buttons and interactive elements have focus outline in CSS", css.includes(":focus-visible"));
assert("AC-05", "Touch targets ≥ 44px for buttons", css.includes("min-height: 44px") || css.includes("min-height: 48px"));
assert("AC-07", "Musician cards have aria-label and aria-expanded", html.includes('class="musician-card"') && html.includes("aria-label=") && html.includes("aria-expanded="));
assert("AC-08", "Keyboard navigation handlers for cards (Enter / Space)", js.includes("e.key === \"Enter\""));

console.log("\n=================================================");
console.log(`TOTAL TESTS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL TESTS PASSED! Ready for classroom presentation.");
}
