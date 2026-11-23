@echo off
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
    docker compose ps -q 2>nul | findstr /R "." >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo [INFO] Stopping Docker Compose containers...
        docker compose stop
        echo [OK] Containers stopped safely. Database volume campusharmony_mysql_data is preserved.
    )
)

:: 2. Terminate background Spring Boot process on Port 8080
echo [INFO] Stopping background processes on Port 8080 (Spring Boot Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo Stopping PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

:: 3. Terminate background Vite process on Port 5173
echo [INFO] Stopping background processes on Port 5173 (React Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Stopping PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ======================================================================
echo   All Campus Harmony application services have been safely stopped.
echo   MySQL Server and persistent database data remain completely intact.
echo ======================================================================
echo.
pause
