@echo off
chcp 65001 >nul
title 少儿编程作品展示系统 - 启动器

echo ========================================
echo   少儿编程作品展示系统 - 本地启动
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查后端服务...
tasklist /fi "imagename eq node.exe" /fo csv 2>nul | findstr /i "node.exe" >nul
if %errorlevel%==0 (
    echo     后端可能已在运行，跳过启动
) else (
    echo     正在启动后端服务...
    start "后端服务" cmd /k "cd /d %~dp0backend && node src/app.js"
    timeout /t 3 /nobreak >nul
)

echo.
echo [2/3] 启动前端服务...
start "前端服务" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo [3/3] 等待前端启动...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   启动完成！
echo   前端地址: http://localhost:3000
echo   后台地址: http://localhost:3000/admin/login
echo   账号: admin  密码: 0142013
echo.
echo   关闭本窗口不会停止服务
echo   要停止服务，请关闭弹出的两个黑色窗口
echo ========================================
echo.
pause
