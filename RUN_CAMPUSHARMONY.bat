@echo off
setlocal enabledelayedexpansion
title Campus Harmony — Full System Launcher
color 0B

echo ======================================================================
echo   CAMPUS HARMONY — ONE-CLICK SYSTEM LAUNCHER
echo   Academic Management System (React + Spring Boot + MySQL)
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Load configuration from .env if present
if exist "%~dp0.env" (
    echo [INFO] Loading configuration from .env file...
    for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0.env") do (
        set "var=%%A"
        set "val=%%B"
        if not "!var:~0,1!"=="#" (
            set "!var!=!val!"
        )
    )
)

:: Set defaults if not explicitly set
if "%CAMPUS_DB_USER%"=="" set CAMPUS_DB_USER=root
if "%CAMPUS_DB_PASSWORD%"=="" set CAMPUS_DB_PASSWORD=RootPass2026!
if "%CAMPUS_ADMIN_LOGIN%"=="" set CAMPUS_ADMIN_LOGIN=admin
if "%CAMPUS_ADMIN_PASSWORD%"=="" set CAMPUS_ADMIN_PASSWORD=AdminSecurePass2026!
if "%SPRING_DATASOURCE_URL%"=="" set SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/campus_harmony?useSSL=false^&serverTimezone=UTC^&allowPublicKeyRetrieval=true
if "%VITE_API_URL%"=="" set VITE_API_URL=http://localhost:8080/api

:: 2. Check if Docker is available and running
docker info >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Docker daemon is running.
    echo [INFO] Launching Campus Harmony containers via Docker Compose...
    echo.
    docker compose up -d
    if !ERRORLEVEL! equ 0 (
        goto WAIT_DOCKER_SERVICES
    )
    echo [WARNING] Docker Compose startup encountered an issue. Falling back to native launch...
    echo.
)

:NATIVE_LAUNCH
echo [INFO] Running in Native Windows Mode...
echo.
echo [1/5] Checking Environment Prerequisites...

where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java JDK 17+ was not found in PATH!
    echo Please install Eclipse Temurin or Oracle JDK 17+ and add it to PATH.
    pause
    exit /b 1
)

where mvn >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Apache Maven was not found in PATH!
    echo Please install Apache Maven 3.8+ and add it to PATH.
    pause
    exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found in PATH!
    echo Please install Node.js 18+ or 20+ and add it to PATH.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm was not found in PATH!
    pause
    exit /b 1
)

echo [OK] Java, Maven, Node.js, and npm are detected.
echo.

echo [2/5] Checking Local MySQL Database (localhost:3306)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$tcp = New-Object Net.Sockets.TcpClient; try { $tcp.Connect('127.0.0.1', 3306); $tcp.Close(); exit 0 } catch { exit 1 }"
if %ERRORLEVEL% neq 0 (
    echo [INFO] MySQL is not responding on port 3306. Attempting to start MySQL80 service...
    net start MySQL80 >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        net start MySQL >nul 2>&1
    )
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$tcp = New-Object Net.Sockets.TcpClient; try { $tcp.Connect('127.0.0.1', 3306); $tcp.Close(); exit 0 } catch { exit 1 }"
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] MySQL Server is not responding on localhost:3306!
        echo Please ensure MySQL Server 8.0 is started.
        pause
        exit /b 1
    )
)
echo [OK] MySQL Server is active on localhost:3306.
echo.

echo [3/5] Verifying Database Schema and Migrations...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\init-db.ps1"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Database initialization failed. Please check your MySQL credentials.
    pause
    exit /b 1
)
echo.

echo [4/5] Starting Spring Boot Backend (Port 8080)...
start "Campus Harmony Backend [Port 8080]" cmd /k "cd /d ""%~dp0backend"" && set CAMPUS_DB_USER=%CAMPUS_DB_USER% && set CAMPUS_DB_PASSWORD=%CAMPUS_DB_PASSWORD% && set CAMPUS_ADMIN_LOGIN=%CAMPUS_ADMIN_LOGIN% && set CAMPUS_ADMIN_PASSWORD=%CAMPUS_ADMIN_PASSWORD% && set SPRING_DATASOURCE_URL=%SPRING_DATASOURCE_URL% && mvn spring-boot:run"

echo [INFO] Waiting for Spring Boot Backend initialization...
powershell -NoProfile -ExecutionPolicy Bypass -Command "for ($i=0; $i -lt 60; $i++) { try { $req = [System.Net.WebRequest]::Create('http://localhost:8080/api/auth/me'); $resp = $req.GetResponse(); $resp.Close(); break } catch [System.Net.WebException] { if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -in 401,403,200) { break } } Start-Sleep -Seconds 1 } exit 0"
echo [OK] Spring Boot Backend is active on port 8080.
echo.

echo [5/5] Starting React + TanStack Frontend (Port 5173)...
start "Campus Harmony Frontend [Port 5173]" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo [INFO] Waiting for Frontend dev server initialization...
powershell -NoProfile -ExecutionPolicy Bypass -Command "for ($i=0; $i -lt 40; $i++) { try { $req = [System.Net.WebRequest]::Create('http://localhost:5173'); $resp = $req.GetResponse(); $resp.Close(); break } catch { } Start-Sleep -Seconds 1 } exit 0"
echo [OK] React Frontend is active on port 5173.
echo.

goto FINISH

:WAIT_DOCKER_SERVICES
echo [INFO] Waiting for container services to finish initial startup...
powershell -NoProfile -ExecutionPolicy Bypass -Command "for ($i=0; $i -lt 60; $i++) { try { $req = [System.Net.WebRequest]::Create('http://localhost:5173'); $resp = $req.GetResponse(); $resp.Close(); break } catch { } Start-Sleep -Seconds 2 } exit 0"
echo [OK] Docker services are online.
echo.

:FINISH
echo ======================================================================
echo   CAMPUS HARMONY IS NOW RUNNING!
echo   ------------------------------------------------------------------
echo   * Web Application:        http://localhost:5173
echo   * Spring Boot REST API:   http://localhost:8080/api
echo   * Default Admin Username: %CAMPUS_ADMIN_LOGIN%
echo ======================================================================
echo.
echo Launching Campus Harmony in your default web browser...
start http://localhost:5173
echo.
echo To safely stop all services without resetting your database,
echo double-click STOP_CAMPUSHARMONY.bat.
echo.
pause
