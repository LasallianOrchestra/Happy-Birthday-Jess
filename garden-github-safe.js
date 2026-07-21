/* ================================================================
   HYACINTH BIRTHDAY GARDEN — EASY PERSONALIZATION
   Change these four values. Everything else updates automatically.
   ================================================================ */
const SITE_CONFIG = {
  lovedOneName: "Ralph James Bates",
  callSign: "Honeybun / Bunbun",
  yourName: "Nicu",
  birthday: "2026-07-22T00:00:00+08:00",
  relationshipStart: "2025-12-28T00:00:00+08:00",
  heroMessage:
    "Bunbun, I grew this little digital garden from our memories, our love, and every moment that made us choose each other.",
};

const memories = [
  ["memory-01.jpg", "One of the moments I keep replaying"],
  ["memory-02.jpg", "You, exactly as you are"],
  ["memory-03.jpg", "Us, being completely ourselves"],
  ["memory-04.jpg", "A simple day that became a favorite"],
  ["memory-05.jpg", "Two faces, one shared joke"],
  ["memory-06.jpg", "The kind of peace I want to keep"],
  ["memory-07.jpg", "Another tiny chapter of us"],
  ["memory-08.jpg", "Walking through life side by side"],
  ["memory-09.jpg", "My favorite person in my frame"],
  ["memory-10.jpg", "Even the road felt special that day"],
  ["memory-11.jpg", "The light, the trees, and you"],
  ["memory-12.jpg", "A close-up of a life I love"],
  ["memory-13.jpg", "Blue-hour memories"],
  ["memory-14.jpg", "A photo inside a photo inside my heart"],
  ["memory-15.jpg", "Your playful side, safely archived"],
  ["memory-16.jpg", "The two of us—my favorite view"],
  ["memory-17.jpg", "Close feels like home"],
  ["memory-18.jpg", "Our playful language"],
  ["memory-19.jpg", "Matching energy, always"],
  ["memory-20.jpg", "Love, handmade and held close"],
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let currentMemory = 0;
let autoPlayTimer = null;
let autoPlayResumeAfterVisibility = false;
let lightboxSequence = memories.map((_, index) => index);
let favorites = new Set();
try {
  favorites = new Set(JSON.parse(localStorage.getItem("hyacinthFavoriteMemories") || "[]"));
} catch (_) {
  favorites = new Set();
}


async function cleanupLegacyGardenCaches() {
  if (!("caches" in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith("hyacinth-birthday-garden-") && key !== "hyacinth-birthday-garden-v8-20260720")
      .map((key) => caches.delete(key)));
  } catch (_) {
    // Cache cleanup is optional; the garden remains fully functional without it.
  }
}

function applyPersonalization() {
  const map = {
    "#heroName": SITE_CONFIG.lovedOneName,
    "#recipientName": `${SITE_CONFIG.lovedOneName} · ${SITE_CONFIG.callSign}`,
    "#creatorName": SITE_CONFIG.yourName,
    "#letterName": SITE_CONFIG.lovedOneName,
    "#signatureName": SITE_CONFIG.yourName,
    "#surpriseName": SITE_CONFIG.lovedOneName,
    "#footerRecipient": `${SITE_CONFIG.lovedOneName} // ${SITE_CONFIG.callSign}`.toUpperCase(),
    "#heroMessage": SITE_CONFIG.heroMessage,
    "#accessRecipientName": SITE_CONFIG.lovedOneName,
  };
  Object.entries(map).forEach(([selector, value]) => {
    const node = $(selector);
    if (node) node.textContent = value;
  });
  document.title = `Happy Birthday, ${SITE_CONFIG.lovedOneName} (${SITE_CONFIG.callSign}) // 07.22.2026`;
}

const ACCESS_HASHES = new Set([
  "c14731c6c4af23ee7f2c2bcfb9cd1882bf2b8e8ddaf003b780a3925ea71b47f8",
  "0d5be8bb0541144a6fbc06624bf1cff42548195488e108460d836a42f74df14c",
  "4e607612807651ca7d6af864b3f1886db108ca2eef5b05be1f7e405ca1e0c63e",
]);
const ACCESS_FALLBACK = new Set(["december282025", "12282025", "122825"]);

