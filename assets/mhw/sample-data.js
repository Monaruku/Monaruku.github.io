/* ──────────────────────────────────────────
   MH Wilds Stat Tracker — sample export
   A realistic demo payload in the "mhw-stats/1"
   schema, used by the "Load sample data" button.
   Also serves as living documentation for the
   schema the REFramework exporter produces.

   Schema ("mhw-stats/1"):
   {
     schema:      "mhw-stats/1",
     exported_at: ISO-8601 string,
     hunter: {
       name:         string,
       short_id:     string (optional),
       hr_points:    int (optional; HR itself is
                     derived in-game and not exported),
       playtime_sec: int (optional),
       zenny:        int (optional),
       guild_points: int (optional)
     },
     quests: {
       total_completed: int,
       categories: { assignments, optional, field_survey,
                     arena, investigations, event,
                     free_challenge, challenge }  // ints
     },
     weapons:  { "<weapon_slug>":  { main: int, sub: int } },
     monsters: { "<monster_slug>": {
       slain:    int,           // killed (excluding captures)
       captured: int,           // subset of total hunts
       min_pct:  int (optional),// smallest size, % of base
       max_pct:  int (optional) // largest size, % of base
     } }
   }
   Crowns and cm sizes are derived page-side from
   min_pct/max_pct plus the tables in mhw-data.js.
   ────────────────────────────────────────── */

window.MHW_SAMPLE_DATA = {
  schema: "mhw-stats/1",
  exported_at: "2026-07-20T21:14:00Z",

  hunter: {
    name: "Monaruku",
    short_id: "A12B3C45",
    hr_points: 210450,
    playtime_sec: 345600,
    zenny: 2450320,
    guild_points: 45230
  },

  quests: {
    total_completed: 480,
    categories: {
      assignments: 120,
      optional: 145,
      field_survey: 98,
      arena: 12,
      investigations: 64,
      event: 38,
      free_challenge: 3,
      challenge: 0
    }
  },

  /* main = quests started with it as main weapon,
     sub = quests with it as secondary weapon. */
  weapons: {
    long_sword:       { main: 148, sub: 24 },
    charge_blade:     { main: 92,  sub: 41 },
    great_sword:      { main: 86,  sub: 10 },
    hunting_horn:     { main: 54,  sub: 88 },
    bow:              { main: 47,  sub: 5 },
    switch_axe:       { main: 31,  sub: 12 },
    dual_blades:      { main: 12,  sub: 3 },
    insect_glaive:    { main: 6,   sub: 2 },
    heavy_bowgun:     { main: 4,   sub: 19 },
    sword_and_shield: { main: 0,   sub: 7 },
    gunlance:         { main: 0,   sub: 1 }
  },

  /* slain + captured = total hunts; sizes as % of base. */
  monsters: {
    chatacabra:              { slain: 6,  captured: 2,  min_pct: 95,  max_pct: 118 },
    quematrice:              { slain: 5,  captured: 1,  min_pct: 100, max_pct: 121 },
    lala_barina:             { slain: 8,  captured: 0,  min_pct: 100, max_pct: 109 },
    congalala:               { slain: 4,  captured: 1,  min_pct: 91,  max_pct: 124 },
    balahara:                { slain: 5,  captured: 2,  min_pct: 97,  max_pct: 116 },
    doshaguma:               { slain: 9,  captured: 3,  min_pct: 89,  max_pct: 130 },
    uth_duna:                { slain: 3,  captured: 1,  min_pct: 100, max_pct: 110 },
    rompopolo:               { slain: 6,  captured: 0,  min_pct: 92,  max_pct: 120 },
    rey_dau:                 { slain: 7,  captured: 2,  min_pct: 94,  max_pct: 119 },
    nerscylla:               { slain: 5,  captured: 1,  min_pct: 100, max_pct: 112 },
    hirabami:                { slain: 4,  captured: 2,  min_pct: 90,  max_pct: 114 },
    ajarakan:                { slain: 8,  captured: 2,  min_pct: 91,  max_pct: 122 },
    nu_udra:                 { slain: 2,  captured: 0,  min_pct: 100, max_pct: 105 },
    guardian_doshaguma:      { slain: 6,  captured: 1,  min_pct: 96,  max_pct: 117 },
    guardian_ebony_odogaron: { slain: 5,  captured: 0,  min_pct: 100, max_pct: 118 },
    xu_wu:                   { slain: 3,  captured: 1,  min_pct: 100, max_pct: 107 },
    guardian_rathalos:       { slain: 4,  captured: 2,  min_pct: 93,  max_pct: 121 },
    guardian_fulgur_anjanath:{ slain: 2,  captured: 1,  min_pct: 100, max_pct: 113 },
    guardian_arkveld:        { slain: 3,  captured: 0,  min_pct: 100, max_pct: 108 },
    jin_dahaad:              { slain: 1,  captured: 0,  min_pct: 100, max_pct: 100 },
    yian_kut_ku:             { slain: 3,  captured: 2,  min_pct: 98,  max_pct: 110 },
    gypceros:                { slain: 2,  captured: 1,  min_pct: 95,  max_pct: 106 },
    rathian:                 { slain: 7,  captured: 4,  min_pct: 92,  max_pct: 119 },
    rathalos:                { slain: 6,  captured: 2,  min_pct: 90,  max_pct: 124 },
    gravios:                 { slain: 3,  captured: 1,  min_pct: 100, max_pct: 115 },
    blangonga:               { slain: 5,  captured: 0,  min_pct: 100, max_pct: 116 },
    arkveld:                 { slain: 4,  captured: 1,  min_pct: 97,  max_pct: 112 },
    zoh_shia:                { slain: 2,  captured: 0,  min_pct: 100, max_pct: 103 },
    mizutsune:               { slain: 4,  captured: 6,  min_pct: 96,  max_pct: 118 },
    gore_magala:             { slain: 3,  captured: 1,  min_pct: 100, max_pct: 113 },
    lagiacrus:               { slain: 2,  captured: 2,  min_pct: 100, max_pct: 110 },
    seregios:                { slain: 4,  captured: 1,  min_pct: 100, max_pct: 123 },
    omega_planetes:          { slain: 0,  captured: 0 },
    gogmazios:               { slain: 1,  captured: 0, min_pct: 100, max_pct: 100 }
  }
};
