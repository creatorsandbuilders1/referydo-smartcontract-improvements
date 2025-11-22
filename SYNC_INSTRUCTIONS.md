# 🔄 Instrucciones de Sincronización con GitHub

## 📋 Pasos para Sincronizar (Dispositivo Actual)

### Opción 1: Usar el Script Automático (Recomendado)

**En Windows:**
```bash
sync-to-github.bat
```

**En Linux/Mac:**
```bash
chmod +x sync-to-github.sh
./sync-to-github.sh
```

---

### Opción 2: Manual (Si prefieres control total)

```bash
# 1. Ver qué cambió
git status

# 2. Agregar todos los archivos
git add .

# 3. Ver qué se va a commitear
git status

# 4. Commit con el mensaje preparado
git commit -F COMMIT_MESSAGE.txt

# 5. Push a GitHub
git push origin main
```

---

## 📥 Pasos en el Nuevo Dispositivo

### 1. Clonar el Repositorio
```bash
git clone <URL-DE-TU-REPO>
cd referydov2
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Verificar que Todo Funciona
```bash
# Verificar contrato
clarinet check

# Correr tests
npm test

# Deberías ver: ✅ 36 tests passing
```

### 4. Leer el Contexto
Abre estos archivos en orden:

1. **`QUICKSTART.md`** - Setup rápido y comandos
2. **`PROJECT_STATUS.md`** - Estado completo del proyecto
3. **`SESSION_SUMMARY.md`** - Resumen de última sesión

### 5. Continuar el Trabajo
```bash
# Ejecutar invariant tests (siguiente paso)
npx @stacks/rendezvous . referydo_advance invariant
```

---

## 📁 Archivos Importantes que se Sincronizarán

### Documentación
- ✅ `PROJECT_STATUS.md` - Estado detallado
- ✅ `QUICKSTART.md` - Guía rápida
- ✅ `SESSION_SUMMARY.md` - Resumen de sesión
- ✅ `README.md` - Overview actualizado
- ✅ `fuzztesting.md` - Docs de Rendezvous

### Código
- ✅ `contracts/referydo_advance.clar` - Contrato V8
- ✅ `contracts/referydo_advance.tests.clar` - Fuzz tests
- ✅ `tests/referydo_advance.test.ts` - Unit tests

### Configuración
- ✅ `package.json` - Scripts actualizados
- ✅ `Clarinet.toml` - Config de Clarinet

### Scripts
- ✅ `sync-to-github.sh` - Script Linux/Mac
- ✅ `sync-to-github.bat` - Script Windows

---

## ⚠️ Archivos que NO se Sincronizan (Ignorados)

Estos archivos están en `.gitignore` y NO se subirán:

- `node_modules/` - Dependencias (se reinstalan con npm install)
- `costs-reports.json` - Reportes locales
- `*.log` - Logs
- `coverage/` - Reportes de coverage
- `settings/Mainnet.toml` - Config local
- `settings/Testnet.toml` - Config local

**Esto es correcto y esperado** ✅

---

## 🔍 Verificar que Todo Subió Correctamente

### En GitHub (navegador):

1. Ve a tu repositorio en GitHub
2. Verifica que veas estos archivos nuevos:
   - `PROJECT_STATUS.md`
   - `QUICKSTART.md`
   - `SESSION_SUMMARY.md`
   - `contracts/referydo_advance.tests.clar`
   - `sync-to-github.sh`
   - `sync-to-github.bat`

3. Verifica el último commit:
   - Debe decir: "✅ V8 Optimization Complete + Fuzz Testing Passed"
   - Debe tener fecha de hoy

---

## 🚨 Solución de Problemas

### Error: "fatal: not a git repository"
```bash
# Inicializar git
git init
git remote add origin <URL-DE-TU-REPO>
git branch -M main
```

### Error: "Permission denied (publickey)"
```bash
# Configurar SSH o usar HTTPS
git remote set-url origin https://github.com/tu-usuario/tu-repo.git
```

### Error: "Updates were rejected"
```bash
# Pull primero, luego push
git pull origin main --rebase
git push origin main
```

### Error: "Merge conflict"
```bash
# Resolver conflictos manualmente
git status  # Ver archivos en conflicto
# Editar archivos y resolver
git add .
git commit -m "Resolved conflicts"
git push origin main
```

---

## 📞 Comandos de Verificación

### Antes de Sincronizar
```bash
# Ver qué cambió
git status

# Ver diferencias
git diff

# Ver archivos que se agregarán
git add . --dry-run
```

### Después de Sincronizar
```bash
# Ver último commit
git log -1

# Ver commits recientes
git log --oneline -5

# Ver archivos en el último commit
git show --name-only
```

---

## ✅ Checklist Final

### En Dispositivo Actual:
- [ ] Todos los tests pasando (`npm test`)
- [ ] Fuzz tests completados (`npm run fuzz`)
- [ ] Archivos de documentación creados
- [ ] Ejecutar `sync-to-github.bat` o `.sh`
- [ ] Verificar en GitHub que todo subió

### En Nuevo Dispositivo:
- [ ] Clonar repositorio
- [ ] `npm install`
- [ ] `clarinet check` funciona
- [ ] `npm test` pasa (36 tests)
- [ ] Leer `PROJECT_STATUS.md`
- [ ] Leer `QUICKSTART.md`
- [ ] Ejecutar invariant tests

---

## 🎯 Próximo Paso Después de Sincronizar

En el nuevo dispositivo, ejecuta:

```bash
npx @stacks/rendezvous . referydo_advance invariant
```

Esto validará que el contrato nunca entra en estados inválidos.

---

**¡Listo para sincronizar! 🚀**