function normalizePassword(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function hashText(value) {
  if (!window.crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function isValidPassword(value) {
  const hash = await hashText(value);
  return hash ? ACCESS_HASHES.has(hash) : ACCESS_FALLBACK.has(value);
}

function setGardenInteraction(enabled) {
  [$("#siteHeader"), $("main"), $("footer"), $("#gardenConsole")]
    .filter(Boolean)
    .forEach((node) => {
      node.inert = !enabled;
      node.setAttribute("aria-hidden", enabled ? "false" : "true");
    });

  const mobilePanel = $("#mobilePanel");
  if (mobilePanel) {
    mobilePanel.inert = !enabled;
    if (!enabled) mobilePanel.setAttribute("aria-hidden", "true");
  }
}

function setupAccessGate() {
  const screen = $("#accessScreen");
  const form = $("#accessForm");
  const input = $("#passwordInput");
  const toggle = $("#passwordToggle");
  const error = $("#accessError");
  const submit = $("#unlockGardenButton");
  const lockButton = $("#lockButton");
  const accessLayout = $("#accessLayout");
  const flowerConsole = $("#flowerConsole");
  const flowerStatus = $("#flowerStatus");
  const bloomProgress = $("#passwordBloomProgress");
  const bloomPercent = $("#bloomPercent");
  const progressPetals = $$("#progressPetals i");
  const petalLayer = $("#accessPetalLayer");

  if (!screen || !form || !input || !submit) return;

  lockButton?.addEventListener("click", () => {
    const audio = $("#backgroundMusic");
    audio?.pause();
    sessionStorage.removeItem("hyacinthUnlocked");
    location.reload();
  });

  if (sessionStorage.getItem("hyacinthUnlocked") === "1") {
    screen.remove();
    document.body.classList.remove("locked");
    setGardenInteraction(true);
    requestAnimationFrame(() => revealVisibleInViewport(true));
    return;
  }

  let failedAttempts = 0;
  let lockoutTimer = null;
  document.body.classList.add("locked");
  setGardenInteraction(false);

  const showError = (message) => {
    error.textContent = message;
    input.setAttribute("aria-invalid", "true");
    screen.classList.remove("denied");
    void screen.offsetWidth;
    screen.classList.add("denied");
    input.select();
  };

  const unlock = async (event) => {
    event.preventDefault();
    const normalized = normalizePassword(input.value);
    const valid = normalized.length > 0 && await isValidPassword(normalized);

    if (!valid) {
      failedAttempts += 1;
      if (failedAttempts >= 5) {
        let seconds = 8;
        submit.disabled = true;
        input.disabled = true;
        showError(`The garden is resting for ${seconds} seconds after several attempts.`);
        clearInterval(lockoutTimer);
        lockoutTimer = setInterval(() => {
          seconds -= 1;
          if (seconds <= 0) {
            clearInterval(lockoutTimer);
            failedAttempts = 0;
            submit.disabled = false;
            input.disabled = false;
            error.textContent = "";
            input.removeAttribute("aria-invalid");
            submit.querySelector("span").textContent = "Open the Garden";
            input.focus({ preventScroll: true });
          } else {
            error.textContent = `The garden is resting for ${seconds} seconds after several attempts.`;
          }
        }, 1000);
      } else {
        showError("That password did not open the garden. Please try the complete date again.");
      }
      return;
    }

    input.removeAttribute("aria-invalid");
    error.textContent = "";
    input.disabled = true;
    toggle.disabled = true;
    submit.disabled = true;
    submit.querySelector("span").textContent = "Access Granted";
    submit.querySelector("strong").textContent = "✓";
    screen.classList.remove("denied");
    screen.classList.add("granted");
    sessionStorage.setItem("hyacinthUnlocked", "1");
    if (flowerStatus) flowerStatus.textContent = "HYACINTH SIGNAL · ACCESS GRANTED";
    if (bloomProgress) bloomProgress.style.width = "100%";
    if (bloomPercent) bloomPercent.textContent = "100%";
    progressPetals.forEach((petal) => petal.classList.add("active"));

    // audio.play() is invoked from this trusted submit gesture, which is the
    // most reliable browser-compliant way to begin audible playback.
    const played = await startBackgroundMusic(true);
    if (!played) {
      showToast("The garden is open. Tap the sound icon if your browser kept the music paused.");
    }

    setGardenInteraction(true);
    document.body.classList.remove("locked");
    window.scrollTo(0, 0);
    requestAnimationFrame(() => revealVisibleInViewport(true));
    setTimeout(() => revealVisibleInViewport(true), 520);
    setTimeout(() => {
      screen.classList.add("hidden");
      setTimeout(() => {
        screen.remove();
        revealVisibleInViewport(true);
      }, 850);
    }, 420);
  };

  form.addEventListener("submit", unlock);
  const updateBloomFeedback = () => {
    const normalized = normalizePassword(input.value);
    const progress = Math.min(100, normalized.length * 7.5);
    if (bloomProgress) bloomProgress.style.width = `${progress}%`;
    if (bloomPercent) bloomPercent.textContent = `${Math.round(progress)}%`;
    progressPetals.forEach((petal, index) => {
      petal.classList.toggle("active", index < Math.ceil(progress / 12.5));
    });
    if (flowerStatus) {
      flowerStatus.textContent = normalized.length
        ? `HYACINTH SIGNAL · BLOOMING ${Math.round(progress)}%`
        : "HYACINTH SIGNAL · WAITING FOR YOU";
    }
    if (flowerConsole) {
      flowerConsole.style.setProperty("--input-energy", String(progress / 100));
    }
  };

  input.addEventListener("input", () => {
    input.removeAttribute("aria-invalid");
    error.textContent = "";
    screen.classList.remove("denied");
    updateBloomFeedback();
  });

  if (!reducedMotion && accessLayout && flowerConsole && matchMedia("(hover:hover)").matches) {
    screen.addEventListener("pointermove", (event) => {
      const x = (event.clientX / innerWidth - .5) * 2;
      const y = (event.clientY / innerHeight - .5) * 2;
      accessLayout.style.transform = `perspective(1200px) rotateX(${y * -1.1}deg) rotateY(${x * 1.1}deg)`;
      flowerConsole.style.transform = `translate3d(${x * 8}px, ${y * 8}px, 0)`;
    }, { passive: true });
    screen.addEventListener("pointerleave", () => {
      accessLayout.style.transform = "";
      flowerConsole.style.transform = "";
    });
  }

  screen.addEventListener("pointerdown", (event) => {
    if (!petalLayer || event.target.closest("button,input")) return;
    const amount = reducedMotion ? 3 : 8;
    for (let i = 0; i < amount; i += 1) {
      const petal = document.createElement("span");
      petal.className = "access-petal";
      petal.style.left = `${event.clientX}px`;
      petal.style.top = `${event.clientY}px`;
      const angle = (Math.PI * 2 * i) / amount + Math.random() * .45;
      const distance = 46 + Math.random() * 88;
      petal.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      petal.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
      petal.style.setProperty("--r", `${Math.round(Math.random() * 160 - 80)}deg`);
      petalLayer.appendChild(petal);
      petal.addEventListener("animationend", () => petal.remove(), { once: true });
    }
  });

  updateBloomFeedback();

  toggle?.addEventListener("click", () => {
    const revealing = input.type === "password";
    input.type = revealing ? "text" : "password";
    toggle.textContent = revealing ? "HIDE" : "SHOW";
    toggle.setAttribute("aria-label", revealing ? "Hide password" : "Show password");
    toggle.setAttribute("aria-pressed", String(revealing));
    input.focus({ preventScroll: true });
  });

  requestAnimationFrame(() => input.focus({ preventScroll: true }));
}

function updateCountdown() {
  const target = new Date(SITE_CONFIG.birthday).getTime();
  const distance = target - Date.now();
  if (distance <= 0) {
    ["days", "hours", "minutes", "seconds"].forEach((id) => $("#" + id).textContent = "00");
    $("#countdownTitle").textContent = "The celebration is live";
    return;
  }
  const values = {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000),
  };
  Object.entries(values).forEach(([id, value]) => $("#" + id).textContent = String(value).padStart(2, "0"));
}

function revealVisibleInViewport(forceHero = false) {
  const limit = window.innerHeight * 1.18;
  $$(".reveal:not(.visible)").forEach((node) => {
    const rect = node.getBoundingClientRect();
    if ((rect.top < limit && rect.bottom > -120) || (forceHero && node.closest("#home"))) {
      node.classList.add("visible");
    }
  });
}

function setupReveal() {
  if (reducedMotion || !("IntersectionObserver" in window)) {
    $$(".reveal").forEach((node) => node.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px 12% 0px", threshold: 0.06 });
  $$(".reveal").forEach((node) => observer.observe(node));
  window.addEventListener("resize", () => revealVisibleInViewport(false), { passive: true });
}

function setupHeader() {
  const header = $("#siteHeader");
  const progress = $("#scrollProgress");
  const menuButton = $("#menuButton");
  const panel = $("#mobilePanel");
  const scrollTopButton = $("#scrollTopButton");
  const sectionLabel = $("#currentSectionLabel");
  const navLinks = $$(".desktop-nav a, .mobile-panel a");
  let scrollTicking = false;

  const onScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      header?.classList.toggle("scrolled", window.scrollY > 30);
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`;
      scrollTopButton?.classList.toggle("visible", window.scrollY > 560);
      scrollTicking = false;
    });
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggleMenu = (force) => {
    if (!panel || !menuButton) return;
    const open = force ?? !panel.classList.contains("open");
    panel.classList.toggle("open", open);
    menuButton.classList.toggle("active", open);
    menuButton.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
  };
  menuButton?.addEventListener("click", () => toggleMenu());
  $$("a", panel || document).forEach((link) => link.addEventListener("click", () => toggleMenu(false)));
  scrollTopButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));

  const sections = ["home", "memories", "constellation", "signals", "letter", "poem", "capsule", "surprise"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const sectionNames = { home: "HOME", memories: "MEMORY GARDEN", constellation: "OUR CONSTELLATION", signals: "LOVE IN BLOOM", letter: "LOVE LETTER", poem: "BIRTHDAY POEM", capsule: "TIME CAPSULE", surprise: "EVERLASTING SURPRISE" };

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const id = visible.target.id;
      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      if (sectionLabel) sectionLabel.textContent = sectionNames[id] || id.toUpperCase();
    }, { rootMargin: "-30% 0px -55%", threshold: [0.05, 0.2, 0.5] });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  let activeTicking = false;
  const syncActiveSection = () => {
    if (activeTicking || !sections.length) return;
    activeTicking = true;
    requestAnimationFrame(() => {
      const marker = window.scrollY + (header?.offsetHeight || 70) + Math.min(window.innerHeight * .28, 240);
      let current = sections[0];
      sections.forEach((section) => {
        if (section.offsetTop <= marker) current = section;
      });
      const id = current.id;
      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      if (sectionLabel) sectionLabel.textContent = sectionNames[id] || id.toUpperCase();
      revealVisibleInViewport(false);
      activeTicking = false;
    });
  };
  window.addEventListener("scroll", syncActiveSection, { passive: true });
  window.addEventListener("resize", syncActiveSection, { passive: true });
  syncActiveSection();
}

function setupCursorGlow() {
  const glow = $("#cursorGlow");
  if (!glow || matchMedia("(hover:none)").matches) return;
  let x = -999, y = -999, gx = -999, gy = -999;
  window.addEventListener("pointermove", (event) => { x = event.clientX; y = event.clientY; }, { passive: true });
  const tick = () => {
    gx += (x - gx) * .14; gy += (y - gy) * .14;
    glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    requestAnimationFrame(tick);
  };
  tick();
}

function setupSpaceCanvas() {
  const canvas = $("#spaceCanvas");
  const ctx = canvas.getContext("2d");
  let width = 0, height = 0, dpr = 1, petals = [], pointer = { x: -9999, y: -9999 };
  const palette = ["#d9b6ff", "#b58cff", "#f2c2ff", "#ffb4d8", "#c9f5d1"];

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth; height = innerHeight;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = width + "px"; canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(90, Math.floor(width * height / 17000));
    petals = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - .5) * .22, vy: .08 + Math.random() * .28,
      size: index % 4 === 0 ? 4 + Math.random() * 5 : 1 + Math.random() * 2.2,
      angle: Math.random() * Math.PI * 2, spin: (Math.random() - .5) * .008,
      sway: Math.random() * Math.PI * 2, color: palette[Math.floor(Math.random() * palette.length)],
      petal: index % 4 === 0, alpha: .12 + Math.random() * .45,
    }));
  };

  const drawPetal = (p) => {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * .58, p.size, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.restore();
  };

  const draw = (time = 0) => {
    ctx.clearRect(0, 0, width, height);
    petals.forEach((p) => {
      p.sway += .008;
      p.x += p.vx + Math.sin(p.sway) * .07;
      p.y += p.vy;
      p.angle += p.spin;
      const dx = p.x - pointer.x, dy = p.y - pointer.y, dist = Math.hypot(dx, dy);
      if (dist < 120 && dist > 1) { p.x += (dx / dist) * .8; p.y += (dy / dist) * .8; }
      if (p.y > height + 15) { p.y = -15; p.x = Math.random() * width; }
      if (p.x < -15) p.x = width + 15; if (p.x > width + 15) p.x = -15;
      if (p.petal) drawPetal(p);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.fill(); }
    });
    ctx.globalAlpha = 1;
    if (!reducedMotion) requestAnimationFrame(draw);
  };
  addEventListener("pointermove", (event) => { pointer.x = event.clientX; pointer.y = event.clientY; }, { passive: true });
  resize(); draw(); addEventListener("resize", resize);
}

function setupTilt() {
  if (reducedMotion || matchMedia("(hover:none)").matches) return;
  $$(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const rx = ((event.clientY - rect.top) / rect.height - .5) * -6;
      const ry = ((event.clientX - rect.left) / rect.width - .5) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener("pointerleave", () => card.style.transform = "");
  });
}

function setupMagneticButtons() {
  if (reducedMotion || matchMedia("(hover:none)").matches) return;
  $$(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * .1}px, ${y * .16}px)`;
    });
    button.addEventListener("pointerleave", () => button.style.transform = "");
  });
}

