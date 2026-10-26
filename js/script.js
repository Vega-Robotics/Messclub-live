/* =========================================================
   MESSCLUB — official website
   ---------------------------------------------------------
   1. EDIT THIS FIRST: MESSCLUB_CONFIG (links + contact email)
   2. Everything below is behavior; you rarely need to touch it.
   ========================================================= */

/* ---------- 1. CONFIG — replace the placeholder values ---------- */
const MESSCLUB_CONFIG = {
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.messclub.app&pcampaignid=web_share",   // your real Google Play listing link
  supportEmail: "messclubteam@gmail.com",          // e.g. support@yourdomain.com
  instagramUrl: "https://instagram.com/_messclub_",          // e.g. https://instagram.com/messclub
  linkedinUrl: "YOUR_LINKEDIN_URL",            // e.g. https://linkedin.com/company/messclub
  ambassadorUrl: "https://messclub-ambassador-site.onrender.com/",        // future Ambassador site / application form
  privacyUrl: "",                              // leave "" to hide the footer link until the page exists
  termsUrl: ""                                 // leave "" to hide the footer link until the page exists
};

/* ---------- helpers ---------- */
document.documentElement.classList.add("js");

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const isSet = (v) => typeof v === "string" && v.trim() !== "" && !/^(PASTE_|YOUR_)/.test(v.trim());
const isMobileLayout = () => window.innerWidth <= 920;

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

/* ---------- 2. APPLY CONFIG TO THE PAGE ---------- */
function applyConfig() {
  const cfg = MESSCLUB_CONFIG;

  $$("[data-config-link]").forEach((el) => {
    const key = el.dataset.configLink;
    const value = cfg[key];

    if (el.hasAttribute("data-hide-if-empty") && !isSet(value)) {
      el.hidden = true;
      el.style.display = "none";
      return;
    }
    if (isSet(value)) {
      el.href = value;
      if (el.hasAttribute("data-external")) { el.target = "_blank"; el.rel = "noopener noreferrer"; }
    } else {
      // Not configured yet: keep the page usable and tell the site owner what to fill in
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (key === "playStoreUrl" && !el.closest("#join")) {
          closeMenu();
          $("#join").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        } else {
          toast(`Add your link for "${key}" in js/script.js`);
        }
      });
    }
  });

  $$("[data-config-text]").forEach((el) => {
    const value = cfg[el.dataset.configText];
    if (isSet(value)) el.textContent = value;
  });

  $$("[data-config-mailto]").forEach((el) => {
    if (isSet(cfg.supportEmail)) {
      const subject = el.dataset.configMailto === "partner" ? "?subject=" + encodeURIComponent("MessClub partner enquiry") : "";
      el.href = "mailto:" + cfg.supportEmail + subject;
    } else {
      el.addEventListener("click", (e) => { e.preventDefault(); toast('Add your email as "supportEmail" in js/script.js'); });
    }
  });
}

/* ---------- 3. IMAGE SLOTS WITH POLISHED PLACEHOLDERS ----------
   Every .shot shows a placeholder first. If the real image file exists
   it fades in over the top; if not, the placeholder stays (never a broken image). */
function initShots() {
  $$(".shot").forEach((slot) => {
    const src = slot.dataset.src;
    const label = slot.dataset.label || "Image";
    slot.innerHTML =
      '<div class="shot-placeholder-mark">M</div>' +
      `<div class="shot-placeholder-label">${label}</div>` +
      `<div class="shot-placeholder-hint">Add ${src}</div>`;
    if (!src) return;
    const img = new Image();
    img.alt = label + " screen of the MessClub app";
    img.decoding = "async";
    img.onload = () => { slot.innerHTML = ""; slot.appendChild(img); };
    img.src = src; // if it 404s, onload never fires and the placeholder stays
  });

  // Logo in navbar (assets/logo.png), falls back to the "M" mark
  $$("[data-logo]").forEach((wrap) => {
    const img = new Image();
    img.alt = "";
    img.onload = () => { wrap.innerHTML = ""; wrap.style.background = "transparent"; wrap.style.boxShadow = "none"; wrap.appendChild(img); };
    img.src = "assets/logo.png";
  });
}

/* ---------- 4. LOADER + HERO ENTRANCE ---------- */
function initLoader() {
  const loader = $("#loader");
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    loader.classList.add("done");
    document.documentElement.classList.add("ready");
  };
  const start = performance.now();
  window.addEventListener("load", () => setTimeout(finish, Math.max(0, 900 - (performance.now() - start))));
  setTimeout(finish, 2200); // never block the visitor if something is slow
}

