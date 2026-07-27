/**
 * MHWilds Monster Icon Downloader
 * ================================
 * Cloudflare blocks all non-browser clients, so this runs inside YOUR browser
 * (which has already passed the challenge).
 *
 * HOW TO USE:
 * 1. Open https://monsterhunterwiki.org/wiki/Category:MHWilds_Monster_Icons in your browser
 * 2. Press F12 to open DevTools, go to the "Console" tab
 * 3. Paste this ENTIRE script and press Enter
 * 4. Wait ~10 seconds -> "mhwilds-monster-icons.zip" downloads with all 56 icons
 *
 * Files are renamed cleanly: MHWA-Guardian_Arkveld_Icon.webp -> guardian-arkveld.webp
 */
(async () => {
  const paths = [
    "d/d5/MHWA-Ajarakan_Icon.webp",
    "d/de/MHWA-Alpha_Doshaguma_Icon.webp",
    "e/e1/MHWA-Arkveld_Icon.webp",
    "7/7e/MHWA-Balahara_Icon.webp",
    "f/fd/MHWA-Baunos_Icon.webp",
    "f/ff/MHWA-Blango_Icon.webp",
    "5/5b/MHWA-Blangonga_Icon.webp",
    "2/23/MHWA-Bulaqchi_Icon.webp",
    "a/af/MHWA-Ceratonoth_Female_Icon.png",
    "3/36/MHWA-Ceratonoth_Icon.webp",
    "4/40/MHWA-Chatacabra_Icon.webp",
    "7/7d/MHWA-Comaqchi_Icon.webp",
    "7/73/MHWA-Conga_Icon.webp",
    "2/2f/MHWA-Congalala_Icon.webp",
    "3/33/MHWA-Dalthydon_Icon.webp",
    "1/14/MHWA-Doshaguma_Icon.webp",
    "6/63/MHWA-Gajios_Icon.webp",
    "2/2d/MHWA-Gelidron_Icon.webp",
    "e/e2/MHWA-Gogmazios_Icon.webp",
    "0/02/MHWA-Gore_Magala_Icon.webp",
    "6/6e/MHWA-Gravios_Icon.webp",
    "6/60/MHWA-Guardian_Arkveld_Icon.webp",
    "4/4d/MHWA-Guardian_Doshaguma_Icon.webp",
    "5/59/MHWA-Guardian_Ebony_Odogaron_Icon.webp",
    "1/12/MHWA-Guardian_Fulgur_Anjanath_Icon.webp",
    "9/96/MHWA-Guardian_Rathalos_Icon.webp",
    "9/99/MHWA-Guardian_Seikret_Icon.webp",
    "3/3d/MHWA-Gypceros_Icon.webp",
    "e/e4/MHWA-Harpios_Icon.webp",
    "2/26/MHWA-Hirabami_Icon.webp",
    "2/24/MHWA-Jin_Dahaad_Icon.webp",
    "6/66/MHWA-Kranodath_Icon.webp",
    "4/49/MHWA-Lagiacrus_Icon.webp",
    "f/fb/MHWA-Lala_Barina_Icon.webp",
    "b/b3/MHWA-Mizutsune_Icon.webp",
    "b/b8/MHWA-Nerscylla_Hatchling_Icon.webp",
    "5/57/MHWA-Nerscylla_Icon.webp",
    "3/30/MHWA-Nu_Udra_Icon.webp",
    "3/3d/MHWA-Omega_Micros_Icon.webp",
    "a/ad/MHWA-Omega_Planetes_Icon.webp",
    "8/8a/MHWA-Piragill_Icon.webp",
    "a/a5/MHWA-Porkeplume_Icon.webp",
    "9/94/MHWA-Quematrice_Icon.webp",
    "7/75/MHWA-Question_Mark_Icon.png",
    "6/64/MHWA-Rafma_Icon.webp",
    "3/33/MHWA-Rathalos_Icon.webp",
    "8/8d/MHWA-Rathian_Icon.webp",
    "6/6b/MHWA-Rey_Dau_Icon.webp",
    "5/5f/MHWA-Rompopolo_Icon.webp",
    "b/b0/MHWA-Seregios_Icon.webp",
    "0/01/MHWA-Talioth_Icon.webp",
    "7/7b/MHWA-Uth_Duna_Icon.webp",
    "e/e3/MHWA-Vespoid_Icon.webp",
    "b/bf/MHWA-Xu_Wu_Icon.webp",
    "3/35/MHWA-Yian_Kut-Ku_Icon.webp",
    "f/fa/MHWA-Zoh_Shia_Icon.webp"
  ];

  // Clean filename: MHWA-Guardian_Arkveld_Icon.webp -> guardian-arkveld.webp
  const cleanName = (p) => {
    const file = p.split("/").pop();
    return file
      .replace(/^MHWA-/, "")
      .replace(/_Icon\.(webp|png)$/, ".$1")
      .toLowerCase()
      .replace(/_/g, "-");
  };

  console.log(`[icons] Fetching ${paths.length} monster icons...`);

  // Load JSZip from CDN
  if (typeof JSZip === "undefined") {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load JSZip"));
      document.head.appendChild(s);
    });
  }

  const zip = new JSZip();
  let ok = 0, fail = 0;

  for (const p of paths) {
    const name = cleanName(p);
    try {
      const res = await fetch("https://monsterhunterwiki.org/images/" + p, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      zip.file(name, await res.blob());
      ok++;
      console.log(`[icons] ${ok}/${paths.length} ${name}`);
    } catch (e) {
      fail++;
      console.warn(`[icons] FAILED ${name}: ${e.message}`);
    }
  }

  console.log(`[icons] Zipping ${ok} files...`);
  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mhwilds-monster-icons.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);

  console.log(`[icons] DONE! ${ok} succeeded, ${fail} failed. Check your downloads folder.`);
})();
