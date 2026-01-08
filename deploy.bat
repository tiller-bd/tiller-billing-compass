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
echo 1/4: Pulling latest changes from %BRANCH_NAME%...
git pull origin %BRANCH_NAME%
if %ERRORLEVEL% NEQ 0 goto :error

:: 2. Install dependencies
echo 2/4: Running npm install...
call npm install
if %ERRORLEVEL% NEQ 0 goto :error

:: 3. Build the project
echo 3/4: Running npm run build...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [BUILD ERROR] The build failed. Stopping restart to prevent crashing production.
    goto :error
)

:: 4. Restart Application
echo 4/4: Restarting %PM2_PROCESS_NAME% via PM2...
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