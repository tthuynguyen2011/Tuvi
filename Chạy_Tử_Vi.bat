@echo off
chcp 65001 >nul
title Tu Vi Dau So - Local Tool

echo ==================================================
echo   KHOI DONG TOOL TU VI DAU SO (LOCAL)
echo ==================================================

netstat -ano | findstr ":8765 " >nul
if %errorlevel% neq 0 (
    echo Dang khoi dong may chu local tai http://127.0.0.1:8765 ...
    start "TuViServer" /min python "%~dp0tuvi-app\app.py"
    timeout /t 2 /nobreak >nul
) else (
    echo May chu da dang chay san tai http://127.0.0.1:8765
)

start "" "http://127.0.0.1:8765"
echo Da mo trinh duyet! Ban co the dong cua so nay (may chu van chay o cua so thu nho TuViServer).
timeout /t 3 /nobreak >nul
