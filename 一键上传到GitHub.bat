@echo off
cd /d "C:\Users\23972\.gemini\antigravity\scratch\global-intelligence-terminal"
echo Connecting to GitHub repository...
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo.
echo ========================================================
echo [OK] If push completed, your code is live on GitHub!
echo Next step: Open https://vercel.com and click Deploy!
echo ========================================================
pause