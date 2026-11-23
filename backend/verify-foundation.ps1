param(
    [string]$MySqlBin = "$env:ProgramFiles\MySQL\MySQL Server 8.0\bin",
    [switch]$SqlOnly,
    [switch]$Browser
)
$ErrorActionPreference='Stop'
if($SqlOnly -and $Browser){throw 'Choose either -SqlOnly or -Browser'}
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$tag=[guid]::NewGuid().ToString('N')
$lab=Join-Path ([IO.Path]::GetTempPath()) "campus-foundation-$tag"
New-Item -ItemType Directory $lab -ErrorAction Stop | Out-Null
$mysql=Join-Path $MySqlBin 'mysql.exe'
$daemon=Join-Path $MySqlBin 'mysqld.exe'
$port=Get-Random -Minimum 36000 -Maximum 45000
$data=Join-Path $lab 'data'
$log=Join-Path $lab 'server.log'
$memory="campus$tag"
$connection=if($SqlOnly){@('--no-defaults','--protocol=MEMORY',"--shared-memory-base-name=$memory",'-uroot')}else{@('--no-defaults','-h','127.0.0.1',"-P$port",'-uroot')}
$client=$connection+@('-N','-B','--raw')
$secret=[guid]::NewGuid().ToString('N')
$init=Join-Path $lab 'bootstrap.sql'
$previous=@{}
foreach ($key in @('MYSQL_PWD','SPRING_DATASOURCE_URL','CAMPUS_DB_USER','CAMPUS_DB_PASSWORD','CAMPUS_ADMIN_LOGIN','CAMPUS_ADMIN_PASSWORD','CAMPUS_DISPOSABLE_WORKFLOW')){
    $previous[$key]=[Environment]::GetEnvironmentVariable($key)
}
try {
    & $daemon --no-defaults --initialize-insecure "--datadir=$data" "--log-error=$log"
    if($LASTEXITCODE){throw "Initialization failed. See $log"}
    [IO.File]::WriteAllText($init,"ALTER USER 'root'@'localhost' IDENTIFIED BY '$secret'; CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '$secret'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;")
    $serverArgs=@('--no-defaults',"--datadir=`"$data`"","--log-error=`"$log`"","--init-file=`"$init`"",'--mysqlx=0','--bind-address=127.0.0.1',"--port=$port")
    if($SqlOnly){$serverArgs=$serverArgs[0..4]+@('--skip-networking','--shared-memory',"--shared-memory-base-name=$memory")}
    $server=Start-Process $daemon -ArgumentList $serverArgs -WindowStyle Hidden -PassThru
    $env:MYSQL_PWD=$secret
    for($n=0;$n -lt 50 -and !(Select-String -LiteralPath $log -Pattern 'ready for connections' -Quiet);$n++){
        if($server.HasExited){throw "Disposable MySQL exited. See $log"}
        Start-Sleep -Milliseconds 250
    }
    $actual=& $mysql @client -e 'SELECT @@datadir'
    if ($LASTEXITCODE -or [IO.Path]::GetFullPath($actual.TrimEnd('\','/')) -ne [IO.Path]::GetFullPath($data)){throw 'Unexpected database instance'}
    foreach($file in @('database/schema_v5.sql','database/procedures_triggers.sql','database/migrations/006_academic_foundation.sql','database/migrations/007_evaluations_management.sql','database/migrations/008_timetable_scheduling.sql','database/migrations/009_attendance_analytics.sql','database/migrations/010_student_complaints.sql')){
        $arguments=$client
        if($file -like '*006*' -or $file -like '*007*' -or $file -like '*008*' -or $file -like '*009*' -or $file -like '*010*'){$arguments+=@('campus_harmony')}
        Get-Content -Raw (Join-Path $repo $file) | & $mysql @arguments
        if($LASTEXITCODE){throw "Failed $file"}
        Write-Output "Applied $file"
    }
    $fixture=Get-Content -Raw "$PSScriptRoot/src/test/resources/foundation_constraints.sql"
    if($SqlOnly){$fixture=$fixture.Replace("ROLLBACK;", "COMMIT;")}
    $result=$fixture | & $mysql @client campus_harmony
    if($LASTEXITCODE -or $result -ne 'DB_FIXTURE 1 1 1'){throw "SQL fixture failed: $result"}
    Write-Output 'Verified parallel section slots, enrollment, persisted lecture record and MySQL summary trigger'
    if($SqlOnly){
        & (Join-Path $MySqlBin 'mysqladmin.exe') @connection shutdown
        if($LASTEXITCODE -or !$server.WaitForExit(10000)){throw 'Could not shut down isolated MySQL'}
        $restartArgs=$serverArgs | Where-Object {$_ -notlike '--init-file=*'}
        $server=Start-Process $daemon -ArgumentList $restartArgs -WindowStyle Hidden -PassThru
        $ready=$false
        for($n=0;$n -lt 50 -and !$ready;$n++){
            Start-Sleep -Milliseconds 250
            $null=& $mysql @client -e 'SELECT 1' 2>$null
            $ready=$LASTEXITCODE -eq 0
        }
        if(!$ready){throw 'Disposable MySQL failed to restart'}
        $persisted=& $mysql @client campus_harmony -e "SELECT CONCAT(COUNT(*),' ',ROUND(100*AVG(r.status='Present'))) FROM attendance_records r JOIN students s ON s.id=r.student_id WHERE s.roll='CHECK'"
        if($LASTEXITCODE -or $persisted -ne '1 100'){throw 'Attendance persistence check failed'}
        Write-Output 'Verified committed lecture attendance after a MySQL server restart'
    }
    if(!$SqlOnly){
        $env:SPRING_DATASOURCE_URL="jdbc:mysql://127.0.0.1:$port/campus_harmony?sslMode=DISABLED&allowPublicKeyRetrieval=true"
        $env:CAMPUS_DB_USER='root'
        $env:CAMPUS_DB_PASSWORD=$secret
        $env:CAMPUS_ADMIN_LOGIN="admin-$tag"
        $env:CAMPUS_ADMIN_PASSWORD=[guid]::NewGuid().ToString('N')
        Copy-Item -LiteralPath "$PSScriptRoot/pom.xml" -Destination $lab
        Copy-Item -LiteralPath "$PSScriptRoot/src" -Destination $lab -Recurse
        if($Browser){
            Write-Host 'Disposable browser lab. Keep this terminal open and press Ctrl+C when finished.'
            Write-Host "Local API: http://127.0.0.1:8080/api"
            Write-Host "Disposable admin account: $env:CAMPUS_ADMIN_LOGIN"
            Write-Host "Disposable admin password: $env:CAMPUS_ADMIN_PASSWORD"
            & mvn.cmd -f "$lab/pom.xml" '-Dspring-boot.run.arguments=--server.address=127.0.0.1 --server.port=8080' spring-boot:run
            if($LASTEXITCODE){throw 'Disposable browser backend exited with an error'}
        }else{
            $env:CAMPUS_DISPOSABLE_WORKFLOW='true'
            & mvn.cmd -f "$lab/pom.xml" '-Dtest=FoundationWorkflowIT,MarksWorkflowIT,TimetableWorkflowIT,AnalyticsWorkflowIT,ComplaintWorkflowIT' test
            if($LASTEXITCODE){throw 'Spring Boot workflow verification failed'}
        }
    }
} finally {
    if($server -and !$server.HasExited){
        & (Join-Path $MySqlBin 'mysqladmin.exe') @connection shutdown
        if(!$server.WaitForExit(4000)){$server.Kill();$server.WaitForExit()}
    }
    foreach($key in $previous.Keys){[Environment]::SetEnvironmentVariable($key,$previous[$key])}
    if(Test-Path $init){Remove-Item -LiteralPath $init -ErrorAction SilentlyContinue}
    $resolved=(Resolve-Path -LiteralPath $lab).Path
    $expected=Join-Path ([IO.Path]::GetFullPath([IO.Path]::GetTempPath())) "campus-foundation-$tag"
    if($resolved -eq $expected){
        Start-Sleep -Milliseconds 500
        Remove-Item -Recurse -Force -LiteralPath $resolved -ErrorAction SilentlyContinue
    }
}

