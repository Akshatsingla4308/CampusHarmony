# =============================================================================
# Campus Harmony — Safe Application Orchestrator (scripts/run.ps1)
# =============================================================================
# Fully compatible with Windows PowerShell 5.1 and PowerShell 7+
# Safely parses credentials from .env without command-line or delayed expansion corruption.
# =============================================================================

$ErrorActionPreference = 'Stop'

# PowerShell 5.1+ guard
if ($PSVersionTable.PSVersion.Major -lt 5) {
    [Console]::Error.WriteLine("[ERROR] Windows PowerShell 5.1 or higher is required.")
    exit 1
}

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $repo ".env"

if (!(Test-Path -LiteralPath $envFile)) {
    [Console]::Error.WriteLine("[ERROR] Configuration file .env was not found!")
    [Console]::Error.WriteLine("Please copy .env.example to .env and configure your secure passwords:")
    [Console]::Error.WriteLine("  copy .env.example .env")
    exit 1
}

# 1. Safely parse .env file preserving all special characters (!, &, %, ^, spaces, quotes)
Get-Content -LiteralPath $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and !$line.StartsWith("#") -and ($line -match "^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$")) {
        $varName = $matches[1]
        $varVal = $matches[2]
        if (($varVal.StartsWith('"') -and $varVal.EndsWith('"')) -or ($varVal.StartsWith("'") -and $varVal.EndsWith("'"))) {
            $varVal = $varVal.Substring(1, $varVal.Length - 2)
        }
        [Environment]::SetEnvironmentVariable($varName, $varVal, "Process")
    }
}

# 2. Strict validation of required credentials — zero hardcoded defaults
$dbPass = $env:CAMPUS_DB_PASSWORD
$adminPass = $env:CAMPUS_ADMIN_PASSWORD

if ([string]::IsNullOrWhiteSpace($dbPass)) {
    [Console]::Error.WriteLine("[SECURITY ERROR] CAMPUS_DB_PASSWORD is not set in .env!")
    [Console]::Error.WriteLine("Please set your secure MySQL password in .env before starting.")
    exit 1
}
if ($dbPass -eq 'your_secure_mysql_password_here') {
    [Console]::Error.WriteLine("[SECURITY ERROR] CAMPUS_DB_PASSWORD is still set to placeholder 'your_secure_mysql_password_here'!")
    [Console]::Error.WriteLine("Please edit .env and replace it with your actual secure password.")
    exit 1
}
if ([string]::IsNullOrWhiteSpace($adminPass)) {
    [Console]::Error.WriteLine("[SECURITY ERROR] CAMPUS_ADMIN_PASSWORD is not set in .env!")
    [Console]::Error.WriteLine("Please set your administrator password in .env before starting.")
    exit 1
}
if ($adminPass -eq 'your_secure_admin_password_here') {
    [Console]::Error.WriteLine("[SECURITY ERROR] CAMPUS_ADMIN_PASSWORD is still set to placeholder 'your_secure_admin_password_here'!")
    [Console]::Error.WriteLine("Please edit .env and replace it with your actual secure password.")
    exit 1
}

if ([string]::IsNullOrWhiteSpace($env:CAMPUS_DB_USER)) { $env:CAMPUS_DB_USER = 'root' }
if ([string]::IsNullOrWhiteSpace($env:CAMPUS_ADMIN_LOGIN)) { $env:CAMPUS_ADMIN_LOGIN = 'admin' }
if ([string]::IsNullOrWhiteSpace($env:SPRING_DATASOURCE_URL)) {
    $env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/campus_harmony?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
}

# Ensure process tracking directory exists
$runDir = Join-Path $repo ".campus_run"
if (!(Test-Path -LiteralPath $runDir)) {
    New-Item -ItemType Directory -Path $runDir -Force | Out-Null
}

# 3. Determine run mode (auto / docker / native)
$mode = if ($env:CAMPUS_RUN_MODE) { $env:CAMPUS_RUN_MODE.ToLower().Trim() } else { 'auto' }

