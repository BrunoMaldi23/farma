$ErrorActionPreference = "Stop"

$frontend = "C:\Bruno\Proyectos\farmacia-inacap\frontend"
$source = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==> Instalando rediseño Sidebar + Topbar + Shell..." -ForegroundColor Cyan

Copy-Item (Join-Path $source "src\components\layout\AppShell.tsx") `
  (Join-Path $frontend "src\components\layout\AppShell.tsx") -Force

Copy-Item (Join-Path $source "src\components\layout\Sidebar.tsx") `
  (Join-Path $frontend "src\components\layout\Sidebar.tsx") -Force

Copy-Item (Join-Path $source "src\components\layout\Topbar.tsx") `
  (Join-Path $frontend "src\components\layout\Topbar.tsx") -Force

Copy-Item (Join-Path $source "src\components\layout\navigation.ts") `
  (Join-Path $frontend "src\components\layout\navigation.ts") -Force

Copy-Item (Join-Path $source "src\styles\index.css") `
  (Join-Path $frontend "src\styles\index.css") -Force

Set-Location $frontend

Write-Host "==> Validando build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "El build encontro errores. Enviame TODA la salida." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host " SIDEBAR + TOPBAR REDISENADOS Y BUILD CORRECTO" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ejecuta: npm run dev" -ForegroundColor Yellow