/* ---------- 5. NAVBAR, MOBILE MENU, BACK TO TOP ---------- */
const menu = $("#mobileMenu");
const burger = $("#burger");

function openMenu() {
  menu.classList.add("open");
  menu.setAttribute("aria-hidden", "false");
  burger.setAttribute("aria-expanded", "true");
  burger.setAttribute("aria-label", "Close menu");
  document.body.style.overflow = "hidden";
}
function closeMenu() {
  menu.classList.remove("open");
  menu.setAttribute("aria-hidden", "true");
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-label", "Open menu");
  document.body.style.overflow = "";
}
function initNav() {
  burger.addEventListener("click", () => (menu.classList.contains("open") ? closeMenu() : openMenu()));
  $$("a", menu).forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  window.addEventListener("resize", () => { if (window.innerWidth > 1080) closeMenu(); });

  $("#toTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  // Highlight the nav item for the section currently in view
  const alias = { explore: "home", tokens: "how", app: "how", foryou: "join", why: "join", partners: "join", ambassadors: "join", vision: "join" };
  const navLinks = $$(".nav-links a");
  const setActive = (id) => navLinks.forEach((a) => a.classList.toggle("active", a.dataset.nav === (alias[id] || id)));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
  }, { rootMargin: "-40% 0px -55% 0px" });
  $$("main section[id]").forEach((s) => io.observe(s));
}

/* ---------- 6. SCROLL REVEAL + COUNTERS ---------- */
function animateNumber(el, to, duration = 1100) {
  if (reduceMotion) { el.textContent = to; return; }
  const from = parseInt(el.textContent, 10) || 0;
  const t0 = performance.now();
  const step = (t) => {
    const p = clamp((t - t0) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initReveal() {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window)) { items.forEach((i) => i.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  items.forEach((i) => io.observe(i));

  // Number counters: count up the first time they're seen
  const counters = $$("[data-count]");
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = parseInt(el.dataset.count, 10);
      el.textContent = "0";
      animateNumber(el, target, 1300);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach((c) => cio.observe(c));
}

/* ---------- 7. SCROLL-LINKED EFFECTS (parallax, timeline, back-to-top, navbar) ---------- */
function initScrollEffects() {
  const nav = $("#nav");
  const toTop = $("#toTop");
  const parallaxEls = $$("[data-parallax]");
  const timeline = $("#timeline");
  const steps = $$(".t-step");
  let ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    nav.classList.toggle("compact", y > 40);
    toTop.classList.toggle("show", y > 700);

    if (!reduceMotion) {
      parallaxEls.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        el.style.transform = `translate3d(0, ${(-r.top * parseFloat(el.dataset.parallax)).toFixed(1)}px, 0)`;
      });
    }

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const pct = clamp((vh * 0.65 - r.top) / r.height, 0, 1);
      timeline.style.setProperty("--progress", (pct * 100).toFixed(1) + "%");
      steps.forEach((s) => s.classList.toggle("on", s.getBoundingClientRect().top < vh * 0.7));
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

/* ---------- 8. DESKTOP-ONLY: cursor, phone tilt, card tilt ---------- */
function initDesktopFx() {
  if (!finePointer || reduceMotion) return;

  // Cursor: pink arrow pointer + a trailing blue comet tail
  const cursor = $("#cursor");
  document.documentElement.classList.add("has-cursor");
  const TAIL = 10;
  const tails = Array.from({ length: TAIL }, (_, i) => {
    const d = document.createElement("div");
    d.className = "cursor-tail";
    const size = 12 - i * 1.0;                     // tail shrinks toward the end
    d.style.width = d.style.height = size + "px";
    d.style.marginLeft = d.style.marginTop = -size / 2 + "px";
    d.dataset.alpha = (0.55 - i * 0.05).toFixed(2); // and fades out
    document.body.appendChild(d);
    return { el: d, x: 0, y: 0 };
  });
  let mx = 0, my = 0, started = false;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    cursor.style.transform = `translate(${mx}px, ${my}px)`;
    if (!started) { started = true; tails.forEach((t) => { t.x = mx; t.y = my; }); cursor.classList.add("show"); }
  }, { passive: true });
  (function animateTail() {
    let px = mx, py = my;
    tails.forEach((t) => {
      t.x += (px - t.x) * 0.38;
      t.y += (py - t.y) * 0.38;
      t.el.style.transform = `translate(${t.x}px, ${t.y}px)`;
      t.el.style.opacity = started && !cursor.classList.contains("hover") ? t.el.dataset.alpha : 0;
      px = t.x; py = t.y;
    });
    requestAnimationFrame(animateTail);
  })();
  document.addEventListener("mouseover", (e) => {
    cursor.classList.toggle("hover", !!e.target.closest("a, button, .card, .faq-q, input, textarea, [role='tab']"));
  });
  document.addEventListener("mousedown", () => cursor.classList.add("down"));
  document.addEventListener("mouseup", () => cursor.classList.remove("down"));
  document.documentElement.addEventListener("mouseleave", () => { cursor.classList.remove("show"); started = false; });

  // Hero phone follows the mouse a little
  const stage = $(".hero-stage");
  const phone = $("#heroPhone");
  if (stage && phone) {
    stage.addEventListener("mousemove", (e) => {
      const r = stage.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      phone.style.setProperty("--ry", (x * 10).toFixed(1) + "deg");
      phone.style.setProperty("--rx", (-y * 8).toFixed(1) + "deg");
    });
    stage.addEventListener("mouseleave", () => { phone.style.setProperty("--ry", "0deg"); phone.style.setProperty("--rx", "0deg"); });
  }

  // 3D tilt on cards marked .tilt
  $$(".tilt").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", (x * 9).toFixed(1) + "deg");
      card.style.setProperty("--rx", (-y * 9).toFixed(1) + "deg");
    });
    card.addEventListener("mouseleave", () => { card.style.setProperty("--ry", "0deg"); card.style.setProperty("--rx", "0deg"); });
  });
}

