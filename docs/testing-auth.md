# Guía de Testing del Sistema de Autenticación

Esta guía describe las pruebas creadas para el backend y el frontend del sistema de autenticación, cómo ejecutarlas y qué resultados esperar. Incluye configuración de entorno, dependencias y ejemplos de salida.

## Objetivos de las pruebas

- Backend: Validar el endpoint `POST /api/auth/login` en escenarios clave:
  - Éxito (200) con credenciales válidas
  - Error (401) con credenciales inválidas
  - Validación de campos obligatorios (400)
  - Comportamiento ante datos malformados (error manejado por el servidor)

- Frontend: Pruebas de integración del formulario de Login, cubriendo:
  - Escritura en campos email y contraseña
  - Envío del formulario y navegación en caso exitoso
  - Mensajes de feedback en casos de error
  - Validación frente a entradas inválidas

## Archivos añadidos

- Backend:
  - `__tests__/auth.login.test.js`: Pruebas del endpoint de login.
  - `jest.setup.js` (actualizado): Añade `JWT_SECRET` para firmar tokens durante los tests.

- Frontend:
  - `frontend/src/pages/Login.test.js`: Pruebas de integración del formulario de Login usando `user-event`.
  - `frontend/src/setupTests.js`: Habilita matchers de `jest-dom` para Testing Library.

## Fragmentos de código (listos para usar)

- Backend: Obtener token CSRF y realizar login exitoso

```js
// __tests__/auth.login.test.js
const { sequelize } = require('../config/database-sqlite');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const app = require('../server');

async function getCsrfToken() {
  const res = await request(app).get('/api/csrf-token');
  const token = res.body.csrfToken;
  const cookie = (res.headers['set-cookie'] || []).find(c => c.startsWith('XSRF-TOKEN='))?.split(';')[0] || `XSRF-TOKEN=${token}`;
  return { token, cookie };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await User.create({
    name: 'Login Test User',
    email: 'login.test@example.com',
    password_hash: await bcrypt.hash('ValidPass123!', 12),
    role: 'customer',
    is_active: true,
    email_verified: true,
  });
});

test('200 success with valid credentials', async () => {
  const { token, cookie } = await getCsrfToken();
  const res = await request(app)
    .post('/api/auth/login')
    .set('x-csrf-token', token)
    .set('Cookie', cookie)
    .send({ email: 'login.test@example.com', password: 'ValidPass123!' })
    .expect(200);
  expect(res.body.message).toBe('Login successful');
});
```

- Frontend: Éxito de login y navegación a dashboard

```jsx
// frontend/src/pages/Login.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import { AuthContext } from '../contexts/AuthContext';

function renderWithAuthAndRouter(ui, { loginImpl } = {}) {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={
          <AuthContext.Provider value={{ user: null, loading: false, login: loginImpl }}>
            {ui}
          </AuthContext.Provider>
        } />
        <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

test('login exitoso navega a dashboard', async () => {
  const user = userEvent.setup();
  const mockLogin = jest.fn(async () => ({ success: true }));
  renderWithAuthAndRouter(<Login />, { loginImpl: mockLogin });

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Password123!');
  await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

  expect(await screen.findByTestId('dashboard')).toBeInTheDocument();
});
```

## Configuración del entorno de testing

- Backend (`jest.setup.js`):
  - `NODE_ENV=test`: evita levantar el servidor y ajusta logs.
  - `JWT_SECRET=test-secret`: necesario para firmar tokens JWT.
  - `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS`: valores mínimos para CORS.

- CSRF:
  - Antes de hacer `POST /api/auth/login`, obtener el token mediante `GET /api/csrf-token`.
  - Enviar tanto el header `x-csrf-token` como la cookie `XSRF-TOKEN` en la petición.

## Dependencias necesarias

- Backend:
  - `jest` (ya configurado)
  - `supertest`

- Frontend:
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `@testing-library/user-event`

Instalación recomendada:

```bash
# Backend (desde la raíz del proyecto)
npm i -D jest supertest

# Frontend (dentro de la carpeta frontend/)
cd frontend
npm i -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Si tu sistema bloquea `npm` por políticas de PowerShell, puedes ejecutar Jest directamente con Node como se indica abajo.

## Cómo ejecutar las pruebas

- Backend (desde la raíz):

```bash
# Ejecutar todas las pruebas backend (Jest)
node node_modules/jest/bin/jest.js --runInBand

# Ejecutar solo el suite de login
node node_modules/jest/bin/jest.js __tests__/auth.login.test.js --runInBand
```

- Frontend (desde `frontend/`):

```bash
cd frontend
# Ejecutar pruebas de React (si `npm test` no funciona, usa el script de react-scripts)
npm test --watchAll=false
# o
node node_modules/react-scripts/scripts/test.js --watchAll=false
```

## Resultados esperados

- Backend:
  - Éxito: respuesta 200 con `message: 'Login successful'`, `user`, `accessToken`, `refreshToken`.
  - Credenciales inválidas: respuesta 401 con `message` indicando credenciales inválidas.
  - Campos faltantes: respuesta 400 con `message: 'Validation errors'` y `errors[]` detallando campos.
  - Datos malformados: el parser JSON produce un error manejado por el middleware, respuesta 500 con `message: 'Something went wrong!'`.

- Frontend:
  - Éxito: tras enviar el formulario, la vista cambia a `/dashboard` (se valida un marcador `data-testid="dashboard"`).
  - Error: aparece un `<Alert role="alert">` con el mensaje de error (p. ej. “Credenciales inválidas”).
  - Entradas inválidas: se muestran mensajes de validación bajo los campos (“Formato de email inválido”, “La contraseña es requerida”) y un banner general.

## Ejemplos de salida

- Backend (Jest):

```
PASS  __tests__/auth.login.test.js
  POST /api/auth/login
    ✓ 200 success with valid credentials
    ✓ 401 with invalid credentials (wrong password)
    ✓ 400 validation error for missing fields
    ✓ Handled error with malformed JSON body

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

- Frontend (React Testing Library):

```
PASS  src/pages/Login.test.js
  Login page integration
    ✓ typing email and password and successful submit navigates to dashboard
    ✓ shows error feedback on invalid credentials
    ✓ shows validation messages with invalid inputs

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

## Notas y buenas prácticas

- En backend, crea datos específicos para los tests (usuario de prueba) y restablece el estado con `sequelize.sync({ force: true })` al inicio.
- Para endpoints protegidos por CSRF, siempre obtén el token con `GET /api/csrf-token` y envíalo en header y cookie.
- En frontend, evita llamadas reales a la API simulando el contexto de autenticación (`AuthContext`) y usando `MemoryRouter` para validar navegación.
- Mantén las pruebas enfocadas y rápidas; usa `--runInBand` en Windows si hay problemas de handles abiertos.