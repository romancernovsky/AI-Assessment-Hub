@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  AI Hub Assessment - Database Backup / Restore Utility
::  Database: ai_hub_assessment @ localhost:5432
:: ============================================================

set DB_USER=aihub
set DB_PASSWORD=aihub123
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=ai_hub_assessment
set BACKUP_DIR=%~dp0db-backups

:: Ensure backup directory exists
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:MENU
cls
echo.
echo  =====================================================
echo    AI Hub Assessment - Database Backup ^& Restore
echo  =====================================================
echo.
echo    1. Backup database   (create new snapshot)
echo    2. Restore database  (from existing snapshot)
echo    3. List backups      (show available snapshots)
echo    4. Exit
echo.
set /p CHOICE="  Select an option [1-4]: "

if "%CHOICE%"=="1" goto BACKUP
if "%CHOICE%"=="2" goto RESTORE_PICK
if "%CHOICE%"=="3" goto LIST_BACKUPS
if "%CHOICE%"=="4" goto EXIT
echo.
echo  Invalid option. Please enter 1, 2, 3, or 4.
pause
goto MENU


:: ============================================================
::  BACKUP
:: ============================================================
:BACKUP
cls
echo.
echo  ----- Creating Backup -----
echo.

:: Build timestamp from date and time
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DT=%%I
set TIMESTAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%%DT:~10,2%%DT:~12,2%

set BACKUP_FILE=%BACKUP_DIR%\backup_%TIMESTAMP%.dump

echo  Target file: %BACKUP_FILE%
echo.

set PGPASSWORD=%DB_PASSWORD%
pg_dump -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -F c -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo  [SUCCESS] Backup created successfully.
    echo  File: %BACKUP_FILE%
) else (
    echo.
    echo  [ERROR] Backup failed.
    echo  - Ensure PostgreSQL is running
    echo  - Ensure pg_dump is in your system PATH
    echo  - Check credentials in this batch file
)

echo.
pause
goto MENU


:: ============================================================
::  LIST BACKUPS
:: ============================================================
:LIST_BACKUPS
cls
echo.
echo  ----- Available Backups -----
echo.

set COUNT=0
for %%f in ("%BACKUP_DIR%\*.dump") do (
    set /a COUNT+=1
    echo    !COUNT!. %%~nxf
)

if %COUNT%==0 (
    echo  No backup files found in: %BACKUP_DIR%
    echo  Run option 1 to create your first backup.
)

echo.
pause
goto MENU


:: ============================================================
::  RESTORE - select file
:: ============================================================
:RESTORE_PICK
cls
echo.
echo  ----- Restore Database -----
echo.
echo  Available backups:
echo.

set MAXCOUNT=0
for %%f in ("%BACKUP_DIR%\*.dump") do (
    set /a MAXCOUNT+=1
    set FILE_!MAXCOUNT!=%%f
    echo    !MAXCOUNT!. %%~nxf
)

if %MAXCOUNT%==0 (
    echo  No backup files found. Create a backup first using option 1.
    echo.
    pause
    goto MENU
)

echo.
set /p PICK="  Enter number to restore [1-%MAXCOUNT%]: "

if "%PICK%"=="" goto RESTORE_PICK
set /a PICK_NUM=%PICK% 2>nul
if %PICK_NUM% LSS 1 goto RESTORE_INVALID
if %PICK_NUM% GTR %MAXCOUNT% goto RESTORE_INVALID

set SELECTED_FILE=!FILE_%PICK_NUM%!

echo.
echo  Selected: !SELECTED_FILE!
echo.
echo  *** WARNING ***
echo  This will OVERWRITE ALL current data in database [%DB_NAME%].
echo  This action cannot be undone (unless you have another backup).
echo.
set /p CONFIRM="  Type YES to confirm restore: "

if /i not "%CONFIRM%"=="YES" (
    echo.
    echo  Restore cancelled.
    pause
    goto MENU
)

goto RESTORE_RUN

:RESTORE_INVALID
echo.
echo  Invalid selection. Please enter a number between 1 and %MAXCOUNT%.
pause
goto RESTORE_PICK


:: ============================================================
::  RESTORE - execute
:: ============================================================
:RESTORE_RUN
echo.
echo  Restoring from: !SELECTED_FILE!
echo.

set PGPASSWORD=%DB_PASSWORD%
pg_restore -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -c "!SELECTED_FILE!"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo  [SUCCESS] Database restored successfully.
) else (
    echo.
    echo  [WARNING] pg_restore completed with warnings.
    echo  This is often normal (e.g. objects that did not exist to drop).
    echo  Review the output above for any critical errors.
)

echo.
pause
goto MENU


:: ============================================================
::  EXIT
:: ============================================================
:EXIT
echo.
echo  Goodbye.
echo.
endlocal
exit /b 0
