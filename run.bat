@echo off
REM
REM run.bat -- atalho para rodar os apps em dev mode no Windows.
REM
REM O dev server real roda no Linux dentro do WSL. Este script:
REM   1) Verifica WSL2 e Docker Desktop.
REM   2) Dispara run.sh dentro do WSL repassando argumentos.
REM
REM Uso:
REM   run.bat                REM backend (default)
REM   run.bat backend
REM   run.bat portal
REM   run.bat backoffice
REM   run.bat all            REM os 3 em paralelo (logs prefixados)
REM
setlocal enabledelayedexpansion

REM ---- 1. WSL2 ----
wsl --status >nul 2>&1
if errorlevel 1 (
  echo [erro] WSL2 nao detectado. Rode setup.bat primeiro, ou instale com 'wsl --install' no PowerShell Admin.
  exit /b 1
)

REM ---- 2. Docker Desktop ----
docker version >nul 2>&1
if errorlevel 1 (
  echo [erro] Docker Desktop nao detectado ou nao iniciado. Inicie o Docker Desktop antes.
  exit /b 1
)

REM ---- 3. Disparar run.sh dentro do WSL ----
wsl -e bash -c "cd \"$(wslpath -u '%CD%')\" && bash ./run.sh %*"
set "exit_code=%errorlevel%"

endlocal
exit /b %exit_code%
