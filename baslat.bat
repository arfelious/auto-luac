echo off
color 0f
title Auto-Luac
cls
:a
if exist index.exe (
    index.exe
) else (
    if exist index.js (
        node index.js
    ) else (
        timeout /t 300 > nul
    )
)
timeout /t 180 > nul
goto a