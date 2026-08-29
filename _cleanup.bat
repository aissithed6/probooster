@echo off
cd /d D:\Probooster\probooster-suit\probooster-main
git add -A
git commit -m "Nettoyage: retire le fichier temporaire de commit"
echo COMMIT_RC=%ERRORLEVEL%
git push origin main
echo PUSH_RC=%ERRORLEVEL%