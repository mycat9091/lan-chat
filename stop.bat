@echo off
chcp 65001 >nul
echo ========================================
echo    局域网聊天室 - 停止服务器
echo ========================================
echo.
echo 正在查找并停止服务器进程...
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    set pid=%%a
)

if defined pid (
    taskkill /F /PID %pid%
    echo.
    echo 服务器已成功停止！
) else (
    echo 未找到运行中的服务器进程。
)

echo.
pause
