/**
 * Fête de la Musique 2026 — Interactive Application Logic
 * Implements audio architecture, city hover/tap reveals,
 * timeline slider controls, and musician hover-audio integration.
 */

// DOM Elements
const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
const launchBtn = document.getElementById("launch-sound");
const floater = document.getElementById("floater");
const vinyl = document.getElementById("vinyl");
const heroAudio = document.getElementById("hero-audio");

// Timeline Elements
const timelineSlider = document.getElementById("timeline-slider");
const prevBtn = document.getElementById("timeline-prev");
const nextBtn = document.getElementById("timeline-next");
const timelineIndicator = document.getElementById("timeline-indicator");
const eraCards = document.querySelectorAll(".era-card");

// City Cards
const cityCards = document.querySelectorAll(".city-card");

// Musician Cards
const musicianCards = document.querySelectorAll(".musician-card");

// State
let isHeroAudioPlaying = false;
let currentPlayingMusician = null;
let currentMusicianAudio = null;
const BACKGROUND_VOLUME = 0.25;
const DUCKED_VOLUME = 0.05;

/* -------------------------------------------------------------
 * 1. Mobile Navigation
 * ------------------------------------------------------------- */
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* -------------------------------------------------------------
 * 2. Background Audio & Hero Integration (F-01 to F-07)
 * ------------------------------------------------------------- */
if (heroAudio) {
  heroAudio.volume = BACKGROUND_VOLUME;
}

function updateHeroButton(playing) {
  if (!launchBtn) return;
  if (playing) {
    launchBtn.classList.add("live");
    launchBtn.textContent = "⏸ Pause Festival Sound";
  } else {
    launchBtn.classList.remove("live");
    launchBtn.textContent = "🔊 Tap to Launch Festival Sound";
  }
}

function updateVinylState(playing) {
  if (!vinyl) return;
  if (playing) {
    vinyl.classList.add("on");
    vinyl.setAttribute("aria-pressed", "true");
    vinyl.setAttribute("aria-label", "Pause festival sound");
  } else {
    vinyl.classList.remove("on");
    vinyl.setAttribute("aria-pressed", "false");
    vinyl.setAttribute("aria-label", "Play festival sound");
  }
}

async function playHeroAudio() {
  if (!heroAudio) return;
  try {
    heroAudio.volume = currentMusicianAudio ? DUCKED_VOLUME : BACKGROUND_VOLUME;
    await heroAudio.play();
    isHeroAudioPlaying = true;
    updateHeroButton(true);
    updateVinylState(true);
    if (floater) floater.hidden = false;
  } catch (err) {
    console.warn("Audio play prevented or interrupted:", err);
  }
}

function pauseHeroAudio() {
  if (!heroAudio) return;
  heroAudio.pause();
  isHeroAudioPlaying = false;
  updateHeroButton(false);
  updateVinylState(false);
}

function toggleHeroAudio() {
  if (isHeroAudioPlaying) {
    pauseHeroAudio();
  } else {
    playHeroAudio();
  }
}

if (launchBtn) {
  launchBtn.addEventListener("click", toggleHeroAudio);
}

if (vinyl) {
  vinyl.addEventListener("click", toggleHeroAudio);
}

/* -------------------------------------------------------------
 * 3. City → Genre Cards Interaction (F-08 to F-14)
 * ------------------------------------------------------------- */
cityCards.forEach((card) => {
  // Mobile tap toggle
  card.addEventListener("click", () => {
    const isCurrentlyOpen = card.classList.contains("open");
    // Close other cards for clean display
    cityCards.forEach((c) => {
      c.classList.remove("open");
      c.setAttribute("aria-expanded", "false");
    });
    if (!isCurrentlyOpen) {
      card.classList.add("open");
      card.setAttribute("aria-expanded", "true");
    }
  });

  // Keyboard accessibility
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });
});

// Close open city cards when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".city-card")) {
    cityCards.forEach((c) => {
      c.classList.remove("open");
      c.setAttribute("aria-expanded", "false");
    });
  }
});

/* -------------------------------------------------------------
 * 4. Music Revolution Timeline Slider (F-15 to F-20)
 * ------------------------------------------------------------- */
