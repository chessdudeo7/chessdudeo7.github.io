/* Strata — Minecraft container textures for read mode.
   Rather than ship images, the world renderer has already generated stone and
   plank textures, so those canvases are reused directly as CSS backgrounds:
   the panels are literally made of the same blocks as the world.

   The texture is pulled hard toward neutral grey before it is handed over.
   It is blended in `overlay` mode over a dark panel, where a full-strength
   texture would read as noise; at this strength it only breaks up the flat
   fill, which is all it is there to do. */
(function () {
  "use strict";
  var W = window.WORLD;
  if (!W || !W.TEX) { return; }

  function tile(texId, scale, flatten) {
    var src = W.TEX[texId];
    if (!src) { return null; }
    var n = src.width * (scale || 2);
    var c = document.createElement("canvas");
    c.width = c.height = n;
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, n, n);
    /* Wash toward mid grey so `overlay` leaves contrast, not colour. */
    g.fillStyle = "rgba(128,128,128," + flatten + ")";
    g.fillRect(0, 0, n, n);
    try { return "url(" + c.toDataURL("image/png") + ")"; }
    catch (e) { return null; }          /* tainted canvas: fall back to flat fill */
  }

  var root = document.documentElement;

  var stone = tile(3, 3, 0.80);
  if (stone) { root.style.setProperty("--mc-stone", stone); }

  var planks = tile(18, 3, 0.78);
  if (planks) { root.style.setProperty("--mc-planks", planks); }

  document.body.classList.add("mc-gui");
})();
