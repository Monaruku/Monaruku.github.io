-- ─────────────────────────────────────────────────────────────────────────
-- MH Wilds Stat Tracker — REFramework exporter
-- https://monaruku.github.io/mhw/
--
-- Exports your hunter profile (HR, playtime, weapon usage, per-monster
-- hunt/capture counts, gold crowns) to JSON in the "mhw-stats/1" schema
-- consumed by the web tracker.
--
-- INSTALL
--   1. Install REFramework (nightly) for Monster Hunter Wilds.
--   2. Drop this file into: MonsterHunterWilds/reframework/autorun/
--   3. Launch the game, open the REFramework overlay (Insert), find
--      "MHW Stats Exporter" under ScriptRunner-generated UI.
--
-- OUTPUT
--   reframework/data/mhw-stats.json
--
-- STATUS: v1.1 — all data paths verified in-game (Ver. 1.041).
-- Hardening: the UI callback is fully pcall-isolated — REFramework runs
-- every script's UI in one shared ImGui frame, and an escaping error can
-- poison that frame and surface as errors blamed on OTHER scripts.
-- Nothing in this script may throw: game-state reads stay behind pcall-
-- guarded button handlers. Read-only: never writes game state.
-- ─────────────────────────────────────────────────────────────────────────

local EXPORT_FILE = "mhw-stats.json"
local DEBUG_FILE  = "mhw_stats_debug.json"

-- ─────────────────────────────────────────────────────────────────────────
-- Verified data map (from in-game dumps, July 2026)
-- ─────────────────────────────────────────────────────────────────────────

-- app.WeaponDef.TYPE index → schema slug.
local WEAPON_SLUGS = {
  [0]  = "great_sword",      -- LONG_SWORD
  [1]  = "sword_and_shield", -- SHORT_SWORD
  [2]  = "dual_blades",      -- TWIN_SWORD
  [3]  = "long_sword",       -- TACHI
  [4]  = "hammer",           -- HAMMER
  [5]  = "hunting_horn",     -- WHISTLE
  [6]  = "lance",            -- LANCE
  [7]  = "gunlance",         -- GUN_LANCE
  [8]  = "switch_axe",       -- SLASH_AXE
  [9]  = "charge_blade",     -- CHARGE_AXE
  [10] = "insect_glaive",    -- ROD
  [11] = "bow",              -- BOW
  [12] = "heavy_bowgun",     -- HEAVY_BOWGUN
  [13] = "light_bowgun",     -- LIGHT_BOWGUN
}

-- app.EnemyDef.ID_Fixed value → schema slug (large monsters only;
-- EM0165 "High Purrformance Barrel Puncher" intentionally excluded).
local MONSTER_FID_SLUGS = {
  [26]          = "rathian",
  [1965232896]  = "rathalos",
  [1411933184]  = "guardian_rathalos",
  [-535078400]  = "gravios",
  [402056736]   = "yian_kut_ku",
  [1049705664]  = "gypceros",
  [-1440201088] = "blangonga",
  [2129596800]  = "congalala",
  [-1083842944] = "lagiacrus",
  [-1363370496] = "lala_barina",
  [-758250816]  = "gore_magala",
  [25]          = "seregios",
  [13052]       = "gogmazios",
  [32634]       = "mizutsune",
  [107194928]   = "guardian_fulgur_anjanath",
  [1663995904]  = "guardian_ebony_odogaron",
  [15]          = "doshaguma",
  [-1916429696] = "guardian_doshaguma",
  [16]          = "balahara",
  [33]          = "chatacabra",
  [-34937520]   = "quematrice",
  [-1528962176] = "nerscylla",
  [567628288]   = "rompopolo",
  [-1547364608] = "rey_dau",
  [1467998976]  = "uth_duna",
  [1657778432]  = "nu_udra",
  [777460864]   = "ajarakan",
  [746996864]   = "arkveld",
  [-283654400]  = "guardian_arkveld",
  [222933952]   = "hirabami",
  [1553456768]  = "jin_dahaad",
  [1401863296]  = "xu_wu",
  [-2003468672] = "zoh_shia",
  [21849]       = "omega_planetes",
}

