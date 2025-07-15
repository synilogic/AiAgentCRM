@echo off
echo =====================================
echo AI Agent CRM - Production Deployment
echo =====================================

echo.
echo Building all applications for production...
echo.

echo [1/4] Installing Backend Dependencies...
cd backend
call npm ci --only=production
if %ERRORLEVEL% neq 0 (
    echo Error: Backend installation failed
    pause
    exit /b 1
)
cd ..

echo [2/4] Building User Frontend...
cd frontend-user
call npm ci
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error: User frontend build failed
    pause
    exit /b 1
)
cd ..

echo [3/4] Building Admin Frontend...
cd frontend-admin
call npm ci
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error: Admin frontend build failed
    pause
    exit /b 1
)
cd ..

echo [4/4] Production build completed successfully!
echo.
echo Build artifacts created:
echo - Backend: ./backend/ (ready for deployment)
echo - User Frontend: ./frontend-user/build/
echo - Admin Frontend: ./frontend-admin/build/
echo.
echo =====================================
echo Deployment Instructions:
echo =====================================
echo 1. Deploy backend to your server (Node.js hosting)
echo 2. Deploy frontend builds to static hosting (Netlify, Vercel, etc.)
echo 3. Update environment variables for production
echo 4. Configure domain names and SSL certificates
echo.
echo Production URLs will be:
echo - Backend API: https://api.yourdomain.com
echo - User Frontend: https://app.yourdomain.com  
echo - Admin Frontend: https://admin.yourdomain.com
echo.
pause 