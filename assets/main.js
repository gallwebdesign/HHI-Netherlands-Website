/* ============================================================
   HHI NETHERLANDS — shared site script
   Every feature checks for its own markup, so all pages can
   safely load this single file.
   ============================================================ */
(() => {
  "use strict";

  /* ---- CONFIG: set the real championship date + contact address ---- */
  const EVENT_DATE = "2027-01-30T12:00:00+01:00";
  const CONTACT_EMAIL = "info@hhi-netherlands.com"; // TODO: replace with the real inbox

  const doc = document.documentElement;
  doc.classList.add("js");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;
  if (prefersReducedMotion) doc.classList.add("reduced-motion");

  const hasGsap = typeof window.gsap !== "undefined";
  const hasScrollTrigger =
    hasGsap && typeof window.ScrollTrigger !== "undefined";
  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ============================ LANGUAGE (EN / NL) ============================
     English lives in the markup; Dutch lives in each element's data-nl
     attribute. The chosen language travels between pages via ?lang=nl.
  ============================================================================ */
  const i18nTargets = Array.from(document.querySelectorAll("[data-nl]")).map(
    (el) => ({
      el,
      nl: el.dataset.nl,
      en: el.innerHTML,
    }),
  );
  const langButtons = document.querySelectorAll(".lang__btn");
  let currentLang = "en";

  const isInternalLink = (href) =>
    href &&
    !href.startsWith("#") &&
    !href.startsWith("http") &&
    !href.startsWith("mailto:") &&
    !href.startsWith("tel:");

  const applyLangToLinks = (lang) => {
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!isInternalLink(href)) return;
      const [pathPart, hash] = href.split("#");
      const [base] = pathPart.split("?");
      const query = lang === "nl" ? "?lang=nl" : "";
      a.setAttribute("href", `${base}${query}${hash ? `#${hash}` : ""}`);
    });
  };

  const setLang = (lang) => {
    currentLang = lang;
    i18nTargets.forEach(({ el, nl, en }) => {
      el.innerHTML = lang === "nl" ? nl : en;
    });
    doc.lang = lang;
    langButtons.forEach((btn) => {
      const isActive = btn.dataset.lang === lang;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
    applyLangToLinks(lang);
  };

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });

  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "nl") setLang("nl");

  /* ============================ COUNTDOWN ============================ */
  const initCountdown = () => {
    const cells = {
      d: document.getElementById("cdD"),
      h: document.getElementById("cdH"),
      m: document.getElementById("cdM"),
      s: document.getElementById("cdS"),
    };
    if (!cells.d) return;

    const target = new Date(EVENT_DATE).getTime();
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      cells.d.textContent = pad(Math.floor(diff / 86400000));
      cells.h.textContent = pad(Math.floor(diff / 3600000) % 24);
      cells.m.textContent = pad(Math.floor(diff / 60000) % 60);
      cells.s.textContent = pad(Math.floor(diff / 1000) % 60);
    };
    tick();
    setInterval(tick, 1000);
  };
  initCountdown();

  /* ============================ CURSOR ============================ */
  const initCursor = () => {
    if (!isFinePointer || prefersReducedMotion || !hasGsap) return;
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;
    doc.classList.add("has-cursor");

    const moveDotX = gsap.quickTo(dot, "x", {
      duration: 0.08,
      ease: "power2.out",
    });
    const moveDotY = gsap.quickTo(dot, "y", {
      duration: 0.08,
      ease: "power2.out",
    });
    const moveRingX = gsap.quickTo(ring, "x", {
      duration: 0.32,
      ease: "power3.out",
    });
    const moveRingY = gsap.quickTo(ring, "y", {
      duration: 0.32,
      ease: "power3.out",
    });

    window.addEventListener("pointermove", (e) => {
      moveDotX(e.clientX);
      moveDotY(e.clientY);
      moveRingX(e.clientX);
      moveRingY(e.clientY);
    });

    document
      .querySelectorAll("a, button, .division, input, textarea")
      .forEach((el) => {
        el.addEventListener("pointerenter", () => ring.classList.add("is-hot"));
        el.addEventListener("pointerleave", () =>
          ring.classList.remove("is-hot"),
        );
      });
  };
  initCursor();

  /* ============================ MAGNETIC BUTTONS ============================ */
  const initMagnetic = () => {
    if (!isFinePointer || prefersReducedMotion || !hasGsap) return;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - (r.left + r.width / 2)) * strength,
          y: (e.clientY - (r.top + r.height / 2)) * strength,
          duration: 0.3,
          ease: "power2.out",
        });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      });
    });
  };
  initMagnetic();

  /* ============================ CARD TILT ============================ */
  const initTilt = () => {
    if (!isFinePointer || prefersReducedMotion || !hasGsap) return;
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        gsap.to(card, {
          rotateX: rx,
          rotateY: ry,
          transformPerspective: 700,
          duration: 0.4,
          ease: "power2.out",
        });
      });
      card.addEventListener("pointerleave", () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.7,
          ease: "elastic.out(1, 0.5)",
        });
      });
    });
  };
  initTilt();

  /* ============================ THREE.JS STAGE FLOOR (home hero) ============================ */
  const initStageFloor = () => {
    const mount = document.getElementById("stage-floor");
    if (!mount || typeof window.THREE === "undefined") return;

    const isMobile = window.innerWidth < 800;
    const cols = isMobile ? 70 : 130;
    const rows = isMobile ? 40 : 70;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0e, 8, 30);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 3.2, 9);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const count = cols * rows;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const oranje = new THREE.Color(0xff4d00);
    const violet = new THREE.Color(0x7c5cff);
    const spanX = 34;
    const spanZ = 22;

    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions[i * 3] = (c / (cols - 1) - 0.5) * spanX;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (r / (rows - 1) - 0.5) * spanZ;
        const mixed = oranje.clone().lerp(violet, c / (cols - 1));
        colors[i * 3] = mixed.r;
        colors[i * 3 + 1] = mixed.g;
        colors[i * 3 + 2] = mixed.b;
        i++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: isMobile ? 0.09 : 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(geometry, material));

    const pointer = { x: 0, targetX: 0, y: 0, targetY: 0 };
    window.addEventListener("pointermove", (e) => {
      pointer.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    const pos = geometry.attributes.position;
    const renderFrame = (t) => {
      pointer.x += (pointer.targetX - pointer.x) * 0.05;
      pointer.y += (pointer.targetY - pointer.y) * 0.05;

      for (let p = 0; p < count; p++) {
        const x = pos.array[p * 3];
        const z = pos.array[p * 3 + 2];
        const wave =
          Math.sin(x * 0.55 + t * 0.0012) * 0.35 +
          Math.sin(z * 0.8 - t * 0.0009) * 0.25;
        const dx = x - pointer.x * (spanX / 2);
        const dz = z - pointer.y * (spanZ / 2);
        const dist = Math.sqrt(dx * dx + dz * dz);
        const ripple =
          Math.max(0, 1 - dist / 6) * Math.sin(dist * 1.4 - t * 0.004) * 0.9;
        pos.array[p * 3 + 1] = wave + ripple;
      }
      pos.needsUpdate = true;

      camera.position.x = pointer.x * 0.8;
      camera.lookAt(0, 0.4, 0);
      renderer.render(scene, camera);
    };

    if (prefersReducedMotion) {
      renderFrame(0);
      return;
    }

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(mount);

    const loop = (t) => {
      if (isVisible) renderFrame(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    window.addEventListener("resize", () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    });
  };
  initStageFloor();

  /* ============================ PAGE ENTRANCE ============================
     Home: preloader counter, curtain lift, hero rows.
     Sub pages: hero rows + lede slide straight in.
  ======================================================================== */
  const loader = document.getElementById("loader");
  const heroRows = document.querySelectorAll(
    ".hero__title .row > span, .page-hero h1 .row > span",
  );
  const heroFades = document.querySelectorAll("[data-hero-fade]");

  const revealHero = () => {
    if (!hasGsap || prefersReducedMotion) {
      if (loader) loader.style.display = "none";
      return;
    }
    const tl = gsap.timeline();
    if (loader) {
      tl.to(loader, {
        yPercent: -100,
        duration: 0.7,
        ease: "power4.inOut",
      }).set(loader, { display: "none" });
    }
    if (heroRows.length) {
      tl.from(
        heroRows,
        { yPercent: 110, duration: 1, ease: "power4.out", stagger: 0.12 },
        loader ? "-=0.25" : 0,
      );
    }
    if (heroFades.length) {
      tl.from(
        heroFades,
        {
          y: 26,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
        },
        "-=0.5",
      );
    }
  };

  if (loader && hasGsap && !prefersReducedMotion) {
    const pct = { v: 0 };
    const pctLabel = document.getElementById("loaderPct");
    const fill = document.getElementById("loaderFill");
    gsap.to(pct, {
      v: 100,
      duration: 1.4,
      ease: "power2.inOut",
      onUpdate: () => {
        pctLabel.textContent = Math.round(pct.v);
        fill.style.transform = `scaleX(${pct.v / 100})`;
      },
      onComplete: revealHero,
    });
  } else {
    revealHero();
  }

  /* ============================ MOBILE MENU ============================ */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  let isMenuOpen = false;

  const setMenu = (open) => {
    isMenuOpen = open;
    menu.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
    if (open) nav.classList.remove("is-hidden");

    if (open && hasGsap && !prefersReducedMotion) {
      gsap.fromTo(
        ".menu__link",
        { y: 34, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.05,
          delay: 0.08,
        },
      );
      gsap.fromTo(
        ".menu__ctas, .menu__socials",
        { y: 20, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.3,
        },
      );
    }
  };

  if (burger && menu) {
    burger.addEventListener("click", () => setMenu(!isMenuOpen));
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        setMenu(false);
        burger.focus();
      }
    });
  }

  /* ============================ NAV HIDE / SHOW ============================ */
  if (nav) {
    let lastY = 0;
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        nav.classList.toggle("is-scrolled", y > 40);
        if (!prefersReducedMotion && !isMenuOpen) {
          nav.classList.toggle("is-hidden", y > lastY && y > 300);
        }
        lastY = y;
      },
      { passive: true },
    );
  }

  /* ============================ SCROLL REVEALS + COUNTERS ============================ */
  if (hasScrollTrigger && !prefersReducedMotion) {
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.fromTo(
        el,
        { y: 40, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    });

    gsap.utils.toArray("[data-count]").forEach((el) => {
      const end = Number(el.dataset.count);
      const state = { v: 0 };
      gsap.to(state, {
        v: end,
        duration: 1.4,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = `${Math.round(state.v)}${end >= 50 ? "+" : ""}`;
        },
      });
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
  }

  /* ============================ ROAD: HORIZONTAL PIN (home, desktop) ============================ */
  const initRoad = () => {
    if (!hasScrollTrigger || prefersReducedMotion) return;
    const track = document.getElementById("roadTrack");
    if (!track) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1001px)", () => {
      const getDistance = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: "#road",
          start: "top top",
          end: () => `+=${getDistance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      return () => tween.scrollTrigger && tween.scrollTrigger.kill();
    });
  };
  initRoad();

  /* ============================ TICKER ============================ */
  const ticker = document.getElementById("tickerTrack");
  if (ticker) ticker.innerHTML += ticker.innerHTML;

  /* ============================ TABS (results archive) ============================ */
  const tabButtons = document.querySelectorAll("[data-tab]");
  if (tabButtons.length) {
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
        document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
          panel.classList.toggle(
            "is-active",
            panel.dataset.tabPanel === btn.dataset.tab,
          );
        });
      });
    });
  }

  /* ============================ CONTACT FORM (mailto compose) ============================ */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(contactForm);
      const subject = encodeURIComponent(
        `[hhi-netherlands.com] ${data.get("subject") || "Contact"}`,
      );
      const body = encodeURIComponent(
        `Name: ${data.get("name") || "-"}\nEmail: ${data.get("email") || "-"}\n\n${data.get("message") || ""}`,
      );
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    });
  }
})();
