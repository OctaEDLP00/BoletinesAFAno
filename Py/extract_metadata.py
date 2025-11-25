#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Recorre ./downloads (por defecto), abre cada archivo .pdf y extrae metadatos:
 - Author (creator)
 - CreationDate
 - ModDate
Genera metadata.csv con columnas:
 filename, filepath, author, creation_date_iso, mod_date_iso
"""

from csv import DictWriter
from datetime import datetime
from pathlib import Path
from re import compile

from PyPDF2 import PdfReader

DOWNLOAD_DIR = Path("../downloads")
OUT_CSV = Path("../metadata.csv")

PDF_DATE_RE = compile(
    r"D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([+\-Z])?(\d{2})?'?(\d{2})?'?"
)


def parse_pdf_date(s):
    """
    Parse PDF date string like "D:YYYYMMDDHHmmSSOHH'mm'"
    Returns ISO 8601 string or empty string if unknown.
    """
    if not s:
        return ""
    s = s.strip()
    m = PDF_DATE_RE.match(s)
    if not m:
        # fallback: attempt to parse common patterns
        try:
            return datetime.fromisoformat(s).isoformat()
        except Exception:
            return s
    year, mon, day, hour, minute, second, tzsign, tzh, tzm = m.groups()
    year = int(year)
    mon = int(mon or 1)
    day = int(day or 1)
    hour = int(hour or 0)
    minute = int(minute or 0)
    second = int(second or 0)
    dt = datetime(year, mon, day, hour, minute, second)
    if tzsign in ("+", "-"):
        # timezone offset present
        try:
            tzh = int(tzh or 0)
            tzm = int(tzm or 0)
            offset_minutes = tzh * 60 + tzm
            if tzsign == "-":
                offset_minutes = -offset_minutes
            # represent as naive ISO with offset text
            # better to return ISO without offset applied; include offset
            return dt.isoformat() + f"{tzsign}{tzh:02d}:{tzm:02d}"
        except Exception:
            pass
    elif tzsign == "Z":
        return dt.isoformat() + "Z"
    return dt.isoformat()


def extract_metadata_from_pdf(path: Path):
    try:
        reader = PdfReader(str(path))
        md = reader.metadata or {}
        # PyPDF2 returns keys like '/Author', '/CreationDate', '/ModDate'
        author = md.get("/Author") or md.get("Author") or ""
        creation_raw = md.get("/CreationDate") or md.get("CreationDate") or ""
        mod_raw = md.get("/ModDate") or md.get("ModDate") or ""
        creation = parse_pdf_date(creation_raw) if creation_raw else ""
        mod = parse_pdf_date(mod_raw) if mod_raw else ""
        return {
            "filename": path.name,
            "filepath": str(path.resolve()),
            "author": author,
            "creation_raw": creation_raw,
            "creation": creation,
            "mod_raw": mod_raw,
            "modification": mod,
        }
    except Exception as e:
        return {
            "filename": path.name,
            "filepath": str(path.resolve()),
            "author": "",
            "creation_raw": "",
            "creation": "",
            "mod_raw": "",
            "modification": "",
            "error": str(e),
        }


def main():
    rows = []
    if not DOWNLOAD_DIR.exists():
        print(f"{DOWNLOAD_DIR} no existe. Ejecuta primero el script de descarga.")
        return

    pdf_files = sorted(DOWNLOAD_DIR.glob("*.pdf"))
    if not pdf_files:
        print("No se encontraron PDFs en", DOWNLOAD_DIR)
    for p in pdf_files:
        print("Procesando", p.name)
        r = extract_metadata_from_pdf(p)
        rows.append(r)

    # columnas deseadas
    fieldnames = [
        "filename",
        "filepath",
        "author",
        "creation_raw",
        "creation",
        "mod_raw",
        "modification",
        "error",
    ]
    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        w = DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for row in rows:
            # asegúrate que todas las keys existan
            for k in fieldnames:
                if k not in row:
                    row[k] = ""
            w.writerow(row)
    print("CSV generado:", OUT_CSV.resolve())


if __name__ == "__main__":
    main()