/* ---------- 9. TOKEN SELECTOR ---------- */
function initTokens() {
  const tabs = $$(".duration-tabs button");
  const num = $("#tokenNum");
  const days = $("#tokenDays");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      days.textContent = tab.dataset.days + " DAYS";
      animateNumber(num, parseInt(tab.dataset.tokens, 10), 700);
    });
  });
}

/* ---------- 10. APP PHONE (scroll-synced on desktop, tap on mobile) ---------- */
function initAppPhone() {
  const shots = $$("#appScreen .shot");
  const steps = $$(".app-step");
  const chips = $$("#appChips button");
  if (!shots.length) return;

  function setScreen(i) {
    shots.forEach((s, n) => s.classList.toggle("is-active", n === i));
    steps.forEach((s, n) => s.classList.toggle("is-active", n === i));
    chips.forEach((c, n) => c.setAttribute("aria-selected", String(n === i)));
  }

  const io = new IntersectionObserver((entries) => {
    if (isMobileLayout()) return; // simplified on mobile: chips only
    entries.forEach((en) => { if (en.isIntersecting) setScreen(parseInt(en.target.dataset.screen, 10)); });
  }, { rootMargin: "-45% 0px -45% 0px" });
  steps.forEach((s) => io.observe(s));

  chips.forEach((chip) => chip.addEventListener("click", () => {
    const i = parseInt(chip.dataset.screen, 10);
    setScreen(i);
    if (!isMobileLayout()) steps[i].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }));
}

/* ---------- 11. FAQ ACCORDION ---------- */
function initFaq() {
  const list = $("#faqList");
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".faq-q");
    if (!btn) return;
    const item = btn.closest(".faq-item");
    const willOpen = !item.classList.contains("open");
    $$(".faq-item.open", list).forEach((o) => { o.classList.remove("open"); $(".faq-q", o).setAttribute("aria-expanded", "false"); });
    if (willOpen) { item.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
  });
}

/* ---------- 12. CONTACT FORM (frontend only — no server) ---------- */
function initContactForm() {
  const form = $("#contactForm");
  const note = $("#formNote");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    note.className = "form-note";
    const data = Object.fromEntries(new FormData(form).entries());
    let valid = true;
    ["name", "email", "subject", "message"].forEach((k) => {
      const el = form.elements[k];
      const ok = k === "email" ? /^\S+@\S+\.\S+$/.test((data[k] || "").trim()) : (data[k] || "").trim().length > 0;
      el.setAttribute("aria-invalid", String(!ok));
      if (!ok) valid = false;
    });
    if (!valid) { note.textContent = "Please fill in every field with a valid email."; return; }

    if (isSet(MESSCLUB_CONFIG.supportEmail)) {
      const body = `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`;
      window.location.href = `mailto:${MESSCLUB_CONFIG.supportEmail}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
      note.className = "form-note ok";
      note.textContent = "Opening your email app. Press send there to reach us.";
    } else {
      note.textContent = "Contact form backend coming soon.";
    }
  });
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();
  applyConfig();
  initShots();
  initLoader();
  initNav();
  initReveal();
  initScrollEffects();
  initDesktopFx();
  initTokens();
  initAppPhone();
  initFaq();
  initContactForm();
});