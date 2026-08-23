/* Strata — ambience.
   A separate overlay canvas so particles can run at full frame rate without
   forcing the whole block world to redraw. Everything here is decoration:
   if it fails, the page and the game are unaffected. */
(function () {
  "use strict";
  var W = window.WORLD;
  if (!W) { return; }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Overlay canvas ───────────────────────────────────────────────────── */
  var fx = document.createElement("canvas");
  fx.id = "fx";
  document.body.insertBefore(fx, document.getElementById("world-veil"));
  var ctx = fx.getContext("2d");
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0;

  function fit() {
    var nw = Math.max(1, window.innerWidth), nh = Math.max(1, window.innerHeight);
    if (nw === w && nh === h) { return; }
    w = nw; h = nh;
    fx.width = Math.round(w * DPR);
    fx.height = Math.round(h * DPR);
    fx.style.width = w + "px";
    fx.style.height = h + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  /* ── Particles ────────────────────────────────────────────────────────────
     What drifts past you depends on how deep you are: spores near the
     surface, dust through the stone, embers once lava is in range.
     ───────────────────────────────────────────────────────────────────── */
  var parts = [];
  var MAX = 34;

  function spawn(p) {
    var kind;
    if (p < 0.22) { kind = "spore"; }
    else if (p < 0.62) { kind = "dust"; }
    else if (p < 0.82) { kind = Math.random() < 0.75 ? "dust" : "ember"; }
    else { kind = Math.random() < 0.45 ? "dust" : "ember"; }

    var o = {
      k: kind,
      x: Math.random() * w,
      y: kind === "ember" ? h + 8 : -8 + Math.random() * h,
      s: kind === "dust" ? 1 + Math.random() * 1.4 : 1.4 + Math.random() * 1.8,
      a: 0.10 + Math.random() * 0.22,
      life: 1
    };
    if (kind === "spore") { o.vx = (Math.random() - 0.5) * 0.14; o.vy = -0.10 - Math.random() * 0.14; }
    else if (kind === "dust") { o.vx = (Math.random() - 0.5) * 0.12; o.vy = 0.16 + Math.random() * 0.30; }
    else { o.vx = (Math.random() - 0.5) * 0.22; o.vy = -0.34 - Math.random() * 0.42; }
    return o;
  }

  var COLOUR = {
    spore: "168,214,120",
    dust:  "196,190,172",
    ember: "255,150,60"
  };

  /* ── Ore glints ───────────────────────────────────────────────────────────
     A brief sparkle on an ore block that is actually on screen and actually
     uncovered — never on rock the player has not reached.
     ───────────────────────────────────────────────────────────────────── */
  var ORE = { 8:"#6E7480", 9:"#D8B584", 10:"#EFC06A", 11:"#DC4B42",
              12:"#8DF2EE", 13:"#B98DEC", 15:"#E39A5E", 16:"#6BD98C", 17:"#FFDE96" };
  var glints = [];

  function findOre() {
    var grid = W.grid;
    if (!grid) { return null; }
    var B = W.BLOCK, start = Math.floor(W.rowOffset), sub = (W.rowOffset - start) * B;
    var rows = Math.ceil(h / B) + 1;
    for (var tries = 0; tries < 24; tries++) {
      var ry = Math.floor(Math.random() * rows);
      var gx = Math.floor(Math.random() * W.cols);
      var gy = start + ry;
      if (gy < 0 || gy >= W.ROWS) { continue; }
      var m = grid[gy * W.cols + gx];
      if (!ORE[m]) { continue; }
      if (W.isSeen && !W.isSeen(gx, gy)) { continue; }
      return { x: gx * B + B / 2, y: ry * B - sub + B / 2, c: ORE[m] };
    }
    return null;
  }

  /* ── Loop ─────────────────────────────────────────────────────────────── */
  var last = 0, glintT = 0;
  var mx = 0.34, my = 0.46, tmx = 0.34, tmy = 0.46;
  var lastDepth = "";
  var debris = [];

  addEventListener("pointermove", function (e) {
    tmx = e.clientX / Math.max(1, window.innerWidth);
    tmy = e.clientY / Math.max(1, window.innerHeight);
  }, { passive: true });

  /* A short shower of falling blocks when the stratum changes, so descending
     between layers registers as an event rather than a colour swap. */
  function caveIn() {
    for (var i = 0; i < 26; i++) {
      debris.push({
        x: Math.random() * w,
        y: -10 - Math.random() * 60,
        vy: 0.9 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.3,
        s: 3 + Math.random() * 5,
        r: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.12,
        life: 1
      });
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    fit();
    var dt = Math.min(50, now - last || 16);
    last = now;

    ctx.clearRect(0, 0, w, h);
    var p = progress();

    /* Torchlight breathing, tinted by the current stratum and drifting
       toward the cursor so the light feels carried rather than fixed. */
    var depth = getComputedStyle(document.documentElement)
      .getPropertyValue("--depth").trim() || "#6E8C3A";

    if (depth !== lastDepth) {
      lastDepth = depth;
    }

    mx = 0.36; my = 0.46;   /* a fixed lamp reads calmer than one that chases */

    var pulse = 0.030 + Math.sin(now / 1400) * 0.012 + Math.sin(now / 430) * 0.005;
    var g = ctx.createRadialGradient(w * mx, h * my, 0, w * mx, h * my, Math.max(w, h) * 0.72);
    g.addColorStop(0, hexA(depth, Math.max(0, pulse)));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    /* Particles */
    while (parts.length < MAX) { parts.push(spawn(p)); }
    for (var i = parts.length - 1; i >= 0; i--) {
      var o = parts[i];
      o.x += o.vx * dt * 0.06;
      o.y += o.vy * dt * 0.06;
      if (o.k === "ember") { o.life -= dt * 0.00035; }
      if (o.y < -12 || o.y > h + 12 || o.x < -12 || o.x > w + 12 || o.life <= 0) {
        parts[i] = spawn(p);
        continue;
      }
      ctx.globalAlpha = o.a * (o.k === "ember" ? Math.max(0, o.life) : 1);
      ctx.fillStyle = "rgb(" + COLOUR[o.k] + ")";
      ctx.fillRect(o.x, o.y, o.s, o.s);
      if (o.k === "ember") {
        ctx.globalAlpha *= 0.3;
        ctx.fillRect(o.x - 1, o.y - 1, o.s + 2, o.s + 2);
      }
    }
    ctx.globalAlpha = 1;

    /* Ore glints */
    glintT -= dt;
    if (glintT <= 0) {
      glintT = 1400 + Math.random() * 2200;
      var found = findOre();
      if (found) { found.t = 0; glints.push(found); }
    }
    for (var j = glints.length - 1; j >= 0; j--) {
      var q = glints[j];
      q.t += dt;
      var k = q.t / 620;
      if (k >= 1) { glints.splice(j, 1); continue; }
      var amp = Math.sin(k * Math.PI);
      ctx.globalAlpha = amp * 0.9;
      ctx.strokeStyle = q.c;
      ctx.lineWidth = 1.4;
      var r = 3 + amp * 6;
      ctx.beginPath();
      ctx.moveTo(q.x - r, q.y); ctx.lineTo(q.x + r, q.y);
      ctx.moveTo(q.x, q.y - r); ctx.lineTo(q.x, q.y + r);
      ctx.stroke();
      ctx.globalAlpha = amp;
      ctx.fillStyle = q.c;
      ctx.fillRect(q.x - 1, q.y - 1, 2, 2);
    }
    ctx.globalAlpha = 1;

    /* Falling debris from the last stratum change */
    for (var d = debris.length - 1; d >= 0; d--) {
      var q2 = debris[d];
      q2.y += q2.vy * dt * 0.06;
      q2.x += q2.vx * dt * 0.06;
      q2.r += q2.vr;
      q2.life -= dt * 0.00042;
      if (q2.y > h + 20 || q2.life <= 0) { debris.splice(d, 1); continue; }
      ctx.save();
      ctx.translate(q2.x, q2.y);
      ctx.rotate(q2.r);
      ctx.globalAlpha = Math.max(0, q2.life) * 0.7;
      ctx.fillStyle = depth;
      ctx.fillRect(-q2.s / 2, -q2.s / 2, q2.s, q2.s);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function hexA(hex, a) {
    hex = hex.replace("#", "");
    if (hex.length === 3) { hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]; }
    var n = parseInt(hex, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  if (!reduced) { requestAnimationFrame(frame); }
  else { fit(); }

})();