function setFeatured(index, scrollThumb = true) {
  currentMemory = (index + memories.length) % memories.length;
  const [src, caption] = memories[currentMemory];
  const image = $("#featuredImage");
  image.style.opacity = "0";
  setTimeout(() => { image.src = src; image.alt = caption; image.style.opacity = "1"; }, 160);
  $("#featuredIndex").textContent = `BLOOM // ${String(currentMemory + 1).padStart(2, "0")}`;
  $("#featuredCaption").textContent = caption;
  $$(".memory-thumb").forEach((thumb, i) => thumb.classList.toggle("active", i === currentMemory));
  updateFavoriteUI();
  const preload = new Image();
  preload.src = memories[(currentMemory + 1) % memories.length][0];
  if (scrollThumb) $(`.memory-thumb[data-index="${currentMemory}"]`)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
}

function updateFavoriteUI() {
  const isFavorite = favorites.has(currentMemory);
  const count = favorites.size;
  const countNodes = [$("#favoriteCount"), $("#consoleFavoriteCount"), $("#dashboardFavoriteCount")];
  countNodes.forEach((node) => { if (node) node.textContent = String(count); });

  [$("#favoriteCurrentButton"), $("#lightboxFavoriteButton")].filter(Boolean).forEach((button) => {
    button.classList.toggle("active", isFavorite);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute("aria-label", isFavorite ? "Remove this memory from favorites" : "Save this memory as a favorite");
    const icon = button.querySelector("span");
    const label = button.querySelector("small");
    if (icon) icon.textContent = isFavorite ? "♥" : "♡";
    if (label) label.textContent = isFavorite ? "Saved bloom" : "Save bloom";
  });

  $$(".memory-thumb").forEach((thumb, index) => thumb.classList.toggle("favorite", favorites.has(index)));
  $$(".new-bloom-card").forEach((card) => {
    const index = Number(card.dataset.index);
    card.classList.toggle("favorite", favorites.has(index));
  });
}

function toggleFavorite(index = currentMemory) {
  if (favorites.has(index)) favorites.delete(index);
  else favorites.add(index);
  localStorage.setItem("hyacinthFavoriteMemories", JSON.stringify([...favorites].sort((a, b) => a - b)));
  currentMemory = index;
  updateFavoriteUI();
  showToast(favorites.has(index) ? "This memory was saved as a favorite bloom." : "This memory was removed from favorites.");
}

function openFavorites() {
  const sequence = [...favorites].sort((a, b) => a - b);
  if (!sequence.length) {
    showToast("Save a memory with the heart button first.");
    return;
  }
  openLightbox(sequence[0], sequence);
  showToast(`${sequence.length} favorite bloom${sequence.length === 1 ? "" : "s"} opened.`);
}

function setAutoPlay(active) {
  const autoButton = $("#autoPlayButton");
  if (autoPlayTimer) clearInterval(autoPlayTimer);
  autoPlayTimer = active ? setInterval(() => setFeatured(currentMemory + 1), 3200) : null;
  if (autoButton) {
    autoButton.textContent = active ? "Ⅱ Pause" : "▶ Auto-play";
    autoButton.classList.toggle("active", active);
    autoButton.setAttribute("aria-pressed", String(active));
  }
}

