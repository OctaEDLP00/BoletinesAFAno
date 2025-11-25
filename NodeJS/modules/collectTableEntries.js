/**
 * Extrae número, título y link desde la tabla
 * @param {import("playwright").Page} page
 * @returns {Promise<Array<{number: string, title: string, href: string} | null>>}
 */
export async function collectTableEntries(page) {
  return await page.$$eval("table tr", (rows) =>
    rows
      .map((tr) => {
        const cells = tr.querySelectorAll("td");
        if (cells.length < 3) return null;

        const number = cells[0]?.innerText?.trim() || "";
        const title =
          /** @type {HTMLElement} */ (
            tr.querySelector(".item-title")
          )?.innerText?.trim() || "";
        const link =
          /** @type {HTMLAnchorElement} */ (tr.querySelector("a[href]"))
            ?.href || "";

        if (!link) return null;

        return { number, title, href: link };
      })
      .filter(Boolean),
  );
}
