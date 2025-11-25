import { existsSync, mkdirSync } from "node:fs";
import { join, parse } from "node:path";
import { chromium } from "playwright";
import {
  collectTableEntries,
  downloadToFileNativeFetch,
  sanitizeFilename,
} from "./modules/index.js";
import { OPTS } from "./constants.js";

const { log, error } = console;

/**
 * @param {string} dir
 */
export async function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

(async () => {
  const { outDir, startPage, baseUrl, maxPages } = OPTS;
  ensureDir(outDir);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const seen = new Set();
  let total = 0;

  for (let p = startPage; p <= maxPages; p++) {
    const url = baseUrl + (p === 1 ? "" : `&page=${p}`);
    log(`Crawling page ${p}: ${url}\n`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    await page.waitForTimeout(300);

    const entries = await collectTableEntries(page);
    if (!entries.length) {
      log(`No entries found on page ${p}. Stopping.`);
      break;
    }

    const newEntries = entries.filter((e) => !seen.has(e?.href));
    if (!newEntries.length) {
      log(`No new links found on page ${p}. Stopping.`);
      break;
    }

    for (const entry of newEntries) {
      try {
        const { href, number, title } = entry || {};

        seen.add(href);
        total++;

        // Sanitizar nombre de archivo
        const safeTitle = sanitizeFilename(title || number || `file_${total}`);

        // Si querés incluir el número al inicio, descomenta la siguiente línea:
        // const safeName = sanitizeFilename(`${number} - ${title}`);
        const safeName = safeTitle;
        let filename = safeName;

        // Asegura extensión .pdf si no tiene
        if (!filename.toLowerCase().endsWith(".pdf"))
          filename = `${filename}.pdf`;

        const dest = join(outDir, filename);

        let finalDest = dest;

        while (existsSync(finalDest)) {
          const parsed = parse(dest);
          let i = 1;
          let candidate;
          do {
            candidate = join(parsed.dir, `${parsed.name}_${i}${parsed.ext}`);
            i++;
          } while (existsSync(candidate));
          finalDest = candidate;
        }

        log(`Downloading (${total}) ${filename} -> ${finalDest}`);
        // @ts-ignore
        await downloadToFileNativeFetch(href, finalDest);
      } catch (err) {
        err instanceof Error &&
          error(`Error downloading ${entry?.href}:`, err.message);
      }
    }

    // intenta detectar paginación: si aparece enlace "Anteriores" o similar seguiramos, pero ya estamos controlando por ausencia de nuevos links
    // espera un pequeño rato (opcional)
    await page.waitForTimeout(600);
  }

  log(
    `Hecho. Archivos descargados en ${outDir} (total links encontrados únicos: ${seen.size})`,
  );
  await browser.close();
})();
