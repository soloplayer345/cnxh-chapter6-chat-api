# Mo tunnel ngrok toi API port 5000 (Docker hoac bun run dev).
# Lan dau: chay scripts/setup-ngrok.ps1 de them authtoken.

$ErrorActionPreference = "Stop"

function Get-NgrokExe {
    if (Get-Command ngrok -ErrorAction SilentlyContinue) {
        return "ngrok"
    }
    $wingetPath = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Links\ngrok.exe"
    if (Test-Path $wingetPath) {
        return $wingetPath
    }
    throw "Khong tim thay ngrok. Cai: winget install Ngrok.Ngrok"
}

$port = if ($env:PORT) { $env:PORT } else { 5000 }
$healthUrl = "http://localhost:$port/health"

Write-Host "Kiem tra API tai $healthUrl ..."
try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
    if ($response.Content -notmatch '"success":\s*true') {
        throw "Health check khong tra success:true"
    }
    Write-Host "API OK."
}
catch {
    Write-Host "API chua chay hoac chua san sang." -ForegroundColor Red
    Write-Host "Chay truoc: docker compose up -d   hoac   bun run dev"
    exit 1
}

$ngrok = Get-NgrokExe

$versionOutput = & $ngrok version 2>&1 | Out-String
if ($versionOutput -match "ngrok version (\d+\.\d+\.\d+)") {
    $currentVersion = [version]$Matches[1]
    if ($currentVersion -lt [version]"3.20.0") {
        Write-Host "Ngrok $currentVersion qua cu (can >= 3.20). Dang cap nhat..."
        & $ngrok update
    }
}

function Get-ExistingTunnel {
    try {
        $data = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 3
        return $data.tunnels | Where-Object { $_.config.addr -match ":$port$" -or $_.config.addr -eq "http://localhost:$port" }
    }
    catch {
        return $null
    }
}

$existing = Get-ExistingTunnel
if ($existing) {
    $url = $existing[0].public_url
    Write-Host "Ngrok da chay san cho port $port." -ForegroundColor Yellow
    Write-Host "Public URL: $url"
    Write-Host "Swagger:    $url/api-docs"
    Write-Host "Dashboard:  http://127.0.0.1:4040"
    Write-Host "Dung tunnel cuoc: bun run ngrok:stop"
    exit 0
}

$stale = Get-Process ngrok -ErrorAction SilentlyContinue
if ($stale) {
    Write-Host "Dang dung ngrok cu (PID $($stale.Id -join ', '))..."
    $stale | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host "Mo ngrok tunnel -> localhost:$port"
Write-Host "Dashboard: http://127.0.0.1:4040"
Write-Host "Dung tunnel: Ctrl+C"
& $ngrok http $port
