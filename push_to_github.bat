@echo off
title Push UK Passive Tracker Indexes to GitHub & Vercel
cd /d "%~dp0"
echo ========================================================
echo    Pushing UK Passive Tracker Indexes to GitHub
echo ========================================================
echo.
echo Remote target: https://github.com/anildutta007/uk-passive-tracker-indexes.git
echo.

git init -b main 2>nul
git add .
git commit -m "Initial commit: UK Passive Tracker Indexes & Top 5 Outperforming Funds (20-Year Returns)" 2>nul
git branch -M main

git remote get-url origin >nul 2>nul
if errorlevel 1 (
    git remote add origin https://github.com/anildutta007/uk-passive-tracker-indexes.git
) else (
    git remote set-url origin https://github.com/anildutta007/uk-passive-tracker-indexes.git
)

git push -u origin main
if errorlevel 1 (
    echo.
    echo ========================================================
    echo [ACTION REQUIRED ON GITHUB]
    echo 1. Open your browser and go to: https://github.com/new
    echo 2. Repository name: uk-passive-tracker-indexes
    echo 3. Keep it Public (or Private)
    echo 4. Leave "Add a README file" UNCHECKED (keep repo empty)
    echo 5. Click "Create repository"
    echo 6. Run this push_to_github.bat script again!
    echo ========================================================
    echo.
    echo [VERCEL AUTO-DEPLOY SETUP]
    echo 1. Go to https://vercel.com/new
    echo 2. Select GitHub repository: anildutta007/uk-passive-tracker-indexes
    echo 3. Click "Deploy" (Zero configuration needed)
    echo 4. Every future git push will automatically deploy to Vercel!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  SUCCESS! Your code has been pushed to GitHub:
    echo  https://github.com/anildutta007/uk-passive-tracker-indexes
    echo.
    echo  If connected to Vercel, an automatic production deployment
    echo  has now been triggered at:
    echo  https://uk-passive-tracker-indexes.vercel.app
    echo ========================================================
)
pause