-- _ClearNumPerCategory index → schema slug (0–4 verified in-game;
-- 5–7 ordering inferred).
local QUEST_CATEGORY_SLUGS = {
  [0] = "assignments",
  [1] = "optional",
  [2] = "field_survey",
  [3] = "arena",
  [4] = "investigations",
  [5] = "event",
  [6] = "free_challenge",
  [7] = "challenge",
}

-- ─────────────────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────────────────

local function say(msg)
  log.info("[mhw-stats] " .. tostring(msg))
end

-- ─────────────────────────────────────────────────────────────────────────
-- Debug discovery: dump candidate singletons, their TDB fields & methods
-- so save structures and ID tables can be mapped without guessing.
-- ─────────────────────────────────────────────────────────────────────────

local SINGLETON_CANDIDATES = {
  "app.PlayerManager",
  "app.SaveDataManager",
  "app.UserDataManager",
  "app.UserManager",
  "app.HunterManager",
  "app.HunterProfileManager",
  "app.ProfileManager",
  "app.GuildCardManager",
  "app.QuestManager",
  "app.QuestRecordManager",
  "app.PlayRecordManager",
  "app.RecordManager",
  "app.HuntingLogManager",
  "app.MonsterManager",
  "app.EnemyManager",
  "app.AchievementManager",
}

local function type_name_of(v)
  local ok, name = pcall(function ()
    return v:get_type_definition():get_full_name()
  end)
  return ok and name or "?"
end

