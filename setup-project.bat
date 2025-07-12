@echo off
echo ========================================
echo    AI Agent CRM - Project Setup
echo ========================================
echo.

echo [1/6] Copying environment template...
copy backend\env.example backend\.env
echo Environment template copied. Please edit backend\.env with your actual values.
echo.

echo [2/6] Installing backend dependencies...
cd backend
call npm install
echo Backend dependencies installed.
echo.

echo [3/6] Installing frontend-user dependencies...
cd ..\frontend-user
call npm install
echo Frontend-user dependencies installed.
echo.

echo [4/6] Installing frontend-admin dependencies...
cd ..\frontend-admin
call npm install
echo Frontend-admin dependencies installed.
echo.

echo [5/6] Installing frontend dependencies...
cd ..\frontend
call npm install
echo Frontend dependencies installed.
echo.

echo [6/6] Building applications...
cd ..\frontend-user
call npm run build
cd ..\frontend-admin
call npm run build
cd ..\frontend
call npm run build
cd ..
echo.

echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit backend\.env with your actual configuration values
echo 2. Start MongoDB and Redis services
echo 3. Run: start-all-apps.bat
echo.
echo For development:
echo - Backend: cd backend && npm run dev
echo - Frontend-user: cd frontend-user && npm start
echo - Frontend-admin: cd frontend-admin && npm start
echo.
pause 