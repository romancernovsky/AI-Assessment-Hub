$ErrorActionPreference = 'Stop'
$APP = "d:\AI-Assessment-Hub\ai-hub-assessment"
$STG = "d:\AI-Assessment-Hub\deploy-staging"
$ZIP = "d:\AI-Assessment-Hub\deploy.zip"

Write-Host "Assembling staging..."
if (Test-Path $STG) { Remove-Item -Recurse -Force $STG }
New-Item -ItemType Directory $STG -Force | Out-Null

Copy-Item "$APP\.next\standalone\*" $STG -Recurse -Force
Copy-Item "$APP\.next\static" "$STG\.next\static" -Recurse -Force
Copy-Item "$APP\public" "$STG\public" -Recurse -Force
Copy-Item "$APP\prisma" "$STG\prisma" -Recurse -Force
Copy-Item "$APP\startup.sh" "$STG\startup.sh" -Force
Copy-Item "$APP\seed_admin.js" "$STG\seed_admin.js" -Force
Copy-Item "$APP\node_modules\prisma" "$STG\node_modules\prisma" -Recurse -Force
Copy-Item "$APP\node_modules\@prisma\engines" "$STG\node_modules\@prisma\engines" -Recurse -Force

# Download Linux Prisma engines
$cdn = "https://binaries.prisma.sh/all_commits/605197351a3c8bdd595af2d2a9bc3025bca48ea2/debian-openssl-3.0.x"
$eng = "$STG\node_modules\@prisma\engines"
$ProgressPreference = 'SilentlyContinue'

Write-Host "Downloading schema-engine..."
$gz = "$env:TEMP\se.gz"
Invoke-WebRequest "$cdn/schema-engine.gz" -OutFile $gz -UseBasicParsing
$i=[IO.File]::OpenRead($gz);$g=New-Object IO.Compression.GzipStream($i,[IO.Compression.CompressionMode]::Decompress);$o=[IO.File]::Create("$eng\schema-engine-debian-openssl-3.0.x");$g.CopyTo($o);$o.Close();$g.Close();$i.Close()

Write-Host "Downloading libquery_engine..."
$gz2 = "$env:TEMP\qe.gz"
Invoke-WebRequest "$cdn/libquery_engine.so.node.gz" -OutFile $gz2 -UseBasicParsing
$i2=[IO.File]::OpenRead($gz2);$g2=New-Object IO.Compression.GzipStream($i2,[IO.Compression.CompressionMode]::Decompress);$o2=[IO.File]::Create("$eng\libquery_engine-debian-openssl-3.0.x.so.node");$g2.CopyTo($o2);$o2.Close();$g2.Close();$i2.Close()

Write-Host "Creating ZIP..."
if (Test-Path $ZIP) { Remove-Item $ZIP -Force }
Compress-Archive -Path "$STG\*" -DestinationPath $ZIP -Force
$sz = [math]::Round((Get-Item $ZIP).Length/1MB,1)
Write-Host "ZIP: $sz MB"

Write-Host "Cleaning Oryx artifacts..."
$t = az account get-access-token --query accessToken -o tsv
$ku = "https://waw-secopsai-dev-westeurope-01.scm.azurewebsites.net"
$h = @{Authorization="Bearer $t";'If-Match'='*'}
try { Invoke-RestMethod "$ku/api/vfs/site/wwwroot/oryx-manifest.toml" -Method DELETE -Headers $h | Out-Null; Write-Host "Deleted oryx-manifest.toml" } catch { Write-Host "oryx-manifest.toml not found (OK)" }
try { Invoke-RestMethod "$ku/api/vfs/site/wwwroot/node_modules.tar.gz" -Method DELETE -Headers $h | Out-Null; Write-Host "Deleted node_modules.tar.gz" } catch { Write-Host "node_modules.tar.gz not found (OK)" }

Write-Host "Deploying..."
az webapp deploy --name waw-secopsai-dev-westeurope-01 --resource-group rg-secopsai-app-dev-westeurope-01 --src-path $ZIP --type zip --async true 2>&1 | ForEach-Object { $_ -replace '^WARNING: ', '' } | Where-Object { $_ -match "Status:|Deployment|RuntimeSuccessful|error|Success|failed|Visit" }

Write-Host "Done."