local function array_len_of(v)
  local ok, n = pcall(function () return #v end)
  if ok and type(n) == "number" then return n end
  local ok2, m = pcall(function () return v:get_size() end)
  if ok2 and type(m) == "number" then return m end
  return nil
end

--- Field list: scalar samples, or type names (plus array lengths) for
--- object fields — type names reveal where the profile data lives.
local function describe_object(obj)
  local out = { fields = {}, methods = {} }
  local ok, tdb = pcall(function () return obj:get_type_definition() end)
  if not ok or tdb == nil then return out end

  local okf, fields = pcall(function () return tdb:get_fields() end)
  if okf and fields then
    for _, f in ipairs(fields) do
      local okn, name = pcall(function () return f:get_name() end)
      if okn and name then
        local okv, v = pcall(function () return obj:get_field(name) end)
        local entry = name
        if okv and v ~= nil then
          local vt = type(v)
          if vt == "string" or vt == "number" or vt == "boolean" then
            entry = name .. " = " .. tostring(v)
          else
            entry = name .. " : " .. type_name_of(v)
            local alen = array_len_of(v)
            if alen then entry = entry .. "[" .. alen .. "]" end
          end
        end
        table.insert(out.fields, entry)
      end
    end
  end

  -- Only accessor-style methods; the full list is noise for discovery.
  local okm, methods = pcall(function () return tdb:get_methods() end)
  if okm and methods then
    for _, m in ipairs(methods) do
      local okn, name = pcall(function () return m:get_name() end)
      if okn and name
        and (name:find("^get_") or name:find("^Get")
          or name:find("^is_") or name:find("^Is")) then
        table.insert(out.methods, name)
      end
    end
  end
  return out
end

-- ─────────────────────────────────────────────────────────────────────────
-- Deep dive: recursively map app.savedata.cUserSaveData, following type
-- names that look like they hold hunter-profile data.
-- ─────────────────────────────────────────────────────────────────────────

local DEEP_KEYWORDS = {
  "Profile", "Record", "Hunter", "Guild", "Quest", "Weapon",
  "Monster", "Log", "Crown", "Play", "Hunt", "Enemy", "Em",
  "Player", "Status", "Counter", "Basic", "Rank", "Report",
  "Story", "Communication", "Mandrake",
}
local DEEP_MAX_LINES = 16000
local DEEP_DEPTH = 4

local unpack_fn = table.unpack or unpack

local function call0(obj, name, ...)
  local argc = select("#", ...)
  local argv = { ... }
  local ok, r = pcall(function ()
    if argc == 0 then return obj:call(name) end
    return obj:call(name, unpack_fn(argv, 1, argc))
  end)
  if ok then return r end
  return nil
end

local function type_matches(tn)
  for _, kw in ipairs(DEEP_KEYWORDS) do
    if tn:find(kw, 1, true) then return true end
  end
  return false
end

local function is_collection_type(tn)
  return tn:find("List`1") or tn:find("DYNAMIC_ARRAY") or tn:find("cManagedArray")
    or tn:find("cLimitedArray") or tn:find("%[%]") or tn:find("Dictionary")
    or tn:find("HashSet") or tn:find("Queue") or tn:find("Bitset")
end

local function collection_count(v)
  local ok, n = pcall(function () return #v end)
  if ok and type(n) == "number" then return n end
  local c = call0(v, "get_Count")
  if type(c) == "number" then return c end
  local s = call0(v, "get_size")
  if type(s) == "number" then return s end
  return nil
end

local function element_at(v, i)
  local ok, e = pcall(function () return v[i] end)
  if ok and e ~= nil then return e end
  return call0(v, "get_Item", i)
end

local function first_element(v)
  return element_at(v, 0)
end

-- Best-effort scalar extraction: plain Lua values, boxed primitives
-- (m_value) and boxed enums (value__).
local function scalar_of(el)
  local t = type(el)
  if t == "number" or t == "string" or t == "boolean" then return el end
  if t == "userdata" then
    local ok, mv = pcall(function () return el:get_field("m_value") end)
    if ok and mv ~= nil then return mv end
    local ok2, vv = pcall(function () return el:get_field("value__") end)
    if ok2 and vv ~= nil then return vv end
  end
  return nil
end

local function deep_dive(obj, path, depth, out, seen)
  if #out >= DEEP_MAX_LINES or obj == nil then return end
  local addr = tostring(obj)
  if seen[addr] then return end
  seen[addr] = true

  local oktdb, tdb = pcall(function () return obj:get_type_definition() end)
  if not oktdb or tdb == nil then return end
  table.insert(out, path .. " : " .. type_name_of(obj))

  -- Data is sometimes exposed through getters rather than fields.
  -- Mandrake-typed objects: list ALL methods (we need to learn how to
  -- read RE Engine's encrypted-value wrapper).
  local tn_here = type_name_of(obj)
  local list_all_methods = tn_here:find("Mandrake") ~= nil
  local okm, methods = pcall(function () return tdb:get_methods() end)
  if okm and methods then
    for _, m in ipairs(methods) do
      local okn, mname = pcall(function () return m:get_name() end)
      if okn and mname and #out < DEEP_MAX_LINES then
        if (mname:find("^get_") and type_matches(mname)) or list_all_methods then
          table.insert(out, path .. "  (method) " .. mname)
        end
      end
    end
  end

  local okf, fields = pcall(function () return tdb:get_fields() end)
  if not okf or not fields then return end
  for _, f in ipairs(fields) do
    if #out >= DEEP_MAX_LINES then return end
    local okn, fname = pcall(function () return f:get_name() end)
    if okn and fname then
      local okv, v = pcall(function () return obj:get_field(fname) end)
      if okv and v ~= nil then
        local vt = type(v)
        local child = path .. "." .. fname
        if vt == "string" or vt == "number" or vt == "boolean" then
          table.insert(out, child .. " = " .. tostring(v))
        else
          local ctn = type_name_of(v)
          local cnt = collection_count(v)
          table.insert(out, child .. " : " .. ctn .. (cnt and (" [" .. cnt .. "]") or ""))
          if depth > 0 then
            local el = (cnt == nil or cnt > 0) and first_element(v) or nil
            if el ~= nil and scalar_of(el) ~= nil then
              -- Primitive/enum element array: dump every value on one line.
              local n = math.min(cnt or 200, 200)
              local vals = {}
              for i = 0, n - 1 do
                vals[#vals + 1] = tostring(scalar_of(element_at(v, i)))
              end
              table.insert(out, child .. " = { " .. table.concat(vals, ", ") .. " }")
            elseif el ~= nil and type(el) == "userdata" then
              deep_dive(el, child .. "[0]", depth - 1, out, seen)
            elseif not is_collection_type(ctn) and type_matches(ctn) then
              deep_dive(v, child, depth - 1, out, seen)
            end
          end
        end
      end
    end
  end
end

-- Numeric field read (pcall'd get_field + scalar unbox).
local function safe_num(obj, field)
  local ok, v = pcall(function () return obj:get_field(field) end)
  if not ok or v == nil then return nil end
  local sv = scalar_of(v)
  if type(sv) == "number" then return sv end
  return nil
end

-- Numeric array element read.
local function elem_num(arr, i)
  local el = element_at(arr, i)
  if el == nil then return nil end
  local sv = scalar_of(el)
  if type(sv) == "number" then return sv end
  return nil
end

-- Field with getter fallback.
local function field_or_getter(obj, field, getter)
  local ok, v = pcall(function () return obj:get_field(field) end)
  if ok and v ~= nil then return v end
  return call0(obj, getter)
end

-- Static fields of an enum type: name = value lines.
local function dump_enum_statics(type_name)
  local tdb = sdk.find_type_definition(type_name)
  if not tdb then return { "type not found" } end
  local out = {}
  local ok, fields = pcall(function () return tdb:get_fields() end)
  if ok and fields then
    for _, f in ipairs(fields) do
      local oks, is_static = pcall(function () return f:is_static() end)
      local okn, fname = pcall(function () return f:get_name() end)
      if oks and is_static and okn and fname and fname ~= "value__" then
        local okv, val = pcall(function () return f:get_data(nil) end)
        out[#out + 1] = fname .. " = " .. tostring(okv and val or "?")
      end
    end
  end
  if #out == 0 then out[1] = "no static fields" end
  return out
end

local function dump_debug()
  local report = {
    note = "Shallow singleton map + deep dive into _UserSaveData.",
    singletons = {},
  }
  for _, name in ipairs(SINGLETON_CANDIDATES) do
    local ok, s = pcall(function () return sdk.get_managed_singleton(name) end)
    if ok and s ~= nil then
      report.singletons[name] = describe_object(s)
    else
      report.singletons[name] = "not available"
    end
  end

  local lines = {}
  local save = sdk.get_managed_singleton("app.SaveDataManager")
  local user = save and call0(save, "get_UserSaveData") or nil
  if user == nil then
    table.insert(lines, "get_UserSaveData() returned nil")
  else
    -- _UserSaveData is app.savedata.cUserSaveParam[] — one element per
    -- character slot (MAX_USER_SAVEDATA = 3). Dive into each element.
    local cnt = collection_count(user)
    table.insert(lines, "_UserSaveData : " .. type_name_of(user) ..
      (cnt and (" [" .. cnt .. "]") or ""))
    if cnt == nil or cnt > 0 then
      for i = 0, (cnt or 3) - 1 do
        local el = element_at(user, i)
        if el ~= nil and type(el) == "userdata" then
          deep_dive(el, "_UserSaveData[" .. i .. "]", DEEP_DEPTH, lines, {})
        else
          table.insert(lines, "_UserSaveData[" .. i .. "] = empty")
        end
      end
    end
    -- Blocks exposed only through getters (no plain field to recurse into).
    local slot0 = element_at(user, 0)
    if slot0 ~= nil and type(slot0) == "userdata" then
      for _, g in ipairs({ "get_EnemyReport", "get_QuestRecord", "get_Player", "get_BasicData" }) do
        local res = call0(slot0, g)
        if res ~= nil and type(res) == "userdata" then
          deep_dive(res, "_UserSaveData[0]." .. g .. "()", DEEP_DEPTH, lines, {})
        else
          table.insert(lines, "_UserSaveData[0]." .. g .. "() = nil")
        end
      end
    end
  end
  report.user_save_data_deep_dive = lines

  -- Enum statics: enemy fixed-ID table (monster ID map) + weapon types.
  report.enum_statics = {}
  for _, tn in ipairs({
    "app.EnemyDef.ID", "app.EnemyDef.ID_Fixed", "app.EnemyDef.FixedID",
    "app.EnemyDef.EM_FIXED", "app.WeaponDef.TYPE", "app.WeaponType",
    "app.PlayerDef.WpType", "app.HunterDef.WpType",
  }) do
    report.enum_statics[tn] = dump_enum_statics(tn)
  end

  -- app.EnemyDef static methods: looking for enum<->FixedId converters.
  do
    local tdb = sdk.find_type_definition("app.EnemyDef")
    if tdb then
      local out = {}
      local okm, methods = pcall(function () return tdb:get_methods() end)
      if okm and methods then
        for _, m in ipairs(methods) do
          local okn, mname = pcall(function () return m:get_name() end)
          local oks, is_static = pcall(function () return m:is_static() end)
          if okn and mname and oks and is_static then
            out[#out + 1] = mname
          end
        end
      end
      report.enemy_def_static_methods = out
    end
  end

  -- Enemy catalog: authoritative per-monster info (expect EmID + FixedId).
  do
    local em = sdk.get_managed_singleton("app.EnemyManager")
    local cat = em and call0(em, "get_Catalog") or nil
    if cat ~= nil then
      local clines = {}
      deep_dive(cat, "EnemyCatalog", 3, clines, {})
      report.enemy_catalog_dive = clines
    else
      report.enemy_catalog_dive = { "catalog unavailable" }
    end
  end

  -- Probes: export rehearsal with real reads.
  local probes = {}
  local slot0 = element_at(user, 0)
  if slot0 ~= nil and type(slot0) == "userdata" then
    probes.PlayTime = safe_num(slot0, "PlayTime")

    local basic = call0(slot0, "get_BasicData")
    if basic ~= nil then
      local okn, nm = pcall(function () return basic:get_field("CharName") end)
      probes.CharName = okn and tostring(nm) or "?"
      for _, mf in ipairs({
        "HunterPoint", "Money", "TotalMoney", "Point", "TotalPoint", "LuckyTicket",
      }) do
        local okf, m = pcall(function () return basic:get_field(mf) end)
        if okf and m ~= nil then
          probes["decode_" .. mf] = tostring(call0(m, "decode"))
        end
      end
    end

    -- Quest categories + weapon usage totals.
    local prof = call0(slot0, "get_HunterProfile")
    local qcc = prof and field_or_getter(prof, "_QuestClearCounter", "get_QuestClearCounter") or nil
    local cats = qcc and field_or_getter(qcc, "_ClearNumPerCategory", "get_ClearNumPerCategory") or nil
    if cats ~= nil then
      local n = collection_count(cats) or 20
      local main_sum, sub_sum = {}, {}
      for w = 0, 15 do main_sum[w] = 0; sub_sum[w] = 0 end
      local cat_lines, quest_total = {}, 0
      for i = 0, n - 1 do
        local c = element_at(cats, i)
        if c ~= nil then
          local num = safe_num(c, "Num") or 0
          quest_total = quest_total + num
          local fid = safe_num(c, "CategoryFixedId")
          local mw = field_or_getter(c, "MainWeaponUseNum", "get_MainWeaponUseNum")
          local sw = field_or_getter(c, "SubWeaponUseNum", "get_SubWeaponUseNum")
          for w = 0, 15 do
            main_sum[w] = main_sum[w] + (elem_num(mw, w) or 0)
            sub_sum[w] = sub_sum[w] + (elem_num(sw, w) or 0)
          end
          cat_lines[#cat_lines + 1] = string.format("[%d] fid=%s num=%d",
            i, tostring(fid), num)
        end
      end
      probes.quest_categories = cat_lines
      probes.quest_total = quest_total
      local function join16(t)
        local parts = {}
        for w = 0, 15 do parts[#parts + 1] = tostring(t[w] or 0) end
        return table.concat(parts, ", ")
      end
      probes.weapon_main_sum = join16(main_sum)
      probes.weapon_sub_sum = join16(sub_sum)
    end

    -- Full boss hunting log (non-empty entries only).
    local er = call0(slot0, "get_EnemyReport")
    local boss = er and field_or_getter(er, "_Boss", "get_Boss") or nil
    if boss ~= nil then
      local bn = collection_count(boss) or 100
      local blog = {}
      for i = 0, bn - 1 do
        local b = element_at(boss, i)
        if b ~= nil then
          local slay = safe_num(b, "SlayingNum") or 0
          local cap = safe_num(b, "CaptureNum") or 0
          local state = safe_num(b, "EnemyState") or 0
          if slay > 0 or cap > 0 or state > 0 then
            blog[#blog + 1] = string.format(
              "[%d] fid=%s state=%s slay=%d cap=%d min=%s max=%s",
              i, tostring(safe_num(b, "FixedId")), state, slay, cap,
              tostring(safe_num(b, "MixSize")), tostring(safe_num(b, "MaxSize")))
          end
        end
      end
      probes.boss_log = blog
    end
  end
  report.probes = probes

  local ok, err = pcall(function () json.dump_file(DEBUG_FILE, report) end)
  if ok then
    say("debug info written to reframework/data/" .. DEBUG_FILE ..
      " (" .. #lines .. " deep-dive lines)")
  else
    say("debug dump failed: " .. tostring(err))
  end
end

-- ─────────────────────────────────────────────────────────────────────────
-- Export
-- ─────────────────────────────────────────────────────────────────────────

local function iso_utc_now()
  return os.date("!%Y-%m-%dT%H:%M:%SZ")
end

-- The save slot marked Active (falls back to slot 0).
local function active_slot(save)
  local user = call0(save, "get_UserSaveData")
  if user == nil then return nil end
  local cnt = collection_count(user) or 3
  for i = 0, cnt - 1 do
    local s = element_at(user, i)
    if s ~= nil and type(s) == "userdata" and safe_num(s, "Active") == 1 then
      return s
    end
  end
  return element_at(user, 0)
end

-- Read a Mandrake-encrypted numeric field (via.rds.Mandrake:decode()).
local function decode_mandrake(obj, field)
  local ok, m = pcall(function () return obj:get_field(field) end)
  if not ok or m == nil then return nil end
  local v = call0(m, "decode")
  if type(v) == "number" then return math.floor(v + 0.5) end
  return nil
end

local function build_export()
  local missing = {}
  local export = {
    schema = "mhw-stats/1",
    exported_at = iso_utc_now(),
    hunter = {},
    quests = { total_completed = 0, categories = {} },
    weapons = {},
    monsters = {},
  }

  local save = sdk.get_managed_singleton("app.SaveDataManager")
  local slot = save and active_slot(save) or nil
  if slot == nil then
    export.hunter.name = "Unknown"
    table.insert(missing, "save_slot")
    return export, missing
  end

  -- Identity & basics.
  local basic = field_or_getter(slot, "_BasicData", "get_BasicData")
  if basic ~= nil then
    local okn, nm = pcall(function () return basic:get_field("CharName") end)
    if okn and nm ~= nil then export.hunter.name = tostring(nm) end
    export.hunter.zenny        = decode_mandrake(basic, "Money")
    export.hunter.guild_points = decode_mandrake(basic, "Point")
    export.hunter.hr_points    = decode_mandrake(basic, "HunterPoint")
  else
    table.insert(missing, "basic_data")
  end
  if export.hunter.name == nil then export.hunter.name = "Unknown" end
  local oksid, sid = pcall(function () return slot:get_field("HunterShortId") end)
  if oksid and sid ~= nil then export.hunter.short_id = tostring(sid) end
  export.hunter.playtime_sec = safe_num(slot, "PlayTime")
  for _, k in ipairs({ "zenny", "guild_points", "hr_points", "playtime_sec" }) do
    if export.hunter[k] == nil then table.insert(missing, "hunter." .. k) end
  end

  -- Quest categories + per-weapon main/sub usage.
  local prof = field_or_getter(slot, "_HunterProfile", "get_HunterProfile")
  local qcc = prof and field_or_getter(prof, "_QuestClearCounter", "get_QuestClearCounter") or nil
  local cats = qcc and field_or_getter(qcc, "_ClearNumPerCategory", "get_ClearNumPerCategory") or nil
  if cats ~= nil then
    local main_sum, sub_sum = {}, {}
    for w = 0, 13 do main_sum[w] = 0; sub_sum[w] = 0 end
    local total = 0
    local n = collection_count(cats) or 20
    for i = 0, n - 1 do
      local c = element_at(cats, i)
      if c ~= nil then
        local num = safe_num(c, "Num") or 0
        total = total + num
        local cslug = QUEST_CATEGORY_SLUGS[i]
        if cslug ~= nil then export.quests.categories[cslug] = num end
        local mw = field_or_getter(c, "MainWeaponUseNum", "get_MainWeaponUseNum")
        local sw = field_or_getter(c, "SubWeaponUseNum", "get_SubWeaponUseNum")
        for w = 0, 13 do
          main_sum[w] = main_sum[w] + (elem_num(mw, w) or 0)
          sub_sum[w] = sub_sum[w] + (elem_num(sw, w) or 0)
        end
      end
    end
    export.quests.total_completed = total
    for w = 0, 13 do
      local slug = WEAPON_SLUGS[w]
      if slug and (main_sum[w] > 0 or sub_sum[w] > 0) then
        export.weapons[slug] = { main = main_sum[w], sub = sub_sum[w] }
      end
    end
  else
    table.insert(missing, "quests")
  end

  -- Monster hunting log.
  local er = field_or_getter(slot, "_EnemyReport", "get_EnemyReport")
  local boss = er and field_or_getter(er, "_Boss", "get_Boss") or nil
  if boss ~= nil then
    local bn = collection_count(boss) or 100
    for i = 0, bn - 1 do
      local b = element_at(boss, i)
      if b ~= nil then
        local fid = safe_num(b, "FixedId")
        local slug = fid and MONSTER_FID_SLUGS[fid] or nil
        if slug ~= nil then
          local slay = safe_num(b, "SlayingNum") or 0
          local cap = safe_num(b, "CaptureNum") or 0
          local state = safe_num(b, "EnemyState") or 0
          if slay > 0 or cap > 0 or state > 0 then
            local rec = { slain = slay, captured = cap }
            local minp = safe_num(b, "MixSize")
            local maxp = safe_num(b, "MaxSize")
            if minp ~= nil and minp < 9999 then rec.min_pct = minp end
            if maxp ~= nil and maxp > 0 then rec.max_pct = maxp end
            export.monsters[slug] = rec
          end
        end
      end
    end
  else
    table.insert(missing, "monsters")
  end

  if #missing > 0 then
    export.missing_fields = missing
  end
  return export, missing
end

local function do_export()
  local data, missing = build_export()
  local ok, err = pcall(function () json.dump_file(EXPORT_FILE, data) end)
  if ok then
    if #missing > 0 then
      say("exported with " .. #missing .. " unreadable field(s): "
        .. table.concat(missing, ", "))
    else
      say("stats exported to reframework/data/" .. EXPORT_FILE)
    end
  else
    say("export failed: " .. tostring(err))
  end
  return ok
end

local function copy_to_clipboard()
  local data = build_export()
  local text = json.dump_string and json.dump_string(data) or nil
  -- Older REFramework builds lack json.dump_string; fall back to manual.
  if not text then
    local ok, s = pcall(function ()
      json.dump_file(EXPORT_FILE, data)
      local f = io.open("reframework/data/" .. EXPORT_FILE, "r")
      if not f then return nil end
      local content = f:read("*a")
      f:close()
      return content
    end)
    if ok then text = s end
  end
  if text and imgui.set_clipboard_text then
    imgui.set_clipboard_text(text)
    say("stats JSON copied to clipboard — paste it on the tracker page.")
  else
    say("clipboard unavailable in this REFramework build; use the exported file instead.")
  end
end

local function open_data_folder()
  pcall(function ()
    os.execute('explorer "reframework\\data"')
  end)
end

-- ─────────────────────────────────────────────────────────────────────────
-- UI (inside the REFramework overlay)
-- ─────────────────────────────────────────────────────────────────────────

local function draw_ui()
  imgui.text("Export your hunter profile for the web tracker.")
  imgui.spacing()

  if imgui.button("Export stats to file") then
    do_export()
  end
  imgui.same_line()
  if imgui.button("Copy to clipboard") then
    copy_to_clipboard()
  end
  imgui.same_line()
  if imgui.button("Open data folder") then
    open_data_folder()
  end

  imgui.spacing()
  imgui.separator()
  imgui.spacing()

  if imgui.button("Dump debug info (diagnostics)") then
    dump_debug()
  end
  imgui.text("Not needed for normal use. Writes a diagnostics file")
  imgui.text("to reframework/data/mhw_stats_debug.json.")
end

-- Frame isolation: nothing in this callback may ever throw. An escaping
-- error can corrupt REFramework's shared ImGui frame and surface as an
-- error blamed on another script. Belt and suspenders: outer pcall +
-- tree_pop safety + one-time log (no per-frame log spam).
local ui_error_reported = false

re.on_draw_ui(function ()
  local opened = false
  local ok, err = pcall(function ()
    if imgui.tree_node("MHW Stats Exporter") then
      opened = true
      -- Inner guard: a draw error must never skip TreePop (ImGui asserts).
      local ok2, err2 = pcall(draw_ui)
      imgui.tree_pop()
      opened = false
      if not ok2 then imgui.text("UI error: " .. tostring(err2)) end
    end
  end)
  if not ok then
    if opened then pcall(imgui.tree_pop) end
    if not ui_error_reported then
      ui_error_reported = true
      say("ui frame error (isolated, other scripts unaffected): " .. tostring(err))
    end
  end
end)

say("exporter loaded — open the REFramework overlay to use it.")
