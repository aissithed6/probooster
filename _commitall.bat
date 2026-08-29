@echo off
cd /d D:\Probooster\probooster-suit\probooster-main
git add -A
echo STAGED_COUNT=
git diff --cached --name-only | find /c /v ""
git commit -m "Integration RGPD (suppression compte definitif client), icones partagees dashboard, types NavItem et diverses synchronisations API super-admin/vendor"
echo COMMIT_RC=%ERRORLEVEL%
git push origin main
echo PUSH_RC=%ERRORLEVEL%