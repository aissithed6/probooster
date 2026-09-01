@echo off
cd /d D:\Probooster\probooster-suit\probooster-main
del _tsc-check.cjs tsc-m.log tsc-verify.log 2>nul >nul
git add -A
git commit -F _commit-msg.txt
git push
del _commit-msg.txt
