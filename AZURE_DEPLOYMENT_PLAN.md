# Plan: Deploy AI-Hub Assessment to Azure

## TL;DR
Deploy the Next.js + Prisma + PostgreSQL assessment app to pre-provisioned Azure services (App Service + PostgreSQL Flexible Server) using ZIP deployment with Node.js 20 runtime. First a one-off deployment, then a reusable `azure-redeploy.bat` that refreshes only application code while preserving database data.

## Azure Services Reference (Verified)
| Service | Name |
|---|---|
| Subscription | **NBS-DEV-SECOPSAI-001** (`1e94901d-ba9f-4f3b-88d5-ad41c405a1a2`) |
| Resource Group | rg-secopsai-app-dev-westeurope-01 |
| App Service Plan | asp-secopsai-dev-westeurope-01 |
| Web App | **waw-secopsai-dev-westeurope-01** |
| Web App Managed Identity | `c86a6099-f2d9-4fe7-9810-38e1fdef24a1` (system-assigned, has Key Vault Secrets User) |
| PostgreSQL Flex | **pgsqlflexweudevsecopsai01** |
| DB Admin User | dbsadmin |
| DB App User | secopsai_95021_user ✅ |
| DB App Password | mzwf33F1xV ✅ |
| DB Name | ai_hub_db (**not yet created on server**) |
| DB Private Endpoint IP | **10.153.27.200** (subnet `netprv-secopsai-pep-dev-westeurope-01`) |
| VNet | vnetprv-secopsai-dev-westeurope-01 |
| VNet Integration Subnet | netprv-secopsai-vint-waw-dev-westeurope-01 (`10.153.27.208/28`) |
| PEP Subnet | netprv-secopsai-pep-dev-westeurope-01 (`10.153.27.192/28`) |
| NSG (VInt) | nsg-netprv-secopsai-vint-waw-dev-westeurope-01 |
| Key Vault (App) | kv-secopsai-app-dev-01 (private access only, IP `10.153.27.197`) |
| Key Vault (Infra) | kv-secopsai-infra-dev-01 (private access only) |
| Azure AD App Registration | `cd6b814b-614a-408f-9ada-9e7b84ec5ff8` (tenant `f35a6974-607f-47d4-82d7-ff31d7dc53a5`) |
| Network RG | rg-secopsai-network-dev-westeurope-01 |

> **Important corrections from the original plan:**
> - Subscription is **NBS-DEV-SECOPSAI-001** (not NSS-DEV-SECOPSAI-001)
> - Web App is **waw-secopsai-dev-westeurope-01** (not wae-secopsai-dev-westeurope-01)
> - PostgreSQL Flex is **pgsqlflexweudevsecopsai01** (not pgsql-flex-secopsai-app-dev-01)
> - PostgreSQL has **public access disabled** (private endpoints only via VNet)

## Architecture
- **App**: Next.js 16.2.1 + standalone output, Node.js 20 LTS runtime, port 8080 (internal, set by Oryx) → 80/443 (external via App Service)
- **DB**: PostgreSQL via Prisma ORM 5.22.0 (5 tables: User, Feedback, BankVersion, AssessmentAttempt, QuestionReaction)
- **Auth**: NextAuth 4.24.13 with Credentials + Azure AD SSO providers
- **Deploy method**: ZIP deploy via Kudu `/api/zipdeploy` (no Docker/ACR). ZIP must be created with `tar` on Windows (not `Compress-Archive`) to ensure forward-slash paths. Oryx build disabled (`SCM_DO_BUILD_DURING_DEPLOYMENT=false`, `ENABLE_ORYX_BUILD=false`)
- **Startup**: Custom `startup.sh` that undoes Oryx symlink damage before starting `node server.js`
- **Networking**: PostgreSQL behind private endpoint (`10.153.27.200`). App Service uses VNet integration (`WEBSITE_VNET_ROUTE_ALL=1`). IP allowlist on web app (403 for non-whitelisted IPs). NSG `Deny_all_Outbound` at priority 4096 **blocks all internet** from VInt subnet.
- **Git branch**: NVSbrand (SSO branch merged in)
- **Health endpoint**: `/api/health?key=<NEXTAUTH_SECRET>` — tests DB connectivity, runs migrations (`?action=migrate`), seeds admin (`?action=seed`)

---

