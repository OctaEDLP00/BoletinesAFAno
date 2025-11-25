#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrae metadatos PDF usando pypdf y genera metadata.csv
"""

import csv
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader

DOWNLOAD_DIR = Path("../downloads")
OUT_CSV = Path("../metadata.csv")


def parse_pdf_date(d):
    """
    Convierte un string de fecha PDF (D:YYYYMMDDHHmmSS...) a ISO 8601
    Ej: 'D:20240628120000Z' -> '2024-06-28T12:00:00Z'
    """
    if not d or not isinstance(d, str):
        return ""

    d = d.strip()

    # Formato PDF estándar: D:YYYYMMDDHHmmSSOHH'mm'
    if d.startswith("D:"):
        d = d[2:]  # quitar 'D:'

    # Rellenar valores faltantes
    year = int(d[0:4])
    month = int(d[4:6]) if len(d) >= 6 else 1
    day = int(d[6:8]) if len(d) >= 8 else 1
    hour = int(d[8:10]) if len(d) >= 10 else 0
    minute = int(d[10:12]) if len(d) >= 12 else 0
    second = int(d[12:14]) if len(d) >= 14 else 0

    # timezone (si existe)
    tz = ""
    if len(d) > 14:
        tz = d[14:]

    dt = datetime(year, month, day, hour, minute, second)
    iso = dt.isoformat()
    if tz:
        iso += f" {tz}"
    return iso


def extract_metadata(path: Path):
    """
    Extrae metadatos usando pypdf
    """
    try:
        reader = PdfReader(str(path))
        md = reader.metadata  # dict con claves tipo '/Author', '/ModDate'

        author = md.get("/Author", "")
        creation_raw = md.get("/CreationDate", "")
        mod_raw = md.get("/ModDate", "")

        creation = parse_pdf_date(creation_raw)
        modification = parse_pdf_date(mod_raw)

        return {
            "filename": path.name,
            "author": author,
            "creation": creation,
            "modification": modification,
            "error": "",
        }

    except Exception as e:
        return {
            "filename": path.name,
            "author": "",
            "creation": "",
            "modification": "",
            "error": str(e),
        }


def main():
    if not DOWNLOAD_DIR.exists():
        print(
            f"No existe la carpeta {DOWNLOAD_DIR}. Ejecutá primero el script de descarga."
        )
        return

    pdfs = list(DOWNLOAD_DIR.glob("*.pdf"))
    if not pdfs:
        print("No se encontraron PDFs en ./downloads")
        return

    rows = []

    for p in pdfs:
        print(f"Procesando {p.name}")
        rows.append(extract_metadata(p))

    fieldnames = [
        "filename",
        "author",
        "creation",
        "modification",
        "error",
    ]

    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

    print(f"Listo. Archivo generado: {OUT_CSV.resolve()}")


if __name__ == "__main__":
    main()
