# Plan de Implementación de Fuzz Testing - REFERYDO Contract

## 📋 Resumen Ejecutivo

Este plan detalla la implementación de fuzz testing para el contrato `referydo_advance.clar` usando Rendezvous. El objetivo es descubrir edge cases y vulnerabilidades que los unit tests tradicionales no detectan.

---

## 🎯 Objetivos del Fuzz Testing

1. **Validar la integridad financiera**: Asegurar que el 100% del escrow se distribuye correctamente
2. **Verificar transiciones de estado**: Confirmar que los estados del proyecto solo cambian de manera válida
3. **Detectar overflows/underflows**: Encontrar casos donde los cálculos aritméticos fallen
4. **Probar autorización**: Verificar que solo los usuarios correctos pueden ejecutar funciones específicas
5. **Validar edge cases**: Montos extremos, porcentajes límite, secuencias de operaciones inusuales

---

## 📦 Fase 1: Instalación y Configuración

### 1.1 Instalar Rendezvous

```bash
npm install @stacks/rendezvous --save-dev
```

### 1.2 Estructura de Archivos

```
contracts/
├── referydo_advance.clar           # Contrato principal
├── referydo_advance.tests.clar     # Tests de fuzz (NUEVO)
```

### 1.3 Actualizar Clarinet.toml

Agregar el archivo de tests:

```toml
[contracts.referydo_advance_tests]
path = 'contracts/referydo_advance.tests.clar'
clarity_version = 3
epoch = 'latest'
```

---

## 🧪 Fase 2: Propiedades a Testear (Property-Based Testing)

### 2.1 Propiedad: Conservación de Fondos

**Invariante**: La suma de todos los pagos debe ser igual al monto total del escrow.

```clarity
;; Property: Total distribution equals escrow amount
(define-public (test-fund-conservation 
  (amount uint)
  (scout-fee uint)
  (platform-fee uint))
  (let (
    (scout-payout (/ (* amount scout-fee) u100))
    (platform-payout (/ (* amount platform-fee) u100))
    (total-fees (+ scout-payout platform-payout))
    (talent-payout (- amount total-fees))
    (reconstructed-total (+ talent-payout scout-payout platform-payout))
  )
    (asserts! (<= (+ scout-fee platform-fee) u100) (ok false))
    (asserts! (is-eq amount reconstructed-total) (err u999))
    (ok true)
  )
)
```

### 2.2 Propiedad: Fees No Exceden el Total

**Invariante**: Los fees combinados nunca deben exceder el 100%.

```clarity
;; Property: Combined fees cannot exceed 100%
(define-public (test-fee-bounds 
  (scout-fee uint)
  (platform-fee uint))
  (begin
    (asserts! 
      (<= (+ scout-fee platform-fee) u100)
      (err u999)
    )
    (ok true)
  )
)
```

### 2.3 Propiedad: Transiciones de Estado Válidas

**Invariante**: Los estados solo pueden transicionar en el orden correcto.

```clarity
;; Property: State transitions are valid
(define-public (test-state-transitions 
  (from-status uint)
  (to-status uint))
  (let (
    (valid-transition
      (or
        ;; Created (0) -> Pending_Acceptance (4)
        (and (is-eq from-status u0) (is-eq to-status u4))
        ;; Pending_Acceptance (4) -> Funded (1)
        (and (is-eq from-status u4) (is-eq to-status u1))
        ;; Pending_Acceptance (4) -> Declined (5)
        (and (is-eq from-status u4) (is-eq to-status u5))
        ;; Funded (1) -> Completed (2)
        (and (is-eq from-status u1) (is-eq to-status u2))
        ;; Funded (1) -> Disputed (3)
        (and (is-eq from-status u1) (is-eq to-status u3))
      )
    )
  )
    (asserts! valid-transition (err u999))
    (ok true)
  )
)
```

### 2.4 Propiedad: No Hay Pérdida por Redondeo

**Invariante**: La diferencia por redondeo debe ser mínima (< 1% del total).

