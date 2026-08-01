@echo off
echo ===================================
echo   360-Viewer - Local Git Commit
echo ===================================
echo.

set /p commit_msg="Enter commit message (or press ENTER for default): "
if "%commit_msg%"=="" set commit_msg="Update 360-Viewer features and localization"

echo.
echo Adding files to git staging...
git add .

echo.
echo Committing changes locally...
git commit -m %commit_msg%

echo.
echo ===================================
echo   Local Commit Completed Successfully!
echo ===================================
pause
