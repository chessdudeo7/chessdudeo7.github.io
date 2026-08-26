/* Strata — Minecraft GUI textures.
   The menu background and the panel faces are the game's own block textures,
   tiled. Rather than ship images, the world renderer has already generated
   dirt, stone and planks, so those canvases are reused directly as CSS
   backgrounds — the UI is literally made of the same blocks as the world. */
(function () {
  "use strict";
  var W = window.WORLD;
  if (!W || !W.TEX) { return; }

  function tile(texId, scale, darken) {
    var src = W.TEX[texId];
    if (!src) { return null; }
    var n = src.width * (scale || 2);
    var c = document.createElement("canvas");
    c.width = c.height = n;
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, n, n);
    if (darken) {
      g.fillStyle = "rgba(0,0,0," + darken + ")";
      g.fillRect(0, 0, n, n);
    }
    try { return "url(" + c.toDataURL("image/png") + ")"; }
    catch (e) { return null; }          /* tainted canvas: fall back to flat colour */
  }

  var root = document.documentElement;

  /* The classic darkened-dirt menu backdrop. */
  var dirt = tile(2, 3, 0.62);
  if (dirt) { root.style.setProperty("--mc-dirt", dirt); }

  /* Stone for heavier panels, planks for the wooden ones. */
  var stone = tile(3, 2, 0.30);
  if (stone) { root.style.setProperty("--mc-stone", stone); }

  var planks = tile(18, 2, 0.20);
  if (planks) { root.style.setProperty("--mc-planks", planks); }

  document.body.classList.add("mc-gui");
})();