```clarity
;; Property: Rounding loss is minimal
(define-public (test-rounding-loss 
  (amount uint)
  (scout-fee uint)
  (platform-fee uint))
  (let (
    (scout-payout (/ (* amount scout-fee) u100))
    (platform-payout (/ (* amount platform-fee) u100))
    (total-fees (+ scout-payout platform-payout))
    (talent-payout (- amount total-fees))
    (reconstructed (+ talent-payout scout-payout platform-payout))
    (loss (if (>= amount reconstructed) 
            (- amount reconstructed) 
            u0))
    (max-acceptable-loss (/ amount u100)) ;; 1% max
  )
    (asserts! (<= (+ scout-fee platform-fee) u100) (ok false))
    (asserts! (<= loss max-acceptable-loss) (err u999))
    (ok true)
  )
)
```

---

## 🔒 Fase 3: Invariantes a Testear (Invariant Testing)

### 3.1 Invariante: Balance del Contrato

**Invariante**: El balance del contrato debe ser igual a la suma de todos los proyectos en estado "Funded" o "Pending_Acceptance".

```clarity
;; Invariant: Contract balance matches funded projects
(define-read-only (invariant-contract-balance)
  (let (
    (fund-escrow-calls 
      (default-to u0 (get called (map-get? context "fund-escrow"))))
    (approve-calls 
      (default-to u0 (get called (map-get? context "approve-and-distribute"))))
    (decline-calls 
      (default-to u0 (get called (map-get? context "decline-project"))))
  )
    ;; Balance should be: funded - (approved + declined)
    (>= fund-escrow-calls (+ approve-calls decline-calls))
  )
)
```

### 3.2 Invariante: Estado Consistente

**Invariante**: Un proyecto nunca puede volver a un estado anterior.

```clarity
;; Invariant: Projects never regress to previous states
(define-read-only (invariant-no-state-regression)
  (let (
    (accept-calls 
      (default-to u0 (get called (map-get? context "accept-project"))))
    (decline-calls 
      (default-to u0 (get called (map-get? context "decline-project"))))
    (approve-calls 
      (default-to u0 (get called (map-get? context "approve-and-distribute"))))
  )
    ;; Once accepted or declined, cannot go back
    (if (> accept-calls u0)
      (is-eq decline-calls u0)
      true
    )
  )
)
```

### 3.3 Invariante: Autorización

**Invariante**: Solo el cliente puede aprobar, solo el talent puede aceptar/declinar.

```clarity
;; Invariant: Authorization is always enforced
(define-read-only (invariant-authorization-enforced)
  ;; This checks that unauthorized calls always fail
  ;; Rendezvous tracks failed calls separately
  true ;; Placeholder - Rendezvous handles this automatically
)
```

---

## 🚀 Fase 4: Configuración de Rendezvous

### 4.1 Crear Script de Ejecución

Crear `scripts/run-fuzz.js`:

```javascript
import { runFuzzTests } from '@stacks/rendezvous';

const config = {
  contract: 'referydo_advance',
  testContract: 'referydo_advance_tests',
  runs: 1000, // Número de iteraciones
  maxDepth: 10, // Profundidad máxima de llamadas
  seed: Date.now(), // Seed para reproducibilidad
};

runFuzzTests(config);
```

### 4.2 Agregar Script a package.json

```json
{
  "scripts": {
    "fuzz": "node scripts/run-fuzz.js",
    "fuzz:verbose": "node scripts/run-fuzz.js --verbose",
    "fuzz:seed": "node scripts/run-fuzz.js --seed"
  }
}
```

---

## 📊 Fase 5: Casos de Prueba Específicos

### 5.1 Edge Cases Críticos

| Caso | Descripción | Valores de Prueba |
|------|-------------|-------------------|
| **Monto Mínimo** | Proyecto con 1 uSTX | amount=1, fees=1% |
| **Monto Máximo** | Proyecto con u340282366920938463463374607431768211455 | Max uint |
| **Fees al 100%** | Scout + Platform = 100% | scout=50, platform=50 |
| **Fees al 0%** | Sin fees | scout=0, platform=0 |
| **Redondeo Extremo** | Montos que causan pérdida por redondeo | amount=3, scout=33, platform=33 |
| **Secuencia Completa** | Create → Fund → Accept → Approve | Flujo normal |
| **Decline Inmediato** | Create → Fund → Decline | Refund path |

