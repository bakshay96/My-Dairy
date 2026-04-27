# Restart Vite Dev Server - Complete Clean Start

Write-Host "`n=== MY-DAIRY FRESH START ===" -ForegroundColor Cyan
Write-Host "`nStep 1: Stopping all Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Done!" -ForegroundColor Green

Write-Host "`nStep 2: Clearing all caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
Write-Host "Done!" -ForegroundColor Green

Write-Host "`nStep 3: Starting fresh dev server..." -ForegroundColor Yellow
Write-Host "`nOpening new terminal window..." -ForegroundColor Gray

# Start Vite in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "`n=== INSTRUCTIONS ===" -ForegroundColor Cyan
Write-Host "`n1. Wait for 'VITE ready' message in the new window" -ForegroundColor White
Write-Host "2. Open INCOGNITO/PRIVATE browser window" -ForegroundColor White
Write-Host "3. Navigate to: http://localhost:5173" -ForegroundColor White
Write-Host "4. Press F12 to check console - should have NO errors" -ForegroundColor White
Write-Host "`nIf you still see errors:" -ForegroundColor Yellow
Write-Host "- Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor Gray
Write-Host "- Use completely different browser" -ForegroundColor Gray
Write-Host "- Restart your computer" -ForegroundColor Gray
