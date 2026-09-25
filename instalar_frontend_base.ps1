$ErrorActionPreference = "Stop"

$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = "C:\Bruno\Proyectos\farmacia-inacap\frontend"

if (-not (Test-Path $frontend)) {
  New-Item -ItemType Directory -Force -Path $frontend | Out-Null
}

$sourceResolved = (Resolve-Path $source).Path.TrimEnd('\')
$frontendResolved = (Resolve-Path $frontend).Path.TrimEnd('\')

Write-Host "==> Instalando FRONTEND BASE RESPONSIVE..." -ForegroundColor Cyan

if ($sourceResolved -ne $frontendResolved) {
  if (Test-Path (Join-Path $source "src")) {
    Copy-Item -Path (Join-Path $source "src") -Destination $frontend -Recurse -Force
  }

  Copy-Item -Path (Join-Path $source ".env.example") -Destination (Join-Path $frontend ".env.example") -Force
  Copy-Item -Path (Join-Path $source "README_FRONTEND.md") -Destination (Join-Path $frontend "README_FRONTEND.md") -Force
}
else {
  Write-Host "Los archivos ya están dentro de frontend; se omite la copia." -ForegroundColor Yellow
}

Set-Location $frontend

if (-not (Test-Path "package.json")) {
  Write-Host "No existe package.json. Creando proyecto Vite..." -ForegroundColor Cyan
  npm create vite@latest . -- --template react-ts
}

Write-Host "==> Instalando dependencias..." -ForegroundColor Cyan
npm install
npm install react-router-dom axios lucide-react

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
}

Write-Host "==> Validando TypeScript y build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "El frontend tiene errores de compilacion. Enviame TODA la salida." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host " FRONTEND BASE RESPONSIVE INSTALADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: npm run dev" -ForegroundColor Yellow
Write-Host "Navegador: http://localhost:5173" -ForegroundColor Yellow
