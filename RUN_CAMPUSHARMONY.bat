@echo off
title Campus Harmony — System Launcher
color 0B
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Campus Harmony launch halted with exit code %ERRORLEVEL%.
    pause
    exit /b %ERRORLEVEL%
)
pause
