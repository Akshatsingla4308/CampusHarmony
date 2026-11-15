@echo off
title Campus Harmony - Spring Boot Backend
echo ======================================================================
echo   CAMPUS HARMONY - STUDENT MANAGEMENT SYSTEM (BACKEND)
echo   Spring Boot 3.2 + Spring Data JPA + Hibernate + MySQL
echo ======================================================================
echo.
echo Checking Java installation...
java -version
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java 17+ is required but not found in PATH.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Starting Spring Boot Server on http://localhost:8080 ...
cd /d "%~dp0"

if exist "C:\Users\Lenovo\apache-maven-3.9.6\bin\mvn.cmd" (
    "C:\Users\Lenovo\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
) else (
    mvn spring-boot:run
)

pause