function setupGallery() {
  $("#featuredPrev")?.addEventListener("click", () => setFeatured(currentMemory - 1));
  $("#featuredNext")?.addEventListener("click", () => setFeatured(currentMemory + 1));
  $$(".memory-thumb").forEach((thumb) => thumb.addEventListener("click", () => setFeatured(Number(thumb.dataset.index), false)));
  $$(".grid-memory, .new-bloom-card").forEach((item) => item.addEventListener("click", () => openLightbox(Number(item.dataset.index))));
  $("#featuredStage")?.addEventListener("click", () => openLightbox(currentMemory));

  $("#favoriteCurrentButton")?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(currentMemory);
  });
  $("#favoritesButton")?.addEventListener("click", openFavorites);
  $("#consoleFavoritesButton")?.addEventListener("click", openFavorites);
  $("#newBloomsButton")?.addEventListener("click", () => {
    const newBloomSequence = [16, 17, 18, 19];
    openLightbox(newBloomSequence[0], newBloomSequence);
    showToast("The four newest blooms are now in the spotlight.");
  });

  $("#shuffleButton")?.addEventListener("click", () => {
    let next = Math.floor(Math.random() * memories.length);
    if (next === currentMemory) next = (next + 1) % memories.length;
    setFeatured(next);
    showToast(`Bloom ${String(next + 1).padStart(2, "0")} opened at random.`);
  });

  $("#autoPlayButton")?.addEventListener("click", () => setAutoPlay(!autoPlayTimer));

  let touchStart = null;
  const stage = $("#featuredStage");
  stage?.addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
  stage?.addEventListener("touchend", (event) => {
    if (touchStart === null) return;
    const delta = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 50) setFeatured(currentMemory + (delta < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && autoPlayTimer) {
      autoPlayResumeAfterVisibility = true;
      setAutoPlay(false);
    } else if (!document.hidden && autoPlayResumeAfterVisibility) {
      autoPlayResumeAfterVisibility = false;
      setAutoPlay(true);
    }
  });

  updateFavoriteUI();
}

function openLightbox(index, sequence = null) {
  lightboxSequence = sequence?.length ? [...sequence] : memories.map((_, memoryIndex) => memoryIndex);
  currentMemory = (index + memories.length) % memories.length;
  if (!lightboxSequence.includes(currentMemory)) lightboxSequence.unshift(currentMemory);
  updateLightbox();
  $("#lightbox")?.showModal();
  document.body.classList.add("modal-open");
}

function stepLightbox(direction) {
  const position = lightboxSequence.indexOf(currentMemory);
  const nextPosition = (position + direction + lightboxSequence.length) % lightboxSequence.length;
  currentMemory = lightboxSequence[nextPosition];
  updateLightbox();
}

function updateLightbox() {
  const [src, caption] = memories[currentMemory];
  const image = $("#lightboxImage");
  if (image) {
    image.style.opacity = "0";
    image.src = src;
    image.alt = caption;
    const decoded = image.decode ? image.decode() : Promise.resolve();
    decoded.catch(() => {}).finally(() => { image.style.opacity = "1"; });
  }
  $("#lightboxNumber").textContent = `BLOOM // ${String(currentMemory + 1).padStart(2, "0")}`;
  $("#lightboxCaption").textContent = caption;
  setFeatured(currentMemory, false);
  updateFavoriteUI();
}

function setupLightbox() {
  const modal = $("#lightbox");
  if (!modal) return;
  const close = () => { if (modal.open) modal.close(); document.body.classList.remove("modal-open"); };
  $("#lightboxClose")?.addEventListener("click", close);
  $("#lightboxPrev")?.addEventListener("click", () => stepLightbox(-1));
  $("#lightboxNext")?.addEventListener("click", () => stepLightbox(1));
  $("#lightboxFavoriteButton")?.addEventListener("click", () => toggleFavorite(currentMemory));
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  modal.addEventListener("close", () => document.body.classList.remove("modal-open"));
  modal.addEventListener("cancel", () => document.body.classList.remove("modal-open"));

  let touchStart = null;
  modal.addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
  modal.addEventListener("touchend", (event) => {
    if (touchStart === null) return;
    const delta = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 55) stepLightbox(delta < 0 ? 1 : -1);
    touchStart = null;
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (!modal.open) return;
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
    if (event.key.toLowerCase() === "f") toggleFavorite(currentMemory);
  });
}

function setupSignals() {
  $$(".signal-card").forEach((card) => {
    card.setAttribute("aria-pressed", "false");
    card.addEventListener("click", () => {
      const opening = !card.classList.contains("active");
      card.classList.toggle("active", opening);
      card.setAttribute("aria-pressed", String(opening));
      card.querySelector(".decrypt").textContent = opening ? "PETAL IN BLOOM" : "TAP TO BLOOM";
      if (opening) burst(22, true);
    });
  });
}

function setupLetter() {
  const button = $("#decryptButton");
  const encrypted = $("#encryptedLetter");
  const decoded = $("#decodedLetter");
  button.addEventListener("click", () => {
    encrypted.hidden = true;
    decoded.hidden = false;
    button.querySelector("span").textContent = "Letter Decrypted";
    button.querySelector("strong").textContent = "✓";
    button.disabled = true;
    const readButton = $("#letterReadButton");
    const copyButton = $("#letterCopyButton");
    if (readButton) readButton.disabled = false;
    if (copyButton) copyButton.disabled = false;
    burst(90, true);
    showToast("Your love letter is now in full bloom.");
  });
}

