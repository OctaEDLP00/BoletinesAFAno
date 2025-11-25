/**
 * @typedef {Object} Options
 * @property {string} baseUrl base listing URL (page 1). Example: "https://www.afa.com.ar/es/boletins/tribunal-de-disciplina?s=10"
 * @property {string} outDir output directory for downloads
 * @property {number} startPage first page number (1)
 * @property {number} maxPages safety limit to avoid infinite loops
 */

/**
 * @type {Options}
 */
const OPTS = {
  baseUrl: "https://www.afa.com.ar/es/boletins/tribunal-de-disciplina?s=10",
  outDir: "../downloads",
  startPage: 1,
  maxPages: 200,
};

const { log, error } = console;

import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { chromium } from "playwright";

async function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Extrae todos los enlaces de descarga (href) que contengan "assets1.afa.com.ar"
 * @param {import('playwright').Page} page
 * @returns {Promise<Array<string>>}
 */
async function collectDownloadLinks(page) {
  // selector: any anchor with href including assets1.afa.com.ar and likely contains "download"
  const hrefs = await page.$$eval('a[href*="assets1.afa.com.ar"]', (els) =>
    Array.from(new Set(els.map((a) => a.href))),
  );
  return hrefs;
}

/**
 * Descarga usando fetch (stream) y guarda a archivo
 * @param {string} url
 * @param {string} destPath
 */
async function downloadToFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url} -> ${res.status}`);
  const fileStream = createWriteStream(destPath);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

(async () => {
  const { outDir, startPage, baseUrl, maxPages } = OPTS;
  ensureDir(outDir);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const seen = new Set();
  let pageNum = startPage;
  let totalFound = 0;
  for (; pageNum <= maxPages; pageNum++) {
    const url = baseUrl + (pageNum === 1 ? "" : `&page=${pageNum}`);
    log(`Crawling page ${pageNum}: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const links = await collectDownloadLinks(page);
    if (!links.length) {
      log(`No download links on page ${pageNum}. Stopping.`);
      break;
    }

    // Agrega nuevos links
    const newLinks = links.filter((h) => !seen.has(h));
    if (!newLinks.length) {
      log(`No new links found on page ${pageNum}. Stopping.`);
      break;
    }

    for (const href of newLinks) {
      try {
        seen.add(href);
        totalFound++;
        // crea nombre de archivo robusto: último segmento de la URL o con query
        const urlObj = new URL(href);
        let filename = path.basename(urlObj.pathname) || `file_${totalFound}`;
        // si no tiene extensión intenta inferir de Content-Type después
        const dest = path.join(outDir, filename);
        // Evita sobreescritura: si existe, añade índice
        let finalDest = dest;
        let counter = 1;
        while (existsSync(finalDest)) {
          const parsed = path.parse(dest);
          finalDest = path.join(
            parsed.dir,
            `${parsed.name}_${counter}${parsed.ext}`,
          );
          counter++;
        }
        log(`Downloading (${totalFound}) ${href} -> ${finalDest}`);
        await downloadToFile(href, finalDest);
      } catch (err) {
        error(`Error downloading ${href}:`, err.message);
      }
    }

    // intenta detectar paginación: si aparece enlace "Anteriores" o similar seguiramos, pero ya estamos controlando por ausencia de nuevos links
    // espera un pequeño rato (opcional)
    await page.waitForTimeout(500);
  }

  log(
    `Hecho. Archivos descargados en ${outDir} (total links encontrados únicos: ${seen.size})`,
  );
  await browser.close();
})();
