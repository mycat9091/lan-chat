@echo off
chcp 65001 >nul
echo ========================================
echo    局域网聊天室 - 重启服务器
echo ========================================
echo.
echo 正在停止服务器...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    set pid=%%a
)

if defined pid (
    taskkill /F /PID %pid% >nul 2>&1
    echo 服务器已停止。
    timeout /t 2 /nobreak >nul
) else (
    echo 未找到运行中的服务器。
)

echo.
echo 正在启动服务器...
echo.

start "局域网聊天服务器" cmd /k "node server/index.js"

echo.
echo 服务器已在新窗口中启动！
echo.
pause
