/* ──────────────────────────────────────────
   MH Wilds Stat Tracker — app logic
   Fully client-side: intake (paste / drop / linked
   file), validation, IndexedDB + localStorage
   persistence, URL-fragment sharing, rendering.
   ────────────────────────────────────────── */

(function () {
  "use strict";

  var DATA  = window.MHW_DATA;
  var $  = function (id) { return document.getElementById(id); };

  /* ── DOM refs ── */
  var els = {
    paste:        $("intake-paste"),
    btnPaste:     $("btn-paste-load"),
    dropZone:     $("drop-zone"),
    fileInput:    $("file-input"),
    btnSavedFile: $("btn-saved-file"),
    btnSavedReload: $("btn-saved-reload"),
    savedNote:    $("saved-file-note"),
    btnSample:    $("btn-sample"),
    status:       $("intake-status"),
    roster:       $("roster"),
    rosterList:   $("roster-list"),
    dashboard:    $("dashboard"),
    shareName:    $("share-name"),
    shareDate:    $("share-date"),
    btnCopyLink:  $("btn-copy-link"),
    btnDownload:  $("btn-download-json"),
    btnForget:    $("btn-forget"),
    deltaCard:    $("delta-card"),
    deltaContent: $("delta-content"),
    statHr:       $("stat-hr"),
    statHrLabel:  $("stat-hr-label"),
    statPlaytime: $("stat-playtime"),
    statQuests:   $("stat-quests"),
    statHunts:    $("stat-hunts"),
    statCrowns:   $("stat-crowns"),
    statGuild:    $("stat-guild"),
    statZenny:    $("stat-zenny"),
    questChart:   $("quest-chart"),
    questSummary: $("quest-summary"),
    questDonut:   $("quest-donut"),
    weaponChart:  $("weapon-chart"),
    weaponDonut:  $("weapon-donut"),
    logRings:     $("log-rings"),
    sortSelect:   $("sort-select"),
    monsterGrid:  $("monster-grid"),
    monsterModal: $("monster-modal"),
    modalBody:    $("modal-body"),
    modalClose:   $("modal-close"),
    weaponSummary: $("weapon-summary"),
    btnViewMain: $("weapon-view-main"),
    btnViewSub:  $("weapon-view-sub"),
    shareStatus: $("share-status"),
    qrPanel:     $("qr-panel"),
    qrCanvas:    $("qr-canvas"),
    qrName:      $("qr-name"),
    qrClose:     $("qr-close")
  };

  var LS_ROSTER = "mhw.roster.v1";
  var LS_SNAP_PREFIX = "mhw.snapshots.v1.";
  var IDB_NAME = "mhw-tracker";
  var IDB_STORE = "kv";

  var current = null;   // { id, data }
  var lastPrevSnap = null; // previous snapshot of current hunter (for "recent" sort)
  var weaponViewMode = "main"; // "main" | "sub" — weapon usage bar view

  /* ════════════════════════════════════════
     Formatting helpers
     ════════════════════════════════════════ */

  function fmtInt(n) {
    return (typeof n === "number" && isFinite(n)) ? n.toLocaleString("en-US") : "–";
  }

  function fmtPlaytime(sec) {
    if (typeof sec !== "number" || !isFinite(sec) || sec < 0) return "–";
    var h = Math.floor(sec / 3600);
    var m = Math.round((sec % 3600) / 60);
    return h > 0 ? h + "h " + m + "m" : m + "m";
  }

  function fmtSize(v) {
    return (typeof v === "number" && isFinite(v)) ? v.toFixed(2) : "–";
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleString();
  }

  /* ════════════════════════════════════════
     Schema validation ("mhw-stats/1")
     ════════════════════════════════════════ */

  function isNum(v) { return typeof v === "number" && isFinite(v) && v >= 0; }

  function validateExport(obj) {
    var errors = [];
    if (!obj || typeof obj !== "object") {
      return { ok: false, errors: ["Not a JSON object."] };
    }
    if (obj.schema !== DATA.schemaVersion) {
      errors.push('Unknown schema "' + (obj.schema || "(missing)") +
        '" — expected "' + DATA.schemaVersion + '".');
    }
    if (!obj.hunter || typeof obj.hunter !== "object") {
      errors.push("Missing hunter block.");
    } else {
      if (typeof obj.hunter.name !== "string" || !obj.hunter.name.trim()) {
        errors.push("Hunter name missing.");
      }
      ["hr", "hr_points", "playtime_sec", "guild_points", "zenny"].forEach(function (k) {
        if (obj.hunter[k] !== undefined && !isNum(obj.hunter[k])) {
          errors.push('hunter.' + k + " must be a non-negative number.");
        }
      });
      if (obj.hunter.short_id !== undefined && typeof obj.hunter.short_id !== "string") {
        errors.push("hunter.short_id must be a string.");
      }
    }
    if (obj.quests) {
      if (!isNum(obj.quests.total_completed)) {
        errors.push("quests.total_completed must be a non-negative number.");
      }
      if (obj.quests.categories && typeof obj.quests.categories === "object") {
        Object.keys(obj.quests.categories).forEach(function (slug) {
          if (!DATA.questCategoryBySlug[slug]) errors.push('Unknown quest category "' + slug + '".');
          else if (!isNum(obj.quests.categories[slug])) errors.push("quests.categories." + slug + " must be a number.");
        });
      }
    }
    if (obj.weapons && typeof obj.weapons === "object") {
      Object.keys(obj.weapons).forEach(function (slug) {
        var w = obj.weapons[slug];
        if (!DATA.weaponBySlug[slug]) { errors.push('Unknown weapon slug "' + slug + '".'); return; }
        if (!w || typeof w !== "object") { errors.push("weapons." + slug + " must be an object."); return; }
        ["main", "sub"].forEach(function (k) {
          if (w[k] !== undefined && !isNum(w[k])) errors.push("weapons." + slug + "." + k + " must be a number.");
        });
      });
    }
    if (obj.monsters && typeof obj.monsters === "object") {
      Object.keys(obj.monsters).forEach(function (slug) {
        var m = obj.monsters[slug];
        if (!DATA.monsterBySlug[slug]) { errors.push('Unknown monster slug "' + slug + '".'); return; }
        if (!m || typeof m !== "object") { errors.push('monsters.' + slug + " must be an object."); return; }
        ["slain", "captured", "min_pct", "max_pct"].forEach(function (k) {
          if (m[k] !== undefined && !isNum(m[k])) errors.push("monsters." + slug + "." + k + " must be a number.");
        });
      });
    }
    return { ok: errors.length === 0, errors: errors };
  }

  /* ════════════════════════════════════════
     Persistence — roster & snapshots (localStorage)
     ════════════════════════════════════════ */

  function loadRoster() {
    try { return JSON.parse(localStorage.getItem(LS_ROSTER)) || []; }
    catch (e) { return []; }
  }
  function saveRoster(list) {
    try { localStorage.setItem(LS_ROSTER, JSON.stringify(list)); } catch (e) {}
  }
  function rosterUpsert(id, data) {
    var list = loadRoster();
    var entry = {
      id: id,
      name: data.hunter.name,
      hr: isNum(data.hunter.hr) ? data.hunter.hr : null,
      savedAt: new Date().toISOString(),
      data: data
    };
    var i = list.findIndex(function (r) { return r.id === id; });
    if (i >= 0) list[i] = entry; else list.push(entry);
    saveRoster(list);
  }
  function rosterRemove(id) {
    saveRoster(loadRoster().filter(function (r) { return r.id !== id; }));
    try { localStorage.removeItem(LS_SNAP_PREFIX + id); } catch (e) {}
  }

  function loadSnapshots(id) {
    try { return JSON.parse(localStorage.getItem(LS_SNAP_PREFIX + id)) || []; }
    catch (e) { return []; }
  }
  function pushSnapshot(id, snap) {
    var snaps = loadSnapshots(id);
    snaps.push(snap);
    if (snaps.length > 50) snaps = snaps.slice(snaps.length - 50);
    try { localStorage.setItem(LS_SNAP_PREFIX + id, JSON.stringify(snaps)); } catch (e) {}
  }

  /* ════════════════════════════════════════
     Persistence — linked file handle (IndexedDB)
     ════════════════════════════════════════ */

  function idbOpen() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(IDB_STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function idbSet(key, value) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put(value, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }
  function idbGet(key) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(key);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  /* ════════════════════════════════════════
     Share-link encoding (URL fragment)
     Format: #d=1.<base64url(deflate-raw(json))>
     Fallback: #d=0.<base64url(json)>
     ════════════════════════════════════════ */

  function bytesToB64url(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlToBytes(str) {
    var b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function pipeThrough(bytes, stream) {
    return new Response(
      new Blob([bytes]).stream().pipeThrough(stream)
    ).arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
  }

  function encodeShare(data) {
    var jsonBytes = new TextEncoder().encode(JSON.stringify(data));
    if ("CompressionStream" in window) {
      return pipeThrough(jsonBytes, new CompressionStream("deflate-raw"))
        .then(function (packed) {
          var url = location.origin + location.pathname + "#d=1." + bytesToB64url(packed);
          /* If compression didn't help (tiny payload), use raw form. */
          var rawUrl = location.origin + location.pathname + "#d=0." + bytesToB64url(jsonBytes);
          return url.length <= rawUrl.length ? url : rawUrl;
        })
        .catch(function () {
          return location.origin + location.pathname + "#d=0." + bytesToB64url(jsonBytes);
        });
    }
    return Promise.resolve(location.origin + location.pathname + "#d=0." + bytesToB64url(jsonBytes));
  }

  function decodeShare(fragment) {
    /* fragment like "#d=1...." or "#d=0...." */
    var m = /^#d=([01])\.(.+)$/.exec(fragment || "");
    if (!m) return Promise.reject(new Error("No shared data in this link."));
    var bytes;
    try { bytes = b64urlToBytes(m[2]); }
    catch (e) { return Promise.reject(new Error("Shared data is corrupted.")); }
    var done = function (buf) {
      try { return JSON.parse(new TextDecoder().decode(buf)); }
      catch (e) { throw new Error("Shared data is not valid JSON."); }
    };
    if (m[1] === "1") {
      if (!("DecompressionStream" in window)) {
        return Promise.reject(new Error("This link was compressed; your browser can't decompress it."));
      }
      return pipeThrough(bytes, new DecompressionStream("deflate-raw")).then(done);
    }
    return Promise.resolve(done(bytes));
  }

  /* ════════════════════════════════════════
     Stats computation
     ════════════════════════════════════════ */

  /* Crowns & sizes are derived from size-percent records
     plus the per-monster tables in mhw-data.js. */
  function crownsOf(slug, m) {
    var ref = DATA.monsterBySlug[slug];
    var c = { mini: false, silver: false, gold: false };
    if (!ref || !m) return c;
    if (isNum(m.min_pct) && (m.slain > 0 || m.captured > 0)) c.mini = m.min_pct <= ref.crowns.mini;
    if (isNum(m.max_pct)) {
      c.gold   = m.max_pct >= ref.crowns.gold;
      c.silver = !c.gold && m.max_pct >= ref.crowns.silver;
    }
    return c;
  }

  function sizeCm(slug, pct) {
    var ref = DATA.monsterBySlug[slug];
    if (!ref || !isNum(ref.baseSize) || !isNum(pct)) return null;
    return Math.round(ref.baseSize * pct) / 100;
  }

  function computeTotals(data) {
    var t = { quests: 0, hunts: 0, caps: 0, crownsSmall: 0, crownsLarge: 0, crownsSilver: 0 };
    if (data.quests && isNum(data.quests.total_completed)) t.quests = data.quests.total_completed;
    var mons = data.monsters || {};
    Object.keys(mons).forEach(function (slug) {
      var m = mons[slug] || {};
      /* A capture completes a hunt too: total hunts = slain + captured. */
      var s = isNum(m.slain) ? m.slain : 0;
      var c = isNum(m.captured) ? m.captured : 0;
      t.hunts += s + c;
      t.caps  += c;
      var cr = crownsOf(slug, m);
      if (cr.mini)   t.crownsSmall++;
      if (cr.gold)   t.crownsLarge++;
      if (cr.silver) t.crownsSilver++;
    });
    return t;
  }

  function makeSnapshot(data) {
    var mons = {};
    Object.keys(data.monsters || {}).forEach(function (slug) {
      var m = data.monsters[slug] || {};
      var c = crownsOf(slug, m);
      mons[slug] = {
        h: (m.slain || 0) + (m.captured || 0),
        cs: c.mini,
        cl: c.gold
      };
    });
    return { t: new Date().toISOString(), totals: computeTotals(data), monsters: mons };
  }

  /* ════════════════════════════════════════
     Chart assets — weapon icons, palette, helpers
     ════════════════════════════════════════ */

  var SVG_HEAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  function ico(inner) { return SVG_HEAD + inner + "</svg>"; }
  function fp(d) { return '<path d="' + d + '" fill="currentColor" stroke="none"/>'; }

  /* Minimal 24×24 silhouettes for the 14 weapon types. */
  var WEAPON_ICONS = {
    great_sword:      ico(fp("M13.5 3.5H20V10l-8.5 8.5-3-3z") + '<path d="M4.5 19.5 9 15"/><path d="M7.8 13.2l3 3"/>'),
    sword_and_shield: ico('<path d="M4 16.5 13 7.5"/><path d="M6.4 11.9l2.2 2.2"/><path d="M15.6 10.8h4.1v3.4c0 2.9-2.05 4.2-2.05 4.2s-2.05-1.3-2.05-4.2z"/>'),
    dual_blades:      ico('<path d="M5 19.5 11 13"/><path d="M19 19.5 13 13"/>' + fp("M9 4.5l2.7 5.9-2.4.6z") + fp("M15 4.5l-2.7 5.9 2.4.6z")),
    long_sword:       ico('<path d="M5.5 18.5C10 14 14.5 9.5 19.5 4.5"/><path d="M5.5 18.5 3.5 20.5"/><path d="M6.6 16.4l2 2"/>'),
    hammer:           ico(fp("M12 4.5 19.5 7l-1.7 6.5-7.2-2.5z") + '<path d="M4.5 19.5 12.5 11.5"/>'),
    hunting_horn:     ico(fp("M11 5l8 8-4 4-8-8z") + '<path d="M4 15.5 11 8.5"/><circle cx="5.8" cy="19.2" r="1.15" fill="currentColor" stroke="none"/><path d="M6.95 18.3v-2.9"/>'),
    lance:            ico('<path d="M3.5 20.5 13.5 10.5"/>' + fp("M14 4.5 19.5 10l-6 .5z") + '<circle cx="7" cy="17" r="2.4"/>'),
    gunlance:         ico('<path d="M3.5 20.5 11.5 12.5"/>' + fp("M11 8.5 15.5 4l4.5 4.5-4.5 4.5z") + '<path d="M19.5 2.5 21 1"/><path d="M21.5 6.5 23 5"/><path d="M21.8 10.8l1.9.2"/>'),
    switch_axe:       ico('<path d="M4.5 19.5 12 12"/>' + fp("M11.5 3.5c5.8 0 9.5 3.8 9.5 9.5-4.7 0-9.5-3.8-9.5-9.5z") + '<circle cx="11.4" cy="12.6" r="1.25" fill="currentColor" stroke="none"/>'),
    charge_blade:     ico('<path d="M4.5 19.5 10.5 13.5"/><path d="M8.5 12.5l2.5 2.5"/>' + fp("M10 9l3-6.5L19.5 9 16 12.5z")),
    insect_glaive:    ico('<path d="M4 20 16 8"/>' + fp("M16 8l1-6 5 5-6 1z") + '<circle cx="16.5" cy="16.5" r="1.3" fill="currentColor" stroke="none"/><path d="M15.2 15.2 13.6 13.9"/><path d="M17.8 17.8l1.6 1.3"/>'),
    bow:              ico('<path d="M7.5 3.5c7 3.5 7 13.5 0 17"/><path d="M7.5 3.5v17"/><path d="M7.5 12H20"/><path d="M17.2 9.2 20.6 12l-3.4 2.8"/><path d="M10.5 10.4 8.3 12l2.2 1.6"/>'),
    heavy_bowgun:     ico(fp("M3 9.5h13v5H3z") + fp("M17.5 8h2.6v8h-2.6z") + fp("M6.5 14.5 5 20.5h3.6l1.4-6z") + fp("M9 5.8h4.6v2.6H9z") + fp("M10.6 8.4h1.4v1.1h-1.4z")),
    light_bowgun:     ico(fp("M3 10.2h12.5v3.4H3z") + fp("M15.5 10.9H20v2h-4.5z") + fp("M6 13.6 4.6 19h3.2l1.2-5.4z") + fp("M11.5 13.6v3.2h2v-3.2z"))
  };

  /* Categorical palette — violet first (theme), then distinct hues. */
  var PALETTE = ["#a78bfa", "#f0913f", "#e4645f", "#f472b6", "#f7d154", "#60a5fa", "#45d0c0", "#b8e356"];
  var OTHER_COLOR = "rgba(240,240,245,0.3)";

  var QUEST_ICONS = {
    assignments: "❗", optional: "📋", field_survey: "🧭", arena: "⚔️",
    investigations: "🔍", event: "🎪", free_challenge: "🏁", challenge: "🏆"
  };

  function hexRgb(hex) {
    var h = hex.replace("#", "");
    return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16) };
  }
  function tint(color, a) {
    if (color.charAt(0) !== "#") return color;
    var c = hexRgb(color);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }

  /* Bars render at size 0, then grow to their target on the next frames.
     data-w animates width (horizontal bars), data-h animates height (columns). */
  function animateGrow(container) {
    var fills = container.querySelectorAll("[data-w],[data-h]");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(fills, function (el) {
          if (el.hasAttribute("data-w")) el.style.width = el.getAttribute("data-w");
          if (el.hasAttribute("data-h")) el.style.height = el.getAttribute("data-h");
        });
      });
    });
  }

  /* ════════════════════════════════════════
     Rendering
     ════════════════════════════════════════ */

  function setStatus(msg, ok) {
    els.status.textContent = msg || "";
    els.status.classList.toggle("intake-status--ok", !!ok);
  }

  /* Feedback for share-bar actions lives with the share card itself. */
  /* state: true = success, false = error, "warn" = caution */
  function setShareStatus(msg, state) {
    els.shareStatus.textContent = msg || "";
    els.shareStatus.classList.toggle("share-status--ok", state === true);
    els.shareStatus.classList.toggle("share-status--warn", state === "warn" && !!msg);
    els.shareStatus.classList.toggle("share-status--err", state === false && !!msg);
  }

  function renderRoster() {
    var list = loadRoster();
    els.roster.hidden = list.length === 0;
    els.rosterList.textContent = "";
    list.forEach(function (r) {
      var chip = document.createElement("span");
      chip.className = "roster-chip" + (current && current.id === r.id ? " roster-chip--active" : "");
      var label = document.createElement("span");
      label.textContent = r.name;
      var hr = document.createElement("span");
      hr.className = "chip-hr";
      hr.textContent = r.hr ? "HR " + r.hr : "";
      var pick = document.createElement("button");
      pick.type = "button";
      pick.className = "chip-remove";
      pick.title = "Remove " + r.name;
      pick.textContent = "×";
      pick.addEventListener("click", function (ev) {
        ev.stopPropagation();
        rosterRemove(r.id);
        if (current && current.id === r.id) hideDashboard();
        renderRoster();
      });
      chip.appendChild(label);
      chip.appendChild(hr);
      chip.appendChild(pick);
      chip.addEventListener("click", function () {
        acceptData(r.data, { silent: true });
      });
      els.rosterList.appendChild(chip);
    });
  }

  function renderHeader(data) {
    els.shareName.textContent = data.hunter.name;
    els.shareDate.textContent = "Exported " + (fmtDate(data.exported_at) || "unknown date");
  }

  function renderStats(data) {
    var t = computeTotals(data);
    if (isNum(data.hunter.hr)) {
      els.statHr.textContent = fmtInt(data.hunter.hr);
      els.statHrLabel.textContent = "Hunter Rank";
    } else {
      els.statHr.textContent = fmtInt(data.hunter.hr_points);
      els.statHrLabel.textContent = "HR Points";
    }
    els.statPlaytime.textContent = fmtPlaytime(data.hunter.playtime_sec);
    els.statQuests.textContent   = fmtInt(t.quests);
    els.statHunts.textContent    = fmtInt(t.hunts);
    els.statCrowns.textContent   = (t.crownsSmall + t.crownsLarge) + " / " + (DATA.monsters.length * 2);
    els.statGuild.textContent    = fmtInt(data.hunter.guild_points);
    els.statZenny.textContent    = fmtInt(data.hunter.zenny);
  }

  function renderQuests(data) {
    var cats = (data.quests && data.quests.categories) || {};
    var total = data.quests && isNum(data.quests.total_completed) ? data.quests.total_completed : 0;
    var rows = DATA.questCategories.map(function (ref, i) {
      var n = isNum(cats[ref.slug]) ? cats[ref.slug] : 0;
      return { slug: ref.slug, name: ref.name, n: n, color: PALETTE[i % PALETTE.length] };
    });
    var catSum = rows.reduce(function (s, r) { return s + r.n; }, 0);
    var max = rows.reduce(function (s, r) { return Math.max(s, r.n); }, 0);
    els.questSummary.textContent = fmtInt(total) + " quests completed, by category";

    /* Donut: grand total in the center, categories as slices. */
    var slices = rows.filter(function (r) { return r.n > 0; }).map(function (r) {
      return { key: r.slug, name: r.name, value: r.n, color: r.color };
    });
    els.questDonut.innerHTML = donutSvgMarkup(slices, catSum);

    /* Column-chart tiles, categories in canonical order. */
    els.questChart.textContent = "";
    rows.forEach(function (r, i) {
      var pct = catSum > 0 ? Math.round((r.n / catSum) * 100) : 0;

      var tile = document.createElement("div");
      tile.className = "qtile" + (r.n === 0 ? " qtile--zero" : "");
      tile.setAttribute("data-key", r.slug);
      tile.style.setProperty("--qc", r.color);
      tile.style.setProperty("--qc-bg", tint(r.color, 0.07));
      tile.style.setProperty("--qc-line", tint(r.color, 0.22));
      tile.style.animationDelay = (i * 45) + "ms";
      tile.title = r.name + " — " + fmtInt(r.n) + " quests (" + pct + "% of categorized)";

      var icoSpan = document.createElement("span");
      icoSpan.className = "qtile-ico";
      icoSpan.textContent = QUEST_ICONS[r.slug] || "•";

      var val = document.createElement("span");
      val.className = "qtile-val";
      val.textContent = fmtInt(r.n);

      var track = document.createElement("div");
      track.className = "qtile-track";
      var fill = document.createElement("div");
      fill.className = "qtile-fill";
      fill.style.background = "linear-gradient(to top," + tint(r.color, 0.35) + "," + r.color + ")";
      fill.style.height = "0%";
      fill.setAttribute("data-h", max > 0 ? Math.max((r.n / max) * 100, r.n > 0 ? 4 : 0).toFixed(2) + "%" : "0%");
      fill.style.transitionDelay = (i * 45 + 150) + "ms";
      track.appendChild(fill);

      var name = document.createElement("span");
      name.className = "qtile-name";
      name.textContent = r.name;

      var share = document.createElement("span");
      share.className = "qtile-pct";
      share.textContent = pct + "%";

      tile.appendChild(icoSpan);
      tile.appendChild(val);
      tile.appendChild(track);
      tile.appendChild(name);
      tile.appendChild(share);
      els.questChart.appendChild(tile);
    });

    var qMeta = {};
    rows.forEach(function (r) {
      var p = catSum > 0 ? Math.round((r.n / catSum) * 100) : 0;
      qMeta[r.slug] = { name: fmtInt(r.n) + " · " + p + "%", sub: r.name };
    });
    var qLabel = slices.map(function (s) {
      return s.name + " " + Math.round((s.value / catSum) * 100) + "%";
    }).join(", ");
    setDonutState("quest", els.questDonut, els.questChart,
      function (key) { return qMeta[key]; },
      function () { return { name: fmtInt(total), sub: "quests completed" }; },
      "Quest category share: " + (qLabel || "no quests recorded"));
    animateGrow(els.questChart);
  }

  /* ── Generic donut engine (weapon usage & quest log) ── */
  var DONUT_R = 78;
  var DONUT_C = 2 * Math.PI * DONUT_R;
  var donutStates = {}; /* zoneKey -> { donutEl, listEl, nameEl, subEl, metaFor, defaultMeta } */

  function donutSvgMarkup(slices, grand) {
    var parts = ['<svg viewBox="0 0 200 200">'];
    parts.push('<circle class="donut-track" cx="100" cy="100" r="' + DONUT_R + '"></circle>');
    if (grand > 0 && slices.length) {
      var acc = 0;
      var gap = slices.length > 1 ? 3 : 0;
      slices.forEach(function (s, i) {
        var len = Math.max((s.value / grand) * DONUT_C - gap, 1.5);
        parts.push('<circle class="donut-slice" data-key="' + s.key + '" cx="100" cy="100" r="' + DONUT_R +
          '" stroke="' + s.color + '" stroke-dasharray="' + len.toFixed(2) + " " + DONUT_C.toFixed(2) +
          '" stroke-dashoffset="' + (-(acc + gap / 2)).toFixed(2) +
          '" transform="rotate(-90 100 100)" style="animation-delay:' + (i * 70) + 'ms"></circle>');
        acc += (s.value / grand) * DONUT_C;
      });
    }
    parts.push('<text x="100" y="96" class="donut-center-name"></text>');
    parts.push('<text x="100" y="114" class="donut-center-sub"></text>');
    parts.push("</svg>");
    return parts.join("");
  }

  function donutFocus(zoneKey, key) {
    var st = donutStates[zoneKey];
    if (!st) return;
    var hasSlice = !!key && !!st.donutEl.querySelector('.donut-slice[data-key="' + key + '"]');
    st.donutEl.classList.toggle("has-focus", hasSlice);
    Array.prototype.forEach.call(st.donutEl.querySelectorAll(".donut-slice"), function (p) {
      p.classList.toggle("is-hot", p.getAttribute("data-key") === key);
    });
    if (st.listEl) {
      Array.prototype.forEach.call(st.listEl.querySelectorAll("[data-key]"), function (r) {
        r.classList.toggle("is-hot", !!key && r.getAttribute("data-key") === key);
      });
    }
    var m = (key && st.metaFor(key)) || st.defaultMeta();
    st.nameEl.textContent = m.name;
    st.subEl.textContent = m.sub;
  }

  function wireDonutZone(zoneKey, donutEl, listEl) {
    function keyFromEvent(e) {
      if (!e.target || !e.target.closest) return null;
      var hit = e.target.closest("[data-key]");
      return hit ? hit.getAttribute("data-key") : null;
    }
    [donutEl, listEl].forEach(function (zone) {
      if (!zone) return;
      zone.addEventListener("mouseover", function (e) {
        var key = keyFromEvent(e);
        if (key) donutFocus(zoneKey, key);
      });
      zone.addEventListener("mouseleave", function () { donutFocus(zoneKey, null); });
    });
  }

  function setDonutState(zoneKey, donutEl, listEl, metaFor, defaultMeta, ariaLabel) {
    donutStates[zoneKey] = {
      donutEl: donutEl,
      listEl: listEl,
      nameEl: donutEl.querySelector(".donut-center-name"),
      subEl: donutEl.querySelector(".donut-center-sub"),
      metaFor: metaFor,
      defaultMeta: defaultMeta
    };
    if (ariaLabel) donutEl.setAttribute("aria-label", ariaLabel);
    donutFocus(zoneKey, null);
  }

  function renderWeapons(data) {
    var rows = DATA.weapons.map(function (w) {
      var rec = (data.weapons && data.weapons[w.slug]) || {};
      var main = isNum(rec.main) ? rec.main : 0;
      var sub  = isNum(rec.sub)  ? rec.sub  : 0;
      return { slug: w.slug, name: w.name, main: main, sub: sub, total: main + sub };
    });

    var isSub = weaponViewMode === "sub";
    var valKey = isSub ? "sub" : "main";

    rows.sort(function (a, b) {
      if (isSub) return b.sub - a.sub || b.total - a.total;
      return b.total - a.total;
    });

    var grand = rows.reduce(function (s, r) { return s + r[valKey]; }, 0);

    /* Summary line adapts to the active view */
    var usedCount = rows.filter(function (r) { return r[valKey] > 0; }).length;
    els.weaponSummary.textContent = isSub
      ? "Secondary loadout — " + fmtInt(grand) + " quests across " + usedCount + " weapons."
      : "Quests per weapon — hover the chart or a row to compare.";

    /* Donut: top 7 individually, the rest pooled as "Other". */
    var slices = [], sliceColor = {};
    rows.slice(0, 7).forEach(function (r, i) {
      if (r[valKey] > 0) {
        slices.push({ key: r.slug, name: r.name, value: r[valKey], color: PALETTE[i] });
        sliceColor[r.slug] = PALETTE[i];
      }
    });
    var rest = rows.slice(7).reduce(function (s, r) { return s + r[valKey]; }, 0);
    if (rest > 0) slices.push({ key: "__other", name: "Other weapons", value: rest, color: OTHER_COLOR });

    els.weaponDonut.innerHTML = donutSvgMarkup(slices, grand);

    /* Rows */
    els.weaponChart.textContent = "";
    var topSlug = rows.length && rows[0][valKey] > 0 ? rows[0].slug : null;
    var meta = {};
    rows.forEach(function (c) {
      var pct = grand > 0 ? Math.round((c[valKey] / grand) * 100) : 0;
      meta[c.slug] = { name: c.name, sub: fmtInt(c[valKey]) + (isSub ? " as secondary" : " quests") + " · " + pct + "%" };
    });
    if (rest > 0) meta.__other = { name: "Other weapons", sub: fmtInt(rest) + (isSub ? " as secondary" : " quests") + " · " + Math.round((rest / grand) * 100) + "%" };

    rows.forEach(function (c, i) {
      var color = sliceColor[c.slug] || OTHER_COLOR;
      var pct = grand > 0 ? Math.round((c[valKey] / grand) * 100) : 0;
      var val = c[valKey];

      var row = document.createElement("div");
      row.className = "weapon-row" +
        (c.slug === topSlug ? " weapon-row--top" : "") +
        (val === 0 ? " weapon-row--zero" : "");
      row.setAttribute("data-key", c.slug);
      row.title = c.name + ": " + fmtInt(c.main) + " main · " + fmtInt(c.sub) + " secondary";

      var icoSpan = document.createElement("span");
      icoSpan.className = "weapon-ico";
      icoSpan.style.background = tint(color, 0.09);
      icoSpan.style.borderColor = tint(color, 0.28);

      var img = document.createElement("img");
      img.className = "weapon-ico-img";
      img.src = "../assets/mhw/icons/" + c.slug.replace(/_/g, "-") + "_ic.png";
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", function () {
        /* Official icon unavailable — fall back to inline SVG silhouette */
        icoSpan.style.color = color;
        icoSpan.innerHTML = WEAPON_ICONS[c.slug] || "";
      });
      icoSpan.appendChild(img);

      var name = document.createElement("span");
      name.className = "weapon-name";
      name.textContent = c.name;
      if (c.slug === topSlug) {
        var badge = document.createElement("span");
        badge.className = "weapon-badge";
        badge.textContent = "top";
        name.appendChild(badge);
      }

      var track = document.createElement("div");
      track.className = "weapon-bar-track";

      if (isSub) {
        /* Sub view: single full-brightness bar for secondary usage */
        var fillS = document.createElement("div");
        fillS.className = "weapon-bar-fill";
        fillS.style.background = "linear-gradient(90deg," + tint(color, 0.45) + "," + color + ")";
        fillS.style.width = "0%";
        fillS.setAttribute("data-w", grand > 0 ? Math.max((c.sub / grand) * 100, c.sub > 0 ? 2 : 0).toFixed(2) + "%" : "0%");
        fillS.style.transitionDelay = (i * 28) + "ms";
        track.appendChild(fillS);
      } else {
        /* Main view: main usage only */
        var fillMain = document.createElement("div");
        fillMain.className = "weapon-bar-fill";
        fillMain.style.background = "linear-gradient(90deg," + tint(color, 0.45) + "," + color + ")";
        fillMain.style.width = "0%";
        fillMain.setAttribute("data-w", grand > 0 ? Math.max((c.main / grand) * 100, c.main > 0 ? 2 : 0).toFixed(2) + "%" : "0%");
        fillMain.style.transitionDelay = (i * 28) + "ms";
        track.appendChild(fillMain);
      }

      var num = document.createElement("span");
      num.className = "weapon-count";
      var strong = document.createElement("strong");
      strong.textContent = fmtInt(val);
      var em = document.createElement("em");
      em.textContent = pct + "%";
      num.appendChild(strong);
      num.appendChild(em);

      row.appendChild(icoSpan);
      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(num);

      /* Sub badge — quick-glance secondary count (both views) */
      if (c.sub > 0) {
        var subBadge = document.createElement("span");
        subBadge.className = "weapon-sub-badge";
        subBadge.title = fmtInt(c.sub) + " quests as secondary";
        subBadge.textContent = "⚡" + fmtInt(c.sub);
        row.appendChild(subBadge);
      }

      els.weaponChart.appendChild(row);
    });

    var wLabel = slices.map(function (s) {
      return s.name + " " + Math.round((s.value / grand) * 100) + "%";
    }).join(", ");
    setDonutState("weapon", els.weaponDonut, els.weaponChart,
      function (key) { return meta[key]; },
      function () {
        return slices.length ? meta[slices[0].key]
          : { name: "No quests", sub: "recorded yet" };
      },
      (isSub ? "Secondary weapon" : "Weapon") + " usage share: " + (wLabel || "no quests recorded"));
    animateGrow(els.weaponChart);
  }

  function monsterImgSrc(slug) {
    return "../assets/mhw/monsters/" + slug.replace(/_/g, "-") + ".webp";
  }

  function fallbackPortrait(img) {
    if (img.src.indexOf("question-mark") === -1) {
      img.src = "../assets/mhw/monsters/question-mark.png";
    }
  }

  function renderMonsters(data) {
    var mons = data.monsters || {};
    var rows = DATA.monsters.map(function (ref) {
      var m = mons[ref.slug] || null;
      var slain = m && isNum(m.slain) ? m.slain : 0;
      var captured = m && isNum(m.captured) ? m.captured : 0;
      var hunted = slain + captured;
      return {
        ref: ref,
        name: ref.name,
        slug: ref.slug,
        m: m,
        slain: slain,
        captured: captured,
        hunted: hunted,
        crowns: crownsOf(ref.slug, m)
      };
    });

    /* ── Top row: four progress rings + total hunts ── */
    var t = computeTotals(data);
    var totalSpecies = DATA.monsters.length;
    var discovered = rows.filter(function (r) { return !!r.m; }).length;
    var speciesHunted = rows.filter(function (r) { return r.hunted > 0; }).length;

    els.logRings.innerHTML =
      ringBlock("mini", "mini crowns", t.crownsSmall, totalSpecies, 0, "#f7d154", "#e8a13a") +
      ringBlock("large", "large crowns", t.crownsLarge, totalSpecies, t.crownsSilver, "#f7d154", "#b8e356") +
      ringBlock("disc", "discovered", discovered, totalSpecies, 0, "#60a5fa", "#45d0c0") +
      ringBlock("hunt", "monsters hunted", speciesHunted, totalSpecies, 0, "#f0913f", "#e4645f") +
      huntTotalBlock(t.hunts);

    /* ── Sort ── */
    var mode = els.sortSelect.value;
    rows.sort(function (a, b) {
      if (mode === "name") return a.name.localeCompare(b.name);
      return b.hunted - a.hunted || a.name.localeCompare(b.name);
    });

    /* ── Monster grid ── */
    els.monsterGrid.textContent = "";
    rows.forEach(function (r, i) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "mcard" + (r.hunted === 0 ? " mcard--zero" : "");
      card.style.animationDelay = Math.min(i * 22, 440) + "ms";
      card.setAttribute("aria-label", r.name + " — " + fmtInt(r.hunted) + " hunted. Open details.");

      var img = document.createElement("img");
      img.className = "mcard-img";
      img.src = monsterImgSrc(r.slug);
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", function () { fallbackPortrait(img); });

      var body = document.createElement("span");
      body.className = "mcard-body";

      var name = document.createElement("span");
      name.className = "mcard-name";
      name.textContent = r.name;

      var meta = document.createElement("span");
      meta.className = "mcard-meta";

      var crowns = document.createElement("span");
      crowns.className = "mcard-crowns";
      var c = r.crowns;
      var mini = document.createElement("span");
      mini.className = "crown" + (c.mini ? "" : " crown--missing");
      mini.title = "Mini crown" + (c.mini ? " earned" : " missing");
      mini.textContent = "♛";
      var large = document.createElement("span");
      large.className = "crown" + (c.gold ? "" : c.silver ? " crown--silver" : " crown--missing");
      large.title = c.gold ? "Gold large crown earned"
        : c.silver ? "Silver large crown — gold not yet"
        : "Large crown missing";
      large.textContent = "♛";
      crowns.appendChild(mini);
      crowns.appendChild(large);

      var count = document.createElement("span");
      count.className = "mcard-count";
      var strong = document.createElement("strong");
      strong.textContent = fmtInt(r.hunted);
      count.appendChild(strong);
      count.appendChild(document.createTextNode(" hunted"));

      meta.appendChild(crowns);
      meta.appendChild(count);
      body.appendChild(name);
      body.appendChild(meta);
      card.appendChild(img);
      card.appendChild(body);

      card.addEventListener("click", function () { openMonsterModal(r, card); });
      els.monsterGrid.appendChild(card);
    });
  }

  var RING_R = 30;
  var RING_C = 2 * Math.PI * RING_R;

  function ringBlock(id, label, earned, total, extra, gradA, gradB) {
    var frac = total > 0 ? earned / total : 0;
    var extraFrac = total > 0 ? extra / total : 0;
    var pct = Math.round(frac * 100);
    var len = frac > 0 ? Math.max(frac * RING_C - 1.5, 2) : 0;
    var extraLen = extra > 0 ? Math.max(extraFrac * RING_C - 1.5, 2) : 0;
    var extraRot = -90 + frac * 360;
    return '<div class="cring">' +
      '<svg viewBox="0 0 76 76" style="--C:' + RING_C.toFixed(1) + '">' +
      '<defs><linearGradient id="grad-' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + gradA + '"/><stop offset="1" stop-color="' + gradB + '"/>' +
      '</linearGradient></defs>' +
      '<circle class="cring-track" cx="38" cy="38" r="' + RING_R + '"/>' +
      (extra > 0
        ? '<circle class="cring-silver" cx="38" cy="38" r="' + RING_R +
          '" style="stroke-dasharray:' + extraLen.toFixed(1) + " " + RING_C.toFixed(1) +
          '" transform="rotate(' + extraRot.toFixed(1) + ' 38 38)"/>'
        : "") +
      '<circle class="cring-fill" cx="38" cy="38" r="' + RING_R +
        '" stroke="url(#grad-' + id + ')" style="stroke-dasharray:' + len.toFixed(1) + " " + RING_C.toFixed(1) +
        '" transform="rotate(-90 38 38)"/>' +
      '<text x="38" y="43" class="cring-pct">' + pct + "%</text>" +
      "</svg>" +
      '<span class="cring-label"><strong>' + fmtInt(earned) + "</strong> / " + fmtInt(total) + "<br>" + label + "</span>" +
      "</div>";
  }

  /* Standalone counter that visually matches the ring row — used for the
     grand total of hunts, which has no natural "out of" denominator. */
  function huntTotalBlock(total) {
    return '<div class="hunt-total">' +
      '<span class="hunt-total-disc"><span class="hunt-total-val">' + fmtInt(total) + "</span></span>" +
      '<span class="cring-label">total hunts</span>' +
      "</div>";
  }

  /* ── Monster detail modal ── */

  function monsterModalMarkup(r) {
    var ref = r.ref;
    var c = r.crowns;
    var th = ref.crowns;

    function stat(value, label) {
      return '<div class="mmodal-stat"><b>' + value + "</b><span>" + label + "</span></div>";
    }
    function chip(name, state, hint) {
      return '<div class="mmodal-crown mmodal-crown--' + state + '">' +
        '<span class="mmodal-crown-glyph">♛</span>' +
        '<span class="mmodal-crown-name">' + name + "</span>" +
        '<span class="mmodal-crown-hint">' + hint + "</span></div>";
    }
    function sizeBlock(label, pct) {
      var cm = sizeCm(r.slug, pct);
      var main = isNum(pct) ? (cm !== null ? fmtSize(cm) + " cm" : pct + "%") : "–";
      var sub = isNum(pct) ? pct + "% of base" : "no record";
      return '<div class="mmodal-stat"><b>' + main + "</b><span>" + label + " · " + sub + "</span></div>";
    }

    var silverEarned = c.silver || c.gold;
    return '<div class="mmodal-head">' +
      '<img class="mmodal-img" src="' + monsterImgSrc(r.slug) + '" alt="">' +
      '<div class="mmodal-id">' +
        '<h3 class="mmodal-name" id="mmodal-name">' + r.name + "</h3>" +
        '<span class="mmodal-type">' + ref.type + "</span>" +
      "</div></div>" +

      '<div class="mmodal-stats">' +
        stat(fmtInt(r.hunted), "hunted") +
        stat(fmtInt(r.captured), "captured") +
        stat(fmtInt(r.slain), "slain") +
      "</div>" +

      '<div class="mmodal-crowns">' +
        chip("Mini", c.mini ? "gold" : "missing",
          c.mini ? "Earned · ≤ " + th.mini + "%" : "Needs ≤ " + th.mini + "% size") +
        chip("Silver", silverEarned ? "silver" : "missing",
          silverEarned ? "Earned · ≥ " + th.silver + "%" : "Needs ≥ " + th.silver + "% size") +
        chip("Gold", c.gold ? "gold" : "missing",
          c.gold ? "Earned · ≥ " + th.gold + "%" : "Needs ≥ " + th.gold + "% size") +
      "</div>" +

      '<div class="mmodal-sizes">' +
        sizeBlock("Smallest", r.m && isNum(r.m.min_pct) ? r.m.min_pct : null) +
        sizeBlock("Largest", r.m && isNum(r.m.max_pct) ? r.m.max_pct : null) +
      "</div>";
  }

  var lastModalTrigger = null;

  function openMonsterModal(r, triggerEl) {
    lastModalTrigger = triggerEl || null;
    els.modalBody.innerHTML = monsterModalMarkup(r);
    var img = els.modalBody.querySelector(".mmodal-img");
    if (img) img.addEventListener("error", function () { fallbackPortrait(img); });
    els.monsterModal.hidden = false;
    document.body.style.overflow = "hidden";
    els.modalClose.focus();
  }

  function closeMonsterModal() {
    if (els.monsterModal.hidden) return;
    els.monsterModal.hidden = true;
    document.body.style.overflow = "";
    if (lastModalTrigger && lastModalTrigger.focus) lastModalTrigger.focus();
    lastModalTrigger = null;
  }

  function renderDelta(id, data) {
    var snaps = loadSnapshots(id);
    var snap = makeSnapshot(data);
    lastPrevSnap = snaps.length ? snaps[snaps.length - 1] : null;

    var prev = lastPrevSnap ? lastPrevSnap.totals : null;
    var changed = !prev ||
      prev.quests !== snap.totals.quests ||
      prev.hunts !== snap.totals.hunts ||
      prev.caps !== snap.totals.caps ||
      prev.crownsSmall !== snap.totals.crownsSmall ||
      prev.crownsLarge !== snap.totals.crownsLarge;

    if (prev && changed) {
      var pills = [];
      function pill(label, diff) {
        if (diff > 0) pills.push("+" + fmtInt(diff) + " " + label);
      }
      pill("quests", snap.totals.quests - prev.quests);
      pill("hunts", snap.totals.hunts - prev.hunts);
      pill("captures", snap.totals.caps - prev.caps);
      pill("small crowns", snap.totals.crownsSmall - prev.crownsSmall);
      pill("large crowns", snap.totals.crownsLarge - prev.crownsLarge);

      if (pills.length) {
        els.deltaContent.textContent = "";
        pills.forEach(function (text) {
          var el = document.createElement("span");
          el.className = "delta-pill";
          el.textContent = text;
          els.deltaContent.appendChild(el);
        });
        els.deltaCard.hidden = false;
      } else {
        els.deltaCard.hidden = true;
      }
    } else {
      els.deltaCard.hidden = true;
    }

    if (changed) pushSnapshot(id, snap);
  }

  function renderAll(data) {
    renderHeader(data);
    renderStats(data);
    renderQuests(data);
    renderWeapons(data);
    renderMonsters(data);
  }

  function showDashboard() { els.dashboard.hidden = false; }
  function hideDashboard() {
    els.dashboard.hidden = true;
    current = null;
    hideQrPanel();
    setShareStatus("", true);
    if (location.hash.indexOf("#d=") === 0) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  /* ════════════════════════════════════════
     Intake
     ════════════════════════════════════════ */

  function hunterId(data) {
    return String(data.hunter.name).trim().toLowerCase();
  }

  function acceptData(data, opts) {
    opts = opts || {};
    var check = validateExport(data);
    if (!check.ok) {
      setStatus(check.errors.slice(0, 3).join(" "), false);
      return false;
    }
    var id = hunterId(data);
    current = { id: id, data: data };
    hideQrPanel(); /* stale QR would point at the previous hunter */
    rosterUpsert(id, data);
    renderDelta(id, data);
    renderAll(data);
    renderRoster();
    showDashboard();
    if (!opts.silent) setStatus("Loaded " + data.hunter.name + "'s stats.", true);
    /* Keep the URL carrying the data so refresh/bookmark works. */
    if (!opts.skipHash) {
      encodeShare(data).then(function (url) {
        history.replaceState(null, "", url);
      }).catch(function () {});
    }
    return true;
  }

  function parseAndAccept(text, sourceLabel) {
    var obj;
    try { obj = JSON.parse(text); }
    catch (e) {
      setStatus("That " + (sourceLabel || "text") + " isn't valid JSON.", false);
      return;
    }
    acceptData(obj);
  }

  function readFile(file) {
    var reader = new FileReader();
    reader.onload = function () { parseAndAccept(String(reader.result), "file"); };
    reader.onerror = function () { setStatus("Couldn't read that file.", false); };
    reader.readAsText(file);
  }

  /* ── Paste ── */
  els.btnPaste.addEventListener("click", function () {
    var text = els.paste.value.trim();
    if (!text) { setStatus("Paste the exported JSON first.", false); return; }
    parseAndAccept(text, "pasted text");
  });

  /* ── Drop zone & picker ── */
  ["dragenter", "dragover"].forEach(function (ev) {
    els.dropZone.addEventListener(ev, function (e) {
      e.preventDefault();
      els.dropZone.classList.add("drop-zone--over");
    });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    els.dropZone.addEventListener(ev, function (e) {
      e.preventDefault();
      els.dropZone.classList.remove("drop-zone--over");
    });
  });
  els.dropZone.addEventListener("drop", function (e) {
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) readFile(file);
  });
  els.dropZone.addEventListener("click", function () { els.fileInput.click(); });
  els.dropZone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); els.fileInput.click(); }
  });
  els.fileInput.addEventListener("change", function () {
    if (els.fileInput.files[0]) readFile(els.fileInput.files[0]);
    els.fileInput.value = "";
  });

  /* ── Linked file (File System Access API) ── */
  var fsSupported = "showOpenFilePicker" in window;

  function setLinkedNote(name) {
    els.savedNote.hidden = false;
    els.savedNote.textContent = name
      ? "Linked to " + name + " — click “Re-read linked file” after each export."
      : "";
    els.btnSavedReload.hidden = !name;
  }

  function readHandle(handle) {
    return handle.queryPermission({ mode: "read" }).then(function (state) {
      if (state !== "granted") return handle.requestPermission({ mode: "read" });
      return state;
    }).then(function (state) {
      if (state !== "granted") throw new Error("Permission to read the file was denied.");
      return handle.getFile();
    }).then(function (file) { readFile(file); });
  }

  if (fsSupported) {
    els.btnSavedFile.addEventListener("click", function () {
      window.showOpenFilePicker({
        types: [{ description: "MH Wilds stats export", accept: { "application/json": [".json"] } }],
        multiple: false
      }).then(function (handles) {
        var handle = handles[0];
        return idbSet("linkedFile", handle).then(function () {
          setLinkedNote(handle.name);
          return readHandle(handle);
        });
      }).catch(function (err) {
        if (err && err.name === "AbortError") return; /* user cancelled picker */
        setStatus(err.message || "Couldn't link that file.", false);
      });
    });

    els.btnSavedReload.addEventListener("click", function () {
      idbGet("linkedFile").then(function (handle) {
        if (!handle) { setLinkedNote(null); setStatus("No file linked yet.", false); return; }
        return readHandle(handle);
      }).catch(function (err) {
        setStatus(err.message || "Couldn't re-read the linked file.", false);
      });
    });

    /* Restore any previously linked handle (name only; read on click). */
    idbGet("linkedFile").then(function (handle) {
      if (handle && handle.name) setLinkedNote(handle.name);
    }).catch(function () {});
  } else {
    els.btnSavedFile.disabled = true;
    els.btnSavedFile.title = "Your browser doesn't support the File System Access API — use paste or drop instead.";
  }

  /* ── Sample data ── */
  els.btnSample.addEventListener("click", function () {
    acceptData(window.MHW_SAMPLE_DATA, { skipHash: false });
  });

  /* ── Share bar ── */

  /* ── QR code for the share link (generated locally via qrious) ── */
  function hideQrPanel() { els.qrPanel.hidden = true; }

  /* Best-effort: renders the QR panel; returns false when the save is
     too large for QR capacity (the copied link still works either way). */
  var QR_CAPACITY = 2953; /* byte-mode capacity of the largest QR (v40) at level L */
  function tryRenderQr(url) {
    /* Explicit gate: the share URL is pure ASCII, so its length is its
       byte size. Anything past capacity can't become a QR at all. */
    if (typeof QRious === "undefined" || url.length > QR_CAPACITY) return false;
    try {
      /* Pass 1: probe render just to learn this QR's module grid. */
      var tmp = document.createElement("canvas");
      new QRious({
        element: tmp, value: url, size: 800, level: "L", padding: 0,
        background: "#ffffff", foreground: "#000000"
      });
      var row = tmp.getContext("2d").getImageData(0, 1, tmp.width, 1).data;
      var extent = tmp.width;
      while (extent > 1 && row[(extent - 1) * 4] > 128) extent--;
      var run = 0;
      while (run < extent && row[run * 4] < 128) run++;
      var moduleSize = Math.max(1, Math.round(run / 7)); /* finder is 7 modules wide */
      var cols = Math.max(21, Math.round(extent / moduleSize));

      /* Pass 2: real render at an exact multiple of the grid, so every
         module is a whole number of device pixels — crisp and scannable,
         with no leftover margin inside the canvas. */
      var dpr = Math.max(window.devicePixelRatio || 1, 1);
      var modulePx = Math.max(1, Math.floor((240 * dpr) / cols));
      var size = cols * modulePx;
      new QRious({
        element: els.qrCanvas, value: url, size: size, level: "L", padding: 0,
        background: "#f0f0f5", foreground: "#14100a"
      });
      var cssSize = Math.round(size / dpr);
      els.qrCanvas.style.width = cssSize + "px"; /* height stays auto — square via intrinsic ratio */
      els.qrName.textContent = current.data.hunter.name;
      els.qrPanel.hidden = false;
      return true;
    } catch (e) {
      hideQrPanel();
      return false;
    }
  }

  /* Copy the share link AND show its QR code in one action. */
  els.btnCopyLink.addEventListener("click", function () {
    if (!current) return;
    encodeShare(current.data).then(function (url) {
      var qrOk = tryRenderQr(url);
      var msg = qrOk
        ? "Share link copied — anyone opening it sees this hunter."
        : "Share link copied, but this save is too large for a QR code (~2.9 KB limit) — share the link directly instead.";
      var state = qrOk ? true : "warn";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(url).then(function () {
          setShareStatus(msg, state);
        });
      }
      window.prompt("Copy your share link:", url);
      setShareStatus(msg, state);
    }).catch(function () {
      setShareStatus("Couldn't build a share link.", false);
    });
  });
  els.qrClose.addEventListener("click", hideQrPanel);

  els.btnDownload.addEventListener("click", function () {
    if (!current) return;
    var blob = new Blob([JSON.stringify(current.data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mhw-stats-" + current.id.replace(/[^a-z0-9_-]+/g, "-") + ".json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  });

  els.btnForget.addEventListener("click", function () {
    if (!current) return;
    rosterRemove(current.id);
    hideDashboard();
    renderRoster();
    setStatus("Removed from roster.", true);
  });

  /* ── Log controls ── */
  els.sortSelect.addEventListener("change", function () { if (current) renderMonsters(current.data); });

  /* ── Monster detail modal ── */
  els.modalClose.addEventListener("click", closeMonsterModal);
  els.monsterModal.addEventListener("click", function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute("data-modal-close")) closeMonsterModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMonsterModal();
  });

  /* ── Weapon view toggle (main / secondary) ── */
  function setWeaponView(mode) {
    if (weaponViewMode === mode) return;
    weaponViewMode = mode;
    els.btnViewMain.classList.toggle("is-active", mode === "main");
    els.btnViewSub.classList.toggle("is-active", mode === "sub");
    els.btnViewMain.setAttribute("aria-pressed", String(mode === "main"));
    els.btnViewSub.setAttribute("aria-pressed", String(mode === "sub"));
    if (current) renderWeapons(current.data);
  }
  els.btnViewMain.addEventListener("click", function () { setWeaponView("main"); });
  els.btnViewSub.addEventListener("click", function () { setWeaponView("sub"); });

  /* ── Donut ↔ list hover sync (weapons & quests) ── */
  wireDonutZone("weapon", els.weaponDonut, els.weaponChart);
  wireDonutZone("quest", els.questDonut, els.questChart);

  /* ════════════════════════════════════════
     Boot: shared link → roster → nothing
     ════════════════════════════════════════ */

  renderRoster();

  if (location.hash.indexOf("#d=") === 0) {
    decodeShare(location.hash).then(function (data) {
      if (!acceptData(data, { silent: true, skipHash: true })) {
        setStatus("The shared link doesn't contain valid stats data.", false);
      }
    }).catch(function (err) {
      setStatus(err.message || "Couldn't read the shared link.", false);
    });
  } else {
    var roster = loadRoster();
    if (roster.length) {
      acceptData(roster[roster.length - 1].data, { silent: true, skipHash: true });
    }
  }

})();
