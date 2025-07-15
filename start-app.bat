@echo off
echo Starting Ai Agentic CRM Application...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo Starting User Frontend...
start "User Frontend" cmd /k "cd frontend-user && npm start"

echo Starting Admin Frontend...
start "Admin Frontend" cmd /k "cd frontend-admin && npm start"

echo.
echo All services are starting...
echo.
echo Backend API: http://localhost:5000
echo User Frontend: http://localhost:3000
echo Admin Frontend: http://localhost:3001
echo.
echo Press any key to exit this window...
pause > nul 