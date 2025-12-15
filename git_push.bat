@echo off
cd /d "%~dp0"
git status
git remote -v
if %errorlevel% neq 0 (
    echo No remote repository configured. Please add remote first:
    echo git remote add origin YOUR_REPO_URL
    pause
    exit /b 1
)
git push -u origin main
if %errorlevel% neq 0 (
    git push -u origin master
)
pause

