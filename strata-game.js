/* Strata — mining layer. Sits on top of window.WORLD.
   The portfolio never depends on any of this: in Read mode the world ignores
   clicks entirely and the page behaves like a normal site. */
(function () {
  "use strict";
  var W = window.WORLD;
  if (!W) { return; }
  var SAVE = "strata-save-v1";

  /* Placed-block ids owned by this layer. */
  var TABLE = 24, FURNACE = 25, TORCH = 26;

  var BLOCKS = {
    1:{item:"dirt",tier:0,hard:0.5},
    2:{item:"dirt",tier:0,hard:0.5},
    3:{item:"cobble",tier:1,hard:1.0},
    4:{item:"cobble",tier:1,hard:1.0},
    5:{item:"cobble",tier:1,hard:1.4},
    6:{item:"cobble",tier:1,hard:1.4},
    8:{item:"coal",tier:1,hard:1.2},
    9:{item:"iron_raw",tier:2,hard:1.6},
    10:{item:"gold_raw",tier:3,hard:1.8},
    11:{item:"redstone",tier:3,hard:1.8},
    12:{item:"diamond",tier:3,hard:2.2},
    13:{item:"amethyst",tier:3,hard:1.6},
    15:{item:"copper",tier:2,hard:1.5},
    16:{item:"emerald",tier:3,hard:2.0},
    17:{item:"glowstone",tier:1,hard:0.8},
    18:{item:"log",tier:0,hard:0.8},
    19:{item:"sapling",tier:0,hard:0.3},
    20:{item:"brick",tier:1,hard:1.3},
    21:{item:"brick",tier:1,hard:1.3},
    23:{item:"obsidian",tier:4,hard:4.0},
    24:{item:"table",tier:0,hard:0.6},
    25:{item:"furnace",tier:1,hard:1.2},
    26:{item:"torch",tier:0,hard:0.2}
  };

  var ITEMS = {
    dirt:{n:"Dirt",t:2}, cobble:{n:"Cobblestone",t:3}, coal:{n:"Coal",t:8},
    iron_raw:{n:"Raw Iron",t:9}, gold_raw:{n:"Raw Gold",t:10},
    iron_ingot:{n:"Iron Ingot",s:"ingot",c:"#D8D8DE"},
    gold_ingot:{n:"Gold Ingot",s:"ingot",c:"#E8C44A"},
    redstone:{n:"Redstone",t:11}, diamond:{n:"Diamond",t:12},
    amethyst:{n:"Amethyst",t:13}, copper:{n:"Copper",t:15},
    emerald:{n:"Emerald",t:16}, glowstone:{n:"Glowstone",t:17},
    log:{n:"Log",t:18}, sapling:{n:"Leaves",t:19}, brick:{n:"Stone Bricks",t:20},
    obsidian:{n:"Obsidian",t:23},
    plank:{n:"Planks",t:18}, stick:{n:"Stick",s:"stick"},
    table:{n:"Crafting Table",t:24,place:TABLE},
    furnace:{n:"Furnace",t:25,place:FURNACE},
    torch:{n:"Torch",t:26,place:TORCH},
    pick_wood:{n:"Wooden Pickaxe",s:"pick",c:"#8A6440"},
    pick_stone:{n:"Stone Pickaxe",s:"pick",c:"#7E7E86"},
    pick_iron:{n:"Iron Pickaxe",s:"pick",c:"#D8D8DE"},
    pick_gold:{n:"Golden Pickaxe",s:"pick",c:"#E8C44A"},
    pick_diamond:{n:"Diamond Pickaxe",s:"pick",c:"#4FD6D0"},
    helm_iron:{n:"Iron Helmet",s:"helm",c:"#D8D8DE"},
    chest_iron:{n:"Iron Chestplate",s:"chest",c:"#D8D8DE"},
    legs_iron:{n:"Iron Leggings",s:"legs",c:"#D8D8DE"},
    boots_iron:{n:"Iron Boots",s:"boots",c:"#D8D8DE"},
    helm_gold:{n:"Golden Helmet",s:"helm",c:"#E8C44A"},
    chest_gold:{n:"Golden Chestplate",s:"chest",c:"#E8C44A"},
    legs_gold:{n:"Golden Leggings",s:"legs",c:"#E8C44A"},
    boots_gold:{n:"Golden Boots",s:"boots",c:"#E8C44A"},
    helm_diamond:{n:"Diamond Helmet",s:"helm",c:"#4FD6D0"},
    chest_diamond:{n:"Diamond Chestplate",s:"chest",c:"#4FD6D0"},
    legs_diamond:{n:"Diamond Leggings",s:"legs",c:"#4FD6D0"},
    boots_diamond:{n:"Diamond Boots",s:"boots",c:"#4FD6D0"}
  };

  /* Golden tools mine fast but gate low, same as the real game. */
  var PICK_TIER = {pick_wood:1, pick_stone:2, pick_gold:1, pick_iron:3, pick_diamond:4};

  var ARMOUR = {
    helm_iron:{slot:"helm",pts:2}, chest_iron:{slot:"chest",pts:6},
    legs_iron:{slot:"legs",pts:5}, boots_iron:{slot:"boots",pts:2},
    helm_gold:{slot:"helm",pts:2}, chest_gold:{slot:"chest",pts:5},
    legs_gold:{slot:"legs",pts:3}, boots_gold:{slot:"boots",pts:1},
    helm_diamond:{slot:"helm",pts:3}, chest_diamond:{slot:"chest",pts:8},
    legs_diamond:{slot:"legs",pts:6}, boots_diamond:{slot:"boots",pts:3}
  };

  /* Shaped recipes, laid out as they are in the game. "shapeless" means the
     ingredients just have to be present. grid 2 fits the inventory square;
     grid 3 needs a crafting table. */
  var RECIPES = [
    {out:"plank", n:4, grid:2, shapeless:{log:1}},
    {out:"stick", n:4, grid:2, shape:["X","X"], key:{X:"plank"}},
    {out:"table", n:1, grid:2, shape:["XX","XX"], key:{X:"plank"}},
    {out:"torch", n:4, grid:2, shape:["C","S"], key:{C:"coal", S:"stick"}},

    {out:"furnace", n:1, grid:3, shape:["XXX","X X","XXX"], key:{X:"cobble"}},

    {out:"pick_wood",    n:1, grid:3, shape:["XXX"," S "," S "], key:{X:"plank", S:"stick"}},
    {out:"pick_stone",   n:1, grid:3, shape:["XXX"," S "," S "], key:{X:"cobble", S:"stick"}},
    {out:"pick_gold",    n:1, grid:3, shape:["XXX"," S "," S "], key:{X:"gold_ingot", S:"stick"}},
    {out:"pick_iron",    n:1, grid:3, shape:["XXX"," S "," S "], key:{X:"iron_ingot", S:"stick"}},
    {out:"pick_diamond", n:1, grid:3, shape:["XXX"," S "," S "], key:{X:"diamond", S:"stick"}},

    {out:"helm_iron",  n:1, grid:3, shape:["XXX","X X"], key:{X:"iron_ingot"}},
    {out:"chest_iron", n:1, grid:3, shape:["X X","XXX","XXX"], key:{X:"iron_ingot"}},
    {out:"legs_iron",  n:1, grid:3, shape:["XXX","X X","X X"], key:{X:"iron_ingot"}},
    {out:"boots_iron", n:1, grid:3, shape:["X X","X X"], key:{X:"iron_ingot"}},

    {out:"helm_gold",  n:1, grid:3, shape:["XXX","X X"], key:{X:"gold_ingot"}},
    {out:"chest_gold", n:1, grid:3, shape:["X X","XXX","XXX"], key:{X:"gold_ingot"}},
    {out:"legs_gold",  n:1, grid:3, shape:["XXX","X X","X X"], key:{X:"gold_ingot"}},
    {out:"boots_gold", n:1, grid:3, shape:["X X","X X"], key:{X:"gold_ingot"}},

    {out:"helm_diamond",  n:1, grid:3, shape:["XXX","X X"], key:{X:"diamond"}},
    {out:"chest_diamond", n:1, grid:3, shape:["X X","XXX","XXX"], key:{X:"diamond"}},
    {out:"legs_diamond",  n:1, grid:3, shape:["XXX","X X","X X"], key:{X:"diamond"}},
    {out:"boots_diamond", n:1, grid:3, shape:["X X","X X"], key:{X:"diamond"}}
  ];

  /* Crafting bench state: what is sitting in the grid, and what is on the
     cursor after picking a stack up. */
  var craft = { size: 2, cells: [null, null, null, null] };
  var held = null;

  function resizeCraft(size) {
    returnCraft();
    craft.size = size;
    craft.cells = new Array(size * size).fill(null);
  }

  /* Never swallow items: anything left in the grid goes back to the player. */
  function returnCraft() {
    if (!craft.cells) { return; }
    craft.cells.forEach(function (id) { if (id) { give(id, 1); } });
    craft.cells = new Array(craft.size * craft.size).fill(null);
    if (held) { give(held, 1); held = null; }
    save();
  }

  /* Shape matching: trim to the bounding box so a recipe can sit anywhere
     in the grid, exactly like the real thing. */
  function matchRecipe() {
    var n = craft.size, filled = [];
    for (var i = 0; i < craft.cells.length; i++) {
      if (craft.cells[i]) { filled.push({ x: i % n, y: (i / n) | 0, id: craft.cells[i] }); }
    }
    if (!filled.length) { return null; }

    var minX = 9, maxX = -1, minY = 9, maxY = -1;
    filled.forEach(function (c) {
      if (c.x < minX) { minX = c.x; } if (c.x > maxX) { maxX = c.x; }
      if (c.y < minY) { minY = c.y; } if (c.y > maxY) { maxY = c.y; }
    });
    var w = maxX - minX + 1, hgt = maxY - minY + 1;

    for (var r = 0; r < RECIPES.length; r++) {
      var rec = RECIPES[r];
      if (rec.grid > n) { continue; }

      if (rec.shapeless) {
        var have = {};
        filled.forEach(function (c) { have[c.id] = (have[c.id] || 0) + 1; });
        var ok = Object.keys(rec.shapeless).length === Object.keys(have).length;
        for (var k in rec.shapeless) { if (have[k] !== rec.shapeless[k]) { ok = false; } }
        if (ok) { return rec; }
        continue;
      }

      if (rec.shape.length !== hgt || rec.shape[0].length !== w) { continue; }
      var good = true;
      for (var y = 0; y < hgt && good; y++) {
        for (var x = 0; x < w && good; x++) {
          var ch = rec.shape[y][x];
          var want = ch === " " ? null : rec.key[ch];
          var got = craft.cells[(minY + y) * n + (minX + x)];
          if (want !== got) { good = false; }
        }
      }
      if (good) { return rec; }
    }
    return null;
  }

  /* Only ores smelt. Diamond, emerald and redstone drop finished. */
  var SMELT = { iron_raw:"iron_ingot", gold_raw:"gold_ingot" };
  var FUEL  = { coal:8, log:2, plank:1 };   /* items smelted per unit */

  var S = {inv:{}, equip:{helm:null,chest:null,legs:null,boots:null}, mined:0, burn:0};
  try {
    var raw = localStorage.getItem(SAVE);
    if (raw) { S = Object.assign(S, JSON.parse(raw)); }
  } catch (e) { /* private mode: run without persistence */ }
  delete S.edits;                    /* the world is rebuilt fresh on every load */

  function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} }
  function count(id) { return S.inv[id] || 0; }
  function give(id, n) { S.inv[id] = count(id) + (n || 1); }
  function take(id, n) { S.inv[id] = count(id) - n; if (S.inv[id] <= 0) { delete S.inv[id]; } }

  function bestPick() {
    var b = 0;
    for (var k in PICK_TIER) { if (count(k) && PICK_TIER[k] > b) { b = PICK_TIER[k]; } }
    return b;
  }
  function armourPts() {
    var p = 0;
    for (var s in S.equip) { if (S.equip[s]) { p += ARMOUR[S.equip[s]].pts; } }
    return p;
  }

  /* ── Extra block textures owned by this layer ─────────────────────────── */
  (function () {
    var B = W.BLOCK, u = B / 16;
    function make(draw) {
      var c = document.createElement("canvas");
      c.width = c.height = B;
      var g = c.getContext("2d");
      function r(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x * u, y * u, w * u, h * u); }
      draw(r);
      return c;
    }
    W.TEX[TABLE] = make(function (r) {
      r(0, 0, 16, 16, "#7A5327");
      r(0, 0, 16, 3, "#9A6B33");
      r(0, 3, 16, 1, "#5A3D1C");
      r(2, 6, 5, 4, "#4A3218"); r(9, 6, 5, 4, "#4A3218");
      r(2, 11, 5, 3, "#5A3D1C"); r(9, 11, 5, 3, "#5A3D1C");
      r(0, 0, 16, 1, "rgba(255,255,255,.12)"); r(0, 15, 16, 1, "rgba(0,0,0,.35)");
    });
    W.TEX[FURNACE] = make(function (r) {
      r(0, 0, 16, 16, "#55555E");
      r(0, 0, 16, 4, "#63636C");
      r(3, 6, 10, 8, "#25252B");
      r(4, 10, 8, 3, "#E8722C");
      r(5, 11, 6, 2, "#FFC24A");
      r(0, 0, 16, 1, "rgba(255,255,255,.12)"); r(0, 15, 16, 1, "rgba(0,0,0,.35)");
    });
    W.TEX[TORCH] = make(function (r) {
      r(7, 6, 2, 10, "#7A5327");
      r(6, 3, 4, 3, "#FFC24A");
      r(7, 2, 2, 2, "#FFF0A8");
    });
  })();

  /* ── Item icons ───────────────────────────────────────────────────────── */
  function drawItem(cv, id) {
    var it = ITEMS[id];
    if (!it) { return; }
    var g = cv.getContext("2d"), n = cv.width, u = n / 16;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, n, n);
    if (it.t && W.TEX[it.t]) { g.drawImage(W.TEX[it.t], 0, 0, n, n); return; }
    var c = it.c || "#C8A24A";
    function px(x, y, w, hh, col) { g.fillStyle = col; g.fillRect(x * u, y * u, w * u, hh * u); }
    if (it.s === "stick") { px(9,3,2,3,"#8A6440"); px(8,6,2,3,"#8A6440"); px(6,9,2,4,"#8A6440"); return; }
    if (it.s === "ingot") { px(4,7,8,4,c); px(5,6,6,1,c); px(4,11,8,1,"rgba(0,0,0,.28)"); return; }
    if (it.s === "pick") {
      px(9,4,2,3,"#7A5327"); px(8,7,2,3,"#7A5327"); px(6,10,2,4,"#7A5327");
      px(6,2,7,2,c); px(5,3,2,2,c); px(12,3,2,2,c); return;
    }
    if (it.s === "helm") { px(4,3,8,3,c); px(3,5,2,4,c); px(11,5,2,4,c); px(5,6,6,2,c); return; }
    if (it.s === "chest") { px(4,3,8,2,c); px(3,5,10,6,c); px(2,5,2,5,c); px(12,5,2,5,c); return; }
    if (it.s === "legs") { px(4,3,8,3,c); px(4,6,3,7,c); px(9,6,3,7,c); return; }
    if (it.s === "boots") { px(3,8,5,4,c); px(9,8,5,4,c); px(3,12,6,2,c); px(9,12,6,2,c); return; }
  }

  /* ── Steve ────────────────────────────────────────────────────────────── */
  function drawFigure(cv) {
    var g2 = cv.getContext("2d"), u = cv.width / 16;
    g2.imageSmoothingEnabled = false;
    g2.clearRect(0, 0, cv.width, cv.height);
    function r(x, y, w, hh, col) { g2.fillStyle = col; g2.fillRect(x * u, y * u, w * u, hh * u); }
    var SKIN = "#B98D62", SKIN_S = "#9C7350", HAIR = "#33241A", HAIR_S = "#241910";
    var SHIRT = "#00A6A6", SHIRT_S = "#008F8F";
    var PANTS = "#3D3DA6", PANTS_S = "#32328C", SHOE = "#4E4E52";

    r(4, 20, 4, 12, PANTS); r(8, 20, 4, 12, PANTS);
    r(7, 20, 1, 12, PANTS_S); r(11, 20, 1, 12, PANTS_S);
    r(4, 30, 4, 2, SHOE); r(8, 30, 4, 2, SHOE);
    r(0, 8, 4, 7, SHIRT); r(12, 8, 4, 7, SHIRT);
    r(3, 8, 1, 7, SHIRT_S); r(15, 8, 1, 7, SHIRT_S);
    r(0, 15, 4, 5, SKIN); r(12, 15, 4, 5, SKIN);
    r(3, 15, 1, 5, SKIN_S); r(15, 15, 1, 5, SKIN_S);
    r(4, 8, 8, 12, SHIRT); r(11, 8, 1, 12, SHIRT_S); r(4, 19, 8, 1, SHIRT_S);
    r(4, 0, 8, 8, SKIN); r(11, 0, 1, 8, SKIN_S);
    r(4, 0, 8, 2, HAIR); r(4, 2, 1, 3, HAIR); r(11, 2, 1, 3, HAIR); r(4, 0, 8, 1, HAIR_S);
    r(5, 4, 1, 1, "#F2F2F2"); r(6, 4, 1, 1, "#3B3BCF");
    r(9, 4, 1, 1, "#3B3BCF"); r(10, 4, 1, 1, "#F2F2F2");
    r(7, 5, 2, 1, SKIN_S); r(6, 6, 4, 1, "#6E4E35"); r(5, 7, 6, 1, SKIN_S);

    function col(id) { return id ? (ITEMS[id].c || "#D8D8DE") : null; }
    var hc = col(S.equip.helm), cc = col(S.equip.chest),
        lc = col(S.equip.legs), bc = col(S.equip.boots);
    if (hc) {
      r(3, -1, 10, 3, hc); r(3, 2, 2, 4, hc); r(11, 2, 2, 4, hc);
      r(4, 2, 8, 1, hc); r(3, 5, 2, 1, hc); r(11, 5, 2, 1, hc);
    }
    if (cc) {
      r(3, 7, 10, 2, cc); r(4, 9, 8, 8, cc);
      r(0, 9, 4, 5, cc); r(12, 9, 4, 5, cc);
      r(6, 11, 4, 4, "rgba(0,0,0,0.16)");
    }
    if (lc) { r(4, 17, 8, 3, lc); r(4, 20, 4, 6, lc); r(8, 20, 4, 6, lc); }
    if (bc) { r(3, 26, 5, 6, bc); r(8, 26, 5, 6, bc); }
  }

  /* ── World interaction ────────────────────────────────────────────────── */
  var canvas = W.canvas, BLOCK = W.BLOCK;
  var mining = null, hover = null, placing = null;
  var TIERNAME = ["hand", "wooden", "stone", "iron", "diamond"];

  function cellAt(x, y) {
    var r = canvas.getBoundingClientRect();
    var cx = x - r.left, cy = y - r.top;
    if (cx < 0 || cy < 0 || cx > r.width || cy > r.height) { return null; }
    var start = Math.floor(W.rowOffset), sub = (W.rowOffset - start) * BLOCK;
    var gx = Math.floor(cx / BLOCK), gy = start + Math.floor((cy + sub) / BLOCK);
    if (gx < 0 || gx >= W.cols || gy < 0 || gy >= W.ROWS) { return null; }
    return {gx:gx, gy:gy, i:gy * W.cols + gx, sx:gx * BLOCK, sy:(gy - start) * BLOCK - sub};
  }

  function drawHover() {
    if (mining || !hover) { return; }
    var ctx = canvas.getContext("2d");
    ctx.save();
    ctx.strokeStyle = placing ? "#8BE04A" : "#EAE6DC";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.strokeRect(hover.sx + 1, hover.sy + 1, BLOCK - 2, BLOCK - 2);
    ctx.restore();
  }

  /* Outlining the target is the only way to tell solid ground from the air
     that fills most of the screen near the surface. */
  canvas.addEventListener("pointermove", function (e) {
    if (mode !== "play" || mining) { return; }
    var c = cellAt(e.clientX, e.clientY);
    if (!c) { if (hover) { hover = null; W.redraw(); } return; }
    var m = W.grid[c.i];
    var want = placing ? !m : !!m;   /* placing targets air, mining targets solid */
    var next = want ? c : null;
    if ((next && hover && next.i === hover.i) || (!next && !hover)) { return; }
    hover = next;
    W.redraw();
    drawHover();
  });

  canvas.addEventListener("pointerleave", function () {
    if (hover) { hover = null; W.redraw(); }
  });

  function startMine(e) {
    if (mode !== "play") { return; }
    if (e.button !== undefined && e.button !== 0) { return; }
    var c = cellAt(e.clientX, e.clientY);
    if (!c) { return; }
    var m = W.grid[c.i];

    if (placing) {
      if (m) { flash("Something is already there"); return; }
      W.set(c.i, ITEMS[placing].place);
      take(placing, 1);
      flash("Placed " + ITEMS[placing].n);
      if (!count(placing)) { placing = null; }
      save(); W.redraw(); render();
      return;
    }

    if (m === 22) { openChest(c); return; }
    if (m === TABLE) { openScreen("table"); return; }
    if (m === FURNACE) { openScreen("furnace"); return; }
    if (!m) { flash("Nothing to mine there"); return; }

    var def = BLOCKS[m];
    if (!def) {
      if (m === 7) { flash("Bedrock cannot be broken"); }
      else if (m === 14) { flash("Lava cannot be mined"); }
      else { flash("Cannot be mined"); }
      return;
    }
    if (def.tier > bestPick()) { flash("Needs a " + TIERNAME[def.tier] + " pickaxe"); return; }
    mining = {c:c, m:m, t:0, need:def.hard / (1 + bestPick() * 0.8)};
    loop();
  }

  function stopMine() { mining = null; }

  function loop() {
    if (!mining) { W.redraw(); return; }
    mining.t += 1 / 60;
    W.redraw();
    var ctx = canvas.getContext("2d");
    var p = Math.min(1, mining.t / mining.need);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "#0B0C10";
    ctx.lineWidth = 1.5;
    var n = Math.floor(p * 5);
    for (var k = 0; k <= n; k++) {
      var o = (k + 1) / 6 * BLOCK;
      ctx.beginPath();
      ctx.moveTo(mining.c.sx + o, mining.c.sy);
      ctx.lineTo(mining.c.sx + BLOCK - o, mining.c.sy + BLOCK);
      ctx.stroke();
    }
    ctx.strokeStyle = "#EAE6DC"; ctx.lineWidth = 2;
    ctx.strokeRect(mining.c.sx + 1, mining.c.sy + 1, BLOCK - 2, BLOCK - 2);
    ctx.restore();
    if (p >= 1) {
      var def = BLOCKS[mining.m];
      W.set(mining.c.i, W.SKY);
      give(def.item, 1);
      S.mined++;
      flash("+1 " + ITEMS[def.item].n);
      mining = null;
      save(); render(); W.redraw();
      return;
    }
    requestAnimationFrame(loop);
  }

  /* ── Lava animation ──────────────────────────────────────────────────────
     The field itself is drawn by the world renderer as a function of position
     and time, so all this has to do is ask for frames.
     ───────────────────────────────────────────────────────────────────── */
  setInterval(function () {
    if (document.hidden || mining) { return; }
    W.redraw();
    drawHover();
  }, 90);

  /* ── Chests ───────────────────────────────────────────────────────────── */
  var chests = {}, openKey = null;

  function chestAt(c) {
    var key = c.gx + "," + c.gy;
    if (!chests[key]) {
      var seed = c.gx * 7919 + c.gy * 104729;
      function h(n) {
        n = Math.imul(n ^ 61, 0x27d4eb2d); n = n ^ (n >>> 15);
        return ((n >>> 0) % 1000) / 1000;
      }
      var pool = ["iron_raw", "gold_raw", "coal", "diamond", "emerald", "brick", "plank", "stick"];
      var items = {}, slots = 2 + Math.floor(h(seed) * 3);
      for (var i = 0; i < slots; i++) {
        var id = pool[Math.floor(h(seed + i * 13) * pool.length)];
        items[id] = (items[id] || 0) + 1 + Math.floor(h(seed + i * 29) * 3);
      }
      chests[key] = items;
    }
    return chests[key];
  }

  function openChest(c) { openKey = c.gx + "," + c.gy; chestAt(c); openScreen("chest"); }

  addEventListener("pointerup", stopMine);
  addEventListener("pointercancel", stopMine);
  canvas.addEventListener("pointerdown", startMine);

  /* ── Modes ────────────────────────────────────────────────────────────── */
  var MODE_KEY = "strata-mode", mode = "read";
  try { mode = localStorage.getItem(MODE_KEY) || "read"; } catch (e) {}

  function setMode(m, quiet) {
    mode = m;
    document.body.classList.toggle("mode-play", m === "play");
    document.body.classList.toggle("mode-read", m === "read");
    modeBtn.textContent = m === "play" ? "Reading" : "Play";
    try { localStorage.setItem(MODE_KEY, m); } catch (e) {}
    if (m === "play" && !quiet) { flash("Click blocks to mine. Press E for inventory."); }
    if (m !== "play") { hover = null; placing = null; W.redraw(); }
  }

  var modeBtn = document.createElement("button");
  modeBtn.id = "mode-btn";
  modeBtn.type = "button";
  modeBtn.addEventListener("click", function () { setMode(mode === "play" ? "read" : "play"); });
  document.body.appendChild(modeBtn);

  var playHint = document.createElement("div");
  playHint.id = "play-hint";
  playHint.innerHTML = "click a block to mine<br>scroll to descend<br>E for inventory";
  document.body.appendChild(playHint);

  var flashEl = document.createElement("div");
  flashEl.id = "pickup";
  document.body.appendChild(flashEl);
  var flashT = null;
  function flash(msg) {
    flashEl.textContent = msg;
    flashEl.classList.add("in");
    clearTimeout(flashT);
    flashT = setTimeout(function () { flashEl.classList.remove("in"); }, 1800);
  }

  setMode(mode, true);

  /* ── Screen ───────────────────────────────────────────────────────────── */
  var scr = document.createElement("div");
  scr.id = "screen";
  scr.innerHTML = '<div class="scr-box"><div class="scr-head">' +
    '<span id="scr-title">Inventory</span>' +
    '<button class="scr-x" type="button">close</button></div><div class="scr-cols">' +
    '<div id="scr-left"></div>' +
    '<div><div class="scr-t">Player</div><div id="g-prof"></div></div>' +
    '</div></div>';
  document.body.appendChild(scr);
  scr.querySelector(".scr-x").addEventListener("click", closeScreen);
  scr.addEventListener("click", function (e) { if (e.target === scr) { closeScreen(); } });

  var kind = "inv";
  function openScreen(k) { kind = k; scr.classList.add("on"); render(); }
  function closeScreen() { returnCraft(); scr.classList.remove("on"); openKey = null; }

  var openBtn = document.createElement("button");
  openBtn.id = "inv-btn";
  openBtn.type = "button";
  openBtn.innerHTML = "<span>E</span> Inventory";
  openBtn.addEventListener("click", function () { openScreen("inv"); });
  document.body.appendChild(openBtn);

  addEventListener("keydown", function (e) {
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") { return; }
    if (e.key === "e" || e.key === "E") {
      if (scr.classList.contains("on")) { closeScreen(); } else { openScreen("inv"); }
    }
    if (e.key === "Escape") {
      if (placing) { placing = null; flash("Cancelled"); W.redraw(); }
      else { closeScreen(); }
    }
  });

  function slot(id, n, onClick) {
    var d = document.createElement(onClick ? "button" : "div");
    d.className = "islot" + (onClick ? " act" : "");
    if (onClick) { d.type = "button"; d.addEventListener("click", onClick); }
    var cv = document.createElement("canvas");
    cv.width = cv.height = 32;
    d.appendChild(cv);
    if (n) { var b = document.createElement("b"); b.textContent = n; d.appendChild(b); }
    d.setAttribute("data-tip", ITEMS[id] ? ITEMS[id].n : "");
    drawItem(cv, id);
    return d;
  }

  function heading(t) {
    var d = document.createElement("div");
    d.className = "scr-t";
    d.textContent = t;
    return d;
  }

  /* The bench: click a stack to pick it up, click a cell to lay one down,
     click a filled cell to take it back. */
  function craftBench() {
    var wrap = document.createElement("div");
    wrap.className = "bench";

    var grid = document.createElement("div");
    grid.className = "cgrid";
    grid.style.gridTemplateColumns = "repeat(" + craft.size + ", 46px)";

    craft.cells.forEach(function (id, i) {
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cslot" + (id ? " full" : "");
      if (id) {
        var cv = document.createElement("canvas");
        cv.width = cv.height = 32;
        cell.appendChild(cv);
        drawItem(cv, id);
      }
      cell.addEventListener("click", function () {
        if (craft.cells[i]) {
          give(craft.cells[i], 1);
          craft.cells[i] = null;
        } else if (held) {
          craft.cells[i] = held;
          held = null;
        } else {
          flash("Pick an item from your inventory first");
          return;
        }
        save(); render();
      });
      grid.appendChild(cell);
    });
    wrap.appendChild(grid);

    var arrow = document.createElement("div");
    arrow.className = "carrow";
    arrow.textContent = "->";
    wrap.appendChild(arrow);

    var rec = matchRecipe();
    var out = document.createElement("button");
    out.type = "button";
    out.className = "cout" + (rec ? " ready" : "");
    out.disabled = !rec;
    if (rec) {
      var ocv = document.createElement("canvas");
      ocv.width = ocv.height = 40;
      out.appendChild(ocv);
      drawItem(ocv, rec.out);
      if (rec.n > 1) {
        var b = document.createElement("b");
        b.textContent = rec.n;
        out.appendChild(b);
      }
      out.setAttribute("data-tip", ITEMS[rec.out].n);
      out.addEventListener("click", function () {
        for (var i = 0; i < craft.cells.length; i++) { craft.cells[i] = null; }
        give(rec.out, rec.n);
        flash("Crafted " + ITEMS[rec.out].n + (rec.n > 1 ? " x" + rec.n : ""));
        save(); render();
      });
    }
    wrap.appendChild(out);
    return wrap;
  }

  /* A reference card so the shapes are discoverable rather than guesswork. */
  function recipeBook(gridSize) {
    var wrap = document.createElement("div");
    wrap.className = "book";
    RECIPES.filter(function (r) { return r.grid <= gridSize; }).forEach(function (r) {
      var card = document.createElement("div");
      card.className = "bcard";

      var mini = document.createElement("div");
      mini.className = "mini";
      var rows = r.shapeless ? ["X"] : r.shape;
      var cols = rows[0].length;
      mini.style.gridTemplateColumns = "repeat(" + cols + ", 15px)";
      rows.forEach(function (row) {
        for (var x = 0; x < cols; x++) {
          var ch = row[x];
          var id = r.shapeless ? Object.keys(r.shapeless)[0]
                 : (ch === " " ? null : r.key[ch]);
          var d = document.createElement("div");
          d.className = "mcell";
          if (id) {
            var cv = document.createElement("canvas");
            cv.width = cv.height = 16;
            d.appendChild(cv);
            drawItem(cv, id);
            d.setAttribute("data-tip", ITEMS[id].n);
          }
          mini.appendChild(d);
        }
      });
      card.appendChild(mini);

      var lab = document.createElement("div");
      lab.className = "blab";
      lab.innerHTML = "<b>" + ITEMS[r.out].n + (r.n > 1 ? " x" + r.n : "") + "</b>";
      card.appendChild(lab);
      wrap.appendChild(card);
    });
    return wrap;
  }

  function render() {
    var left = document.getElementById("scr-left");
    if (!left) { return; }
    var title = document.getElementById("scr-title");
    left.innerHTML = "";

    if (kind === "chest") {
      title.textContent = "Chest";
      var items = chests[openKey] || {};
      left.appendChild(heading("Contents"));
      var grid = document.createElement("div");
      grid.className = "inv-grid";
      var ks = Object.keys(items);
      if (!ks.length) { grid.innerHTML = '<p class="empty">Empty.</p>'; }
      ks.forEach(function (k) {
        grid.appendChild(slot(k, items[k], function () {
          give(k, items[k]);
          flash("+" + items[k] + " " + ITEMS[k].n);
          delete items[k];
          save(); render();
        }));
      });
      left.appendChild(grid);
      var hint = document.createElement("p");
      hint.className = "empty";
      hint.textContent = "Click a stack to take it. Close the chest to leave the rest.";
      left.appendChild(hint);

    } else {
      title.textContent = kind === "table" ? "Crafting Table"
        : kind === "furnace" ? "Furnace" : "Inventory";

      left.appendChild(heading("Items"));
      var inv = document.createElement("div");
      inv.className = "inv-grid";
      var keys = Object.keys(S.inv);
      if (!keys.length) {
        inv.innerHTML = '<p class="empty">Empty. Click blocks in the world to mine them. ' +
          "Dirt, wood and leaves need no tool; stone needs a wooden pickaxe.</p>";
      }
      keys.forEach(function (k) {
        inv.appendChild(slot(k, S.inv[k], function () {
          if (held) { give(held, 1); }
          held = k;
          take(k, 1);
          save(); render();
        }));
      });

      if (held) {
        var hc = document.createElement("div");
        hc.className = "held";
        var hcv = document.createElement("canvas");
        hcv.width = hcv.height = 24;
        hc.appendChild(hcv);
        drawItem(hcv, held);
        var ht = document.createElement("span");
        ht.textContent = "Holding " + ITEMS[held].n + " - click a crafting cell";
        hc.appendChild(ht);
        var hb = document.createElement("button");
        hb.type = "button";
        hb.textContent = "put back";
        hb.addEventListener("click", function () { give(held, 1); held = null; save(); render(); });
        hc.appendChild(hb);
        if (ITEMS[held].place) {
          var pb = document.createElement("button");
          pb.type = "button";
          pb.textContent = "place in world";
          pb.addEventListener("click", function () {
            placing = held; give(held, 1); held = null; save();
            closeScreen();
            flash("Click empty space to place the " + ITEMS[placing].n + ". Esc to cancel.");
          });
          hc.appendChild(pb);
        }
        left.appendChild(hc);
      }
      left.appendChild(inv);

      if (kind === "furnace") {
        left.appendChild(heading("Smelting"));
        var fuelTotal = S.burn;
        for (var fk in FUEL) { fuelTotal += count(fk) * FUEL[fk]; }
        var note = document.createElement("p");
        note.className = "empty";
        note.innerHTML = "Fuel available: <b>" + fuelTotal +
          "</b> smelts. Coal burns 8, a log 2, a plank 1.";
        left.appendChild(note);

        Object.keys(SMELT).forEach(function (ore) {
          var row = document.createElement("div");
          var ready = count(ore) > 0 && fuelTotal > 0;
          row.className = "recipe" + (ready ? " ok" : "");
          var cv = document.createElement("canvas");
          cv.width = cv.height = 32;
          row.appendChild(cv);
          drawItem(cv, SMELT[ore]);
          var t = document.createElement("div");
          t.innerHTML = "<b>" + ITEMS[SMELT[ore]].n + "</b><span>" +
            '<span class="' + (count(ore) ? "has" : "lacks") + '">1x ' + ITEMS[ore].n + "</span> " +
            '<span class="' + (fuelTotal > 0 ? "has" : "lacks") + '">+ fuel</span></span>';
          row.appendChild(t);
          var b = document.createElement("button");
          b.type = "button";
          b.textContent = "Smelt";
          b.disabled = !ready;
          b.addEventListener("click", function () {
            if (S.burn <= 0) {
              var used = null;
              for (var fk2 in FUEL) { if (count(fk2)) { used = fk2; break; } }
              if (!used) { flash("No fuel"); return; }
              take(used, 1);
              S.burn = FUEL[used];
            }
            S.burn--;
            take(ore, 1);
            give(SMELT[ore], 1);
            flash("Smelted 1 " + ITEMS[SMELT[ore]].n);
            save(); render();
          });
          row.appendChild(b);
          left.appendChild(row);
        });
      }

      var gridSize = kind === "table" ? 3 : 2;
      if (craft.size !== gridSize) { resizeCraft(gridSize); }
      left.appendChild(heading(gridSize === 3 ? "Crafting  3 x 3" : "Crafting  2 x 2"));
      left.appendChild(craftBench());
      left.appendChild(heading("Recipes"));
      left.appendChild(recipeBook(gridSize));

      if (gridSize === 2) {
        var n2 = document.createElement("p");
        n2.className = "empty";
        n2.textContent = "Only small recipes fit in your inventory square. " +
          "Craft a Crafting Table, click it in your inventory to hold it, " +
          "place it in the world, then click it for the full 3 x 3 grid.";
        left.appendChild(n2);
      }
    }

    var pf = document.getElementById("g-prof");
    pf.innerHTML =
      '<div class="fig-wrap"><canvas id="g-fig" width="128" height="256"></canvas></div>' +
      '<div class="stat"><span>Pickaxe</span><b>' +
        ["Fists", "Wooden", "Stone", "Iron", "Diamond"][bestPick()] + "</b></div>" +
      '<div class="stat"><span>Blocks mined</span><b>' + S.mined + "</b></div>" +
      '<div class="stat"><span>Armour</span><b>' + armourPts() + " pts</b></div>" +
      '<div class="armour" id="g-arm"></div>' +
      '<button class="wipe" id="g-wipe" type="button">Reset progress</button>';

    drawFigure(document.getElementById("g-fig"));

    var arm = document.getElementById("g-arm");
    ["helm", "chest", "legs", "boots"].forEach(function (sl) {
      var wrap = document.createElement("div");
      wrap.className = "arm-row";
      var lab = document.createElement("span");
      lab.textContent = sl;
      wrap.appendChild(lab);

      var cur = S.equip[sl];
      var box = document.createElement("div");
      box.className = "arm-slot" + (cur ? " filled" : "");
      if (cur) {
        var cv2 = document.createElement("canvas");
        cv2.width = cv2.height = 28;
        box.appendChild(cv2);
        drawItem(cv2, cur);
        box.title = "Unequip";
        box.addEventListener("click", function () {
          give(cur, 1); S.equip[sl] = null; save(); render();
        });
      }
      wrap.appendChild(box);

      Object.keys(ARMOUR).forEach(function (id) {
        if (ARMOUR[id].slot !== sl || !count(id)) { return; }
        var b2 = document.createElement("button");
        b2.type = "button";
        b2.className = "equip";
        b2.textContent = "Equip " + ITEMS[id].n.split(" ")[0];
        b2.addEventListener("click", function () {
          if (S.equip[sl]) { give(S.equip[sl], 1); }
          take(id, 1);
          S.equip[sl] = id;
          save(); render();
        });
        wrap.appendChild(b2);
      });
      arm.appendChild(wrap);
    });

    document.getElementById("g-wipe").addEventListener("click", function () {
      try { localStorage.removeItem(SAVE); } catch (e) {}
      location.reload();
    });
  }

  render();
})();