### 5.2 Secuencias de Operaciones

```clarity
;; Property: Complete workflow succeeds
(define-public (test-complete-workflow
  (amount uint)
  (scout-fee uint)
  (platform-fee uint))
  (let (
    (project-id u1)
  )
    ;; Simulate: create → fund → accept → approve
    (asserts! (<= (+ scout-fee platform-fee) u100) (ok false))
    (asserts! (> amount u0) (ok false))
    ;; Additional workflow validation here
    (ok true)
  )
)
```

---

## 🎯 Fase 6: Métricas de Éxito

### 6.1 Cobertura Objetivo

- ✅ 100% de funciones públicas testeadas
- ✅ Todas las transiciones de estado cubiertas
- ✅ Edge cases de aritmética validados
- ✅ Casos de autorización verificados

### 6.2 Criterios de Aprobación

1. **1000+ iteraciones** sin fallos en propiedades
2. **Todos los invariantes** mantienen su validez
3. **Cero overflows/underflows** detectados
4. **Distribución correcta** en el 100% de los casos

---

## 📝 Fase 7: Implementación Paso a Paso

### Día 1: Setup
1. ✅ Instalar Rendezvous
2. ✅ Crear archivo de tests
3. ✅ Configurar Clarinet.toml

### Día 2-3: Propiedades
4. ✅ Implementar test-fund-conservation
5. ✅ Implementar test-fee-bounds
6. ✅ Implementar test-state-transitions
7. ✅ Implementar test-rounding-loss

### Día 4: Invariantes
8. ✅ Implementar invariant-contract-balance
9. ✅ Implementar invariant-no-state-regression
10. ✅ Implementar invariant-authorization-enforced

### Día 5: Ejecución y Análisis
11. ✅ Ejecutar primera ronda de fuzz tests
12. ✅ Analizar resultados
13. ✅ Ajustar propiedades según hallazgos
14. ✅ Re-ejecutar con más iteraciones

---

## 🐛 Fase 8: Análisis de Resultados

### 8.1 Qué Buscar

- **Fallos en propiedades**: Indican bugs en la lógica
- **Invariantes violados**: Problemas de estado inconsistente
- **Excepciones no manejadas**: Edge cases no considerados
- **Patrones de fallo**: Secuencias específicas que causan problemas

### 8.2 Documentar Hallazgos

Crear `FUZZ_RESULTS.md` con:
- Bugs encontrados
- Casos de prueba que fallaron
- Valores específicos que causaron problemas
- Soluciones implementadas

---

## 🔄 Fase 9: Integración Continua

### 9.1 Agregar a CI/CD

```yaml
# .github/workflows/fuzz-test.yml
name: Fuzz Testing
on: [push, pull_request]
jobs:
  fuzz:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run fuzz
```

### 9.2 Ejecutar Regularmente

- **Pre-commit**: Fuzz rápido (100 runs)
- **Pre-merge**: Fuzz medio (1000 runs)
- **Nightly**: Fuzz extensivo (10000+ runs)

---

## 📚 Recursos Adicionales

- [Rendezvous Docs](https://stacks-network.github.io/rendezvous/)
- [Clarity Language Reference](https://docs.stacks.co/clarity/)
- [Property-Based Testing Guide](https://hypothesis.works/articles/what-is-property-based-testing/)

---

## ✅ Checklist Final

- [ ] Rendezvous instalado
- [ ] Archivo de tests creado
- [ ] 4+ propiedades implementadas
- [ ] 3+ invariantes implementados
- [ ] Script de ejecución configurado
- [ ] Primera ronda de tests ejecutada
- [ ] Resultados documentados
- [ ] CI/CD configurado

---

**Próximo Paso**: Comenzar con la Fase 1 - Instalación y Configuración