function Test-PortOpen([string]$hostAddress, [int]$portNumber) {
    $tcp = New-Object Net.Sockets.TcpClient
    try {
        $tcp.Connect($hostAddress, $portNumber)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

$port3306InUse = Test-PortOpen '127.0.0.1' 3306

$useDocker = $false
if ($mode -eq 'docker') {
    $dockerCmd = Get-Command docker.exe -ErrorAction SilentlyContinue
    if (!$dockerCmd) {
        [Console]::Error.WriteLine("[ERROR] Docker mode requested, but docker CLI was not found in PATH.")
        exit 1
    }
    $dockerInfo = & docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine("[ERROR] Docker mode requested, but Docker Desktop daemon is not running.")
        exit 1
    }
    if ($port3306InUse) {
        [Console]::Error.WriteLine("[PORT CONFLICT ERROR] Port 3306 is already in use by a host service (such as local MySQL Server).")
        [Console]::Error.WriteLine("To run Campus Harmony via Docker Compose, stop the local MySQL service (e.g. net stop MySQL80)")
        [Console]::Error.WriteLine("or configure CAMPUS_RUN_MODE=native in .env to use your local MySQL instance.")
        exit 1
    }
    $useDocker = $true
} elseif ($mode -eq 'native') {
    $useDocker = $false
} else {
    # auto mode
    $dockerCmd = Get-Command docker.exe -ErrorAction SilentlyContinue
    if ($dockerCmd) {
        $dockerInfo = & docker info 2>&1
        if ($LASTEXITCODE -eq 0 -and !$port3306InUse) {
            $useDocker = $true
        } elseif ($LASTEXITCODE -eq 0 -and $port3306InUse) {
            Write-Host "[INFO] Local MySQL service detected on port 3306. Auto-selecting Native Windows mode."
            $useDocker = $false
        }
    }
}

# 4. Execution path: Docker Compose
if ($useDocker) {
    Write-Host "[INFO] Starting Campus Harmony via Docker Compose (compose.yaml)..."
    $composeFile = Join-Path $repo "compose.yaml"
    & docker compose -f $composeFile up -d
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine("[ERROR] Docker Compose failed to start containers. Aborting launch.")
        exit 1
    }

    Write-Host "[INFO] Waiting for container services to initialize..."
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $req = [System.Net.WebRequest]::Create('http://localhost:5173')
            $resp = $req.GetResponse()
            $resp.Close()
            $ready = $true
            break
        } catch { }
        Start-Sleep -Seconds 2
    }

    if (!$ready) {
        [Console]::Error.WriteLine("[ERROR] Docker Compose services timed out before becoming ready!")
        exit 1
    }

    Write-Host "[OK] Docker services verified ready."
    Start-Process "http://localhost:5173"
    exit 0
}

# 5. Execution path: Native Windows
Write-Host "[INFO] Running in Native Windows Mode..."
Write-Host "[1/5] Checking Environment Prerequisites..."

foreach ($tool in @('java', 'mvn', 'node', 'npm')) {
    $c = Get-Command "$tool.exe" -ErrorAction SilentlyContinue
    if (!$c) { $c = Get-Command "$tool.cmd" -ErrorAction SilentlyContinue }
    if (!$c) {
        [Console]::Error.WriteLine("[ERROR] Required tool '$tool' was not found in PATH!")
        exit 1
    }
}
Write-Host "[OK] Java JDK, Apache Maven, Node.js, and npm are verified."

# Install frontend dependencies if missing
$nodeModulesDir = Join-Path $repo "frontend\node_modules"
if (!(Test-Path -LiteralPath $nodeModulesDir)) {
    Write-Host "[INFO] First-time setup: Installing frontend dependencies (npm install)..."
    $frontendDir = Join-Path $repo "frontend"
    & npm.cmd --prefix $frontendDir install
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine("[ERROR] Failed to install frontend dependencies!")
        exit 1
    }
    Write-Host "[OK] Frontend dependencies installed successfully."
}

