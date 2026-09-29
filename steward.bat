@echo off
chcp 65001 >nul
echo 正在启动 [全球决策情报终端] AI 站长全天候巡检...
"E:\nvm\v24.20.0\node.exe" scripts/site_steward.js
pause
