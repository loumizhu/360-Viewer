@echo off
REM ============================================
REM Create Image Manifest for 360 Viewer
REM ============================================
REM This script generates image-manifest.json files
REM for faster image loading in the 360 viewer
REM ============================================

echo.
echo ============================================
echo  Creating Image Manifest
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo.
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Run the manifest creation script
echo Running create-image-manifest.py...
echo.
python create-image-manifest.py

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to create manifest
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Manifest Creation Complete!
echo ============================================
echo.
echo The image-manifest.json file(s) have been created.
echo This will make image loading much faster.
echo.
echo You can now refresh your browser to use the manifest.
echo.
pause
