@echo off
echo ==============================================
echo Automating Local Git Commit
echo ==============================================

git add .
set /p commitMsg="Enter commit message (or press enter for default 'Auto-commit from IDE'): "

if "%commitMsg%"=="" set commitMsg=Auto-commit from IDE

git commit -m "%commitMsg%"

echo.
echo ==============================================
echo Commit Successful!
echo ==============================================
pause
