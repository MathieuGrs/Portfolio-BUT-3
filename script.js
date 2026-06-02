/* =========================================================
   Portfolio Mathieu Grosshans
   ONE continuous film: a single scroll timeline drives every
   video's currentTime AND a cross-dissolve between layers, so
   the four clips read as a single, seamless video.
   ========================================================= */
(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const wrap = document.getElementById("film-wrap");
  const layers = [...document.querySelectorAll(".layer")].map((el, idx) => ({
    el,
    n: idx + 1,                       // 1-indexed
    video: el.querySelector(".scene-video"),
    duration: 10,
    target: 0,                        // desired currentTime
    render: 0,                        // smoothed currentTime
    ready: false,
  }));
  const N = layers.length;
  const SEG = 1 / N;                  // each scene owns 1/N of the timeline
  const SCRUB = SEG * 0.86;           // reach last frame at 86%, hold the rest
  const FADE = 0.04;                  // cross-dissolve width (in global progress)

  // Stack: scene 1 on top, later scenes beneath (revealed as the one above fades)
  layers.forEach((L) => { L.el.style.zIndex = String((N - L.n + 1) * 10); });

  /* ---- warm up + true durations ---- */
  layers.forEach((L) => {
    const v = L.video;
    const onMeta = () => {
      if (isFinite(v.duration) && v.duration > 0) L.duration = v.duration;
      L.ready = true;
      try { v.currentTime = 0.001; } catch (e) {}
    };
    if (v.readyState >= 1) onMeta();
    else v.addEventListener("loadedmetadata", onMeta, { once: true });
    v.addEventListener("canplay", () => {
      const p = v.play();
      if (p && p.then) p.then(() => v.pause()).catch(() => {});
      else { try { v.pause(); } catch (e) {} }
    }, { once: true });
  });

  /* ---- global scroll progress 0..1 across the film ---- */
  let P = 0;
  function computeP() {
    const vh = window.innerHeight;
    const scrollable = wrap.offsetHeight - vh;
    const rect = wrap.getBoundingClientRect();
    P = scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;
  }

  /* ---- per-layer crossfade opacity + scrub target ---- */
  function applyTimeline() {
    for (const L of layers) {
      const i = L.n;
      const boundary = (i < N) ? i * SEG : Infinity;          // when this layer hands off
      const opacity = clamp(1 - (P - boundary) / FADE, 0, 1); // fades out after its boundary
      L.el.style.opacity = opacity.toFixed(3);
      // pointer events only on the layer that's actually visible & in front
      L.el.style.pointerEvents = opacity > 0.5 ? "auto" : "none";

      const local = (P - (i - 1) * SEG) / SCRUB;              // 0..1 across the scrub span
      L.target = clamp(local, 0, 1) * (L.duration - 0.05);
    }
  }

  /* ---- reveals (button/overlay entrances), in per-scene local progress ---- */
  const revealRules = {
    "hero":      { s:1, a:0.0,  b:0.34 },
    "hint":      { s:1, a:0.0,  b:0.18 },
    "label-2":   { s:2, a:0.18, b:1.25 },
    "bubbles-2": { s:2, a:0.50, b:1.25 },
    "label-3":   { s:3, a:0.16, b:1.25 },
    "statues-3": { s:3, a:0.55, b:1.25 },
    "label-4":   { s:4, a:0.16, b:1.25 },
    "envelope-4":{ s:4, a:0.50, b:1.25 },
  };
  const revealEls = [...document.querySelectorAll("[data-reveal]")];
  revealEls.forEach((el) => el.classList.add("is-hidden"));
  function applyReveals() {
    for (const el of revealEls) {
      const r = revealRules[el.dataset.reveal]; if (!r) continue;
      const local = (P - (r.s - 1) * SEG) / SEG;
      el.classList.toggle("is-hidden", !(local >= r.a && local <= r.b));
    }
  }

  /* ---- chrome (rail + topbar) ---- */
  const rail = document.getElementById("scrollProgress");
  const topbar = document.getElementById("topbar");
  function applyChrome() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    if (rail) rail.style.width = (ratio * 100).toFixed(2) + "%";
    if (topbar) topbar.classList.toggle("solid", window.scrollY > 40);
  }

  /* ---- rAF: smooth the scrub so motion stays fluid on jumpy scroll ---- */
  const LERP = prefersReduced ? 1 : 0.16;
  function currentIndex() { return Math.min(Math.max(Math.floor(P / SEG) + 1, 1), N); }
  function tick() {
    const c = currentIndex();
    for (const L of layers) {
      if (!L.ready) continue;
      L.render += (L.target - L.render) * LERP;
      // Only seek the active clip and the one fading in next (perf); others hold.
      if (L.n === c || L.n === c + 1) {
        const v = L.video;
        const delta = Math.abs(L.render - (v.currentTime || 0));
        if (delta > 0.012 && v.readyState >= 2 && !v.seeking) {
          try { v.currentTime = L.render; } catch (e) {}
        }
      }
    }
    requestAnimationFrame(tick);
  }

  /* ---- wiring ---- */
  let scheduled = false;
  function onScroll() {
    if (scheduled) return; scheduled = true;
    requestAnimationFrame(() => { computeP(); applyTimeline(); applyReveals(); applyChrome(); scheduled = false; });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { computeP(); applyTimeline(); applyReveals(); applyChrome(); }, { passive: true });

  computeP(); applyTimeline(); applyReveals(); applyChrome();
  requestAnimationFrame(tick);

  /* ---- land on a requested scene's last frame (e.g. returning from a sub-page) ---- */
  function jumpToSceneLastFrame(k){
    const scrollable = wrap.offsetHeight - window.innerHeight;
    const y = wrap.offsetTop + navP(k) * scrollable;
    window.scrollTo({ top: y, behavior: "auto" });
  }
  try {
    const land = sessionStorage.getItem("landScene");
    if (land) {
      sessionStorage.removeItem("landScene");
      // wait a frame so layout is settled, then snap (no smooth — feels instant on return)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        jumpToSceneLastFrame(parseInt(land, 10));
        computeP(); applyTimeline(); applyReveals(); applyChrome();
      }));
    } else if (location.hash.startsWith("#scene-")) {
      const k = parseInt(location.hash.replace("#scene-",""), 10);
      if (k > 1) requestAnimationFrame(() => requestAnimationFrame(() => {
        jumpToSceneLastFrame(k); computeP(); applyTimeline(); applyReveals(); applyChrome();
      }));
    }
  } catch (e) {}

  /* ---- nav: land on the LAST frame of the target scene ---- */
  // p that puts scene k at its held last frame, fully opaque, as the current layer
  function navP(k){ return k <= 1 ? 0 : (k - 1) * SEG + SCRUB + 0.01; }
  document.querySelectorAll("[data-scene-nav]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const k = parseInt(a.getAttribute("data-scene-nav"), 10);
      e.preventDefault();
      const scrollable = wrap.offsetHeight - window.innerHeight;
      const y = wrap.offsetTop + navP(k) * scrollable;
      window.scrollTo({ top: y, behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  /* ---- pointer-reactive specular highlight on glass bubbles ---- */
  if (!prefersReduced && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll(".lg-bubble").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width) * 100;
        const my = ((e.clientY - r.top) / r.height) * 100;
        const spec = b.querySelector(".lg-spec");
        if (spec) spec.style.background =
          `radial-gradient(70% 90% at ${mx}% ${my - 30}%, rgba(255,255,255,.6), transparent 70%)`;
      });
      b.addEventListener("pointerleave", () => {
        const spec = b.querySelector(".lg-spec");
        if (spec) spec.style.background = "";
      });
    });
  }

  function clamp(v, lo, hi){ return v < lo ? lo : v > hi ? hi : v; }
})();
