@echo off
SETLOCAL

:: --- Configuration ---
SET REPO_PATH=%~dp0
SET BRANCH_NAME=main
SET PM2_PROCESS_NAME=tiller-bill-management

echo Starting deployment in: %REPO_PATH%

:: Ensure we are in the correct directory
cd /d "%REPO_PATH%"

:: 1. Pull latest changes
echo 1/5: Pulling latest changes from %BRANCH_NAME%...
git pull origin %BRANCH_NAME%
if %ERRORLEVEL% NEQ 0 goto :error

:: 2. Install dependencies
echo 2/5: Running npm install...
call npm install
if %ERRORLEVEL% NEQ 0 goto :error

:: 3. Generate Prisma Client
echo 3/5: Running npx prisma generate...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo [PRISMA ERROR] Client generation failed.
    goto :error
)

:: 4. Build the project
echo 4/5: Running npm run build...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [BUILD ERROR] The build failed.
    goto :error
)

:: 5. Restart Application
echo 5/5: Restarting %PM2_PROCESS_NAME% via PM2...
call pm2 restart %PM2_PROCESS_NAME%

echo.
echo ===================================
echo    Deployment Successful!
echo ===================================
pause
exit /b 0

:error
echo.
echo ***********************************
echo    ERROR: Deployment failed.
echo ***********************************
pause
exit /b 1