@echo off
echo Building project...
call npm run build

cd dist
echo Initializing temporary git repo...
git init
git checkout -B gh-pages

echo Adding files...
git add -A

echo Committing...
git commit -m "Deploy from manual script"

echo Pushing to GitHub...
git push -f https://github.com/kittyboy06/Dairy.git gh-pages

cd ..
echo Deployment Complete!
pause
