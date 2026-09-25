$ErrorActionPreference = "Stop"

$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = "C:\Bruno\Proyectos\farmacia-inacap\frontend"
$target = Join-Path $frontend "src\styles\index.css"

Write-Host "==> Aplicando index.css final de FarmaGestion..." -ForegroundColor Cyan

Copy-Item (Join-Path $source "index.css") $target -Force

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
Write-Host " INDEX FINAL APLICADO - BUILD CORRECTO" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta: npm run dev" -ForegroundColor Yellow