function setupSurprise() {
  const openButton = $("#unlockButton");
  const birthdayModal = $("#birthdayModal");
  const previewMessage = $("#surprisePreviewMessage");
  const previewButtons = $$('[data-surprise-preview]');
  const tabButtons = $$('[data-surprise-tab]', birthdayModal || document);
  const pages = $$('[data-surprise-page]', birthdayModal || document);
  const wishButton = $("#wishButton");
  let selectedTab = "wish";
  let wishCount = Number(localStorage.getItem("hyacinthWishCount") || 0);

  if (!openButton || !birthdayModal) return;

  const updateWishButton = () => {
    if (!wishButton) return;
    wishButton.querySelector("span").textContent = wishCount ? `Plant Another Wish · ${wishCount} Bloom${wishCount === 1 ? "" : "s"}` : "Plant a Birthday Wish";
    wishButton.querySelector("strong").textContent = wishCount ? "✿" : "✧";
  };

  const setTab = (name, focus = false) => {
    selectedTab = name;
    tabButtons.forEach((button) => {
      const active = button.dataset.surpriseTab === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    pages.forEach((page) => {
      const active = page.dataset.surprisePage === name;
      page.classList.toggle("active", active);
      page.hidden = !active;
    });
  };

  previewButtons.forEach((button) => button.addEventListener("click", () => {
    selectedTab = button.dataset.surprisePreview || "wish";
    previewButtons.forEach((item) => item.classList.toggle("active", item === button));
    openButton.dataset.startTab = selectedTab;
    if (previewMessage) previewMessage.textContent = button.dataset.message || "Your surprise is ready whenever you are.";
    burst(34, true);
  }));

  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => setTab(button.dataset.surpriseTab));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabButtons.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabButtons.length - 1;
      setTab(tabButtons[nextIndex].dataset.surpriseTab, true);
    });
  });

  openButton.addEventListener("click", () => {
    setTab(openButton.dataset.startTab || selectedTab || "wish");
    birthdayModal.showModal();
    document.body.classList.add("modal-open");
    burst(260, false);
  });

  $$('[data-close-birthday]').forEach((button) => button.addEventListener("click", () => birthdayModal.close()));
  birthdayModal.addEventListener("click", (event) => { if (event.target === birthdayModal) birthdayModal.close(); });
  birthdayModal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    openButton.focus({ preventScroll: true });
  });

  wishButton?.addEventListener("click", () => {
    const input = $("#personalWishInput");
    const personalWish = input?.value.trim() || "";
    if (!personalWish) {
      input?.focus();
      showToast("Write a birthday wish before planting it.");
      return;
    }
    let planted = [];
    try { planted = JSON.parse(localStorage.getItem("hyacinthPersonalWishes") || "[]"); } catch (_) {}
    planted.push(personalWish);
    localStorage.setItem("hyacinthPersonalWishes", JSON.stringify(planted.slice(-20)));
    if (input) input.value = "";
    wishCount += 1;
    localStorage.setItem("hyacinthWishCount", String(wishCount));
    const dashboardCount = $("#dashboardWishCount");
    if (dashboardCount) dashboardCount.textContent = String(wishCount);
    updateWishButton();
    document.dispatchEvent(new CustomEvent("hyacinth:wish-planted"));
    burst(180, true);
    showToast(`Birthday wish ${wishCount} has been planted among the hyacinths.`);
  });

  updateWishButton();
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function fadeAudio(audio, target, duration = 500) {
  const start = audio.volume;
  const difference = target - start;
  const startTime = performance.now();
  return new Promise((resolve) => {
    const step = (time) => {
      const progress = Math.min(1, (time - startTime) / duration);
      audio.volume = Math.max(0, Math.min(1, start + difference * progress));
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

async function startBackgroundMusic(silentFail = false) {
  const audio = $("#backgroundMusic");
  if (!audio) return false;
  const preferredVolume = Number(localStorage.getItem("hyacinthMusicVolume") ?? 0.7);
  audio.volume = 0;
  try {
    await audio.play();
    await fadeAudio(audio, preferredVolume, reducedMotion ? 0 : 650);
    return true;
  } catch (_) {
    audio.volume = preferredVolume;
    if (!silentFail) showToast("Your browser blocked autoplay. Tap the music control to play Perfect.");
    return false;
  }
}

function setupMusic() {
  const audio = $("#backgroundMusic");
  const headerButton = $("#musicButton");
  const consoleButton = $("#consolePlayButton");
  const seek = $("#musicSeek");
  const volume = $("#musicVolume");
  const currentTimeNode = $("#musicCurrentTime");
  const durationNode = $("#musicDuration");
  const expandButton = $("#consoleExpandButton");
  const consolePanel = $("#gardenConsole");
  if (!audio) return;

  const preferredVolume = Number(localStorage.getItem("hyacinthMusicVolume") ?? 0.7);
  audio.volume = Math.max(0, Math.min(1, preferredVolume));
  if (volume) volume.value = String(audio.volume);

  const syncState = () => {
    const playing = !audio.paused;
    headerButton?.classList.toggle("playing", playing);
    headerButton?.setAttribute("aria-label", playing ? "Pause background music" : "Play background music");
    if (headerButton) headerButton.title = playing ? "Pause Perfect — Ed Sheeran" : "Play Perfect — Ed Sheeran";
    if (consoleButton) {
      consoleButton.classList.toggle("playing", playing);
      consoleButton.setAttribute("aria-label", playing ? "Pause background music" : "Play background music");
      consoleButton.querySelector("span").textContent = playing ? "Ⅱ" : "▶";
    }
  };

  const syncTime = () => {
    if (seek && Number.isFinite(audio.duration) && audio.duration > 0 && !seek.matches(":active")) {
      seek.value = String((audio.currentTime / audio.duration) * 100);
      seek.style.setProperty("--seek", `${seek.value}%`);
    }
    if (currentTimeNode) currentTimeNode.textContent = formatTime(audio.currentTime);
    if (durationNode) durationNode.textContent = formatTime(audio.duration);
  };

  const toggle = async () => {
    if (audio.paused) {
      const played = await startBackgroundMusic(false);
      if (played) showToast("Now playing: Perfect — Ed Sheeran.");
    } else {
      const preferred = audio.volume;
      await fadeAudio(audio, 0, reducedMotion ? 0 : 300);
      audio.pause();
      audio.volume = preferred;
      showToast("Music paused.");
    }
  };

  audio.addEventListener("play", syncState);
  audio.addEventListener("pause", syncState);
  audio.addEventListener("timeupdate", syncTime);
  audio.addEventListener("loadedmetadata", syncTime);
  audio.addEventListener("durationchange", syncTime);
  headerButton?.addEventListener("click", toggle);
  consoleButton?.addEventListener("click", toggle);

  seek?.addEventListener("input", () => {
    if (!Number.isFinite(audio.duration)) return;
    audio.currentTime = (Number(seek.value) / 100) * audio.duration;
    seek.style.setProperty("--seek", `${seek.value}%`);
    syncTime();
  });

  volume?.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    localStorage.setItem("hyacinthMusicVolume", String(audio.volume));
    volume.style.setProperty("--volume", `${audio.volume * 100}%`);
  });
  volume?.style.setProperty("--volume", `${audio.volume * 100}%`);

  const setConsoleExpanded = (expanded) => {
    consolePanel?.classList.toggle("expanded", expanded);
    if (!expandButton) return;
    expandButton.setAttribute("aria-expanded", String(expanded));
    expandButton.setAttribute("aria-label", expanded ? "Collapse garden controls" : "Expand garden controls");
    expandButton.textContent = expanded ? "⌄" : "⌃";
  };
  expandButton?.addEventListener("click", () => {
    setConsoleExpanded(!consolePanel?.classList.contains("expanded"));
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 880) setConsoleExpanded(false);
  }, { passive: true });

  if ("mediaSession" in navigator && "MediaMetadata" in window) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Perfect",
      artist: "Ed Sheeran",
      album: "Our Birthday Garden",
      artwork: [{ src: "memory-16.jpg", sizes: "512x512", type: "image/jpeg" }],
    });
    navigator.mediaSession.setActionHandler("play", () => startBackgroundMusic(true));
    navigator.mediaSession.setActionHandler("pause", () => audio.pause());
    navigator.mediaSession.setActionHandler("seekbackward", (details) => { audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10)); });
    navigator.mediaSession.setActionHandler("seekforward", (details) => { audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (details.seekOffset || 10)); });
  }

  syncState();
  syncTime();
}

