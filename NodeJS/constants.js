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
export const OPTS = {
  baseUrl: "https://www.afa.com.ar/es/boletins/tribunal-de-disciplina?s=10",
  outDir: "../downloads",
  startPage: 1,
  maxPages: 200,
};
