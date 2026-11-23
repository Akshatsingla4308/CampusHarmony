@echo off
setlocal enabledelayedexpansion
title Campus Harmony — Safe Service Shutdown
color 0C

echo ======================================================================
echo   CAMPUS HARMONY — SAFE SHUTDOWN UTILITY
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. If Docker Compose containers are active, gracefully stop them
where docker >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose -f "%~dp0compose.yaml" ps -q 2>nul | findstr /R "." >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo [INFO] Stopping Docker Compose containers...
        docker compose -f "%~dp0compose.yaml" stop
        echo [OK] Containers stopped safely. Database volume 'campusharmony_mysql_data' is preserved.
    )
)

:: 2. Stop tracked native processes by recorded PID
if exist "%~dp0.campus_run\backend.pid" (
    set /p BACKEND_PID=<"%~dp0.campus_run\backend.pid"
    if not "!BACKEND_PID!"=="" (
        echo [INFO] Stopping Campus Harmony Backend (PID !BACKEND_PID!)...
        taskkill /F /T /PID !BACKEND_PID! >nul 2>&1
    )
    del "%~dp0.campus_run\backend.pid" >nul 2>&1
)

if exist "%~dp0.campus_run\frontend.pid" (
    set /p FRONTEND_PID=<"%~dp0.campus_run\frontend.pid"
    if not "!FRONTEND_PID!"=="" (
        echo [INFO] Stopping Campus Harmony Frontend (PID !FRONTEND_PID!)...
        taskkill /F /T /PID !FRONTEND_PID! >nul 2>&1
    )
    del "%~dp0.campus_run\frontend.pid" >nul 2>&1
)

:: 3. Terminate any remaining CampusHarmony-specific sub-processes (targeted command-line match only)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$myDir = (Resolve-Path '%~dp0').Path; Get-CimInstance Win32_Process | Where-Object { ($_.CommandLine -like \"*$myDir\backend*\" -or $_.CommandLine -like \"*$myDir\frontend*\") -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo.
echo ======================================================================
echo   All Campus Harmony application services have been safely stopped.
echo   MySQL Server and persistent database data remain completely intact.
echo ======================================================================
echo.
pause
