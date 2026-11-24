@echo off
title CampusHarmony — Demonstration Database Setup
color 0B
cd /d "%~dp0"
echo ======================================================================
echo   CampusHarmony — Initializing Academic Demonstration Dataset
echo ======================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\seed-demo.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Demonstration seeding encountered an error (Code: %ERRORLEVEL%).
    pause
    exit /b %ERRORLEVEL%
)
echo.
pause
