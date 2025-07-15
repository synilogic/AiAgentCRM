@echo off
echo Checking Ai Agentic CRM Applications Health...
echo.

echo [1/4] Checking Backend Server (port 5000)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/' -Method Get -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ Backend API: HEALTHY' -ForegroundColor Green } else { Write-Host '❌ Backend API: UNHEALTHY' -ForegroundColor Red } } catch { Write-Host '❌ Backend API: NOT RESPONDING' -ForegroundColor Red }"
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/health' -Method Get -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ Backend Health: HEALTHY' -ForegroundColor Green } else { Write-Host '❌ Backend Health: UNHEALTHY' -ForegroundColor Red } } catch { Write-Host '❌ Backend Health: NOT RESPONDING' -ForegroundColor Red }"

echo [2/4] Checking Frontend User (port 3000)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -Method Get -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ Frontend User: HEALTHY' -ForegroundColor Green } else { Write-Host '❌ Frontend User: UNHEALTHY' -ForegroundColor Red } } catch { Write-Host '❌ Frontend User: NOT RESPONDING' -ForegroundColor Red }"

echo [3/4] Checking Frontend Admin (port 3001)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001' -Method Get -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ Frontend Admin: HEALTHY' -ForegroundColor Green } else { Write-Host '❌ Frontend Admin: UNHEALTHY' -ForegroundColor Red } } catch { Write-Host '❌ Frontend Admin: NOT RESPONDING' -ForegroundColor Red }"

echo [4/4] Checking Main Frontend (port 3002)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3002' -Method Get -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ Main Frontend: HEALTHY' -ForegroundColor Green } else { Write-Host '❌ Main Frontend: UNHEALTHY' -ForegroundColor Red } } catch { Write-Host '❌ Main Frontend: NOT RESPONDING' -ForegroundColor Red }"

echo.
echo Health check completed.
echo.
pause 