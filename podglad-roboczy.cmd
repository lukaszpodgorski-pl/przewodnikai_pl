@echo off
rem Podglad roboczy - cala tresc, takze artykuly wyciete z produkcji.
rem Do czytania i poprawiania tekstow przed dopuszczeniem ich do publikacji.
cd /d "%~dp0"

echo.
echo  ===============================================================
echo   PODGLAD ROBOCZY
echo  ===============================================================
echo.
echo   Widzisz CALA tresc - takze artykuly, ktorych nie ma na zywej
echo   stronie. Tu czytasz i poprawiasz.
echo.
echo   Adres:       http://localhost:4321
echo   Zatrzymanie: Ctrl+C, potem T i Enter
echo.
echo   Przegladarka otworzy sie sama, gdy serwer bedzie gotowy.
echo  ===============================================================
echo.

if not exist "node_modules\" (
  echo  Brak node_modules - instaluje zaleznosci. To potrwa kilka minut.
  echo.
  call npm install
  echo.
)

call npm run dev -- --open

echo.
echo  Serwer zatrzymany.
pause
