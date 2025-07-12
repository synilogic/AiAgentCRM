@echo off
echo ========================================
echo    AI Agent CRM - Status Check
echo ========================================
echo.

echo [1] Checking running processes...
netstat -an | findstr ":3000 :3001 :5000" | findstr LISTENING
echo.

echo [2] Testing backend API...
curl -s http://localhost:5000 || echo "Backend not responding"
echo.

echo [3] Testing auth endpoint...
curl -s http://localhost:5000/api/auth/me || echo "Auth endpoint error (expected)"
echo.

echo [4] Checking MongoDB...
tasklist | findstr mongod || echo "MongoDB not running"
echo.

echo [5] Frontend URLs:
echo    User Panel:  http://localhost:3000
echo    Admin Panel: http://localhost:3001
echo    Backend API: http://localhost:5000
echo.

echo [6] Test Login Credentials:
echo    Email: john@example.com
echo    Password: password123
echo.

pause 