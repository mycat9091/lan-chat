@echo off
chcp 65001 >nul
echo ========================================
echo    局域网聊天室 - 启动服务器
echo ========================================
echo.
echo 正在启动服务器...
echo.

node server/index.js

pause