let currentEraIndex = 0;
const totalEras = eraCards.length;

function updateTimelineControls() {
  if (!timelineSlider || totalEras === 0) return;
  
  if (prevBtn) {
    prevBtn.disabled = currentEraIndex === 0;
  }
  if (nextBtn) {
    nextBtn.disabled = currentEraIndex >= totalEras - 1;
  }
  if (timelineIndicator) {
    timelineIndicator.textContent = `Era ${currentEraIndex + 1} of ${totalEras}`;
  }
}

function scrollTimelineToIndex(index) {
  if (!timelineSlider || !eraCards[index]) return;
  currentEraIndex = Math.max(0, Math.min(totalEras - 1, index));
  const targetCard = eraCards[currentEraIndex];
  
  timelineSlider.scrollTo({
    left: targetCard.offsetLeft - timelineSlider.offsetLeft - 16,
    behavior: "smooth"
  });
  updateTimelineControls();
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentEraIndex > 0) {
      scrollTimelineToIndex(currentEraIndex - 1);
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (currentEraIndex < totalEras - 1) {
      scrollTimelineToIndex(currentEraIndex + 1);
    }
  });
}

// Sync index with user scroll/swipe gesture
if (timelineSlider) {
  let scrollTimeout;
  timelineSlider.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollLeft = timelineSlider.scrollLeft;
      let closestIdx = 0;
      let minDistance = Infinity;

      eraCards.forEach((card, idx) => {
        const cardPos = card.offsetLeft - timelineSlider.offsetLeft - 16;
        const dist = Math.abs(scrollLeft - cardPos);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      currentEraIndex = closestIdx;
      updateTimelineControls();
    }, 80);
  });
}

updateTimelineControls();

/* -------------------------------------------------------------
 * 5. Musician Cards & Hover Audio Architecture (F-21 to F-28, A-09)
 * ------------------------------------------------------------- */
function stopMusicianAudio() {
  if (currentMusicianAudio) {
    currentMusicianAudio.pause();
    currentMusicianAudio.currentTime = 0;
    currentMusicianAudio = null;
  }
  if (currentPlayingMusician) {
    currentPlayingMusician.classList.remove("active-play");
    currentPlayingMusician.setAttribute("aria-expanded", "false");
    currentPlayingMusician = null;
  }
  // Restore background audio volume if playing
  if (heroAudio && isHeroAudioPlaying) {
    heroAudio.volume = BACKGROUND_VOLUME;
  }
}

async function playMusicianCard(card) {
  const audio = card.querySelector("audio");
  if (!audio) return;

  // Stop previous snippet if any (F-24: no overlap)
  stopMusicianAudio();

  currentPlayingMusician = card;
  currentMusicianAudio = audio;

  card.classList.add("active-play");
  card.setAttribute("aria-expanded", "true");

  // Duck background audio volume so they never clash (A-09)
  if (heroAudio && isHeroAudioPlaying) {
    heroAudio.volume = DUCKED_VOLUME;
  }

  try {
    audio.volume = 0.45; // 40–50% per spec section 4.2
    await audio.play();
  } catch (err) {
    console.warn("Musician snippet playback interrupted or not permitted:", err);
  }

  audio.onended = () => {
    stopMusicianAudio();
  };
}

musicianCards.forEach((card) => {
  // Desktop Hover Behavior (F-22, F-23, F-24)
  card.addEventListener("mouseenter", () => {
    // Only trigger hover on mouse/pointer devices
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      playMusicianCard(card);
    }
  });

  card.addEventListener("mouseleave", () => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      stopMusicianAudio();
    }
  });

  // Mobile / Touch Tap Behavior (F-25, F-26)
  card.addEventListener("click", () => {
    if (currentPlayingMusician === card) {
      // Tap again: stops audio and hides overlay (F-26)
      stopMusicianAudio();
    } else {
      // Tap: starts audio and reveals overlay (F-25)
      playMusicianCard(card);
    }
  });

  // Keyboard accessibility
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });
});

/* -------------------------------------------------------------
 * 6. Quick Links Smooth Scrolling (F-36 to F-40)
 * ------------------------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (!targetId || targetId === "#") return;
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: "smooth" });
    }
  });
});
