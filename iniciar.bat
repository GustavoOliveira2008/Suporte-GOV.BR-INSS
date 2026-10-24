@echo off
setlocal

rem ===================================================================
rem  Guia Brasil - inicia o servidor local e abre o navegador.
rem  Dê dois cliques neste arquivo.
rem  Para desligar o servidor, feche a janela preta.
rem ===================================================================

title Guia Brasil - servidor local

rem ---------- Procura o PHP ----------
set "PHP="
if exist "C:\xampp\php\php.exe" set "PHP=C:\xampp\php\php.exe"

if not defined PHP (
    where php.exe >nul 2>&1
    if not errorlevel 1 set "PHP=php.exe"
)

if not defined PHP (
    echo.
    echo   Nao encontrei o PHP do XAMPP.
    echo.
    echo   O XAMPP esta instalado em C:\xampp ?
    echo   Se estiver em outro lugar, edite a linha  "set PHP="  neste arquivo.
    echo.
    pause
    exit /b 1
)

rem ---------- Procura uma porta livre ----------
set "PORTA=8000"

:procurar_porta
netstat -an | find ":%PORTA%" | find "LISTENING" >nul 2>&1
if errorlevel 1 goto porta_livre
set /a PORTA+=1
if %PORTA% lss 8010 goto procurar_porta

:porta_livre

echo.
echo   ============================================
echo    Guia Brasil
echo   ============================================
echo.
echo   Endereco:  http://localhost:%PORTA%/
echo.
echo   IMPORTANTE: mantenha esta janela aberta
echo   enquanto estiver usando o Guia Brasil.
echo.
echo   Para encerrar, feche esta janela preta.
echo.

rem Abre o navegador depois de 2 segundos, quando o PHP ja esta escutando.
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:%PORTA%/"

"%PHP%" -S localhost:%PORTA% -t "%~dp0"

echo.
echo   O servidor foi encerrado.
pause
endlocal
