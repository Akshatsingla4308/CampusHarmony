@echo off
setlocal enabledelayedexpansion
title Campus Harmony — System Launcher
color 0B

echo ======================================================================
echo   CAMPUS HARMONY — SYSTEM LAUNCHER
echo   Academic Management System (React + Spring Boot + MySQL)
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Validate .env file exists
if not exist "%~dp0.env" (
    echo [ERROR] Configuration file .env was not found!
    echo Please copy .env.example to .env and configure your secure passwords:
    echo   copy .env.example .env
    echo.
    pause
    exit /b 1
)

:: 2. Load configuration from .env
for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0.env") do (
    set "var=%%A"
    set "val=%%B"
    if not "!var:~0,1!"=="#" (
        set "!var!=!val!"
    )
)

:: 3. Strictly validate required credentials — NO default or placeholder passwords permitted
if "%CAMPUS_DB_PASSWORD%"=="" (
    echo [SECURITY ERROR] CAMPUS_DB_PASSWORD is not set in .env!
    echo Please set your secure MySQL password in .env before starting.
    pause
    exit /b 1
)
if "%CAMPUS_DB_PASSWORD%"=="your_secure_mysql_password_here" (
    echo [SECURITY ERROR] CAMPUS_DB_PASSWORD is still set to placeholder 'your_secure_mysql_password_here'!
    echo Please edit .env and replace it with your actual secure password.
    pause
    exit /b 1
)
if "%CAMPUS_ADMIN_PASSWORD%"=="" (
    echo [SECURITY ERROR] CAMPUS_ADMIN_PASSWORD is not set in .env!
    echo Please set your administrator password in .env before starting.
    pause
    exit /b 1
)
if "%CAMPUS_ADMIN_PASSWORD%"=="your_secure_admin_password_here" (
    echo [SECURITY ERROR] CAMPUS_ADMIN_PASSWORD is still set to placeholder 'your_secure_admin_password_here'!
    echo Please edit .env and replace it with your actual secure password.
    pause
    exit /b 1
)

if "%CAMPUS_DB_USER%"=="" set CAMPUS_DB_USER=root
if "%CAMPUS_ADMIN_LOGIN%"=="" set CAMPUS_ADMIN_LOGIN=admin
if "%SPRING_DATASOURCE_URL%"=="" set SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/campus_harmony?useSSL=false^&serverTimezone=UTC^&allowPublicKeyRetrieval=true
if "%VITE_API_URL%"=="" set VITE_API_URL=http://localhost:8080/api

:: Ensure runtime tracking directory exists
if not exist "%~dp0.campus_run" mkdir "%~dp0.campus_run"

:: 4. Check if Docker is available and active
docker info >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Docker daemon is running.
    echo [INFO] Launching Campus Harmony via Docker Compose (compose.yaml)...
    echo.
    docker compose -f "%~dp0compose.yaml" up -d
    if !ERRORLEVEL! equ 0 (
        goto WAIT_DOCKER_SERVICES
    )
    echo [WARNING] Docker Compose startup failed. Falling back to native Windows services...
    echo.
)

:NATIVE_LAUNCH
echo [INFO] Running in Native Windows Mode...
echo.
echo [1/5] Checking Environment Prerequisites...

where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java JDK (17 or higher) was not found in PATH!
    echo Please install JDK 17+ and ensure it is available in system PATH.
    pause
    exit /b 1
)

where mvn >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Apache Maven was not found in PATH!
    echo Please install Maven 3.8+ and ensure it is available in system PATH.
    pause
    exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found in PATH!
    echo Please install Node.js 18+ or 20+ and ensure it is available in system PATH.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm was not found in PATH!
    pause
    exit /b 1
)

echo [OK] Java, Maven, Node.js, and npm are verified.
echo.

:: Install frontend dependencies if missing
if not exist "%~dp0frontend\node_modules" (
    echo [INFO] Installing frontend dependencies (first-time setup)...
    call npm.cmd --prefix "%~dp0frontend" install
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to install frontend dependencies!
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed successfully.
    echo.
)

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
        echo [ERROR] Could not connect to MySQL Server on localhost:3306!
        echo Please ensure MySQL Server 8.0 is running and listening on port 3306.
        pause
        exit /b 1
    )
)
echo [OK] MySQL Server is active on localhost:3306.
echo.

