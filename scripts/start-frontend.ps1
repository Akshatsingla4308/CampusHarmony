# scripts/start-frontend.ps1
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location (Join-Path $repo "frontend")
Write-Host "Starting Vite frontend on port 5173..."
& npm.cmd run dev
