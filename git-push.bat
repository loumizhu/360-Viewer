@echo off
echo ===================================
echo   360-Viewer - Push to GitHub
echo ===================================
echo.

echo Checking current status...
git status -s

echo.
echo Pushing commits to remote repository...
git push

echo.
if %errorlevel% equ 0 (
    echo ===================================
    echo   Successfully pushed to GitHub!
    echo ===================================
) else (
    echo ===================================
    echo   Push failed. Check connection/auth.
    echo ===================================
)
pause
