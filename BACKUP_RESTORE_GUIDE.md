# Code & Database Backup / Restore Guide

## Code — Git

Git tracks all source code changes. Use commits before making risky edits so you can always roll back.

### Initial Setup (first time only)
```powershell
cd d:\AI-Assessment-Hub
git init
git add .
git commit -m "initial baseline"
```

### Before Making Changes
```powershell
git add .
git commit -m "snapshot: describe what is stable"
```

### View History
```powershell
git log --oneline
```

### Rollback Code to a Previous Commit
```powershell
# Option A — revert a specific commit (safe, keeps history)
git revert <commit-hash>

# Option B — hard reset to a commit (destructive, loses later commits)
git reset --hard <commit-hash>
```

### Branch for Risky Work
```powershell
git checkout -b feature/my-experiment   # work here
git checkout main                        # switch back to stable
git merge feature/my-experiment          # merge when ready
```

---

## Database — pg_dump / pg_restore

Git does NOT back up data. Use `db-backup-restore.bat` for full database snapshots.

### Quick Commands (manual)

**Backup:**
```powershell
pg_dump -U aihub -h localhost -p 5432 -d ai_hub_assessment -F c -f db-backups\manual-backup.dump
```

**Restore:**
```powershell
pg_restore -U aihub -h localhost -p 5432 -d ai_hub_assessment -c db-backups\manual-backup.dump
```

### Schema Only (Prisma migrations)
Prisma migrations in `ai-hub-assessment/prisma/migrations/` track schema changes only (no data).

```powershell
cd ai-hub-assessment
npx prisma migrate deploy        # apply all pending migrations
npx prisma migrate reset         # WARNING: wipes data and reruns all migrations
```

---

## Automated Backup/Restore

Run `db-backup-restore.bat` from the project root. It will prompt you to choose:

1. **Backup** — saves a timestamped `.dump` file to `db-backups\`
2. **Restore** — lists available backups and lets you pick one to restore from
3. **List backups** — shows all available snapshots
4. **Exit**

Backup files are stored in `db-backups\` and excluded from Git (only the `.dump` binary files are ignored — the batch file itself is committed).

---

## Recommended Workflow for Risky Changes

1. `git add . && git commit -m "stable before: <description>"`
2. Run `db-backup-restore.bat` → choose **Backup**
3. Make your changes
4. If something breaks:
   - **Code**: `git reset --hard HEAD` (undo all uncommitted changes) or `git revert <hash>`
   - **Data**: run `db-backup-restore.bat` → choose **Restore**
