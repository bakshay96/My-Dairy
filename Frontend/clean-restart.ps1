# Complete Clean Restart Script for My-Dairy Frontend
# Run this if you're experiencing React hooks errors

Write-Host "🧹 Starting complete clean process..." -ForegroundColor Cyan

# Stop any running processes
Write-Host "`n📡 Checking for running Vite processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*My-Dairy*" } | Stop-Process -Force

# Clean Vite cache
Write-Host "`n🗑️  Cleaning Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "✅ Vite cache cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Vite cache found" -ForegroundColor Gray
}

# Clean dist folder
Write-Host "`n🗑️  Cleaning dist folder..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Dist folder cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No dist folder found" -ForegroundColor Gray
}

# Verify React versions
Write-Host "`n🔍 Verifying React versions..." -ForegroundColor Yellow
$reactOutput = npm ls react 2>&1 | Select-String "react@"
Write-Host "React versions found:" -ForegroundColor Gray
$reactOutput | Select-Object -First 5 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

# Instructions
Write-Host "`n✅ Clean process complete!" -ForegroundColor Green
Write-Host "`n🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Open browser in INCOGNITO/PRIVATE mode" -ForegroundColor White
Write-Host "3. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "4. Hard reload (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "`n⚠️  IMPORTANT: Use INCOGNITO mode first to bypass all cache!" -ForegroundColor Yellow
