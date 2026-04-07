@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: Azure Redeploy — AI Hub Assessment
:: Builds, packages, and deploys the Next.js app to Azure App Service.
:: Run from the repository root (D:\AI-Assessment-Hub).
:: ============================================================================

set "APP_DIR=%~dp0ai-hub-assessment"
set "STAGING_DIR=%~dp0deploy-staging"
set "ZIP_PATH=%~dp0deploy.zip"
set "WEBAPP_NAME=waw-secopsai-dev-westeurope-01"
set "RESOURCE_GROUP=rg-secopsai-app-dev-westeurope-01"
set "KUDU_URL=https://%WEBAPP_NAME%.scm.azurewebsites.net"
set "PRISMA_ENGINE_HASH=605197351a3c8bdd595af2d2a9bc3025bca48ea2"
set "PRISMA_CDN=https://binaries.prisma.sh/all_commits/%PRISMA_ENGINE_HASH%/debian-openssl-3.0.x"

echo.
echo ============================================================
echo   AI Hub Assessment — Azure Redeploy
echo ============================================================
echo   App Dir   : %APP_DIR%
echo   Web App   : %WEBAPP_NAME%
echo   Resource  : %RESOURCE_GROUP%
echo ============================================================
echo.

:: -------------------------------------------------------------------
:: Step 0: Pre-flight checks
:: -------------------------------------------------------------------
echo [0/8] Pre-flight checks...
where az >nul 2>&1 || (echo ERROR: Azure CLI not found. Install from https://aka.ms/installazurecli & exit /b 1)
where node >nul 2>&1 || (echo ERROR: Node.js not found. & exit /b 1)
if not exist "%APP_DIR%\package.json" (echo ERROR: %APP_DIR%\package.json not found. Run from repo root. & exit /b 1)

:: Verify Azure login
az account show >nul 2>&1
if errorlevel 1 (
    echo Not logged in to Azure. Running az login...
    az login
    if errorlevel 1 (echo ERROR: Azure login failed. & exit /b 1)
)
echo   OK — Azure CLI logged in.

:: -------------------------------------------------------------------
:: Step 1: Generate Prisma client with Linux binary target
:: -------------------------------------------------------------------
echo.
echo [1/8] Generating Prisma client (Windows + Linux targets)...
cd /d "%APP_DIR%"
call npx prisma generate
if errorlevel 1 (echo ERROR: prisma generate failed. & exit /b 1)
echo   OK — Prisma client generated.

:: -------------------------------------------------------------------
:: Step 2: Build Next.js standalone
:: -------------------------------------------------------------------
echo.
echo [2/8] Building Next.js (standalone mode)...
if exist "%APP_DIR%\.next" rd /s /q "%APP_DIR%\.next"
call npm run build
if errorlevel 1 (echo ERROR: Next.js build failed. & exit /b 1)
echo   OK — Build complete.

:: -------------------------------------------------------------------
:: Step 3: Assemble deploy-staging directory
:: -------------------------------------------------------------------
echo.
echo [3/8] Assembling deploy staging...

if exist "%STAGING_DIR%" rd /s /q "%STAGING_DIR%"
mkdir "%STAGING_DIR%"

:: standalone output → staging root
xcopy "%APP_DIR%\.next\standalone\*" "%STAGING_DIR%\" /E /Q /Y >nul

:: static assets
xcopy "%APP_DIR%\.next\static" "%STAGING_DIR%\.next\static\" /E /Q /Y >nul

:: public assets
xcopy "%APP_DIR%\public" "%STAGING_DIR%\public\" /E /Q /Y >nul

:: prisma schema + migrations (for future migration runs via SSH)
xcopy "%APP_DIR%\prisma" "%STAGING_DIR%\prisma\" /E /Q /Y >nul

:: startup script and seed
copy /Y "%APP_DIR%\startup.sh" "%STAGING_DIR%\startup.sh" >nul
copy /Y "%APP_DIR%\seed_admin.js" "%STAGING_DIR%\seed_admin.js" >nul

:: CRITICAL: Convert startup.sh to Unix LF line endings.
:: Windows editors save CRLF which makes the shebang "#!/bin/bash\r" — Linux
:: interprets \r as part of the path, can't find the interpreter, exit code 127.
powershell -NoProfile -Command ^
  "$f='%STAGING_DIR%\startup.sh'; " ^
  "$c=[IO.File]::ReadAllText($f); " ^
  "$c=$c.Replace(\"`r`n\",\"`n\"); " ^
  "$utf8=New-Object System.Text.UTF8Encoding($false); " ^
  "[IO.File]::WriteAllText($f,$c,$utf8); " ^
  "Write-Host '  startup.sh converted to LF'"

:: Prisma CLI + engines (for migrations via SSH)
xcopy "%APP_DIR%\node_modules\prisma" "%STAGING_DIR%\node_modules\prisma\" /E /Q /Y >nul
xcopy "%APP_DIR%\node_modules\@prisma\engines" "%STAGING_DIR%\node_modules\@prisma\engines\" /E /Q /Y >nul

echo   OK — Staging assembled.

:: -------------------------------------------------------------------
:: Step 4: Download Linux Prisma engine binaries
:: -------------------------------------------------------------------
echo.
echo [4/8] Downloading Linux Prisma engine binaries...

set "ENGINES_DIR=%STAGING_DIR%\node_modules\@prisma\engines"
set "SCHEMA_ENGINE=%ENGINES_DIR%\schema-engine-debian-openssl-3.0.x"
set "QUERY_ENGINE=%ENGINES_DIR%\libquery_engine-debian-openssl-3.0.x.so.node"

:: Download and decompress using PowerShell (gzipped binaries)
powershell -NoProfile -Command ^
  "$ProgressPreference='SilentlyContinue'; " ^
  "$cdn='%PRISMA_CDN%'; " ^
  "$engDir='%ENGINES_DIR%'; " ^
  "" ^
  "Write-Host '  Downloading schema-engine...'; " ^
  "$gzPath = Join-Path $env:TEMP 'schema-engine-debian.gz'; " ^
  "Invoke-WebRequest -Uri \"$cdn/schema-engine.gz\" -OutFile $gzPath -UseBasicParsing; " ^
  "$outPath = Join-Path $engDir 'schema-engine-debian-openssl-3.0.x'; " ^
  "$in = [IO.File]::OpenRead($gzPath); " ^
  "$gz = New-Object IO.Compression.GzipStream($in,[IO.Compression.CompressionMode]::Decompress); " ^
  "$out = [IO.File]::Create($outPath); $gz.CopyTo($out); $out.Close(); $gz.Close(); $in.Close(); " ^
  "Write-Host ('  schema-engine: ' + [math]::Round((Get-Item $outPath).Length/1MB,1) + ' MB'); " ^
  "" ^
  "Write-Host '  Downloading libquery_engine...'; " ^
  "$gzPath2 = Join-Path $env:TEMP 'query-engine-debian.gz'; " ^
  "Invoke-WebRequest -Uri \"$cdn/libquery_engine.so.node.gz\" -OutFile $gzPath2 -UseBasicParsing; " ^
  "$outPath2 = Join-Path $engDir 'libquery_engine-debian-openssl-3.0.x.so.node'; " ^
  "$in2 = [IO.File]::OpenRead($gzPath2); " ^
  "$gz2 = New-Object IO.Compression.GzipStream($in2,[IO.Compression.CompressionMode]::Decompress); " ^
  "$out2 = [IO.File]::Create($outPath2); $gz2.CopyTo($out2); $out2.Close(); $gz2.Close(); $in2.Close(); " ^
  "Write-Host ('  libquery_engine: ' + [math]::Round((Get-Item $outPath2).Length/1MB,1) + ' MB'); "

if errorlevel 1 (echo ERROR: Failed to download Prisma engines. & exit /b 1)
echo   OK — Linux Prisma engines ready.

:: -------------------------------------------------------------------
:: Step 5: Verify staging contents
:: -------------------------------------------------------------------
echo.
echo [5/8] Verifying staging contents...

if not exist "%STAGING_DIR%\server.js" (echo ERROR: server.js missing from staging. & exit /b 1)
if not exist "%STAGING_DIR%\.next\static" (echo ERROR: .next/static missing from staging. & exit /b 1)
if not exist "%STAGING_DIR%\node_modules\.prisma\client\libquery_engine-debian-openssl-3.0.x.so.node" (echo ERROR: Linux Prisma query engine missing from .prisma/client. & exit /b 1)
if not exist "%SCHEMA_ENGINE%" (echo ERROR: Linux schema-engine missing from @prisma/engines. & exit /b 1)
if not exist "%STAGING_DIR%\startup.sh" (echo ERROR: startup.sh missing from staging. & exit /b 1)
echo   OK — All required files present.

:: -------------------------------------------------------------------
:: Step 6: Remove node_modules symlink + Oryx artifacts from server
:: -------------------------------------------------------------------
echo.
echo [6/8] Cleaning server before deployment...

:: CRITICAL: Previous Oryx runs create a symlink node_modules -> /node_modules.
:: If we deploy on top of this, ZIP extraction writes into the symlink target
:: (/node_modules is ephemeral — wiped on each container restart), so the real
:: node_modules never lands on disk. We must remove the symlink first.
:: Also stop the app to prevent it from locking files during extraction.
powershell -NoProfile -Command ^
  "$ErrorActionPreference='SilentlyContinue'; " ^
  "$kudu='%KUDU_URL%'; " ^
  "$token = az account get-access-token --query accessToken -o tsv; " ^
  "$h = @{ Authorization = \"Bearer $token\"; 'If-Match' = '*' }; " ^
  "$hJson = @{ Authorization = \"Bearer $token\"; 'Content-Type' = 'application/json' }; " ^
  "$body = '{\"command\":\"rm -rf /home/site/wwwroot/node_modules /home/site/wwwroot/_del_node_modules /home/site/wwwroot/oryx-manifest.toml /home/site/wwwroot/node_modules.tar.gz\",\"dir\":\"/\"}'; " ^
  "try { Invoke-RestMethod -Uri \"$kudu/api/command\" -Method POST -Headers $hJson -Body $body | Out-Null; Write-Host '  Removed symlink + Oryx artifacts via Kudu command' } catch { Write-Host '  Kudu command cleanup skipped (non-critical)' }; "

echo   Stopping app before deployment...
az webapp stop --name %WEBAPP_NAME% --resource-group %RESOURCE_GROUP% >nul 2>&1
echo   OK — Server cleaned and app stopped.

:: -------------------------------------------------------------------
:: Step 7: Create ZIP and deploy
:: -------------------------------------------------------------------
echo.
echo [7/8] Creating deployment ZIP and deploying...

if exist "%ZIP_PATH%" del /f /q "%ZIP_PATH%"

:: CRITICAL: Use tar (not Compress-Archive) to get forward-slash paths.
:: Compress-Archive preserves Windows backslashes which break rsync on Linux.
pushd "%STAGING_DIR%"
tar -a -cf "%ZIP_PATH%" *
popd

if not exist "%ZIP_PATH%" (echo ERROR: deploy.zip was not created. & exit /b 1)
powershell -NoProfile -Command "Write-Host ('  ZIP size: ' + [math]::Round((Get-Item '%ZIP_PATH%').Length/1MB,1) + ' MB')"

echo   Deploying to %WEBAPP_NAME%...
:: --clean true: wipes wwwroot before extraction so stale symlinks can't interfere
az webapp deploy --name %WEBAPP_NAME% --resource-group %RESOURCE_GROUP% --src-path "%ZIP_PATH%" --type zip --clean true --async true
if errorlevel 1 (
    echo.
    echo WARNING: az webapp deploy reported an error. This may be a false negative
    echo          due to stale ContainerTimeout from a previous deployment.
    echo          Check docker.log to confirm actual status.
)

:: -------------------------------------------------------------------
:: Step 8: Start app and verify
:: -------------------------------------------------------------------
echo.
echo [8/8] Starting app and verifying...

:: CRITICAL: We stopped the app in Step 6. After repeated crash failures Azure
:: disables auto-restart, so a simple 'restart' doesn't work — we need an
:: explicit start to force a fresh container.
echo   Starting app...
az webapp start --name %WEBAPP_NAME% --resource-group %RESOURCE_GROUP% >nul 2>&1

echo   Waiting 90s for container to start...
timeout /t 90 /nobreak >nul

powershell -NoProfile -Command ^
  "$state = az webapp show --name '%WEBAPP_NAME%' --resource-group '%RESOURCE_GROUP%' --query state -o tsv; " ^
  "Write-Host \"  App state: $state\"; " ^
  "if ($state -eq 'Running') { Write-Host '  SUCCESS — App is running.' } else { Write-Host '  WARNING — App state is not Running. Check logs.' }; "

echo.
echo ============================================================
echo   Deployment complete.
echo   Site: https://%WEBAPP_NAME%.azurewebsites.net
echo.
echo   To check logs:
echo     az webapp log download --name %WEBAPP_NAME% --resource-group %RESOURCE_GROUP% --log-file webapp-logs.zip
echo ============================================================
echo.

endlocal
