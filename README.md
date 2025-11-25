# Download Boletines AFAno

## 📌 ¿Qué hace este proyecto?

El objetivo del proyecto es **automatizar completamente** la preparación del entorno necesario para descargar, procesar y trabajar con los *Boletines de AFA*.

Incluye:
- Creación automática del entorno virtual de Python (`venv`) dentro de la carpeta `Py/`.
- Instalación automática de dependencias Python listadas en `Py/requirements.txt`.
- Instalación automática de dependencias NodeJS dentro de `NodeJS/` usando **pnpm** o, si no está disponible, **npm**.
- Scripts (`setup.ps1` y `setup.sh`) diseñados para funcionar en Windows, Linux y MacOS.

Enlaces a los metadatos de las dos descargas de los archivos y sus metadatos 

- [Ejecutivo](https://docs.google.com/spreadsheets/d/1BSh4QPISDKwtvImIo5ii1RbQcLsOnFJwyZIinJoR7gU/edit?gid=0#gid=0)
- [Disciplinario](https://docs.google.com/spreadsheets/d/1FzJGwnTtH6iZup9dRHBgQ4KCqm-DTevYO3vJSqeuzn4/edit)

## 📂 Estructura del Proyecto (recomendada)

```
/
├── Py/
│   ├── venv/                # Entorno virtual Python (se crea automáticamente)
│   ├── requirements.txt     # Dependencias Python
│   └── *.py                 # Scripts Python del proyecto
│
├── NodeJS/
│   ├── package.json         # Dependencias del entorno NodeJS
│   └── *.js                 # Scripts NodeJS
│
├── setup.ps1                # Script de instalación para Windows
├── setup.sh                 # Script de instalación para Linux/MacOS
└── README.md                # Este archivo
```

# Requisitos

- Tener instalado [NodeJS](https://nodejs.org/es/download) y descargar la ultima lts 
- Tener instalado [Pnpm](https://pnpm.io/installation) o es su defecto **npm** ya instalando en node por defecto

## ▶️ Proceso completo del Setup

### 🔧 Windows

```ps1
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

Automatiza:
1. Detectar Python y crear/activar el venv.
2. Instalar dependencias de `requirements.txt` (o generarlo si no existe).
3. Detectar pnpm > npm.
4. Instalar dependencias NodeJS en `NodeJS/`.

### 🐧 Linux / 🍏 MacOS

```bash
chmod +x setup.sh && ./setup.sh 
```
Automatiza exactamente lo mismo que la versión PowerShell.

## 🧪 Verificación manual opcional

### ✔️ Verificar Python:

```bash
./Py/venv/bin/python --version
```

### ✔️ Verificar dependencias Node:

```bash
cd NodeJS
pnpm list || npm list
```

## ❗ Problemas comunes y soluciones rápidas

### ⚠️ Error: *No se puede activar el venv*

Ejecutá:
```ps1
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### ⚠️ pnpm no está disponible

  Sigue los siguiente pasos para instalar pnpm segun tu OS

  #### 🔧 Windows
  - En windows desde terminal (CMD o Windows Terminal o powershell)
    ```ps1
    Invoke-WebRequest https://get.pnpm.io/install.ps1 -UseBasicParsing | Invoke-Expression
    ```
  - En Windows desde terminal usando winget (CMD o Windows Terminal o powershell)
    ```ps1
    winget install -Id pnpm.pnpm
    ```
  #### 🐧 Linux / 🍏 MacOS
  
  - En linux o MacOS usando curl
    ```bash
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    ```
  - En linux o MacOS usando wget
    ```bash
    wget -qO- https://get.pnpm.io/install.sh | sh -
    ```

### ⚠️ npm/pnpm no instala nada
  Verificá estar en la carpeta correcta:
  ```bash
  cd NodeJS
  ```

## 📝 Notas finales

Este README está ampliado para que tu proyecto quede **autoexplicativo**, portable y fácil de mantener.  
Si querés agregar una sección de “Scripts disponibles”, “Objetivos del proyecto” o integrar CI/CD, puedo extenderlo.
