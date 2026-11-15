@echo off
title Campus Harmony - Frontend
echo ======================================================================
echo   CAMPUS HARMONY - STUDENT MANAGEMENT SYSTEM (FRONTEND)
echo   College ERP Web Application
echo ======================================================================
echo.
cd /d "%~dp0"

if exist "node_modules\vite" (
    echo Starting Vite dev server on http://localhost:5173 ...
    npm run dev
) else (
    echo Starting zero-dependency Node server. Open http://localhost:5173/sms/login.html
    node serve.js
)
pause
