@echo off
echo Starting Ai Agentic CRM Applications...
echo.

echo [1/4] Starting Backend Server...
cd backend
start "Backend" cmd /c "npm start"
echo Backend server starting on port 5000...
echo.

echo [2/4] Starting Frontend User Application...
cd ../frontend-user
start "Frontend-User" cmd /c "npm start"
echo Frontend user app starting on port 3000...
echo.

echo [3/4] Starting Frontend Admin Application...
cd ../frontend-admin
start "Frontend-Admin" cmd /c "set PORT=3001 && npm start"
echo Frontend admin app starting on port 3001...
echo.

echo [4/4] Starting Main Frontend Application...
cd ../frontend
start "Frontend-Main" cmd /c "set PORT=3002 && npm start"
echo Main frontend app starting on port 3002...
echo.

echo All applications are starting up...
echo.
echo Applications will be available at:
echo - Backend API: http://localhost:5000
echo - Backend Health: http://localhost:5000/health
echo - User Frontend: http://localhost:3000
echo - Admin Frontend: http://localhost:3001
echo - Main Frontend: http://localhost:3002
echo.
echo Press any key to continue...
pause > nul 