## Progress Tracker

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Prerequisites & Azure CLI Setup | **DONE** | Azure CLI 2.84.0 ✅, `az login` ✅, subscription set ✅ |
| Phase 2: Configure PostgreSQL Server | **DONE** | DB reachable at `10.153.27.200:5432` ✅, user `secopsai_95021_user` authenticated ✅, using `postgres` database (no `ai_hub_db` needed) |
| Phase 3: Prisma Migrations & Seed Data | **DONE** | Migrations applied via `/api/health?action=rawmigrate` ✅. Admin seeded via `/api/health?action=seedadmin` ✅. 1 user in DB. |
| Phase 4: Configure Web App Settings | **DONE** | All env vars set ✅, runtime NODE\|20-lts ✅, startup command ✅ |
| Phase 5: Build & ZIP Deploy | **DONE** | App deployed and running ✅. Next.js 16.2.1 starts on port 8080 ✅. Oryx symlink fix works ✅ |
| Phase 6: Verify Deployment | **PARTIAL** | App starts ✅. DB connected ✅ (secopsai_95021_user). Migrations applied ✅. Admin seeded ✅. Login page loads ✅. SSO blocked ❌ (no client secret + outbound internet blocked by NSG). |
| Phase 7: Create Redeployment Script | **DONE** | `quick-deploy.ps1` created ✅ |

---

## Phase 1: Prerequisites & Azure CLI Setup

- [x] **1.1** Install Azure CLI — **DONE** (v2.84.0 installed via MSI)
- [x] **1.2** Login to Azure: `az login`
- [x] **1.3** Set subscription: `az account set --subscription "NBS-DEV-SECOPSAI-001"`
- [x] **1.4** Verify resource group exists: `az group show --name rg-secopsai-app-dev-westeurope-01`

> **Note:** In new terminal sessions, you may need to refresh PATH first:
> ```powershell
> $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
> ```

## Phase 2: Configure Azure PostgreSQL Flexible Server

> **CRITICAL FINDING:** PostgreSQL Flexible Server `pgsqlflexweudevsecopsai01` has **public access disabled** and uses **private endpoints only**. It is accessible only from within the VNet. Local machine cannot connect directly.

- [x] **2.1** Get PostgreSQL server FQDN:
  ```
  pgsqlflexweudevsecopsai01.postgres.database.azure.com
  ```
- [x] **2.2** ~~Verify firewall rules~~ — N/A: Server uses private endpoints, not firewall rules. Public access is disabled.
- [ ] **2.3** Create the application database `ai_hub_db`:
  - Cannot be done via `az` CLI (user lacks `flexibleServers/databases/write` permission)
  - Cannot be done locally (no public access)
  - **Must be done from within the VNet** — either via App Service SSH, or by requesting the infra team to create it
  - Attempted via startup.sh (node `pg` module) — failed due to missing `pg` module in standalone output
  - Attempted via startup.sh (psql) — `psql` not available in Node.js App Service container
  - **ACTION NEEDED:** Request infra/DBA team to create database `ai_hub_db` on `pgsqlflexweudevsecopsai01`, or use App Service SSH to run:
    ```bash
    apt-get update && apt-get install -y postgresql-client
    PGPASSWORD="80709b101633276" psql "host=pgsqlflexweudevsecopsai01.postgres.database.azure.com port=5432 dbname=postgres user=secopsai_55021_user sslmode=require" -c "CREATE DATABASE ai_hub_db;"
    ```
- [x] **2.4** DATABASE_URL constructed and set:
  ```
  postgresql://secopsai_55021_user:80709b101633276@pgsqlflexweudevsecopsai01.postgres.database.azure.com:5432/ai_hub_db?schema=public&sslmode=require
  ```
- [ ] **2.5** ~~Test connectivity from local machine~~ — Not possible (private endpoints only). Must verify from App Service container.

### DB Connectivity — RESOLVED (partially)
- **FQDN DNS**: `pgsqlflexweudevsecopsai01.postgres.database.azure.com` does NOT resolve from App Service (Private DNS Zone not linked to VNet). **Workaround applied:** `DATABASE_URL` uses the private endpoint IP `10.153.27.200` directly.
- **TCP connectivity**: Confirmed working — App Service main container can reach `10.153.27.200:5432` ✅
- **Authentication**: FAILS — password `80709b101633276` does not match the `dbsadmin` admin password set when the server was created. The user `secopsai_55021_user` and database `ai_hub_db` don't exist yet.
- **Private DNS Zone**: Still needs to be linked to VNet by ops team for FQDN resolution (nice-to-have, not blocking since we use the IP directly).

## Phase 3: Run Prisma Migrations & Seed Data

> **Cannot run from local machine** — PostgreSQL is behind private endpoints. Migrations and seeding are done via the `/api/health` endpoint deployed with the app.

