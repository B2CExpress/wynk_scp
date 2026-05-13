@echo off
REM
REM setup.bat -- atalho de setup local do wynk-scp em Windows.
REM
REM O setup real roda no Linux dentro do WSL. Este script:
REM   1) Verifica que WSL2 e Docker Desktop estao instalados.
REM   2) Avisa se o repo esta no filesystem do Windows (C:\) -- I/O lento.
REM   3) Dispara setup.sh dentro do WSL repassando argumentos.
REM
REM Uso:
REM   setup.bat              REM setup sem seed
REM   setup.bat --seed       REM setup e popula tenants de exemplo
REM
setlocal enabledelayedexpansion

echo.
echo === wynk-scp setup (Windows / WSL2) ===
echo.

REM ---- 1. WSL2 instalado? ----
wsl --status >nul 2>&1
if errorlevel 1 (
  echo [erro] WSL2 nao detectado. Abra o PowerShell como Administrador e rode:
  echo        wsl --install
  echo Mais info: https://learn.microsoft.com/windows/wsl/install
  exit /b 1
)
echo [ok] WSL2 detectado.

REM ---- 2. Docker Desktop ativo? ----
docker version >nul 2>&1
if errorlevel 1 (
  echo [erro] Docker Desktop nao detectado ou nao iniciado.
  echo        Instale: https://www.docker.com/products/docker-desktop/
  echo        Em Settings, ative "Use the WSL 2 based engine" e a integracao com Ubuntu.
  exit /b 1
)
echo [ok] Docker Desktop detectado.

REM ---- 3. Aviso se cwd esta no filesystem do Windows ----
set "current_path=%CD%"
echo %current_path% | findstr /B /R /C:"[A-Za-z]:" >nul
if not errorlevel 1 (
  echo.
  echo [aviso] Voce esta rodando de %current_path%
  echo         I/O entre o filesystem do Windows e o WSL eh ~10x mais lento
  echo         e pode quebrar file watchers (Next/Vite dev servers).
  echo         Recomendado: clone e rode o repo de dentro do WSL ^(~/wynk-scp^).
  echo.
  echo Pressione ENTER para continuar mesmo assim, ou Ctrl+C para cancelar.
  pause >nul
)

REM ---- 4. Disparar setup.sh dentro do WSL ----
echo.
echo [setup] Executando setup.sh dentro do WSL...
echo.

wsl -e bash -c "cd \"$(wslpath -u '%CD%')\" && bash ./setup.sh %*"
set "exit_code=%errorlevel%"

echo.
if "%exit_code%"=="0" (
  echo [ok] Setup concluido.
  echo.
  echo Para subir o backend, abra o terminal Ubuntu ^(digite "wsl" no CMD ou pelo menu Iniciar^):
  echo     cd ~/wynk-scp ^&^& npm run dev -w backend
) else (
  echo [erro] setup.sh falhou dentro do WSL ^(codigo %exit_code%^). Veja a saida acima.
)

endlocal
exit /b %exit_code%
