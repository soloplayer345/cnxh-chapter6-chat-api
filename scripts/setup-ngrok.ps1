# Cai authtoken ngrok (chi can lam mot lan).
# Lay token: https://dashboard.ngrok.com/get-started/your-authtoken

param(
    [Parameter(Mandatory = $true)]
    [string]$Authtoken
)

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

$ngrok = Get-NgrokExe
& $ngrok config add-authtoken $Authtoken
Write-Host "Da luu authtoken. Chay tunnel: bun run ngrok"
