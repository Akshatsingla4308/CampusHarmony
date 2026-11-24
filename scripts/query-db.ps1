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

$dbPass = $env:CAMPUS_DB_PASSWORD
$dbUser = if ($env:CAMPUS_DB_USER) { $env:CAMPUS_DB_USER } else { 'root' }
$env:MYSQL_PWD = $dbPass

$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (!(Test-Path -LiteralPath $mysql)) {
    $cmdObj = Get-Command mysql.exe -ErrorAction SilentlyContinue
    $mysql = if ($cmdObj) { $cmdObj.Source } else { $null }
}

$query = $args[0]
if ($query) {
    & $mysql --no-defaults -h 127.0.0.1 -P 3306 "-u$($dbUser)" campus_harmony -e "$query"
} else {
    Write-Host "Usage: query-db.ps1 '<sql query>'"
}
