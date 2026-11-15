@echo off
title Campus Harmony - Full Stack Launcher
echo ======================================================================
echo   CAMPUS HARMONY - FULL STACK ERP WEB APPLICATION
echo   College Project: BE Computer Science and Engineering
echo   Backend: Java 17 + Spring Boot + Spring Data JPA + MySQL
echo   Frontend: React.js + HTML5 + CSS3 + Vanilla ES6
echo ======================================================================
echo.

echo [1/2] Launching Spring Boot Backend in a new terminal...
start "Campus Harmony Backend (Port 8080)" cmd /k "%~dp0backend\run-backend.bat"

echo [2/2] Launching Frontend Dev Server in a new terminal...
start "Campus Harmony Frontend (Port 5173)" cmd /k "%~dp0frontend\run-frontend.bat"

echo.
echo ======================================================================
echo Both servers are starting!
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173/sms/login.html
echo MySQL DB: localhost:3306/campus_harmony
echo ======================================================================
echo.
pause
