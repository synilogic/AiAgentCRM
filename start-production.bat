@echo off
echo =====================================
echo AI Agent CRM - Production Startup
echo =====================================

echo.
echo Starting Production Servers...
echo.

echo Starting Backend Server (Production Mode)...
start "Backend Server" cmd /k "cd backend && npm run production"

timeout /t 3 /nobreak >nul

echo.
echo =====================================
echo Production Environment Active
echo =====================================
echo Backend API: http://localhost:5000
echo.
echo For frontend access, serve the built files:
echo User Frontend: ./frontend-user/build/
echo Admin Frontend: ./frontend-admin/build/
echo.
echo Use a web server like nginx or Apache to serve the frontend files.
echo.
pause 