function setupHeartButton() {
  $("#heartButton").addEventListener("click", () => {
    burst(110, true);
    showToast(`A hyacinth bloom was sent to ${SITE_CONFIG.lovedOneName}.`);
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function burst(amount = 180, heartsOnly = false) {
  const canvas = $("#celebrationCanvas");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const palette = ["#d9b6ff", "#a276ff", "#f0c0ff", "#ff9fcf", "#b9f7c7", "#fff8fd"];
  const pieces = Array.from({ length: amount }, () => ({
    x: innerWidth * (.2 + Math.random() * .6),
    y: innerHeight * (.2 + Math.random() * .25),
    vx: (Math.random() - .5) * 11,
    vy: -3 - Math.random() * 9,
    size: 4 + Math.random() * 7,
    gravity: .13 + Math.random() * .08,
    spin: (Math.random() - .5) * .25,
    angle: Math.random() * 6.3,
    color: palette[Math.floor(Math.random() * palette.length)],
    heart: heartsOnly || Math.random() > .76,
    life: 1,
  }));
  const heart = (x, y, size, color, angle) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(size / 17, size / 17);
    ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-12,-3,-9,-12,0,-7); ctx.bezierCurveTo(9,-12,12,-3,0,5);
    ctx.fillStyle = color; ctx.fill(); ctx.restore();
  };
  const frame = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = false;
    pieces.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.angle += p.spin; p.life -= .006;
      if (p.life > 0 && p.y < innerHeight + 30) alive = true;
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.heart) heart(p.x,p.y,p.size*1.5,p.color,p.angle);
      else { ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,p.size*.52,p.size,0,0,Math.PI*2);ctx.fill();ctx.restore(); }
    });
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(frame); else ctx.clearRect(0,0,innerWidth,innerHeight);
  };
  frame();
}



function setupPoem() {
  const sanctuary = $("#poemSanctuary");
  const stanzas = $$(".poem-stanza");
  const openButton = $("#poemOpenButton");
  const replayButton = $("#poemReplayButton");
  const progressBar = $("#poemProgressBar");
  const note = $("#poemNote");
  if (!sanctuary || !stanzas.length || !openButton) return;

  let timers = [];
  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  const resetPoem = () => {
    clearTimers();
    sanctuary.classList.remove("poem-complete");
    stanzas.forEach((stanza) => stanza.classList.remove("visible"));
    if (progressBar) progressBar.style.width = "0%";
    if (note) note.textContent = "Five stanzas are waiting beneath the petals.";
    openButton.hidden = false;
    openButton.disabled = false;
    if (replayButton) replayButton.hidden = true;
  };

  const revealPoem = () => {
    clearTimers();
    openButton.disabled = true;
    openButton.querySelector("span").textContent = "The Poem Is Blooming";
    openButton.querySelector("strong").textContent = "…";
    if (note) note.textContent = "Each stanza is unfolding like a hyacinth bloom.";

    stanzas.forEach((stanza, index) => {
      const timer = setTimeout(() => {
        stanza.classList.add("visible");
        if (progressBar) progressBar.style.width = `${((index + 1) / stanzas.length) * 100}%`;
        if (index === stanzas.length - 1) {
          sanctuary.classList.add("poem-complete");
          openButton.hidden = true;
          openButton.disabled = false;
          openButton.querySelector("span").textContent = "Let the Poem Bloom";
          openButton.querySelector("strong").textContent = "✿";
          if (replayButton) replayButton.hidden = false;
          if (note) note.textContent = "The poem is now in full bloom — kept here just for him.";
          burst(130, false);
          showToast("A birthday poem has bloomed in the heart of the garden.");
        }
      }, reducedMotion ? 0 : index * 720);
      timers.push(timer);
    });
  };

  openButton.addEventListener("click", revealPoem);
  replayButton?.addEventListener("click", () => {
    resetPoem();
    requestAnimationFrame(revealPoem);
  });
}

function setupBotanicalClicks() {
  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, a, dialog, .memory-thumb, .grid-memory, .new-bloom-card")) return;
    const bloom = document.createElement("span");
    bloom.className = "click-bloom";
    bloom.textContent = Math.random() > .35 ? "✿" : "❀";
    bloom.style.left = `${event.clientX}px`;
    bloom.style.top = `${event.clientY}px`;
    document.body.appendChild(bloom);
    setTimeout(() => bloom.remove(), 1100);
  }, { passive: true });
}


function setupConnectionStatus() {
  const connectionStatus = $("#connectionStatus");
  const updateConnection = () => {
    const online = navigator.onLine;
    if (connectionStatus) {
      connectionStatus.textContent = online ? "ONLINE" : "OFFLINE";
      connectionStatus.classList.toggle("offline", !online);
    }
    if (!online) showToast("You are offline. Reconnect to load any media that is not already open.");
  };
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  updateConnection();
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (document.body.classList.contains("locked") || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.matches("input, textarea, select") || event.target.isContentEditable) return;
    const key = event.key.toLowerCase();
    if (key === "m") $("#consolePlayButton")?.click();
    if (key === "f" && !$("#lightbox")?.open) toggleFavorite(currentMemory);
    if (key === "g") document.querySelector("#memories")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    if (key === "p") document.querySelector("#poem")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  });
}

function setupImageResilience() {
  $$('img').forEach((image) => {
    image.addEventListener("error", () => {
      image.classList.add("image-missing");
      image.alt = image.alt || "Image unavailable";
    });
  });
}


const memoryDetails = [
  { category:["together","cozy"], message:"Some moments become precious simply because you were there." },
  { category:["solo"], message:"I love seeing every version of you—the quiet, confident, and completely natural you." },
  { category:["together","playful","outdoors"], message:"The best photographs are often the ones where we forgot to be serious." },
  { category:["together","cozy"], message:"A normal day can become a favorite chapter when it is shared with you." },
  { category:["together","playful"], message:"Our shared jokes are a language only our hearts fully understand." },
  { category:["together","cozy"], message:"There is a softness in our quiet moments that I never want to lose." },
  { category:["together","playful"], message:"Another tiny chapter—unpolished, real, and perfectly ours." },
  { category:["together","outdoors"], message:"Side by side is still my favorite direction." },
  { category:["together","playful"], message:"No matter who holds the camera, you are always my favorite part of the frame." },
  { category:["together","outdoors"], message:"Even an ordinary road feels like a destination when I am walking it with you." },
  { category:["together","outdoors"], message:"The light was beautiful, but you were still the part I remembered most." },
  { category:["together","cozy"], message:"Close enough to see every detail, and still wanting to know you more." },
  { category:["together","outdoors"], message:"Blue hour turned into one of the colors of our story." },
  { category:["together","playful","outdoors"], message:"A photograph inside another photograph—because one memory was not enough." },
  { category:["together","playful"], message:"Your playful side makes the whole world feel less serious and more alive." },
  { category:["together","outdoors"], message:"The two of us will always be my favorite view." },
  { category:["together","cozy","newest"], message:"Close feels like home when your arm is around me." },
  { category:["together","playful","newest"], message:"We can turn an ordinary room into our own little universe." },
  { category:["together","playful","outdoors","newest"], message:"Matching energy, matching poses, and a love that knows how to have fun." },
  { category:["together","cozy","newest"], message:"The handmade flowers were beautiful, but being beside you was the real gift." },
];

