/**
 * Sanitiza un string para filename
 * @param {string} s
 */
export function sanitizeFilename(s) {
  // elimina controles y caracteres invalidos, trim y reemplaza múltiples espacios por uno
  return s
    .replace(/\r?\n|\r/g, " ")
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
