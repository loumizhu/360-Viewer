@echo off
echo ========================================
echo Starting 360 Image Viewer Server...
echo ========================================
echo.

REM Try Python 3 first
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Python...
    echo Opening browser in 2 seconds...
    start "" http://localhost:8000
    timeout /t 2 /nobreak >nul
    python server.py
    goto :end
)

REM Try Python 3 command
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Python3...
    echo Opening browser in 2 seconds...
    start "" http://localhost:8000
    timeout /t 2 /nobreak >nul
    python3 server.py
    goto :end
)

REM Try py launcher
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using py launcher...
    echo Opening browser in 2 seconds...
    start "" http://localhost:8000
    timeout /t 2 /nobreak >nul
    py server.py
    goto :end
)

echo.
echo ERROR: Python is not installed or not in PATH
echo.
echo Please install Python from: https://www.python.org/downloads/
echo Or use one of the alternative methods in README.md
echo.
pause

:end


