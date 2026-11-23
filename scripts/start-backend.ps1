# scripts/start-backend.ps1
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $repo ".env"

if (Test-Path -LiteralPath $envFile) {
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
}

if ([string]::IsNullOrWhiteSpace($env:CAMPUS_DB_USER)) { $env:CAMPUS_DB_USER = 'root' }
if ([string]::IsNullOrWhiteSpace($env:CAMPUS_ADMIN_LOGIN)) { $env:CAMPUS_ADMIN_LOGIN = 'admin' }
if ([string]::IsNullOrWhiteSpace($env:SPRING_DATASOURCE_URL)) {
    $env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/campus_harmony?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
}

Set-Location (Join-Path $repo "backend")
Write-Host "Starting Spring Boot on port 8080..."
& mvn.cmd spring-boot:run