function setupLiveDashboard() {
  const daysNode = $("#daysTogether");
  const wishesNode = $("#dashboardWishCount");
  const capsuleNode = $("#capsuleCount");
  const start = new Date(SITE_CONFIG.relationshipStart).getTime();
  const days = Math.max(0, Math.floor((Date.now() - start) / 86400000));
  if (daysNode) daysNode.textContent = String(days);
  const wishes = Number(localStorage.getItem("hyacinthWishCount") || 0);
  if (wishesNode) wishesNode.textContent = String(wishes);
  let capsules = [];
  try { capsules = JSON.parse(localStorage.getItem("hyacinthCapsules") || "[]"); } catch (_) {}
  if (capsuleNode) capsuleNode.textContent = String(capsules.length);
}

function setupHoldBloom() {
  const button = $("#holdBloomButton");
  if (!button) return;
  let timer = null;
  const start = () => {
    button.classList.add("charging");
    timer = setTimeout(() => {
      button.classList.remove("charging");
      button.classList.add("complete");
      burst(240, true);
      showToast(`A full-heart bloom was grown for ${SITE_CONFIG.lovedOneName}.`);
      setTimeout(() => button.classList.remove("complete"), 900);
    }, 1350);
  };
  const cancel = () => { clearTimeout(timer); button.classList.remove("charging"); };
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", cancel);
  button.addEventListener("pointerleave", cancel);
  button.addEventListener("pointercancel", cancel);
  button.addEventListener("keydown", (event) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) start();
  });
  button.addEventListener("keyup", cancel);
}

function setupMemoryDiscovery() {
  const filters = $$("[data-memory-filter]");
  const search = $("#memorySearch");
  const status = $("#memoryFilterStatus");
  const thumbs = $$(".memory-thumb");
  if (!filters.length || !thumbs.length) return;
  let activeFilter = "all";

  const apply = () => {
    const query = (search?.value || "").trim().toLowerCase();
    let visible = 0;
    thumbs.forEach((thumb) => {
      const index = Number(thumb.dataset.index);
      const details = memoryDetails[index] || { category:[] };
      const categoryMatch = activeFilter === "all" || details.category.includes(activeFilter);
      const text = `${memories[index]?.[1] || ""} ${details.message || ""}`.toLowerCase();
      const searchMatch = !query || text.includes(query);
      const show = categoryMatch && searchMatch;
      thumb.classList.toggle("filtered-out", !show);
      thumb.classList.toggle("search-match", Boolean(query && show));
      if (show) visible += 1;
    });
    if (status) status.textContent = `Showing ${visible} memory bloom${visible === 1 ? "" : "s"}${activeFilter === "all" ? "" : ` in ${activeFilter}`}${query ? ` matching “${query}”` : ""}.`;
    const first = thumbs.find((thumb) => !thumb.classList.contains("filtered-out"));
    if (first && !thumbs[currentMemory]?.classList.contains("filtered-out")) return;
    if (first) setFeatured(Number(first.dataset.index));
  };

  filters.forEach((button) => button.addEventListener("click", () => {
    activeFilter = button.dataset.memoryFilter || "all";
    filters.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    apply();
  }));
  search?.addEventListener("input", apply);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !event.target.matches("input,textarea,select")) {
      event.preventDefault(); search?.focus();
    }
  });
}

function setupConstellation() {
  const svg = $("#constellationMap");
  const image = $("#constellationImage");
  const caption = $("#constellationCaption");
  const message = $("#constellationMessage");
  const indexNode = $("#constellationIndex");
  const progress = $("#constellationProgress");
  const bar = $("#constellationProgressBar");
  if (!svg || !image) return;
  const ns = "http://www.w3.org/2000/svg";
  let selected = 0;
  const center = { x:400, y:310 };
  const points = memories.map((_, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / memories.length) + Math.sin(index * .9) * .12;
    const radius = 145 + (index % 4) * 34 + Math.sin(index * 1.7) * 18;
    return { x:center.x + Math.cos(angle) * radius, y:center.y + Math.sin(angle) * radius };
  });
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const line = document.createElementNS(ns,"line");
    line.setAttribute("x1",point.x); line.setAttribute("y1",point.y); line.setAttribute("x2",next.x); line.setAttribute("y2",next.y); line.setAttribute("class","constellation-line");
    svg.appendChild(line);
  });
  points.forEach((point,index) => {
    const group = document.createElementNS(ns,"g");
    group.setAttribute("class","constellation-node"); group.setAttribute("tabindex","0"); group.setAttribute("role","button"); group.setAttribute("aria-label",`Open memory ${index+1}: ${memories[index][1]}`); group.dataset.index = index;
    group.setAttribute("transform",`translate(${point.x} ${point.y})`);
    const circle = document.createElementNS(ns,"circle"); circle.setAttribute("r", index % 5 === 0 ? 9 : 7);
    const text = document.createElementNS(ns,"text"); text.setAttribute("x","13"); text.setAttribute("y","4"); text.textContent = String(index+1).padStart(2,"0");
    group.append(circle,text); svg.appendChild(group);
    const choose = () => select(index);
    group.addEventListener("click",choose);
    group.addEventListener("keydown",(event)=>{ if(event.key==="Enter"||event.key===" "){event.preventDefault();choose();} });
  });

  const select = (index) => {
    selected = (index + memories.length) % memories.length;
    const [src,text] = memories[selected];
    image.style.opacity="0";
    setTimeout(()=>{ image.src=src; image.alt=text; image.style.opacity="1"; },130);
    if(caption) caption.textContent=text;
    if(message) message.textContent=memoryDetails[selected]?.message || "A memory kept safely in our sky.";
    if(indexNode) indexNode.textContent=`STAR // ${String(selected+1).padStart(2,"0")}`;
    if(progress) progress.textContent=`${String(selected+1).padStart(2,"0")} / ${memories.length}`;
    if(bar) bar.style.width=`${((selected+1)/memories.length)*100}%`;
    $$(".constellation-node",svg).forEach((node,i)=>{node.classList.toggle("active",i===selected);node.classList.toggle("favorite",favorites.has(i));});
  };
  $("#constellationPrev")?.addEventListener("click",()=>select(selected-1));
  $("#constellationNext")?.addEventListener("click",()=>select(selected+1));
  $("#constellationShuffle")?.addEventListener("click",()=>{let next=Math.floor(Math.random()*memories.length);if(next===selected)next=(next+1)%memories.length;select(next);showToast("A random memory star is shining now.");});
  $("#constellationOpen")?.addEventListener("click",()=>openLightbox(selected));
  select(0);
}

function setupLetterTools() {
  const readButton = $("#letterReadButton");
  const copyButton = $("#letterCopyButton");
  const letter = $("#decodedLetter");
  let speaking = false;
  const stop = () => { if("speechSynthesis" in window) speechSynthesis.cancel(); speaking=false; if(readButton){readButton.querySelector("span").textContent="Read It to Me";readButton.querySelector("strong").textContent="◉";} };
  readButton?.addEventListener("click",()=>{
    if(!("speechSynthesis" in window)){showToast("Speech playback is not supported by this browser.");return;}
    if(speaking){stop();return;}
    const utterance=new SpeechSynthesisUtterance(letter?.innerText || ""); utterance.rate=.93; utterance.pitch=1.02; utterance.onend=stop; utterance.onerror=stop; speaking=true; readButton.querySelector("span").textContent="Stop Reading"; readButton.querySelector("strong").textContent="■"; speechSynthesis.speak(utterance);
  });
  copyButton?.addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(letter?.innerText || "");showToast("The love letter was copied.");}catch(_){showToast("Copying was blocked by the browser.");}
  });
  $("#poemListenButton")?.addEventListener("click",()=>{
    if(!("speechSynthesis" in window)){showToast("Speech playback is not supported by this browser.");return;}
    speechSynthesis.cancel(); const poemText=$$(".poem-stanza").map(s=>s.innerText).join("\n"); const u=new SpeechSynthesisUtterance(poemText);u.rate=.9;u.pitch=1.05;speechSynthesis.speak(u);showToast("The birthday poem is being read aloud.");
  });
  window.addEventListener("beforeunload",stop);
}