echo [3/5] Verifying Database Schema and Migrations...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\init-db.ps1"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Database verification or initialization failed!
    echo Please verify your CAMPUS_DB_PASSWORD in .env.
    pause
    exit /b 1
)
echo.

echo [4/5] Starting Spring Boot Backend (Port 8080)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$repo = (Resolve-Path '%~dp0').Path; $env:CAMPUS_DB_USER = $env:CAMPUS_DB_USER; $env:CAMPUS_DB_PASSWORD = $env:CAMPUS_DB_PASSWORD; $env:CAMPUS_ADMIN_LOGIN = $env:CAMPUS_ADMIN_LOGIN; $env:CAMPUS_ADMIN_PASSWORD = $env:CAMPUS_ADMIN_PASSWORD; $env:SPRING_DATASOURCE_URL = $env:SPRING_DATASOURCE_URL; $p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c mvn spring-boot:run' -WorkingDirectory \"$repo\backend\" -WindowStyle Minimized -PassThru; Set-Content -Path \"$repo\.campus_run\backend.pid\" -Value $p.Id"

echo [INFO] Waiting for Spring Boot Backend readiness on http://localhost:8080/api...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready = $false; for ($i=0; $i -lt 60; $i++) { try { $req = [System.Net.WebRequest]::Create('http://localhost:8080/api/auth/me'); $resp = $req.GetResponse(); $resp.Close(); $ready = $true; break } catch [System.Net.WebException] { if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -in 401,403,200) { $ready = $true; break } } Start-Sleep -Seconds 1 }; if (!$ready) { exit 1 } else { exit 0 }"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend failed to become ready within 60 seconds!
    echo Stopping startup and cleaning up background processes...
    call "%~dp0STOP_CAMPUSHARMONY.bat" >nul 2>&1
    pause
    exit /b 1
)
echo [OK] Backend is active and responsive.
echo.

echo [5/5] Starting React Frontend (Port 5173)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$repo = (Resolve-Path '%~dp0').Path; $p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npm run dev' -WorkingDirectory \"$repo\frontend\" -WindowStyle Minimized -PassThru; Set-Content -Path \"$repo\.campus_run\frontend.pid\" -Value $p.Id"

echo [INFO] Waiting for React Frontend dev server on http://localhost:5173...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready = $false; for ($i=0; $i -lt 45; $i++) { try { $req = [System.Net.WebRequest]::Create('http://localhost:5173'); $resp = $req.GetResponse(); $resp.Close(); $ready = $true; break } catch { } Start-Sleep -Seconds 1 }; if (!$ready) { exit 1 } else { exit 0 }"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend failed to become ready within 45 seconds!
    echo Stopping startup and cleaning up background processes...
    call "%~dp0STOP_CAMPUSHARMONY.bat" >nul 2>&1
    pause
    exit /b 1
)
echo [OK] Frontend is active and serving requests.
echo.

goto OPEN_BROWSER

:WAIT_DOCKER_SERVICES
echo [INFO] Waiting for Docker container services to become healthy...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready = $false; for ($i=0; $i -lt 60; $i++) { try { $req = [System.Net.WebRequest]::Create('http://localhost:5173'); $resp = $req.GetResponse(); $resp.Close(); $ready = $true; break } catch { } Start-Sleep -Seconds 2 }; if (!$ready) { exit 1 } else { exit 0 }"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker Compose services timed out before becoming ready!
    pause
    exit /b 1
)
echo [OK] Docker services verified ready.
echo.

:OPEN_BROWSER
echo ======================================================================
echo   CAMPUS HARMONY IS READY AND VERIFIED!
echo   ------------------------------------------------------------------
echo   * Web Application:        http://localhost:5173
echo   * Spring Boot REST API:   http://localhost:8080/api
echo   * Administrator Login:    %CAMPUS_ADMIN_LOGIN%
echo ======================================================================
echo.
echo Opening Campus Harmony in your default web browser...
start http://localhost:5173
echo.
echo To safely stop all services without resetting your database,
echo double-click STOP_CAMPUSHARMONY.bat.
echo.
pause
