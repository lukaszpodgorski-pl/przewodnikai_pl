@echo off
rem Podglad produkcyjny - dokladnie to, co zobaczy swiat po publikacji.
rem Uruchom przed kazdym `npm run publish -- --push`.
cd /d "%~dp0"

echo.
echo  ===============================================================
echo   PODGLAD PRODUKCYJNY
echo  ===============================================================
echo.
echo   Buduje wersje publiczna i serwuje ja lokalnie. Zobaczysz efekt
echo   ciecia: odnosniki do stron w przebudowie zamienione na zwykly
echo   tekst, karty z dopiskiem "w przygotowaniu", zapowiedzi sekcji.
echo.
echo   Przygotowanie trwa okolo minuty (build + weryfikacja GEO).
echo   Zatrzymanie: Ctrl+C, potem T i Enter
echo  ===============================================================
echo.

call node scripts/publish.mjs
if errorlevel 1 (
  echo.
  echo  ---------------------------------------------------------------
  echo   Przygotowanie nie powiodlo sie - podglad nie zostal uruchomiony.
  echo   Powod jest wypisany wyzej. Napraw go i uruchom ponownie.
  echo  ---------------------------------------------------------------
  echo.
  pause
  exit /b 1
)

echo.
echo  Uruchamiam podglad...
echo.
cd .publish
call npx astro preview --open

echo.
echo  Serwer zatrzymany.
pause
