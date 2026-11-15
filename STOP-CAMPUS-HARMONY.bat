@echo off
title Campus Harmony — Safe Service Shutdown
color 0C
echo ======================================================================
echo   CAMPUS HARMONY — SAFE SHUTDOWN UTILITY
echo ======================================================================
echo.

echo [1/2] Terminating process on Port 8080 (Spring Boot Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo Terminating PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/2] Terminating process on Port 5173 (Vite Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Terminating PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ======================================================================
echo   All Campus Harmony local services have been safely stopped.
echo   Unrelated developer tools and databases remain untouched.
echo ======================================================================
echo.
pause