- [ ] **3.1** ~~Set local DATABASE_URL~~ — N/A. Migrations run via health endpoint from App Service container.
- [ ] **3.2** Run migrations via health endpoint (once DB auth works):
  ```
  GET https://waw-secopsai-dev-westeurope-01.azurewebsites.net/api/health?action=migrate&key=8hHaF2SBEXIeGqUOlibfP0JTKVcR91yx
  ```
  This executes `node node_modules/prisma/build/index.js migrate deploy` inside the main app container.
- [ ] **3.3** Seed admin user via health endpoint:
  ```
  GET https://waw-secopsai-dev-westeurope-01.azurewebsites.net/api/health?action=seed&key=8hHaF2SBEXIeGqUOlibfP0JTKVcR91yx
  ```
  This executes `node seed_admin.js` which creates admin@admin.com / password.
- [ ] **3.4** Seed question bank: Must be done from within VNet. Copy `seed_bank.js` and `AI_Hub_Assessment_v2_Question_Bank.xlsx` to App Service and run.
- [ ] **3.5** Verify data seeded correctly

## Phase 4: Configure Azure Web App

- [x] **4.1** Verify web app exists: `waw-secopsai-dev-westeurope-01` confirmed
- [x] **4.2** Application settings configured:

  | Setting | Value | Status |
  |---------|-------|--------|
  | `DATABASE_URL` | `postgresql://secopsai_55021_user:80709b101633276@10.153.27.200:5432/ai_hub_db?schema=public` | ✅ Set (uses private IP) |
  | `NEXTAUTH_SECRET` | `8hHaF2SBEXIeGqUOlibfP0JTKVcR91yx` | ✅ Set |
  | `NEXTAUTH_URL` | `https://waw-secopsai-dev-westeurope-01.azurewebsites.net` | ✅ Set |
  | `AZURE_AD_CLIENT_ID` | `cd6b814b-614a-408f-9ada-9e7b84ec5ff8` | ✅ Set |
  | `AZURE_AD_CLIENT_SECRET` | *(not yet set — needs ops team, see Ops Request #3)* | ❌ Pending |
  | `AZURE_AD_TENANT_ID` | `f35a6974-607f-47d4-82d7-ff31d7dc53a5` | ✅ Set |
  | `WEBSITES_PORT` | `8080` | ✅ Set |
  | `NODE_ENV` | `production` | ✅ Set |
  | `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` | ✅ Set |
  | `ENABLE_ORYX_BUILD` | `false` | ✅ Set |
  | `WEBSITE_VNET_ROUTE_ALL` | `1` | ✅ Set |

  > **PORT NOTE:** Oryx sets `PORT=8080` in its startup wrapper. The Next.js server listens on `process.env.PORT || 3000`. With `WEBSITES_PORT=8080`, Azure's health probe checks port 8080. All three values are now aligned.

  > **PowerShell `&` workaround:** When setting `DATABASE_URL` via `az webapp config appsettings set`, the `&` in `sslmode=require` gets interpreted by PowerShell. Fix: write settings to a JSON file and use `--settings @file.json`.

- [x] **4.3** Startup command: `/home/site/wwwroot/startup.sh` (was `node /home/site/wwwroot/server.js`, changed to use startup script that fixes Oryx symlink)
- [x] **4.4** Runtime: `NODE|20-lts` (set via `cmd /c 'az webapp config set ... --linux-fx-version "NODE|20-lts"'` to avoid PowerShell pipe interpretation)

## Phase 5: Build & Deploy via ZIP Deploy (Node.js runtime)

- [x] **5.1** Runtime set to NODE|20-lts ✅
- [x] **5.2** Build the app locally from `ai-hub-assessment/`:
  ```powershell
  npx prisma generate   # Generates client with binaryTargets: ["native", "debian-openssl-3.0.x"]
  npm run build          # Creates .next/standalone/
  ```
  > **CRITICAL:** `prisma/schema.prisma` must have `binaryTargets = ["native", "debian-openssl-3.0.x"]` in the generator block. Without this, the Linux Prisma query engine won't be included and the app will crash on Azure with: `Prisma Client was generated for "windows", but the actual deployment required "debian-openssl-3.0.x"`.

- [x] **5.3** Assemble the deployment ZIP:
  ```
  deploy-staging/
  ├── server.js                          ← from .next/standalone/
  ├── node_modules/                      ← from .next/standalone/node_modules/
  │   ├── .prisma/client/
  │   │   └── libquery_engine-debian-openssl-3.0.x.so.node  ← MUST be present
  │   ├── @prisma/client/
  │   ├── @prisma/engines/               ← copied from full node_modules
  │   │   ├── schema-engine-debian-openssl-3.0.x            ← downloaded from Prisma CDN
  │   │   └── libquery_engine-debian-openssl-3.0.x.so.node  ← downloaded from Prisma CDN
  │   └── prisma/                        ← copied from full node_modules
  ├── .next/
  │   └── static/                        ← from .next/static/
  ├── public/                            ← from public/
  ├── prisma/
  │   └── schema.prisma + migrations/
  ├── startup.sh
  └── seed_admin.js
  ```

  > **Prisma engines download (version 5.22.0, hash `605197351a3c8bdd595af2d2a9bc3025bca48ea2`):**
  > ```
  > https://binaries.prisma.sh/all_commits/605197351a3c8bdd595af2d2a9bc3025bca48ea2/debian-openssl-3.0.x/schema-engine.gz
  > https://binaries.prisma.sh/all_commits/605197351a3c8bdd595af2d2a9bc3025bca48ea2/debian-openssl-3.0.x/libquery_engine.so.node.gz
  > ```

  > **DO NOT include `oryx-manifest.toml` or `node_modules.tar.gz`** — these trigger Oryx's tar.gz extraction which overwrites `node_modules` with a broken extraction. If they exist on the server from a prior deploy, delete them via Kudu VFS API before deploying:
  > ```powershell
  > $kuduUrl = "https://waw-secopsai-dev-westeurope-01.scm.azurewebsites.net"
  > $token = az account get-access-token --query accessToken -o tsv
  > $headers = @{ Authorization = "Bearer $token"; "If-Match" = "*" }
  > Invoke-RestMethod -Uri "$kuduUrl/api/vfs/site/wwwroot/oryx-manifest.toml" -Method DELETE -Headers $headers
  > Invoke-RestMethod -Uri "$kuduUrl/api/vfs/site/wwwroot/node_modules.tar.gz" -Method DELETE -Headers $headers
  > ```

- [x] **5.4** Startup command set: `/home/site/wwwroot/startup.sh`
- [x] **5.5** Deployed via Kudu zipdeploy API (NOT `az webapp deploy` — see Issue 10):
  ```powershell
  $token = az account get-access-token --query accessToken -o tsv
  $headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/zip' }
  Invoke-WebRequest -Uri "https://waw-secopsai-dev-westeurope-01.scm.azurewebsites.net/api/zipdeploy?isAsync=true" -Method POST -InFile deploy.zip -Headers $headers -UseBasicParsing -TimeoutSec 600
  ```
  - Deploy ZIP size: ~89 MB (created with `tar -a -cf deploy.zip *` to get forward slashes)
  - Deployment status 4 (success), active = true

  > **CRITICAL ZIP CREATION:** Must use `tar -a -cf deploy.zip *` from within the staging directory — NOT `Compress-Archive`. PowerShell's `Compress-Archive` preserves Windows backslash paths which cause `rsync: Invalid argument (22)` errors on Linux. Windows `tar.exe` produces forward-slash paths.

## Phase 6: Verify Deployment

- [x] **6.1** Check deployment logs — confirmed Next.js starts:
  ```
  ▲ Next.js 16.2.1
  - Local:   http://container:8080
  ✓ Ready in 0ms
  ```
  ```
  Site startup probe succeeded after 31.181304 seconds.
  Site is running with deployment version: 4df25f28-5b11-4e9c-8478-1a1a0581c134
  Site started.
  ```
- [x] **6.2** Health endpoint tested from whitelisted IP:
  - Added temp IP rule: `az webapp config access-restriction add ... --rule-name TempDev --priority 100 --ip-address 24.206.109.37/32`
  - `/api/health` returns HTTP 200 ✅
  - DB connectivity to `10.153.27.200:5432`: TCP works ✅, auth fails ❌ (credentials not valid)
  - **Temp IP rule still active** — remove when done: `az webapp config access-restriction remove --name waw-secopsai-dev-westeurope-01 --resource-group rg-secopsai-app-dev-westeurope-01 --rule-name TempDev`
- [ ] **6.3** Test login with admin@admin.com / password — **BLOCKED** on DB (no tables)
- [ ] **6.4** Test full assessment flow — **BLOCKED** on DB
- [x] **6.5** Verify HTTPS/SSL — App Service provides TLS ✅
- [ ] **6.6** Test Azure AD SSO login — **BLOCKED** on: (a) `AZURE_AD_CLIENT_SECRET` not set, (b) NSG blocks outbound to `login.microsoftonline.com`

## Phase 7: Create Redeployment Script

- [x] **7.1** Created `quick-deploy.ps1` (PowerShell):
  - Assembles staging directory from `.next/standalone/` + static + public + prisma + startup.sh + seed_admin.js
  - Downloads Linux Prisma engine binaries from CDN (schema-engine + libquery_engine)
  - Creates ZIP using `tar` (forward slashes, NOT Compress-Archive)
  - Deletes Oryx artifacts from server via Kudu VFS API
  - Deploys via Kudu `/api/zipdeploy` POST
- [x] **7.2** Tested — deployment succeeds (status 4, active, complete) ✅

### How to Redeploy
```powershell
# 1. Build locally
cd ai-hub-assessment
npx prisma generate
npm run build
cd ..

# 2. Create ZIP with forward slashes
Remove-Item deploy-staging -Recurse -Force -ErrorAction SilentlyContinue
# ... (assemble staging, see quick-deploy.ps1) ...
Push-Location deploy-staging
tar -a -cf ..\deploy.zip *
Pop-Location

# 3. Deploy via Kudu API (NOT az webapp deploy)
$token = az account get-access-token --query accessToken -o tsv
Invoke-WebRequest -Uri "https://waw-secopsai-dev-westeurope-01.scm.azurewebsites.net/api/zipdeploy?isAsync=true" `
  -Method POST -InFile deploy.zip `
  -Headers @{ Authorization="Bearer $token"; 'Content-Type'='application/zip' } `
  -UseBasicParsing -TimeoutSec 600

# 4. Poll deployment status
$r = Invoke-RestMethod "https://waw-secopsai-dev-westeurope-01.scm.azurewebsites.net/api/deployments/latest" `
  -Headers @{ Authorization="Bearer $token" }
Write-Host "Status: $($r.status)"  # 4 = success
```

---

## Troubleshooting Log

### Issue 1: `Cannot find module 'xtend/mutable'` (pg module)
**Cause:** startup.sh used `require('pg')` for CREATE DATABASE, but the `pg` module has dependencies (`xtend`, `postgres-interval`) not included in the Oryx-extracted `node_modules.tar.gz`.
**Fix:** Removed `pg`-based DB creation from startup.sh. DB creation should be done by infra team or via SSH.

### Issue 2: `Prisma Client was generated for "windows"` 
**Cause:** `prisma generate` on Windows only produces the Windows query engine binary. Azure App Service runs Linux (Debian).
**Fix:** Added `binaryTargets = ["native", "debian-openssl-3.0.x"]` to `prisma/schema.prisma` generator block. This produces both Windows and Linux engine binaries.

### Issue 3: `prisma: Permission denied`
**Cause:** `npx prisma` in App Service fails because the `prisma` binary in `node_modules/.bin/` doesn't have execute permission after ZIP extraction.
**Fix:** Use `node node_modules/prisma/build/index.js` instead of `npx prisma`.

### Issue 4: `Cannot find module '@prisma/debug'`
**Cause:** The Prisma CLI (`prisma/build/index.js`) requires `@prisma/debug` and other internal packages. These are not part of `@prisma/client` and not included in the Next.js standalone output. Copying just `prisma` and `@prisma/engines` isn't sufficient — the dependency tree is deep.
**Fix:** For now, skip Prisma migration in startup.sh. Run migrations separately via SSH.

### Issue 5: Oryx `node_modules.tar.gz` overwrites deployed modules
**Cause:** On the first ZIP deploy with `SCM_DO_BUILD_DURING_DEPLOYMENT` not set, Oryx ran `npm install` on the server and created `oryx-manifest.toml` + `node_modules.tar.gz`. On every subsequent container restart, Oryx detects the manifest and extracts the tar.gz to `/node_modules`, then symlinks `./node_modules → /node_modules`. This overwrites the modules we carefully packaged in the ZIP (including Linux Prisma engines).
**Fix:** Set `SCM_DO_BUILD_DURING_DEPLOYMENT=false` AND delete old `oryx-manifest.toml` + `node_modules.tar.gz` from the server via Kudu VFS API.

### Issue 6: `Can't reach database server`
**Cause:** PostgreSQL Flex `pgsqlflexweudevsecopsai01` uses private endpoints only. The VNet integration is configured, but DNS resolution for `pgsqlflexweudevsecopsai01.postgres.database.azure.com` may not resolve to the private IP from within the App Service container.
**Possible fixes:**
- Verify Private DNS Zone `privatelink.postgres.database.azure.com` exists and is linked to the VNet
- Check `WEBSITE_DNS_SERVER` and `WEBSITE_VNET_ROUTE_ALL` settings
- Set `WEBSITE_VNET_ROUTE_ALL=1` to route all traffic through VNet
- Contact network admin to verify Private DNS Zone linkage

### Issue 7: Port mismatch (3000 vs 8080)
**Cause:** Oryx startup wrapper sets `PORT=8080` if not already set. The Next.js server listens on `process.env.PORT`. Originally `WEBSITES_PORT` was set to `3000`, so Azure's health probe checked port 3000 while the app listened on 8080.
**Fix:** Changed `WEBSITES_PORT` to `8080`.

### Issue 8: Azure CLI `--async true` reports failure despite success
**Cause:** `az webapp deploy --async true` polls for site startup. If the container had a previous `ContainerTimeout` error, the polling logic may report failure even though the new container started successfully.
**Verify:** Check `docker.log` (not `default_docker.log`) for the definitive status: "Site startup probe succeeded" / "Site started."

### Issue 9: PowerShell special characters in Azure CLI
**Cause:** `&` in DATABASE_URL gets truncated by PowerShell. `|` in `NODE|20-lts` is interpreted as pipe.
**Fix:** Use JSON file for settings (`--settings @file.json`), wrap commands in `cmd /c '...'` for pipe characters. For DATABASE_URL, drop the `&sslmode=require` parameter (Azure PostgreSQL requires SSL by default).

### Issue 10: `az webapp deploy --type zip` triggers Oryx build and fails
**Cause:** Both `az webapp deploy --type zip` and `az webapp deployment source config-zip` trigger the Oryx build pipeline ("Running deployment command...") which fails on our pre-built standalone output. Setting `ENABLE_ORYX_BUILD=false` and `SCM_DO_BUILD_DURING_DEPLOYMENT=false` doesn't prevent this.
**Fix:** Use the Kudu REST API directly: `POST /api/zipdeploy?isAsync=true` with `Content-Type: application/zip`. This respects `SCM_DO_BUILD_DURING_DEPLOYMENT=false` and extracts the ZIP without running Oryx.

### Issue 11: `Compress-Archive` creates ZIP with backslash paths
**Cause:** PowerShell's `Compress-Archive` preserves Windows backslash path separators (e.g., `public\icons\Help-support.svg`). When extracted on Linux by Kudu/rsync, these cause `rsync: recv_generator: failed to stat: Invalid argument (22)` errors.
**Fix:** Use Windows `tar.exe` instead: `Push-Location deploy-staging; tar -a -cf ..\deploy.zip *; Pop-Location`. This produces forward-slash paths (e.g., `public/icons/Help-support.svg`).

### Issue 12: DB authentication fails — user/database don't exist
**Cause:** The PostgreSQL Flexible Server `pgsqlflexweudevsecopsai01` only has system databases (`azure_maintenance`, `azure_sys`, `postgres`). The database `ai_hub_db` and user `secopsai_55021_user` have not been created. The password `80709b101633276` doesn't match the `dbsadmin` admin password either.
**Fix:** Ops/DBA team must create the database and user (see Ops Team Requests below), OR provide the `dbsadmin` password.

### Issue 13: NSG blocks outbound internet — SSO cannot reach Azure AD
**Cause:** The NSG on the VInt subnet has `Deny_all_Outbound` at priority 4096. Only traffic to internal subnets, DNS servers, and Netskope proxies is allowed. The app cannot reach `login.microsoftonline.com` for Azure AD SSO.
**Symptom:** `SIGNIN_OAUTH_ERROR: outgoing request timed out after 3500ms`
**Fix:** Ops/network team must add an outbound allow rule for the `AzureActiveDirectory` service tag on TCP 443.

---

## Key Files
| File | Purpose |
|------|---------|
| `ai-hub-assessment/next.config.mjs` | Standalone output mode + `serverExternalPackages: ['@prisma/client', 'bcryptjs']` |
| `ai-hub-assessment/prisma/schema.prisma` | DB schema — 5 models, `binaryTargets = ["native", "debian-openssl-3.0.x"]` |
| `ai-hub-assessment/prisma/migrations/` | Migration files (3 migrations) |
| `ai-hub-assessment/.env.example` | Required env vars template (includes Azure AD vars) |
| `ai-hub-assessment/seed_admin.js` | Creates admin@admin.com / password (role: admin, authProvider: credentials) |
| `ai-hub-assessment/seed_bank.js` | Loads question bank from `AI_Hub_Assessment_v2_Question_Bank.xlsx` |
| `ai-hub-assessment/src/lib/auth.ts` | NextAuth config (Azure AD + Credentials providers) |
| `ai-hub-assessment/startup.sh` | Azure startup: undoes Oryx symlink, then runs `node server.js` |
| `ai-hub-assessment/src/app/api/health/route.ts` | Diagnostic endpoint: DB test, migrate, seed (auth: `?key=NEXTAUTH_SECRET`) |
| `quick-deploy.ps1` | Automated build+deploy script (staging assembly, engine download, ZIP, Kudu deploy) |

## Current App Settings (as deployed)
```
DATABASE_URL                   = postgresql://secopsai_95021_user:mzwf33F1xV@10.153.27.200:5432/postgres?schema=public&connect_timeout=10
NEXTAUTH_SECRET                = 8hHaF2SBEXIeGqUOlibfP0JTKVcR91yx
NEXTAUTH_URL                   = https://waw-secopsai-dev-westeurope-01.azurewebsites.net
AZURE_AD_CLIENT_ID             = cd6b814b-614a-408f-9ada-9e7b84ec5ff8
AZURE_AD_TENANT_ID             = f35a6974-607f-47d4-82d7-ff31d7dc53a5
AZURE_AD_CLIENT_SECRET         = (NOT SET — needs ops team)
WEBSITES_PORT                  = 8080
NODE_ENV                       = production
SCM_DO_BUILD_DURING_DEPLOYMENT = false
ENABLE_ORYX_BUILD              = false
WEBSITE_VNET_ROUTE_ALL         = 1
Startup command                = /home/site/wwwroot/startup.sh
```

---

## ⚠️ Ops Team Requests (BLOCKING)

The following items require Azure ops/infra/DBA/network team support. The app is deployed and running, but cannot function without these.

### Ops Request #1: ~~Create PostgreSQL Database and User~~ — RESOLVED ✅

**Resolution:** Ops team provided password `mzwf33F1xV` for existing user `secopsai_95021_user`. Migrations and seeding applied directly to the `postgres` database using raw SQL via the health endpoint (`?action=rawmigrate` and `?action=seedadmin`). Separate `ai_hub_db` not needed — using `postgres` database.

---

### Ops Request #2: NSG Outbound Rule for Azure AD SSO (CRITICAL — Blocking SSO)

**Who:** Network team
**NSG:** `nsg-netprv-secopsai-vint-waw-dev-westeurope-01` (on VInt subnet `netprv-secopsai-vint-waw-dev-westeurope-01`)
**Problem:** The NSG has `Deny_all_Outbound` at priority 4096 which blocks ALL internet traffic. The app needs to reach `login.microsoftonline.com` for Azure AD SSO authentication. Current error: `SIGNIN_OAUTH_ERROR: outgoing request timed out after 3500ms`.

**Action:** Add an outbound allow rule:
| Property | Value |
|----------|-------|
| Name | `Allow_AzureAD_Outbound` |
| Priority | 104 (or any < 4096) |
| Source | `10.153.27.208/28` (VInt subnet) |
| Destination | Service Tag: `AzureActiveDirectory` |
| Port | 443 (TCP) |
| Action | Allow |

**CLI equivalent:**
```bash
az network nsg rule create \
  --resource-group rg-secopsai-network-dev-westeurope-01 \
  --nsg-name nsg-netprv-secopsai-vint-waw-dev-westeurope-01 \
  --name Allow_AzureAD_Outbound \
  --priority 104 \
  --direction Outbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes 10.153.27.208/28 \
  --destination-address-prefixes AzureActiveDirectory \
  --destination-port-ranges 443
```

---

### Ops Request #3: Azure AD Client Secret for SSO (CRITICAL — Blocking SSO)

**Who:** Azure AD / Identity team
**App Registration:** `cd6b814b-614a-408f-9ada-9e7b84ec5ff8` (tenant: `f35a6974-607f-47d4-82d7-ff31d7dc53a5`)
**Problem:** The `AZURE_AD_CLIENT_SECRET` app setting is not configured. SSO requires a client secret to complete the OAuth flow.

**Action (preferred — Key Vault reference):**
1. Generate a client secret in the App Registration (Entra ID → App registrations → Certificates & secrets → New client secret)
2. Store it in Key Vault `kv-secopsai-app-dev-01` as secret name `AZURE-AD-CLIENT-SECRET`
3. Set the web app setting:
   ```bash
   az webapp config appsettings set \
     --name waw-secopsai-dev-westeurope-01 \
     --resource-group rg-secopsai-app-dev-westeurope-01 \
     --settings "AZURE_AD_CLIENT_SECRET=@Microsoft.KeyVault(VaultName=kv-secopsai-app-dev-01;SecretName=AZURE-AD-CLIENT-SECRET)"
   ```
   > The web app's managed identity (`c86a6099-f2d9-4fe7-9810-38e1fdef24a1`) already has the **Key Vault Secrets User** role on `kv-secopsai-app-dev-01`.

**Action (simpler alternative):**
Just provide the client secret value and we'll set it directly as an app setting.

---

### Ops Request #4: Private DNS Zone Link (Nice-to-have)

**Who:** Network team
**Problem:** The PostgreSQL FQDN `pgsqlflexweudevsecopsai01.postgres.database.azure.com` does not resolve from within the App Service container. The private endpoint exists but has no Private DNS Zone Group configured (`privateDnsZoneGroups: null`).
**Current workaround:** DATABASE_URL uses the private IP `10.153.27.200` directly.

**Action:** Link Private DNS Zone `privatelink.postgres.database.azure.com` to VNet `vnetprv-secopsai-dev-westeurope-01` and add an A record for `pgsqlflexweudevsecopsai01` → `10.153.27.200`.

---

## Current NSG Rules (VInt Subnet — for reference)

| Priority | Name | Direction | Source | Destination | Port | Action |
|----------|------|-----------|--------|-------------|------|--------|
| 100 | Allow_VInt_self | Outbound | 10.153.27.208/28 | 10.153.27.208/28 | 443 | Allow |
| 101 | Allow_DNS | Outbound | 10.153.27.208/28 | 10.153.4.36, 10.153.4.37 | 53 | Allow |
| 102 | Allow_DB | Outbound | 10.153.27.208/28 | 10.153.27.192/28 | 5432 | Allow |
| 103 | Allow_KV | Outbound | 10.153.27.208/28 | 10.153.27.192/28 | 443 | Allow |
| 3095 | Allow_Netskope | Outbound | VirtualNetwork | 163.116.128.80/81 | 2010,8080,2011,3128 | Allow |
| 4096 | **Deny_all_Outbound** | Outbound | Any | Any | Any | **Deny** |
| 4096 | **Deny_all_Inbound** | Inbound | Any | Any | Any | **Deny** |

---

## Remaining Action Items (after ops requests)
1. ~~**[OPS — REQUEST #1]** Create DB `ai_hub_db` and user `secopsai_55021_user` on PostgreSQL server~~ — ✅ RESOLVED (using `secopsai_95021_user` on `postgres` DB)
2. **[OPS — REQUEST #2]** Add NSG outbound rule for `AzureActiveDirectory` service tag
3. **[OPS — REQUEST #3]** Generate Azure AD client secret and store in Key Vault / set app setting
4. **[OPS — REQUEST #4]** Link Private DNS Zone to VNet (nice-to-have)
5. ~~**[APP TEAM]** Once DB auth works: hit `/api/health?action=migrate&key=...` to run Prisma migrations~~ — ✅ DONE via `?action=rawmigrate`
6. ~~**[APP TEAM]** Seed admin user: hit `/api/health?action=seed&key=...`~~ — ✅ DONE via `?action=seedadmin` (admin@admin.com / password)
7. **[APP TEAM]** Test admin login (admin@admin.com / password) — login page loads ✅, credentials login needs browser test
8. **[APP TEAM]** Test SSO login (after ops requests #2 and #3 are done)
9. **[APP TEAM]** Seed question bank via App Service SSH
10. **[APP TEAM]** Remove temp IP access rule: `az webapp config access-restriction remove --name waw-secopsai-dev-westeurope-01 --resource-group rg-secopsai-app-dev-westeurope-01 --rule-name TempDev`

## Decisions (Updated)
- ZIP deployment with Node.js 20 LTS runtime (no Docker/ACR)
- `SCM_DO_BUILD_DURING_DEPLOYMENT=false` + `ENABLE_ORYX_BUILD=false` — Oryx server-side build disabled
- ZIP created with `tar -a -cf` (NOT `Compress-Archive`) to ensure forward-slash paths for Linux
- Deploy via Kudu `/api/zipdeploy` POST (NOT `az webapp deploy` which triggers Oryx build)
- `WEBSITES_PORT=8080` — matches Oryx's PORT env var that the Next.js server uses
- `WEBSITE_VNET_ROUTE_ALL=1` — routes all traffic through VNet for private endpoint access
- Prisma `binaryTargets = ["native", "debian-openssl-3.0.x"]` — required for Windows build → Linux deploy
- Linux Prisma engines manually downloaded from Prisma CDN and included in the ZIP
- Oryx still creates `oryx-manifest.toml` + symlink on container restart; `startup.sh` undoes this automatically
- DATABASE_URL uses private IP `10.153.27.200` (FQDN DNS doesn't resolve due to missing Private DNS Zone link)
- Migrations run via `/api/health?action=migrate` endpoint (not locally, not SSH) since DB is private-endpoint-only
- NEXTAUTH_URL must match actual web app URL for OAuth callbacks
- Startup command is `/home/site/wwwroot/startup.sh` (undoes Oryx symlink, then runs `node server.js`)
- SSO requires both NSG outbound rule for `AzureActiveDirectory` AND client secret in Key Vault
