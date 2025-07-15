@echo off
echo Starting Ai Agentic CRM Applications...

REM Kill any existing Node.js processes
echo Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul

REM Wait a moment for cleanup
timeout /t 2 >nul

REM Start Backend
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && node server.js"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 >nul

REM Start Frontend User
echo Starting Frontend User Application...
start "Frontend User" cmd /k "cd /d %~dp0frontend-user && npm start"

REM Wait for frontend to start
echo Waiting for frontend to compile...
timeout /t 10 >nul

echo All applications are starting...
echo Backend: http://localhost:5000
echo Frontend User: http://localhost:3000
echo.
echo You can now access the application at: http://localhost:3000
echo.
echo Login credentials:
echo Regular Users:
echo - john@example.com / password123
echo - sarah@example.com / password123
echo - mike@example.com / password123
echo.
echo Admin:
echo - admin@aiagentcrm.com / admin123
echo.
pause 