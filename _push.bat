@echo off
set GIT_TERMINAL_PROMPT=0
cd /d D:\Probooster\probooster-suit\probooster-main
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im git.exe >nul 2>&1
ping -n 2 127.0.0.1 >nul 2>&1
echo fix: onglet campagnes marketing - rollback + messages erreurs contextuels > _msg.txt
echo ===PUSH=== > _push_result.txt
del _apply2.cjs _apply_ux.cjs _deploy.bat _runux.bat _testme.bat _run.log _uxcheck.txt _v2.txt _probe.cjs _probe.txt _recover.bat _recover.txt _extract_handlers.cjs _handlers.txt _write_uxcheck.cjs _write_cur.cjs _cur.txt _marker.bat _marker_probe.txt _vcheck.bat _vcheck2.cjs _tscrun.cjs _tscreport.txt _tscout.txt _lines.txt _showlines.cjs _fixlines.cjs _tscrun_out.txt _check.txt _clean.txt _gcheck.bat _gstatus.txt _finalcleanup.bat _final_result.txt _final.bat _tscdone.txt _run2.bat _write_h.cjs _h.bat _h.txt _status.txt _status.bat _approval.txt _report.txt _report2.txt _v.txt _out.txt _extract.txt _extract.bat _showreport.bat _run2.log endpoint _gcheck.txt 2>nul >nul
echo --- ADD --- >> _push_result.txt
git add -A >> _push_result.txt 2>&1
echo --- COMMIT --- >> _push_result.txt
git commit -F _msg.txt >> _push_result.txt 2>&1
echo --- PUSH --- >> _push_result.txt
git push >> _push_result.txt 2>&1
echo --- STATUS --- >> _push_result.txt
git status --short >> _push_result.txt 2>&1
del _msg.txt _push.bat
echo ===END=== >> _push_result.txt