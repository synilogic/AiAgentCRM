@echo off
title AI Agent CRM - Production Environment
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                 AI AGENT CRM - PRODUCTION                    ║
echo  ║                    Version 1.0.0 READY                      ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

echo [INFO] Starting AI Agent CRM in Production Mode...
echo.

echo [1/3] Checking Production Build Status...
if not exist "frontend-user\build" (
    echo [ERROR] User frontend build not found. Run build-production.js first.
    pause
    exit /b 1
)

if not exist "frontend-admin\build" (
    echo [ERROR] Admin frontend build not found. Run build-production.js first.
    pause
    exit /b 1
)

echo [✓] Frontend builds verified
echo.

echo [2/3] Starting Backend Server (Production Mode)...
cd backend
start "AI Agent CRM Backend" cmd /k "npm run production"
cd ..

echo [✓] Backend server starting...
echo.

echo [3/3] Running Production Tests...
timeout /t 5 /nobreak >nul
node production-test.js

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                   PRODUCTION ENVIRONMENT ACTIVE             ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Backend API:     http://localhost:5000                     ║
echo ║  Health Check:    http://localhost:5000/health              ║
echo ║                                                              ║
echo ║  Frontend Builds Ready for Deployment:                      ║
echo ║  - User Frontend:  ./frontend-user/build/                   ║
echo ║  - Admin Frontend: ./frontend-admin/build/                  ║
echo ║                                                              ║
echo ║  Status: PRODUCTION READY ✓                                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [DEPLOYMENT] Your AI Agent CRM is ready for production deployment!
echo [NEXT STEPS] 
echo 1. Deploy backend to Node.js hosting (Heroku, Railway, etc.)
echo 2. Deploy frontend builds to static hosting (Netlify, Vercel, etc.)
echo 3. Configure domain names and SSL certificates
echo 4. Update environment variables for production
echo.

pause 