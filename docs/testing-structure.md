# Separación de Testing del Código de Producción

Este documento describe la nueva estructura de pruebas, convenciones de nombrado, cómo ejecutar pruebas específicas, cómo excluirlas en despliegues y cómo eliminarlas completamente.

## Estructura de directorios

- `src/`: Código fuente principal del backend y del frontend (`frontend/src`).
- `tests/unit/`: Pruebas unitarias del backend.
- `tests/integration/`: Pruebas de integración del backend.
- `tests/e2e/`: Pruebas end-to-end del backend.
- `frontend/tests/unit/`: Pruebas unitarias del frontend.
- `frontend/tests/integration/`: Pruebas de integración del frontend.
- `frontend/tests/e2e/`: Pruebas end-to-end del frontend.

Los tests se ubican fuera de `src` para que queden excluidos automáticamente de las builds de producción del frontend (CRA sólo compila `src/`).

## Convenciones de nombrado

- Sufijos de archivos de prueba: `*.test.js` o `*.spec.js`.
- Nombres paralelos entre código y pruebas:
  - `routes/auth.js` → `tests/integration/backend/auth.test.js` (backend).
  - `frontend/src/pages/Login.js` → `frontend/tests/integration/Login.test.js` (frontend).

## Configuración de ejecución de pruebas

### Backend (Jest)
- Configuración en `jest.config.js` actualizada para buscar en:
  - `tests/unit/**/*.test.js`
  - `tests/integration/**/*.test.js`
- Ejecutar:
  - `npm test` → toda la suite backend.
  - `npm run test:watch` → modo watch.
  - `npm run test:coverage` → cobertura.
  - Filtrar por nombre de archivo: `npx jest tests/integration/backend/auth.login.test.js`.

### Frontend (CRA + react-scripts)
- Script ajustado para buscar pruebas fuera de `src`:
  - `npm run test` (desde `frontend/`) → `react-scripts test --testMatch '<rootDir>/tests/**/*.(test|spec).js'`
- Setup de Jest del frontend: `frontend/src/setupTests.js` se mantiene y se carga automáticamente.

## Exclusión en builds de producción

- Frontend: al estar fuera de `src`, los tests no se incluyen en la build (`react-scripts build`).
- Backend y repo raíz:
  - `.npmignore` excluye `tests/`, `__tests__/` y `frontend/tests/` en empaquetados/publicaciones.
  - `.dockerignore` excluye directorios de tests del contexto de Docker.
  - Script de build de backend: `npm run build:prod` ejecuta una limpieza previa de tests.

## Eliminación completa de pruebas

- Script de limpieza: `npm run clean:tests` (desde la raíz del repo) elimina:
  - `tests/`, `__tests__/`, `frontend/tests/`
  - Archivos `*.test.js` o `*.spec.js` residuales dentro de `frontend/src`.

## Ejemplos de ejecución

- Backend, pruebas de integración de autenticación:
  - `npx jest tests/integration/backend/auth.login.test.js`

- Frontend, pruebas del Login:
  - `cd frontend && npm run test -- Login.test`

## Notas y buenas prácticas

- Mantener los tests del frontend fuera de `src` garantiza builds limpias sin incluir artefactos de testing.
- Usar nombres paralelos facilita el mantenimiento y el descubrimiento rápido de la prueba correspondiente.
- Para despliegues con Docker, confirmar que `.dockerignore` esté presente para reducir el contexto y acelerar builds.