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
    weaponChart:  $("weapon-chart"),
    crownSummary: $("crown-summary"),
    sortSelect:   $("sort-select"),
    filterCrowns: $("filter-crowns"),
    monsterTbody: $("monster-tbody")
  };

  var LS_ROSTER = "mhw.roster.v1";
  var LS_SNAP_PREFIX = "mhw.snapshots.v1.";
  var IDB_NAME = "mhw-tracker";
  var IDB_STORE = "kv";

  var current = null;   // { id, data }
  var lastPrevSnap = null; // previous snapshot of current hunter (for "recent" sort)

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

  function sizeText(slug, pct) {
    var cm = sizeCm(slug, pct);
    if (cm !== null) return fmtSize(cm);
    return isNum(pct) ? pct + "%" : "–";
  }

  function computeTotals(data) {
    var t = { quests: 0, hunts: 0, caps: 0, crownsSmall: 0, crownsLarge: 0, crownsSilver: 0 };
    if (data.quests && isNum(data.quests.total_completed)) t.quests = data.quests.total_completed;
    var mons = data.monsters || {};
    Object.keys(mons).forEach(function (slug) {
      var m = mons[slug] || {};
      if (isNum(m.slain))    t.hunts += m.slain;
      if (isNum(m.captured)) t.caps  += m.captured;
      var c = crownsOf(slug, m);
      if (c.mini)   t.crownsSmall++;
      if (c.gold)   t.crownsLarge++;
      if (c.silver) t.crownsSilver++;
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
     Rendering
     ════════════════════════════════════════ */

  function setStatus(msg, ok) {
    els.status.textContent = msg || "";
    els.status.classList.toggle("intake-status--ok", !!ok);
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
    var rows = DATA.questCategories.map(function (ref) {
      var n = isNum(cats[ref.slug]) ? cats[ref.slug] : 0;
      return { name: ref.name, n: n };
    });
    var max = rows.reduce(function (acc, r) { return Math.max(acc, r.n); }, 0);
    els.questChart.textContent = "";
    rows.forEach(function (c) {
      var row = document.createElement("div");
      row.className = "weapon-row quest-row" + (c.n === 0 ? " quest-row--zero" : "");
      var name = document.createElement("span");
      name.className = "weapon-name";
      name.textContent = c.name;
      var track = document.createElement("div");
      track.className = "weapon-bar-track";
      var fill = document.createElement("div");
      fill.className = "weapon-bar-fill";
      fill.style.width = max > 0 ? Math.max((c.n / max) * 100, c.n > 0 ? 2 : 0) + "%" : "0%";
      track.appendChild(fill);
      var num = document.createElement("span");
      num.className = "weapon-count";
      num.textContent = fmtInt(c.n);
      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(num);
      els.questChart.appendChild(row);
    });
  }

  function renderWeapons(data) {
    var rows = DATA.weapons.map(function (w) {
      var rec = (data.weapons && data.weapons[w.slug]) || {};
      var main = isNum(rec.main) ? rec.main : 0;
      var sub  = isNum(rec.sub)  ? rec.sub  : 0;
      return { name: w.name, main: main, sub: sub, total: main + sub };
    });
    rows.sort(function (a, b) { return b.total - a.total; });
    var max = rows.length ? rows[0].total : 0;
    els.weaponChart.textContent = "";
    var topFound = false;
    rows.forEach(function (c) {
      var isTop = !topFound && c.total > 0;
      if (isTop) topFound = true;
      var row = document.createElement("div");
      row.className = "weapon-row" + (isTop ? " weapon-row--top" : "");
      var name = document.createElement("span");
      name.className = "weapon-name";
      name.textContent = c.name;
      var track = document.createElement("div");
      track.className = "weapon-bar-track";
      var fillMain = document.createElement("div");
      fillMain.className = "weapon-bar-fill";
      fillMain.style.width = max > 0 ? Math.max((c.main / max) * 100, c.main > 0 ? 2 : 0) + "%" : "0%";
      var fillSub = document.createElement("div");
      fillSub.className = "weapon-bar-fill weapon-bar-fill--sub";
      fillSub.style.width = max > 0 ? Math.max((c.sub / max) * 100, c.sub > 0 ? 2 : 0) + "%" : "0%";
      track.appendChild(fillMain);
      track.appendChild(fillSub);
      var num = document.createElement("span");
      num.className = "weapon-count";
      num.textContent = fmtInt(c.total);
      num.title = c.main + " main · " + c.sub + " sub";
      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(num);
      els.weaponChart.appendChild(row);
    });
  }

  function crownCell(slug, m) {
    var td = document.createElement("td");
    td.className = "crowns";
    var c = crownsOf(slug, m);
    var mini = document.createElement("span");
    mini.className = "crown" + (c.mini ? "" : " crown--missing");
    mini.title = "Mini gold crown" + (c.mini ? " earned" : " not earned");
    mini.textContent = "♛";
    td.appendChild(mini);
    td.appendChild(document.createTextNode(" "));
    var large = document.createElement("span");
    large.className = "crown" + (c.gold ? "" : c.silver ? " crown--silver" : " crown--missing");
    large.title = c.gold ? "Gold large crown earned"
      : c.silver ? "Silver large crown — gold not yet"
      : "Large crown not earned";
    large.textContent = "♛";
    td.appendChild(large);
    return td;
  }

  function numTd(text, cls) {
    var td = document.createElement("td");
    td.className = cls || "num";
    td.textContent = text;
    return td;
  }

  function renderMonsters(data) {
    var mons = data.monsters || {};
    var rows = DATA.monsters.map(function (ref) {
      var m = mons[ref.slug] || null;
      var prevH = lastPrevSnap && lastPrevSnap.monsters[ref.slug]
        ? lastPrevSnap.monsters[ref.slug].h : null;
      var slain = m && isNum(m.slain) ? m.slain : 0;
      var captured = m && isNum(m.captured) ? m.captured : 0;
      var hunted = slain + captured;
      var c = crownsOf(ref.slug, m);
      return {
        name: ref.name,
        slug: ref.slug,
        m: m,
        slain: slain,
        captured: captured,
        hunted: hunted,
        recent: prevH !== null && m ? Math.max(hunted - prevH, 0) : 0,
        crownsMissing: (c.mini ? 0 : 1) + (c.gold ? 0 : 1)
      };
    });

    /* Crown summary line */
    var t = computeTotals(data);
    els.crownSummary.textContent =
      "Gold crowns: " + t.crownsSmall + "/" + DATA.monsters.length + " mini · " +
      t.crownsLarge + "/" + DATA.monsters.length + " large" +
      (t.crownsSilver > 0 ? " · " + t.crownsSilver + " silver large in progress" : "");

    /* Filter */
    if (els.filterCrowns.checked) {
      rows = rows.filter(function (r) { return r.crownsMissing > 0; });
    }

    /* Sort */
    var mode = els.sortSelect.value;
    rows.sort(function (a, b) {
      if (mode === "name")   return a.name.localeCompare(b.name);
      if (mode === "crowns") return b.crownsMissing - a.crownsMissing || b.hunted - a.hunted;
      if (mode === "recent") return b.recent - a.recent || b.hunted - a.hunted;
      return b.hunted - a.hunted || a.name.localeCompare(b.name);
    });

    els.monsterTbody.textContent = "";
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      if (r.hunted === 0) tr.className = "monster-zerocount";
      var name = document.createElement("td");
      var span = document.createElement("span");
      span.className = "monster-name";
      span.textContent = r.name;
      name.appendChild(span);
      tr.appendChild(name);
      tr.appendChild(numTd(fmtInt(r.hunted)));
      tr.appendChild(numTd(fmtInt(r.captured)));
      tr.appendChild(numTd(fmtInt(r.slain)));
      tr.appendChild(crownCell(r.slug, r.m));
      tr.appendChild(numTd(r.m ? sizeText(r.slug, r.m.min_pct) : "–"));
      tr.appendChild(numTd(r.m ? sizeText(r.slug, r.m.max_pct) : "–"));
      els.monsterTbody.appendChild(tr);
    });
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
  els.btnCopyLink.addEventListener("click", function () {
    if (!current) return;
    encodeShare(current.data).then(function (url) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(url).then(function () {
          setStatus("Share link copied — anyone opening it sees this hunter.", true);
        });
      }
      window.prompt("Copy your share link:", url);
    }).catch(function () {
      setStatus("Couldn't build a share link.", false);
    });
  });

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
  els.filterCrowns.addEventListener("change", function () { if (current) renderMonsters(current.data); });

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
