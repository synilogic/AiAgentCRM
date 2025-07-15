#!/usr/bin/env pwsh

Write-Host "Starting Ai Agentic CRM Applications..." -ForegroundColor Green

# Start Backend Server
Write-Host "Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start User Frontend
Write-Host "Starting User Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-user'; npm start"

# Start Admin Frontend
Write-Host "Starting Admin Frontend (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend-admin'; npm start"

Write-Host ""
Write-Host "All applications are starting up!" -ForegroundColor Green
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "  User Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Admin Frontend: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 