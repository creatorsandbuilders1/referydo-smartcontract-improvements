@echo off
REM Script para sincronizar cambios con GitHub (Windows)
REM Uso: sync-to-github.bat

echo.
echo 🔄 Sincronizando REFERYDO con GitHub...
echo.

REM Verificar estado
echo 📊 Estado actual:
git status
echo.

REM Agregar todos los archivos
echo ➕ Agregando archivos...
git add .
echo.

REM Mostrar qué se va a commitear
echo 📝 Archivos a commitear:
git status --short
echo.

REM Commit con mensaje predefinido
echo 💾 Creando commit...
git commit -F COMMIT_MESSAGE.txt
echo.

REM Push a GitHub
echo 🚀 Subiendo a GitHub...
git push origin main
echo.

echo ✅ ¡Sincronización completa!
echo.
echo 📍 Próximos pasos en el nuevo dispositivo:
echo 1. git clone ^<tu-repo^>
echo 2. npm install
echo 3. Leer PROJECT_STATUS.md
echo 4. Ejecutar: npx @stacks/rendezvous . referydo_advance invariant
echo.

pause
