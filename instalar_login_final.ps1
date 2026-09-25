$ErrorActionPreference = "Stop"

$frontend = "C:\Bruno\Proyectos\farmacia-inacap\frontend"
$source = Split-Path -Parent $MyInvocation.MyCommand.Path

$loginTarget = Join-Path $frontend "src\pages\LoginPage.tsx"
$cssTarget = Join-Path $frontend "src\styles\index.css"

Write-Host "==> Instalando login minimalista FarmaGestion..." -ForegroundColor Cyan

Copy-Item (Join-Path $source "LoginPage.tsx") $loginTarget -Force
Copy-Item (Join-Path $source "index.css") $cssTarget -Force

Set-Location $frontend

Write-Host "==> Validando build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "El build encontro errores. Enviame TODA la salida." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " LOGIN INSTALADO Y BUILD CORRECTO" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ejecuta: npm run dev" -ForegroundColor Yellow
