@echo off
title Campus Harmony — Full System Launcher
color 0B
echo ======================================================================
echo   CAMPUS HARMONY — SUNRISE INSTITUTE ERP SYSTEM
echo   Chitkara University | BE CSE Batch 2025 | Semester III
echo   FEE-II (40M) + DBMS (50M) + Programming in Java (25M)
echo ======================================================================
echo.

echo [1/4] Checking Environment Prerequisites...
java -version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java JDK is not installed or not in PATH! Please install JDK 21.
    pause
    exit /b 1
)

mvn -version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Apache Maven is not installed or not in PATH!
    pause
    exit /b 1
)

node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)
echo [OK] Java, Maven, and Node.js detected.
echo.

echo [2/4] Checking Local MySQL Database (localhost:3306)...
powershell -NoProfile -Command "try { $client = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 3306); $client.Close(); exit 0 } catch { exit 1 }"
if %ERRORLEVEL% neq 0 (
    echo [WARNING] MySQL is not responding on localhost:3306.
    echo Please ensure MySQL Server 8.0 is running before testing database operations.
) else (
    echo [OK] MySQL Server is active on localhost:3306.
)
echo.

echo [3/4] Starting Spring Boot Backend (Port 8080)...
start "Campus Harmony Backend [Port 8080]" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"
echo Backend launch command dispatched. Waiting for Tomcat initialization...

echo.
echo [4/4] Starting React Modern ERP Frontend (Port 5173)...
start "Campus Harmony Frontend [Port 5173]" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Frontend dev server dispatched.
echo.

echo ======================================================================
echo   CAMPUS HARMONY IS NOW RUNNING!
echo   ------------------------------------------------------------------
echo   * Modern React ERP:               http://localhost:5173
echo   * Evaluated Vanilla FEE-II Portal: http://localhost:5173/sms/index.html
echo   * Spring Boot REST API:            http://localhost:8080/api
echo   * DBMS Demonstration Workbench:    http://localhost:5173/dbms-demo
echo   * Java Academic Demo Workbench:    http://localhost:5173/java-demo
echo ======================================================================
echo.
echo To stop services safely without killing unrelated applications,
echo run STOP-CAMPUS-HARMONY.bat from this directory.
echo.
pause
