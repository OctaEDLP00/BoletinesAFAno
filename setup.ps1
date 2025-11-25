<#
Setup Script with Write-Color support
#>
# Detect modules
if (-not (Get-Module -ListAvailable -Name PSWriteColor)) {
  Write-Color "Installing PSWriteColor..." yellow
  Install-Module PSWriteColor -Scope CurrentUser -Force
}

Import-Module PSWriteColor

function LogInfo($msg) { Write-Color "[INFO] " -Color Cyan -NoNewLine; Write-Color $msg -Color White }
function LogWarn($msg) { Write-Color "[WARN] " -Color Yellow -NoNewLine; Write-Color $msg -Color White }
function LogErr($msg) { Write-Color "[ERROR] " -Color Red -NoNewLine; Write-Color $msg -Color White }

function Test-PackageManager {
  param([string]$Manager)
  return $Manager -eq "pnpm" -or $Manager -eq "npm"
}

function Get-PackageManager {
  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    return "pnpm"
  } elseif(Get-Command npm -ErrorAction SilentlyContinue) {
    return "npm"
  }
  return $null
}

function Initialize-NodeProject {
  <#
  .SYNOPSIS
    Inicializa el proyecto Node.js con el gestor de paquetes detectado
  .PARAMETER PackageManager
    Gestor de paquetes a usar (pnpm o npm)
  .PARAMETER NodeDir
    Directorio del proyecto Node
  #>
  param(
    [string]$PackageManager,
    [string]$NodeDir
  )

  if (-not (Test-Path $NodeDir)) {
    New-Item -ItemType Directory $NodeDir | Out-Null
  }

  Push-Location $NodeDir

  try {
    if ($PackageManager -eq "pnpm") {
      LogInfo "Inicializando proyecto con pnpm..."
      & pnpm init
    } else {
      LogInfo "Inicializando proyecto con npm..."
      & npm init -y
    }

    if (Test-Path "package.json") {
      LogInfo "Instalando dependencias Node usando $PackageManager..."
      & $PackageManager install
    }
  }
  finally {
    Pop-Location
  }
}

function Get-PythonCmd {
  <#
  .SYNOPSIS
    Detecta y retorna el comando de Python disponible
  .DESCRIPTION
    Busca python3 o python en el sistema y retorna el primero disponible
  .RETURNS
    string - Comando de Python o $null si no se encuentra
  #>
  foreach ($cmd in @("python3", "python")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
      return $cmd
    }
  }
  return $null
}

function Test-PythonEnvironment {
  <#
  .SYNOPSIS
    Verifica si el entorno virtual de Python existe y es válido
  .PARAMETER VenvDir
    Ruta al directorio del entorno virtual
  #>
  param([string]$VenvDir)

  return (Test-Path $VenvDir) -and (Test-Path "$VenvDir/Scripts/Activate.ps1")
}

function Initialize-PythonEnvironment {
  <#
  .SYNOPSIS
    Inicializa el entorno virtual de Python
  .PARAMETER PythonCmd
    Comando de Python a usar
  .PARAMETER VenvDir
    Ruta donde crear el entorno virtual
  #>
  param(
    [string]$PythonCmd,
    [string]$VenvDir
  )

  if (-not (Test-PythonEnvironment -VenvDir $VenvDir)) {
    LogInfo "Creando entorno virtual en: $VenvDir"
    & $PythonCmd -m venv $VenvDir

    if (-not (Test-PythonEnvironment -VenvDir $VenvDir)) {
      LogErr "No se pudo crear el entorno virtual"
      return $false
    }
  } else {
    LogWarn "El entorno virtual ya existe en: $VenvDir"
  }
  return $true
}

function Install-PythonRequirements {
  <#
  .SYNOPSIS
    Instala las dependencias de Python desde requirements.txt
  .PARAMETER ReqFile
    Ruta al archivo requirements.txt
  #>
  param([string]$ReqFile)

  # Crear requirements.txt mínimo si no existe
  if (-not (Test-Path $ReqFile)) {
    LogWarn "requirements.txt no encontrado. Creando archivo mínimo..."
    "PyPDF2" | Out-File $ReqFile -Encoding UTF8
  }

  # Actualizar pip e instalar dependencias
  LogInfo "Actualizando pip..."
  pip install --upgrade pip

  LogInfo "Instalando dependencias desde: $ReqFile"
  pip install -r $ReqFile

  if ($LASTEXITCODE -ne 0) {
    LogErr "Error instalando dependencias de Python"
    return $false
  }

  return $true
}

# --- EJECUCIÓN PRINCIPAL ---
$PyDir = "./Py"
$VenvDir = "$PyDir/venv"
$Req = "$PyDir/requirements.txt"
$NodeDir = "./NodeJS"

# --- Configuración de Python ---
LogInfo "Configurando entorno Python..."

$python = Get-PythonCommand
if (-not $python) {
  LogErr "Python no encontrado en el sistema. Instala Python para continuar."
  exit 1
}

LogInfo "Python detectado: $python"

# Crear directorio Python si no existe
if (-not (Test-Path $PyDir)) {
  New-Item -ItemType Directory $PyDir | Out-Null
}

# Inicializar entorno virtual
if (Initialize-PythonEnvironment -PythonCmd $python -VenvDir $VenvDir) {
  # Activar entorno virtual
  $activate = "$VenvDir/Scripts/Activate"
  if (Test-Path $activate) {
    . $activate
    LogInfo "Entorno virtual activado"

    # Instalar dependencias
    Install-PythonRequirements -ReqFile $Req
  } else {
    LogErr "No se pudo activar el entorno virtual - script no encontrado: $activate"
  }
} else {
  LogErr "Falló la inicialización del entorno virtual de Python"
  exit 1
}

# --- Configuración de Node.js ---
LogInfo "Configurando NodeJS..."

$pkgManager = Get-PackageManager
if (Test-PackageManager -Manager $pkgManager) {
  LogInfo "Gestor de paquetes detectado: $pkgManager"
  Initialize-NodeProject -PackageManager $pkgManager -NodeDir $NodeDir
} else {
  LogWarn "No se encontró npm ni pnpm. Saltando configuración de Node."
}

LogInfo "Configuración completada exitosamente!"
