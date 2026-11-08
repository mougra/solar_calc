/**
 * Генератор data/insolation.json из PVGIS (JRC).
 *
 * Использует PVcalc в режиме PVcalculation=1: он отдаёт месячные суммы
 * прихода на наклонную плоскость (H(i)_m) для произвольного угла.
 * Три конфигурации: оптимальный угол, 30°, 60°. Период — весь массив
 * базы (SARAH3 ~2005–2023), это климатологически устойчивее 3 лет.
 *
 * Выше 65° с.ш. PVGIS сам переключается на ERA5 (проверено на Мурманске).
 *
 * Использование:
 *   node scripts/build-insolation.mjs
 *   node scripts/build-insolation.mjs --limit=3
 *   node scripts/build-insolation.mjs --slugs=moskva,sochi
 *
 * Кэш сырых ответов: .cache/pvgis/<slug>-<db>-<angle>.json
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CITIES } from "../data/cities.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE_DIR = path.join(ROOT, ".cache", "pvgis");
const OUT_FILE = path.join(ROOT, "data", "insolation.json");

const API = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc";
const DELAY_MS = 900;

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const slugsArg = args.find((a) => a.startsWith("--slugs="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const slugs = slugsArg ? new Set(slugsArg.split("=")[1].split(",")) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildUrl(city, { db, angle }) {
  const params = new URLSearchParams({
    lat: String(city.lat),
    lon: String(city.lon),
    peakpower: "1",
    loss: "0",
    PVcalculation: "1",
    outputformat: "json",
  });
  if (angle === "optimal") {
    params.set("optimalinclination", "1");
  } else {
    params.set("angle", angle);
    params.set("aspect", "0");
  }
  if (db) params.set("raddatabase", db);
  return `${API}?${params.toString()}`;
}

async function fetchJson(url) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(4000 * (attempt + 1));
        continue;
      }
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 160)}`);
      }
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      await sleep(1500 * 2 ** attempt);
    }
  }
  throw lastError;
}

/** H(i)_m по месяцам, кВт·ч/м²/мес. */
function monthlyInclined(data) {
  const rows = data.outputs?.monthly?.fixed;
  if (!Array.isArray(rows) || rows.length !== 12) {
    throw new Error("неожиданная структура ответа PVGIS");
  }
  return rows.map((row) => {
    const value = row["H(i)_m"];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error("нет значения H(i)_m");
    }
    return value;
  });
}

async function getMeasurement(city, db, angle) {
  const key = `${city.slug}-${db ?? "auto"}-${angle}.json`;
  const cachePath = path.join(CACHE_DIR, key);
  try {
    const cached = JSON.parse(await readFile(cachePath, "utf8"));
    return cached;
  } catch {
    // кэша нет
  }
  const data = await fetchJson(buildUrl(city, { db, angle }));
  await writeFile(cachePath, JSON.stringify(data));
  await sleep(DELAY_MS);
  return data;
}

async function buildCity(city) {
  let db = null;
  let optimal;
  try {
    optimal = await getMeasurement(city, null, "optimal");
  } catch (error) {
    if (/HTTP 4\d\d/.test(error.message)) {
      db = "PVGIS-ERA5";
      optimal = await getMeasurement(city, db, "optimal");
    } else {
      throw error;
    }
  }

  const actualDb = optimal.inputs?.meteo_data?.radiation_db ?? "PVGIS-SARAH3";
  const source = actualDb.includes("ERA5") ? "ERA5" : "SARAH3";
  const tilt = optimal.inputs?.mounting_system?.fixed?.slope?.value ?? 40;

  const at30 = await getMeasurement(city, db, "30");
  const at60 = await getMeasurement(city, db, "60");

  const psh = monthlyInclined(optimal).map((kwh) => kwh); // кВт·ч/м²/мес
  const round = (arr) => arr.map((v) => Math.round(v * 1000) / 1000);

  return {
    source,
    entry: {
      lat: city.lat,
      lon: city.lon,
      optimalTilt: Math.round(tilt),
      source,
      monthlyKwhM2: round(psh),
      monthlyKwhM2Tilt30: round(monthlyInclined(at30)),
      monthlyKwhM2Tilt60: round(monthlyInclined(at60)),
      period: {
        start: optimal.inputs?.meteo_data?.year_min ?? null,
        end: optimal.inputs?.meteo_data?.year_max ?? null,
      },
    },
  };
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });

  let targets = CITIES;
  if (slugs) targets = targets.filter((c) => slugs.has(c.slug));
  targets = targets.slice(0, limit);

  console.log(`Городов к обработке: ${targets.length}`);

  const cities = {};
  let done = 0;

  for (const city of targets) {
    try {
      const { entry } = await buildCity(city);
      cities[city.slug] = entry;
    } catch (error) {
      console.error(`  ✖ ${city.slug}: ${error.message}`);
    }
    done += 1;
    if (done % 5 === 0 || done === targets.length) {
      console.log(`  ${done}/${targets.length}…`);
    }
  }

  const existing = await readFile(OUT_FILE, "utf8")
    .then((raw) => JSON.parse(raw))
    .catch(() => ({ cities: {} }));

  const merged = { ...existing.cities, ...cities };

  const output = {
    meta: {
      source: "PVGIS v5.3 PVcalc, JRC",
      years: "полный период базы (SARAH3 2005–2023, ERA5 выше 65° с.ш.)",
      generated: new Date().toISOString(),
      fields:
        "monthlyKwhM2 — кВт·ч/м²/мес на наклон под оптимальным углом; Tilt30/Tilt60 — 30° и 60°",
    },
    cities: merged,
  };

  await writeFile(OUT_FILE, JSON.stringify(output, null, 2) + "\n");
  console.log(`Записано городов: ${Object.keys(merged).length} → ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
