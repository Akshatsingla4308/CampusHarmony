# =============================================================================
# Campus Harmony — Safe Service Shutdown (scripts/stop.ps1)
# =============================================================================
# Fully compatible with Windows PowerShell 5.1 and PowerShell 7+
# Stops ONLY CampusHarmony-owned processes. Avoids killing unrelated programs.
# =============================================================================

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composeFile = Join-Path $repo "compose.yaml"
$runDir = Join-Path $repo ".campus_run"

Write-Host "======================================================================"
Write-Host "  CAMPUS HARMONY — SAFE SHUTDOWN UTILITY"
Write-Host "======================================================================"

# 1. Stop Docker Compose containers if running
$dockerCmd = Get-Command docker.exe -ErrorAction SilentlyContinue
if ($dockerCmd) {
    $activeContainers = & docker compose -f $composeFile ps -q 2>$null
    if ($LASTEXITCODE -eq 0 -and $activeContainers) {
        Write-Host "[INFO] Stopping Docker Compose containers..."
        & docker compose -f $composeFile stop
        Write-Host "[OK] Containers stopped. Persistent database volume 'campusharmony_mysql_data' is preserved."
    }
}

# 2. Stop tracked processes by PID with validation against stale/reused IDs
function Stop-TrackedProcess([string]$pidFileName, [string]$serviceName) {
    $pidFile = Join-Path $runDir $pidFileName
    if (Test-Path -LiteralPath $pidFile) {
        $rawPid = (Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Out-String).Trim()
        $procId = 0
        if ([int]::TryParse($rawPid, [ref]$procId) -and $procId -gt 0) {
            $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue
            if ($proc) {
                $cmdLine = $proc.CommandLine
                # Verify process is actually CampusHarmony
                if ($cmdLine -and ($cmdLine -like "*$repo*" -or $cmdLine -like "*spring-boot:run*" -or $cmdLine -like "*vite*")) {
                    Write-Host "[INFO] Stopping Campus Harmony $serviceName (PID $procId)..."
                    Start-Process -FilePath "taskkill.exe" -ArgumentList "/F /T /PID $procId" -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
                } else {
                    Write-Host "[INFO] PID $procId is not associated with CampusHarmony (stale PID). Skipping."
                }
            }
        }
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    }
}

Stop-TrackedProcess "backend.pid" "Backend"
Stop-TrackedProcess "frontend.pid" "Frontend"

# 3. Terminate any remaining processes strictly matching this repository's path
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.ProcessId -ne $PID -and $_.CommandLine -and (
        $_.CommandLine -like "*$repo\backend*" -or 
        $_.CommandLine -like "*$repo\frontend*"
    )
} | ForEach-Object {
    Write-Host "[INFO] Terminating lingering process (PID $($_.ProcessId))..."
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "======================================================================"
Write-Host "  Campus Harmony application services have been safely stopped."
Write-Host "  MySQL Server service and all database records remain intact."
Write-Host "======================================================================"
Write-Host ""
