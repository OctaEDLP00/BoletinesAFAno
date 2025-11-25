#!/usr/bin/env bash
# setup.sh - Generar proyecto: venv en ./Py y dependencias Node en ./NodeJS
set -euo pipefail
IFS=$'\n\t'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY_DIR="$ROOT_DIR/Py"
VENV_DIR="$PY_DIR/venv"
REQ_FILE="$PY_DIR/requirements.txt"
NODE_DIR="$ROOT_DIR/NodeJS"

log() { printf '\033[1;34m[INFO]\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[WARN]\033[0m %s\n' "$1"; }
err() { printf '\033[1;31m[ERROR]\033[0m %s\n' "$1" >&2; }

# ---------------------------
# Detectar python disponible
# ---------------------------
detect_python() {
  if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    err "No se encontró python (python3/python). Instalalo antes de continuar."
    exit 2
  fi
  log "Usando Python: $(command -v $PYTHON_BIN)"
}

# ---------------------------
# Crear/activar venv y pip install
# ---------------------------
setup_python() {
  log "=== PYTHON SETUP ($PY_DIR) ==="

  mkdir -p "$PY_DIR"

  if [ ! -d "$VENV_DIR" ]; then
    log "Creando entorno virtual en $VENV_DIR..."
    "$PYTHON_BIN" -m venv "$VENV_DIR"
  else
    log "venv ya existe en $VENV_DIR"
  fi

  # activar (para el resto del script)
  # shellcheck disable=SC1090
  source "$VENV_DIR/bin/activate"

  # asegurarse pip actualizado
  log "Actualizando pip..."
  pip install --upgrade pip setuptools wheel

  # si no existe requirements, creamos uno mínimo útil
  if [ ! -f "$REQ_FILE" ]; then
    warn "No se encontró requirements.txt en $PY_DIR. Creando requirements mínimo con PyPDF2."
    cat >"$REQ_FILE" <<'EOF'
PyPDF2
pypdf
EOF
  else
    log "Se encontró $REQ_FILE"
  fi

  log "Instalando dependencias Python desde $REQ_FILE..."
  pip install -r "$REQ_FILE"

  log "Python listo. (venv activo para este proceso)"
}

# ---------------------------
# NodeJS / pnpm / npm setup
# ---------------------------
setup_node() {
  log "=== NODEJS SETUP ($NODE_DIR) ==="

  mkdir -p "$NODE_DIR"

  # prefer pnpm
  if command -v pnpm >/dev/null 2>&1; then
    PKG_MANAGER="pnpm"
    INSTALL_CMD="pnpm install --frozen-lockfile || pnpm install"
  elif command -v npm >/dev/null 2>&1; then
    PKG_MANAGER="npm"
    INSTALL_CMD="npm install"
  else
    warn "No se encontró pnpm ni npm. Instalá NodeJS y pnpm/npm antes de continuar."
    return 0
  fi

  log "Usando gestor de paquetes: $PKG_MANAGER"

  if [ -f "$NODE_DIR/package.json" ]; then
    log "Ejecutando instalación en $NODE_DIR usando $PKG_MANAGER..."
    pushd "$NODE_DIR" >/dev/null
    # Ejecuta el comando elegido
    if ! eval "$INSTALL_CMD"; then
      warn "Error durante la instalación de dependencias Node (intento con $PKG_MANAGER falló)."
    fi
    popd >/dev/null
    log "Node dependencias instaladas."
  else
    warn "No se encontró package.json en $NODE_DIR. Saltando 'install'."
    log "Si querés crear un package.json mínimo ejecutá: (cd $NODE_DIR && $PKG_MANAGER init -y)"
  fi
}

# ---------------------------
# Main
# ---------------------------
main() {
  log "Iniciando setup desde $ROOT_DIR"

  detect_python
  setup_python
  setup_node

  log "=== FIN: setup completado ==="
  log "Notas: README del proyecto sugiere usar pnpm para NodeJS; si querés instalar pnpm ver README. :contentReference[oaicite:1]{index=1}"
}

main "$@"
