@echo off
title Campus Harmony — Safe Service Shutdown
color 0C
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop.ps1"
pause
