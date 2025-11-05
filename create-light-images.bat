@echo off
echo ========================================
echo Creating Light Images for 360 Viewer
echo ========================================
echo.

REM Try Python 3 first
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python create-light-images.py
    goto :end
)

REM Try Python 3 command
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python3 create-light-images.py
    goto :end
)

REM Try py launcher
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py create-light-images.py
    goto :end
)

echo.
echo ERROR: Python is not installed or not in PATH
echo.
echo Please install Python from: https://www.python.org/downloads/
echo.

:end
pause


