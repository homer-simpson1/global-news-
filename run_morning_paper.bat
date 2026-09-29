@echo off
cd /d "D:\GEMINI\global-intelligence-terminal"
node scripts\send_discord_morning_paper.js >> morning_paper.log 2>&1
