import { createWriteStream } from "node:fs";
import nodeFetch from "node-fetch";
import { Readable, pipeline } from "node:stream";
import { promisify } from "node:util";
const pipe = promisify(pipeline);

/**
 * Descarga usando fetch (stream) y guarda a archivo
 * @param {string} url
 * @param {string} destPath
 */
export async function downloadToFile(url, destPath) {
  const res = await nodeFetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url} -> ${res.status}`);
  const fileStream = createWriteStream(destPath);
  await new Promise((resolve, reject) => {
    res.body?.pipe(fileStream);
    res.body?.on("error", reject);
    // @ts-ignore
    fileStream.on("finish", resolve);
  });
}

/**
 * Descarga usando fetch nativo. Soporta:
 * - res.body como Node Readable (con .pipe)
 * - res.body como Web ReadableStream (Readable.fromWeb)
 * - fallback a arrayBuffer
 * @param {string} url
 * @param {string} destPath
 */
export async function downloadToFileNativeFetch(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url} -> ${res.status}`);

  // Node-style stream (older libs or node-fetch v2)
  if (res.body && typeof res.body.pipe === "function") {
    await new Promise((resolve, reject) => {
      const fileStream = createWriteStream(destPath);
      res.body.pipe(fileStream);
      res.body.on("error", reject);
      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
    });
    return;
  }

  // Web ReadableStream (fetch nativo en Node 18+)
  if (res.body && typeof res.body.getReader === "function") {
    const nodeReadable = Readable.fromWeb(res.body);
    await pipe(nodeReadable, createWriteStream(destPath));
    return;
  }

  // Fallback: arrayBuffer (menos eficiente para archivos grandes)
  const buf = Buffer.from(await res.arrayBuffer());
  await import("node:fs/promises").then((m) => m.writeFile(destPath, buf));
}
