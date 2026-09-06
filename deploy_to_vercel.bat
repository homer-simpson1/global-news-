@echo off
cd /d "%~dp0"
echo ======================================================
echo    Deploying Global Intel Terminal to Vercel Cloud
echo ======================================================
echo.
call npx vercel --prod
pause
