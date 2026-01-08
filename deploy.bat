@echo off
SETLOCAL

:: --- Configuration ---
:: Since the file is in the project root, we use %~dp0 (current directory)
SET REPO_PATH=%~dp0
SET BRANCH_NAME=main
SET PM2_PROCESS_NAME=tiller-bill-management

echo Starting deployment in: %REPO_PATH%

:: Ensure we are in the correct directory
cd /d "%REPO_PATH%"

:: 1. Pull latest changes
echo Pulling latest changes from %BRANCH_NAME%...
git pull origin %BRANCH_NAME%
if %ERRORLEVEL% NEQ 0 goto :error

:: 2. Install dependencies
echo Running npm install...
call npm install
if %ERRORLEVEL% NEQ 0 goto :error

:: 3. Restart Application
echo Restarting %PM2_PROCESS_NAME% via PM2...
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