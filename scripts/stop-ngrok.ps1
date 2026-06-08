$processes = Get-Process ngrok -ErrorAction SilentlyContinue
if (-not $processes) {
    Write-Host "Khong co ngrok nao dang chay."
    exit 0
}

$processes | Stop-Process -Force
Write-Host "Da dung ngrok (PID: $($processes.Id -join ', '))."
Write-Host "Chay lai: bun run ngrok"
