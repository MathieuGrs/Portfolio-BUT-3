/* =========================================================
   Lightbox — agrandit toute image .shot img au clic.
   Léger, sans dépendance. Fermeture: clic fond / croix / Échap.
   ========================================================= */
(() => {
  "use strict";
  const imgs = [...document.querySelectorAll(".shot img")];
  if (!imgs.length) return;

  // build overlay once
  const ov = document.createElement("div");
  ov.className = "lb-overlay";
  ov.setAttribute("aria-hidden", "true");
  ov.innerHTML =
    '<button class="lb-close" aria-label="Fermer">&times;</button>' +
    '<figure class="lb-fig"><img class="lb-img" alt="" /><figcaption class="lb-cap"></figcaption></figure>';
  document.body.appendChild(ov);

  const lbImg = ov.querySelector(".lb-img");
  const lbCap = ov.querySelector(".lb-cap");
  let lastFocus = null;

  function open(src, alt, cap) {
    lbImg.src = src; lbImg.alt = alt || "";
    lbCap.textContent = cap || "";
    lbCap.style.display = cap ? "block" : "none";
    ov.classList.add("is-open");
    ov.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function close() {
    ov.classList.remove("is-open");
    ov.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbImg.src = "";
    if (lastFocus) lastFocus.focus();
  }

  imgs.forEach((im) => {
    im.style.cursor = "zoom-in";
    const fig = im.closest("figure");
    const capEl = fig ? fig.querySelector(".cap") : null;
    const trigger = () => {
      lastFocus = im;
      open(im.currentSrc || im.src, im.alt, capEl ? capEl.textContent : "");
    };
    im.addEventListener("click", trigger);
    im.setAttribute("tabindex", "0");
    im.setAttribute("role", "button");
    im.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(); }
    });
  });

  ov.addEventListener("click", (e) => {
    if (e.target === ov || e.target.classList.contains("lb-close")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ov.classList.contains("is-open")) close();
  });
})();