Write-Host "[2/5] Checking Local MySQL Database (localhost:3306)..."
if (!(Test-PortOpen '127.0.0.1' 3306)) {
    Write-Host "[INFO] MySQL is not responding on port 3306. Attempting to start MySQL80 service..."
    Start-Process -FilePath "net.exe" -ArgumentList "start MySQL80" -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
    if (!(Test-PortOpen '127.0.0.1' 3306)) {
        Start-Process -FilePath "net.exe" -ArgumentList "start MySQL" -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
    }
    if (!(Test-PortOpen '127.0.0.1' 3306)) {
        [Console]::Error.WriteLine("[ERROR] Could not connect to MySQL Server on localhost:3306!")
        [Console]::Error.WriteLine("Please ensure MySQL Server 8.0 is running and listening on port 3306.")
        exit 1
    }
}
Write-Host "[OK] MySQL Server is active on localhost:3306."

Write-Host "[3/5] Verifying Database Schema and Migrations..."
$initDbScript = Join-Path $repo "scripts\init-db.ps1"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $initDbScript
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("[ERROR] Database verification or initialization failed! Check error details above.")
    exit 1
}

Write-Host "[4/5] Starting Spring Boot Backend (Port 8080)..."
$backendDir = Join-Path $repo "backend"
$backendPidFile = Join-Path $runDir "backend.pid"

$backendProc = Start-Process -FilePath "mvn.cmd" -ArgumentList "spring-boot:run" -WorkingDirectory $backendDir -WindowStyle Minimized -PassThru
Set-Content -LiteralPath $backendPidFile -Value $backendProc.Id

Write-Host "[INFO] Waiting for Spring Boot Backend on http://localhost:8080/api..."
$backendReady = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $req = [System.Net.WebRequest]::Create('http://localhost:8080/api/auth/me')
        $resp = $req.GetResponse()
        $resp.Close()
        $backendReady = $true
        break
    } catch [System.Net.WebException] {
        if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -in 401, 403, 200) {
            $backendReady = $true
            break
        }
    }
    Start-Sleep -Seconds 1
}

if (!$backendReady) {
    [Console]::Error.WriteLine("[ERROR] Backend failed to become ready within 60 seconds!")
    $stopScript = Join-Path $repo "scripts\stop.ps1"
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $stopScript
    exit 1
}
Write-Host "[OK] Spring Boot Backend is active and responsive."

Write-Host "[5/5] Starting React Frontend (Port 5173)..."
$frontendDir = Join-Path $repo "frontend"
$frontendPidFile = Join-Path $runDir "frontend.pid"

$frontendProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory $frontendDir -WindowStyle Minimized -PassThru
Set-Content -LiteralPath $frontendPidFile -Value $frontendProc.Id

Write-Host "[INFO] Waiting for React Frontend on http://localhost:5173..."
$frontendReady = $false
for ($i = 0; $i -lt 45; $i++) {
    try {
        $req = [System.Net.WebRequest]::Create('http://localhost:5173')
        $resp = $req.GetResponse()
        $resp.Close()
        $frontendReady = $true
        break
    } catch { }
    Start-Sleep -Seconds 1
}

if (!$frontendReady) {
    [Console]::Error.WriteLine("[ERROR] Frontend failed to become ready within 45 seconds!")
    $stopScript = Join-Path $repo "scripts\stop.ps1"
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $stopScript
    exit 1
}
Write-Host "[OK] React Frontend is active and serving requests."

Write-Host "======================================================================"
Write-Host "  CAMPUS HARMONY IS READY AND VERIFIED!"
Write-Host "  ------------------------------------------------------------------"
Write-Host "  * Web Application:        http://localhost:5173"
Write-Host "  * Spring Boot REST API:   http://localhost:8080/api"
Write-Host "  * Administrator Login:    $env:CAMPUS_ADMIN_LOGIN"
Write-Host "======================================================================"
Write-Host ""
Write-Host "Launching Campus Harmony in your default web browser..."
Start-Process "http://localhost:5173"
Write-Host ""
Write-Host "To safely stop all services without resetting your database, run STOP_CAMPUSHARMONY.bat."
exit 0
