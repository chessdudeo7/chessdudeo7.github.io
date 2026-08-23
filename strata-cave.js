/* Strata — the Cavern.
   A full-screen explorable cave. Instead of scrolling a page you pan around a
   single large space with exhibits placed throughout it: lantern-lit alcoves
   holding the same content the scroll view carries. Opens over everything and
   closes with Escape, so it cannot disturb Read or Play mode. */
(function () {
  "use strict";
  var W = window.WORLD;
  if (!W) { return; }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var B = W.BLOCK;                 /* reuse the world's block size and textures */
  var COLS = 240, ROWS = 96;
  var SKY = 0;

  /* ── Exhibits ────────────────────────────────────────────────────────────
     Each one sits in its own chamber. Coordinates are in blocks and the cave
     is carved around them, so a chamber can never fail to exist.
     ─────────────────────────────────────────────────────────────────── */
  var EXHIBITS = [
    { x: 20,  y: 26, key: "Entrance", tint: "#6EA047",
      title: "Matthew Zhu",
      sub: "Computer Science &#183; Waterloo &#183; class of 2029",
      body: "Software engineering intern at Ciena and a Canadian chess National Master. " +
            "Drag to explore the cavern &#8212; every lantern is something I have worked on.",
      list: ["Open to co-op terms in 2027", "Ottawa / Waterloo, Canada"],
      links: [["Email", "mailto:m49zhu@uwaterloo.ca"], ["GitHub", "https://github.com/chessdudeo7"]] },

    { x: 58,  y: 20, key: "Ciena", tint: "#B08D57",
      title: "Ciena",
      sub: "Software Engineering Intern &#183; May 2026 &#8212; now",
      body: "Porting an 1,800-line C optical-planning model to Rust and rebuilding its " +
            "neural networks so inference runs on hardware a decade older than the model.",
      list: ["Rust port via PyO3/maturin and cbindgen",
             "7 neural network models in HuggingFace Candle",
             "FFI bridge into a C network simulator",
             "Zero divergence across a ~500-case regression suite"] },

    { x: 92,  y: 40, key: "Auxilium", tint: "#B08D57",
      title: "Auxilium",
      sub: "Software Developer &#183; Jun 2025 &#8212; now",
      body: "Mentor&#8211;student matching built on what actually drives a good pairing.",
      list: ["Pandas matching algorithm, weighted criteria", "Match rate up 36%",
             "Indexed SQLite for repeatable runs"] },

    { x: 128, y: 24, key: "ClipFarm", tint: "#A8302A",
      title: "ClipFarm",
      sub: "Computer vision &#183; 2026",
      body: "Volleyball VODs into highlight clips. RF-DETR tracking finds rally contacts, " +
            "refined by YOLOv8-pose.",
      list: ["13 min &#8594; 8.7 min per game", "R2 cache took another 31% off"],
      links: [["GitHub", "https://github.com/chessdudeo7"]] },

    { x: 150, y: 52, key: "HUME", tint: "#8B5CC4",
      title: "HUME",
      sub: "ML safety &#183; 2026",
      body: "A structural firewall for a belief-revision engine. Confidence is revised from " +
            "structured provenance rather than raw text.",
      list: ["Log-odds likelihood-ratio update", "19-probe adversarial battery"],
      links: [["GitHub", "https://github.com/chessdudeo7"]] },

    { x: 182, y: 30, key: "KnightMare", tint: "#4FD6D0",
      title: "KnightMare",
      sub: "Deep learning &#183; 2025",
      body: "A chess engine that learns instead of searching. A PyTorch CNN over 100,000+ " +
            "grandmaster games returns a move distribution &#8212; no alpha-beta anywhere.",
      list: ["Modal cloud GPUs cut training to minutes"],
      links: [["Write-up", "project-knightmare.html"],
              ["GitHub", "https://github.com/chessdudeo7/ChessHacks"]] },

    { x: 210, y: 58, key: "Chess4All", tint: "#3FA85F",
      title: "Chess4All &amp; OTMaC",
      sub: "Full-stack &#183; 2024 &#8212; now",
      body: "The training platform I wish I&#8217;d had at 1400, and the official site for the " +
            "Ottawa Math Team Contest which I help organise.",
      list: ["30+ endgame studies, vanilla-JS board", "OTMaC ships via pull request"],
      links: [["Chess4All", "project-chess4all.html"], ["OTMaC", "project-otmac.html"]] },

    { x: 66,  y: 66, key: "Waterloo", tint: "#8C97A6",
      title: "University of Waterloo",
      sub: "BCS Honours CS, Co-op &#183; 2025&#8211;2029",
      body: "GPA 3.9/4.0 on the Ren&#233; Descartes National Scholarship &#8212; $25,000, one of " +
            "ten awarded across Canada.",
      list: ["Object-Oriented Software Development", "Logic and Computation",
             "Stanford CS 230 &#183; Google ML"] },

    { x: 116, y: 74, key: "National Master", tint: "#E8B24A",
      title: "National Master",
      sub: "Chess Federation of Canada &#183; 2026",
      body: "Third and final norm at the 2026 Markham True North Open, 2nd place with a " +
            "2300+ performance rating.",
      list: ["Peak 2251 CFC / 2136 FIDE", "Team Canada, 2019 World Cadet",
             "CMO Rep&#234;chage, top 100 nationally"] },

    { x: 196, y: 78, key: "Contact", tint: "#E8722C",
      title: "Your move",
      sub: "Open to co-op terms in 2027",
      body: "If any of this is useful to you, I&#8217;d like to hear from you.",
      links: [["Email", "mailto:m49zhu@uwaterloo.ca"],
              ["Resume &#183; SWE", "MATTHEW_ZHU_SWE.pdf"],
              ["Resume &#183; MLE", "MATTHEW_ZHU_MLE.pdf"],
              ["LinkedIn", "https://www.linkedin.com/in/matthewzhu99"]] }
  ];

  /* ── Cave generation ─────────────────────────────────────────────────────
     Solid rock, then a winding tunnel is bored between every exhibit in turn
     and a chamber hollowed at each one. Carving along the path guarantees the
     whole cavern is connected and every exhibit reachable.
     ─────────────────────────────────────────────────────────────────── */
  var grid = new Uint8Array(COLS * ROWS);
  var lit = new Uint8Array(COLS * ROWS);

  function set(x, y, m) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) { return; }
    grid[y * COLS + x] = m;
  }
  function at(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) { return 7; }
    return grid[y * COLS + x];
  }

  function hash(n) {
    n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15);
    return ((n >>> 0) % 100000) / 100000;
  }

  (function build() {
    /* Rock, banded by depth so the cavern still reads as strata. */
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        var m = y < 8 ? 2 : y < 34 ? 3 : y < 66 ? 5 : 6;
        if (hash(x * 31 + y * 17) < 0.12) { m = (m === 3) ? 4 : m; }
        set(x, y, m);
      }
    }
    for (var bx = 0; bx < COLS; bx++) { set(bx, ROWS - 1, 7); set(bx, 0, 7); }

    function carve(cx, cy, r) {
      for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) { continue; }
          if (cy + dy <= 1 || cy + dy >= ROWS - 2) { continue; }
          set(cx + dx, cy + dy, SKY);
        }
      }
    }

    /* Tunnels between consecutive exhibits */
    for (var i = 0; i < EXHIBITS.length - 1; i++) {
      var a = EXHIBITS[i], b = EXHIBITS[i + 1];
      var steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 2;
      for (var s = 0; s <= steps; s++) {
        var t = s / steps;
        var wob = Math.sin(t * Math.PI * 3 + i) * 4;
        var px = Math.round(a.x + (b.x - a.x) * t);
        var py = Math.round(a.y + (b.y - a.y) * t + wob);
        carve(px, py, 2 + Math.round(hash(s * 7 + i * 91) * 1.6));
      }
    }

    /* A chamber at each exhibit, and ore scattered on its walls */
    var ORES = { Ciena: 9, Auxilium: 15, ClipFarm: 11, HUME: 13,
                 KnightMare: 12, Chess4All: 16, Waterloo: 8,
                 "National Master": 10, Contact: 14, Entrance: 17 };

    EXHIBITS.forEach(function (e, idx) {
      carve(e.x, e.y, 6);
      var ore = ORES[e.key] || 9;
      for (var k = 0; k < 26; k++) {
        var ang = hash(idx * 53 + k) * Math.PI * 2;
        var rad = 6 + hash(idx * 71 + k) * 2.4;
        var ox = Math.round(e.x + Math.cos(ang) * rad);
        var oy = Math.round(e.y + Math.sin(ang) * rad);
        if (at(ox, oy) && at(ox, oy) !== 7) { set(ox, oy, ore); }
      }
    });
  })();

  /* ── Overlay DOM ─────────────────────────────────────────────────────── */
  var root = document.createElement("div");
  root.id = "cavern";
  root.innerHTML =
    '<canvas id="cav-gl"></canvas>' +
    '<div id="cav-veil"></div>' +
    '<div id="cav-labels"></div>' +
    '<div id="cav-bar">' +
      '<span class="cav-title">The Cavern</span>' +
      '<span class="cav-hint">drag to explore &#183; click a lantern</span>' +
      '<span class="cav-sp"></span>' +
      '<span class="cav-count"><b id="cav-found">0</b> / ' + EXHIBITS.length + ' found</span>' +
      '<button type="button" id="cav-x">close</button>' +
    '</div>' +
    '<div id="cav-map"></div>' +
    '<aside id="cav-panel"><button type="button" id="cav-pclose">close</button>' +
      '<div id="cav-pinner"></div></aside>';
  document.body.appendChild(root);

  var cv = root.querySelector("#cav-gl");
  var ctx = cv.getContext("2d");
  var labelHost = root.querySelector("#cav-labels");
  var panel = root.querySelector("#cav-panel");
  var pInner = root.querySelector("#cav-pinner");
  var mapEl = root.querySelector("#cav-map");
  var foundEl = root.querySelector("#cav-found");

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var vw = 0, vh = 0;
  var cam = { x: EXHIBITS[0].x * B - 300, y: EXHIBITS[0].y * B - 200 };
  var open = false, found = {};

  function fit() {
    var w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    if (w === vw && h === vh) { return; }
    vw = w; vh = h;
    cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
    cv.style.width = w + "px"; cv.style.height = h + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
    clampCam();
  }

  function clampCam() {
    cam.x = Math.max(0, Math.min(COLS * B - vw, cam.x));
    cam.y = Math.max(0, Math.min(ROWS * B - vh, cam.y));
  }

  /* ── Lantern labels ──────────────────────────────────────────────────── */
  var labels = EXHIBITS.map(function (e) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cav-lamp";
    b.style.setProperty("--tint", e.tint);
    b.innerHTML = '<span class="cav-flame"></span><span class="cav-name">' + e.key + "</span>";
    b.addEventListener("click", function () { openExhibit(e); });
    labelHost.appendChild(b);
    return b;
  });

  /* ── Minimap ─────────────────────────────────────────────────────────── */
  var mapDots = EXHIBITS.map(function (e) {
    var d = document.createElement("button");
    d.type = "button";
    d.className = "cav-dot";
    d.style.left = (e.x / COLS * 100) + "%";
    d.style.top = (e.y / ROWS * 100) + "%";
    d.style.setProperty("--tint", e.tint);
    d.title = e.key;
    d.addEventListener("click", function () {
      cam.x = e.x * B - vw / 2; cam.y = e.y * B - vh / 2; clampCam();
    });
    mapEl.appendChild(d);
    return d;
  });
  var mapView = document.createElement("span");
  mapView.className = "cav-view";
  mapEl.appendChild(mapView);

  /* ── Panel ───────────────────────────────────────────────────────────── */
  function openExhibit(e) {
    if (!found[e.key]) { found[e.key] = 1; foundEl.textContent = Object.keys(found).length; }
    panel.style.setProperty("--tint", e.tint);
    pInner.innerHTML =
      '<div class="cav-key">' + e.key + "</div>" +
      "<h2>" + e.title + "</h2>" +
      '<div class="cav-sub">' + e.sub + "</div>" +
      "<p>" + e.body + "</p>" +
      (e.list ? "<ul>" + e.list.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>" : "") +
      (e.links ? '<div class="cav-links">' + e.links.map(function (l) {
        return '<a href="' + l[1] + '">' + l[0] + "</a>";
      }).join("") + "</div>" : "");
    panel.classList.add("on");
  }

  root.querySelector("#cav-pclose").addEventListener("click", function () {
    panel.classList.remove("on");
  });

  /* ── Panning ─────────────────────────────────────────────────────────── */
  var drag = null;
  cv.addEventListener("pointerdown", function (e) {
    drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
    cv.setPointerCapture(e.pointerId);
    cv.classList.add("grabbing");
  });
  cv.addEventListener("pointermove", function (e) {
    if (!drag) { return; }
    cam.x = drag.cx - (e.clientX - drag.x);
    cam.y = drag.cy - (e.clientY - drag.y);
    clampCam();
  });
  function endDrag() { drag = null; cv.classList.remove("grabbing"); }
  cv.addEventListener("pointerup", endDrag);
  cv.addEventListener("pointercancel", endDrag);

  var keys = {};
  addEventListener("keydown", function (e) {
    if (!open) { return; }
    if (e.key === "Escape") { close(); return; }
    keys[e.key.toLowerCase()] = true;
  });
  addEventListener("keyup", function (e) { keys[e.key.toLowerCase()] = false; });

  /* ── Render ──────────────────────────────────────────────────────────── */
  function draw(now) {
    if (!open) { return; }
    requestAnimationFrame(draw);
    fit();

    /* Arrow keys / WASD glide the camera */
    var sp = 9;
    if (keys.arrowleft || keys.a) { cam.x -= sp; }
    if (keys.arrowright || keys.d) { cam.x += sp; }
    if (keys.arrowup || keys.w) { cam.y -= sp; }
    if (keys.arrowdown || keys.s) { cam.y += sp; }
    if (keys.arrowleft || keys.arrowright || keys.arrowup || keys.arrowdown ||
        keys.a || keys.d || keys.w || keys.s) { clampCam(); }

    ctx.fillStyle = "#05060A";
    ctx.fillRect(0, 0, vw, vh);

    var x0 = Math.floor(cam.x / B), y0 = Math.floor(cam.y / B);
    var sx = -(cam.x - x0 * B), sy = -(cam.y - y0 * B);
    var cw = Math.ceil(vw / B) + 1, chh = Math.ceil(vh / B) + 1;

    for (var ry = 0; ry < chh; ry++) {
      for (var rx = 0; rx < cw; rx++) {
        var gx = x0 + rx, gy = y0 + ry;
        if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) { continue; }
        var m = grid[gy * COLS + gx];
        if (m === SKY) { continue; }
        var tex = W.TEX[m] || W.TEX[3];
        ctx.drawImage(tex, sx + rx * B, sy + ry * B);
      }
    }

    /* Lantern glow pooled in each chamber */
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < EXHIBITS.length; i++) {
      var e = EXHIBITS[i];
      var px = e.x * B - cam.x, py = e.y * B - cam.y;
      if (px < -300 || py < -300 || px > vw + 300 || py > vh + 300) { continue; }
      var flick = reduced ? 1 : 0.86 + Math.sin(now / 260 + i) * 0.09 + Math.sin(now / 91 + i) * 0.05;
      var g = ctx.createRadialGradient(px, py, 0, px, py, 190 * flick);
      g.addColorStop(0, hexA(e.tint, 0.34));
      g.addColorStop(0.45, hexA(e.tint, 0.10));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(px - 200, py - 200, 400, 400);
    }
    ctx.globalCompositeOperation = "source-over";

    /* Position the lantern buttons */
    for (var j = 0; j < EXHIBITS.length; j++) {
      var ex = EXHIBITS[j];
      var lx = ex.x * B - cam.x, ly = ex.y * B - cam.y;
      var el = labels[j];
      if (lx < -160 || ly < -160 || lx > vw + 160 || ly > vh + 160) {
        el.style.display = "none";
      } else {
        el.style.display = "flex";
        el.style.transform = "translate(" + Math.round(lx) + "px," + Math.round(ly) + "px)";
      }
      mapDots[j].classList.toggle("seen", !!found[ex.key]);
    }

    mapView.style.left = (cam.x / (COLS * B) * 100) + "%";
    mapView.style.top = (cam.y / (ROWS * B) * 100) + "%";
    mapView.style.width = (vw / (COLS * B) * 100) + "%";
    mapView.style.height = (vh / (ROWS * B) * 100) + "%";
  }

  function hexA(hex, a) {
    hex = hex.replace("#", "");
    if (hex.length === 3) { hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]; }
    var n = parseInt(hex, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  /* ── Open / close ────────────────────────────────────────────────────── */
  function show() {
    open = true;
    root.classList.add("on");
    document.body.classList.add("cavern-open");
    vw = 0; vh = 0; fit();
    requestAnimationFrame(draw);
  }
  function close() {
    open = false;
    root.classList.remove("on");
    document.body.classList.remove("cavern-open");
    panel.classList.remove("on");
  }
  root.querySelector("#cav-x").addEventListener("click", close);

  var btn = document.createElement("button");
  btn.id = "cav-open";
  btn.type = "button";
  btn.textContent = "Explore the cavern";
  btn.addEventListener("click", show);
  document.body.appendChild(btn);

  window.CAVERN = { open: show, close: close };
})();
