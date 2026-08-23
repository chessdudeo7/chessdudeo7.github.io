/* Strata — reveals.
   One gentle entrance per element and nothing else. The earlier version drove
   transforms every frame on top of CSS transitions, which is what made the
   page feel unstable. There is no scroll-linked motion here at all. */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Stagger the shelf items so a rack fills in rather than snapping. */
  document.querySelectorAll(".rack").forEach(function (rack) {
    rack.querySelectorAll(".slotcard").forEach(function (c, i) {
      c.style.setProperty("--d", Math.min(i * 34, 420) + "ms");
    });
  });

  if (reduced) {
    document.querySelectorAll(".sign, .vein-node, .room, .chest-card, .bench-item, .rack")
      .forEach(function (el) { el.classList.add("in-view"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) { return; }
      io.unobserve(e.target);
      e.target.classList.add("in-view");
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".sign, .vein-node, .room, .chest-card, .bench-item, .rack")
    .forEach(function (el) { io.observe(el); });
})();
