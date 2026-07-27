/* ──────────────────────────────────────────
   MH Wilds Stat Tracker — static game data
   Weapon & large-monster reference data.
   Slugs are the stable identifiers used by the
   export schema ("mhw-stats/1"); the REFramework
   exporter maps in-game IDs to these slugs.

   Data provenance (verified 2026-07):
   - Weapon indices: app.WeaponDef.TYPE enum dump.
   - Monster EM codes: app.EnemyDef.ID enum dump +
     community datamine names.
   - baseSize & crown thresholds: HunterPie
     MonsterData.xml, cross-checked against in-game
     field-guide values (Chatacabra 498.29 cm base).
   - Crown thresholds are size-percent of baseSize:
     gold >= gold, silver >= silver, mini <= mini.
   ────────────────────────────────────────── */

window.MHW_DATA = {

  schemaVersion: "mhw-stats/1",

  /* The 14 weapon types. `wtype` = app.WeaponDef.TYPE index
     (Capcom internal order; drives MainWeaponUseNum[16]). */
  weapons: [
    { slug: "great_sword",      name: "Great Sword",     wtype: 0  },
    { slug: "sword_and_shield", name: "Sword & Shield",  wtype: 1  },
    { slug: "dual_blades",      name: "Dual Blades",     wtype: 2  },
    { slug: "long_sword",       name: "Long Sword",      wtype: 3  },
    { slug: "hammer",           name: "Hammer",          wtype: 4  },
    { slug: "hunting_horn",     name: "Hunting Horn",    wtype: 5  },
    { slug: "lance",            name: "Lance",           wtype: 6  },
    { slug: "gunlance",         name: "Gunlance",        wtype: 7  },
    { slug: "switch_axe",       name: "Switch Axe",      wtype: 8  },
    { slug: "charge_blade",     name: "Charge Blade",    wtype: 9  },
    { slug: "insect_glaive",    name: "Insect Glaive",   wtype: 10 },
    { slug: "bow",              name: "Bow",             wtype: 11 },
    { slug: "heavy_bowgun",     name: "Heavy Bowgun",    wtype: 12 },
    { slug: "light_bowgun",     name: "Light Bowgun",    wtype: 13 }
  ],

  /* Large monsters. `em` = app.EnemyDef.ID code. `fid` = save-data
     FixedId (filled in as the mapping is verified). `baseSize` in cm.
     Crowns as size-percent thresholds. `added` is informational. */
  monsters: [
    /* ── Launch roster ── */
    { slug: "chatacabra",              name: "Chatacabra",              em: "EM0152_00_0", fid: 33,   baseSize: 498.3,     crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Amphibian",      added: "launch" },
    { slug: "quematrice",              name: "Quematrice",              em: "EM0153_00_0", fid: -34937520, baseSize: 1244.165,  crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Brute Wyvern",   added: "launch" },
    { slug: "lala_barina",             name: "Lala Barina",             em: "EM0070_00_0", fid: -1363370496, baseSize: 731.9625,  crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Temnoceran",     added: "launch" },
    { slug: "congalala",               name: "Congalala",               em: "EM0022_00_0", fid: 2129596800, baseSize: 899.3712,  crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Fanged Beast",   added: "launch" },
    { slug: "balahara",                name: "Balahara",                em: "EM0151_00_0", fid: 16, baseSize: 1912.616,  crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Leviathan",      added: "launch" },
    { slug: "doshaguma",               name: "Doshaguma",               em: "EM0150_00_0", fid: 15, baseSize: 1390.47,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Fanged Beast",   added: "launch" },
    { slug: "uth_duna",                name: "Uth Duna",                em: "EM0157_00_0", fid: 1467998976, baseSize: 2979.2935, crowns: { gold: 113, silver: 109, mini: 90 }, capturable: true,  type: "Leviathan",      added: "launch" },
    { slug: "rompopolo",               name: "Rompopolo",               em: "EM0155_00_0", fid: 567628288, baseSize: 1197.82,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Brute Wyvern",   added: "launch" },
    { slug: "rey_dau",                 name: "Rey Dau",                 em: "EM0156_00_0", fid: -1547364608, baseSize: 2057.0854, crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Flying Wyvern",  added: "launch" },
    { slug: "nerscylla",               name: "Nerscylla",               em: "EM0154_00_0", fid: -1528962176, baseSize: 698.7456,  crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Temnoceran",     added: "launch" },
    { slug: "hirabami",                name: "Hirabami",                em: "EM0161_00_0", fid: 222933952, baseSize: 1659.3395, crowns: { gold: 113, silver: 109, mini: 90 }, capturable: true,  type: "Leviathan",      added: "launch" },
    { slug: "ajarakan",                name: "Ajarakan",                em: "EM0159_00_0", fid: 777460864, baseSize: 1164.36,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Fanged Beast",   added: "launch" },
    { slug: "nu_udra",                 name: "Nu Udra",                 em: "EM0158_00_0", fid: 1657778432, baseSize: 2093.7,    crowns: { gold: 113, silver: 109, mini: 90 }, capturable: true,  type: "Cephalopod",     added: "launch" },
    { slug: "guardian_doshaguma",      name: "Guardian Doshaguma",      em: "EM0150_50_0", fid: -1916429696, baseSize: 1390.47,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Construct",      added: "launch" },
    { slug: "guardian_ebony_odogaron", name: "Guardian Ebony Odogaron", em: "EM0113_51_0", fid: 1663995904, baseSize: 1388.7515, crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Construct",      added: "launch" },
    { slug: "xu_wu",                   name: "Xu Wu",                   em: "EM0163_00_0", fid: 1401863296, baseSize: 1396.3015, crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Cephalopod",     added: "launch" },
    { slug: "guardian_rathalos",       name: "Guardian Rathalos",       em: "EM0002_50_0", fid: 1411933184, baseSize: 1704.22,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Construct",      added: "launch" },
    { slug: "guardian_fulgur_anjanath",name: "Guardian Fulgur Anjanath",em: "EM0100_51_0", fid: 107194928, baseSize: 1646.46,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Construct",      added: "launch" },
    { slug: "guardian_arkveld",        name: "Guardian Arkveld",        em: "EM0160_50_0", fid: -283654400, baseSize: 1666.54,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: false, type: "Construct",      added: "launch" },
    { slug: "jin_dahaad",              name: "Jin Dahaad",              em: "EM0162_00_0", fid: 1553456768, baseSize: 4560.894,  crowns: { gold: 123, silver: 115, mini: 90 }, capturable: false, type: "Leviathan",      added: "launch" },
    { slug: "yian_kut_ku",             name: "Yian Kut-Ku",             em: "EM0008_00_0", fid: 402056736, baseSize: 994.5472,  crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Bird Wyvern",    added: "launch" },
    { slug: "gypceros",                name: "Gypceros",                em: "EM0009_00_0", fid: 1049705664, baseSize: 964.138,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Bird Wyvern",    added: "launch" },
    { slug: "rathian",                 name: "Rathian",                 em: "EM0001_00_0", fid: 26, baseSize: 1754.37,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Flying Wyvern",  added: "launch" },
    { slug: "rathalos",                name: "Rathalos",                em: "EM0002_00_0", fid: 1965232896, baseSize: 1704.22,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Flying Wyvern",  added: "launch" },
    { slug: "gravios",                 name: "Gravios",                 em: "EM0005_00_0", fid: -535078400, baseSize: 2100.58,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Flying Wyvern",  added: "launch" },
    { slug: "blangonga",               name: "Blangonga",               em: "EM0021_00_0", fid: -1440201088, baseSize: 1051.15,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Fanged Beast",   added: "launch" },
    { slug: "arkveld",                 name: "Arkveld",                 em: "EM0160_00_0", fid: 746996864, baseSize: 1666.54,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Flying Wyvern",  added: "launch" },
    { slug: "zoh_shia",                name: "Zoh Shia",                em: "EM0164_50_0", fid: -2003468672, baseSize: 4623.598,  crowns: { gold: 123, silver: 115, mini: 90 }, capturable: false, type: "Construct",      added: "launch" },
    /* ── Title updates ── */
    { slug: "mizutsune",               name: "Mizutsune",               em: "EM0082_00_0", fid: 32634, baseSize: 1923.434,  crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Leviathan",      added: "tu1"    },
    { slug: "gore_magala",             name: "Gore Magala",             em: "EM0071_00_0", fid: -758250816, baseSize: 1765.9,    crowns: { gold: 117, silver: 111, mini: 90 }, capturable: true,  type: "Demi Elder",     added: "tu1"    },
    { slug: "lagiacrus",               name: "Lagiacrus",               em: "EM0046_00_0", fid: -1083842944, baseSize: 2535.46,   crowns: { gold: 113, silver: 109, mini: 90 }, capturable: true,  type: "Leviathan",      added: "tu2"    },
    { slug: "seregios",                name: "Seregios",                em: "EM0077_00_0", fid: 25, baseSize: 1730.27,   crowns: { gold: 123, silver: 115, mini: 90 }, capturable: true,  type: "Flying Wyvern",  added: "tu2"    },
    { slug: "omega_planetes",          name: "Omega Planetes",          em: "EM0166_00_0", fid: 21849, baseSize: null,      crowns: { gold: 123, silver: 115, mini: 90 }, capturable: false, type: "Construct",      added: "tu3"    },
    { slug: "gogmazios",               name: "Gogmazios",               em: "EM0078_00_0", fid: 13052, baseSize: null,      crowns: { gold: 123, silver: 115, mini: 90 }, capturable: false, type: "Elder Dragon",   added: "final"  }
  ],

  /* Quest categories (index in _ClearNumPerCategory[]).
     0–4 verified against in-game Hunter Profile counters;
     5–7 ordering unverified (all zero in reference save). */
  questCategories: [
    { slug: "assignments",    name: "Assignments",          index: 0 },
    { slug: "optional",       name: "Optional Quests",      index: 1 },
    { slug: "field_survey",   name: "Field Survey",         index: 2 },
    { slug: "arena",          name: "Arena Quests",         index: 3 },
    { slug: "investigations", name: "Investigations",       index: 4 },
    { slug: "event",          name: "Event Quests",         index: 5 },
    { slug: "free_challenge", name: "Free Challenge Quests",index: 6 },
    { slug: "challenge",      name: "Challenge Quests",     index: 7 }
  ],

  /* Fast lookups, built once at load. */
  weaponBySlug:  {},
  monsterBySlug: {},
  weaponByWtype: {},
  monsterByFid:  {},
  questCategoryBySlug: {}
};

window.MHW_DATA.weapons.forEach(function (w) {
  window.MHW_DATA.weaponBySlug[w.slug]   = w;
  window.MHW_DATA.weaponByWtype[w.wtype] = w;
});
window.MHW_DATA.monsters.forEach(function (m) {
  window.MHW_DATA.monsterBySlug[m.slug] = m;
  if (m.fid !== null && m.fid !== undefined) window.MHW_DATA.monsterByFid[m.fid] = m;
});
window.MHW_DATA.questCategories.forEach(function (c) {
  window.MHW_DATA.questCategoryBySlug[c.slug] = c;
});
