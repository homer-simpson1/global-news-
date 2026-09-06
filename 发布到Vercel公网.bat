@echo off
cd /d "%~dp0"
echo ======================================================
echo    正在发布全球决策情报终端到 Vercel 云端平台
echo    (永久免费、分配专属永久 HTTPS 网址、全球多端秒开)
echo ======================================================
echo.
echo [操作提示]：
echo 1. 首次若提示登录，选 Continue with GitHub 或 Continue with Email 按回车。
echo 2. 登录后出现任何询问，一律直接按键盘【回车键 (Enter)】采用默认推荐！
echo 3. 几十秒后即可获得专属独立永久公网网址！
echo.
call npx vercel --prod
pause
