@echo off
title Chap Niem - Lan Anh VTuber Public Web
cd /d "D:\Her"

echo ========================================================
echo   🌸 KHOI DONG HE THONG CHAP NIEM (LAN ANH 20 TUOI)
echo ========================================================
echo.

:: Thiet lap thu muc tam cuc bo tai D:\Her\.tmp, khong cham vao o C
set TMPDIR=D:\Her\.tmp
set TEMP=D:\Her\.tmp
set TMP=D:\Her\.tmp

:: Chay tunnel script qua Node.js
node scripts\tunnel.js

pause