function setupCapsule() {
  const form=$("#capsuleForm"), textarea=$("#capsuleMessage"), count=$("#capsuleCharacterCount"), list=$("#capsuleList"), empty=$("#capsuleEmpty"), total=$("#capsuleCount");
  if(!form||!textarea||!list)return;
  let capsules=[]; try{capsules=JSON.parse(localStorage.getItem("hyacinthCapsules")||"[]");}catch(_){capsules=[];}
  const save=()=>localStorage.setItem("hyacinthCapsules",JSON.stringify(capsules));
  const escape=(value)=>String(value).replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  const render=()=>{
    list.innerHTML=""; empty.hidden=capsules.length>0; if(total)total.textContent=String(capsules.length);
    capsules.slice().reverse().forEach(item=>{
      const card=document.createElement("article");card.className="capsule-card";card.innerHTML=`<header><span>${escape(item.mood)} bloom</span><time>${escape(item.date)}</time></header><p>${escape(item.message)}</p><footer>— ${escape(item.signature)}</footer><button class="capsule-delete" type="button" aria-label="Delete this capsule">×</button>`;
      card.querySelector("button").addEventListener("click",()=>{capsules=capsules.filter(entry=>entry.id!==item.id);save();render();showToast("The capsule bloom was removed from this device.");});list.appendChild(card);
    });
  };
  textarea.addEventListener("input",()=>{if(count)count.textContent=`${textarea.value.length} / 280`;});
  form.addEventListener("submit",event=>{event.preventDefault();const message=textarea.value.trim();if(!message){textarea.focus();showToast("Write a message before planting the capsule.");return;}capsules.push({id:Date.now(),message,mood:$("#capsuleMood")?.value||"grateful",signature:$("#capsuleSignature")?.value.trim()||"Ralph",date:new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date())});save();form.reset();$("#capsuleSignature").value="Ralph";if(count)count.textContent="0 / 280";render();burst(120,false);showToast("Your message was planted in the private time capsule.");});
  render();
}

function setupGardenSettings() {
  const dialog=$("#settingsDialog"), open=$("#settingsButton"), close=$("#settingsClose");
  if(!dialog)return;
  let prefs={theme:"amethyst",particles:true,motion:true,glow:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem("hyacinthGardenPreferences")||"{}")};}catch(_){}
  const apply=()=>{document.body.dataset.theme=prefs.theme;document.body.classList.toggle("no-particles",!prefs.particles);document.body.classList.toggle("no-motion",!prefs.motion);document.body.classList.toggle("no-glow",!prefs.glow);$$("[data-theme]",dialog).forEach(button=>{const active=button.dataset.theme===prefs.theme;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});const p=$("#particlesToggle"),m=$("#motionToggle"),g=$("#glowToggle");if(p)p.checked=prefs.particles;if(m)m.checked=prefs.motion;if(g)g.checked=prefs.glow;localStorage.setItem("hyacinthGardenPreferences",JSON.stringify(prefs));};
  open?.addEventListener("click",()=>dialog.showModal());close?.addEventListener("click",()=>dialog.close());dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close();});
  $$("[data-theme]",dialog).forEach(button=>button.addEventListener("click",()=>{prefs.theme=button.dataset.theme;apply();showToast(`${button.querySelector("b")?.textContent||"Garden"} theme applied.`);}));
  [["particlesToggle","particles"],["motionToggle","motion"],["glowToggle","glow"]].forEach(([id,key])=>$("#"+id)?.addEventListener("change",event=>{prefs[key]=event.target.checked;apply();}));
  $("#settingsReset")?.addEventListener("click",()=>{prefs={theme:"amethyst",particles:true,motion:true,glow:true};apply();showToast("The original hyacinth atmosphere was restored.");});apply();
}

function setupNavigator() {
  const dialog=$("#navigatorDialog"), open=$("#navigatorButton"), close=$("#navigatorClose"), search=$("#navigatorSearch"), results=$$("[data-jump]");
  if(!dialog)return;
  const show=()=>{if(!dialog.open)dialog.showModal();setTimeout(()=>search?.focus(),30);}; const hide=()=>dialog.close();
  open?.addEventListener("click",show);close?.addEventListener("click",hide);dialog.addEventListener("click",event=>{if(event.target===dialog)hide();});
  document.addEventListener("keydown",event=>{if(document.body.classList.contains("locked"))return;if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();dialog.open?hide():show();}});
  results.forEach(button=>button.addEventListener("click",()=>{const target=document.getElementById(button.dataset.jump);hide();setTimeout(()=>target?.scrollIntoView({behavior:document.body.classList.contains("no-motion")?"auto":"smooth"}),80);}));
  search?.addEventListener("input",()=>{const q=search.value.trim().toLowerCase();let shown=0;results.forEach(button=>{const match=!q||button.textContent.toLowerCase().includes(q);button.hidden=!match;if(match)shown+=1;});if(!shown)showToast("No garden section matched that search.");});
}

function setupPersonalWishes() {
  const container = $("#plantedWishes");
  if (!container) return;
  const render = () => {
    let wishes = [];
    try { wishes = JSON.parse(localStorage.getItem("hyacinthPersonalWishes") || "[]"); } catch (_) {}
    container.innerHTML = "";
    wishes.slice(-6).forEach((text) => {
      const span = document.createElement("span");
      span.className = "planted-wish";
      span.textContent = text;
      container.appendChild(span);
    });
    const total = Number(localStorage.getItem("hyacinthWishCount") || 0);
    const node = $("#dashboardWishCount");
    if (node) node.textContent = String(total);
  };
  document.addEventListener("hyacinth:wish-planted", render);
  render();
}

applyPersonalization();
setupMusic();
setupAccessGate();
updateCountdown();
setInterval(updateCountdown, 1000);
setupReveal();
setupHeader();
setupCursorGlow();
setupSpaceCanvas();
setupTilt();
setupMagneticButtons();
setupGallery();
setupLightbox();
setupSignals();
setupLetter();
setupPoem();
setupSurprise();
setupHeartButton();
setupBotanicalClicks();
setupConnectionStatus();
setupKeyboardShortcuts();
setupImageResilience();
setupLiveDashboard();
setupHoldBloom();
setupMemoryDiscovery();
setupConstellation();
setupLetterTools();
setupCapsule();
setupGardenSettings();
setupNavigator();
setupPersonalWishes();

cleanupLegacyGardenCaches();
window.addEventListener("load", () => {
  if (!document.body.classList.contains("locked")) revealVisibleInViewport(true);
});
