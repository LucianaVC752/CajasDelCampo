# 🌱 Cajas del Campo

Plataforma digital que conecta a campesinos y productores locales con consumidores finales a través de un modelo de suscripción de cajas de productos agrícolas.

## 🆕 Últimas actualizaciones

- 2025-11-07: Documentación actualizada y verificación de enlaces.
- 2025-11-07: Base de datos SQLite por defecto en desarrollo y pruebas (`config/database-sqlite.js`).
- 2025-11-07: Endurecimiento de seguridad: CSP con reporte, CORS estricto, cabeceras seguras, CSRF (double-submit cookie).
- 2025-11-07: Separación de estructura de testing y scripts de limpieza (`docs/testing-structure.md`, `npm run clean:tests`).
- 2025-11-07: Endpoint de salud `GET /api/health` y cabecera `Report-To` para CSP.
- 2025-11-07: Bloqueo temporal por intentos fallidos en login y rate limiting.
- 2025-11-07: Columnas `image_data` en `products` y `farmers` para almacenamiento de imágenes en SQLite.
- 2025-11-07: Dockerfile actualizado (Node 18 LTS, `HEALTHCHECK`).

## 🚀 Características Principales

- Suscripciones de productos frescos y gestión de pedidos
- Apoyo a campesinos locales y catálogo de productos
- Panel de administración (usuarios, productos, campesinos, pedidos)
- Pagos (Stripe) y preparación para otros métodos
- Seguridad reforzada: CSP, CSRF, CORS, rate limiting y bloqueo por intentos

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js 18
- Express.js
- Sequelize (SQLite por defecto; PostgreSQL opcional en producción)
- JWT para autenticación
- bcryptjs, express-validator, multer, helmet, cors, express-rate-limit

### Frontend
- React 18 (CRA)
- Material UI (MUI)
- React Router v6
- Axios
- React Hook Form
- Framer Motion
- React Query

## 📁 Estructura del Proyecto (actual)

```
CajasDelCampo/
├── config/
│   ├── database-sqlite.js
│   ├── database.js
│   └── production.js
├── middleware/
│   ├── auth.js
│   ├── security.js
│   └── validation.js
├── models/
│   ├── Address.js
│   ├── Farmer.js
│   ├── Order.js
│   ├── OrderItem.js
│   ├── Payment.js
│   ├── Product.js
│   ├── Subscription.js
│   ├── User.js
│   └── index.js
├── routes/
│   ├── admin.js
│   ├── auth.js
│   ├── farmers.js
│   ├── orders.js
│   ├── payments.js
│   ├── products.js
│   ├── subscriptions.js
│   └── users.js
├── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── docs/
│   ├── testing-api.md
│   ├── testing-auth.md
│   └── testing-structure.md
├── uploads/
├── coverage/
└── README.md
```

## 📦 Dependencias actualizadas

### Backend (raíz)
- express `^4.18.2`
- sequelize `^6.35.2`
- sqlite3 `^5.1.7` (dev/test por defecto)
- pg `^8.11.3` y pg-hstore `^2.3.4` (opcional)
- jsonwebtoken `^9.0.2`
- bcryptjs `^2.4.3`
- express-validator `^7.0.1`
- helmet `^7.1.0`
- cors `^2.8.5`
- express-rate-limit `^7.1.5`
- multer `^1.4.5-lts.1`
- stripe `^14.7.0`
- axios `^1.6.2`

### Frontend (`frontend/`)
- react `^18.2.0`
- react-router-dom `^6.8.1`
- @mui/material `^5.18.0`
- axios `^1.6.2`
- react-hook-form `^7.48.2`
- framer-motion `^10.16.16`
- react-query `^3.39.3`
- @stripe/react-stripe-js `^4.0.2`, @stripe/stripe-js `^7.9.0`

## 🚀 Instalación y Configuración (actualizada)

### Prerrequisitos
- Node.js 18 (o superior)
- npm
- SQLite (incluido; no requiere instalación separada para desarrollo)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/cajas-del-campo.git
cd CajasDelCampo
```

### 2. Backend
```bash
npm install
```

Crear `.env` (ejemplo mínimo):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=una_llave_segura_larga
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_tu_clave
STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave
ENCRYPTION_KEY=local-dev-key-32chars-2025!
```

La base de datos SQLite se crea automáticamente en `./database.sqlite`. No se requieren migraciones manuales.

Ejecutar backend:
```bash
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
```

Crear `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Ejecutar frontend:
```bash
npm start
```

Aplicación disponible en:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### 4. Docker (opcional)
- Imagen basada en Node 18 Alpine con `HEALTHCHECK`. Ver `Dockerfile`.

## 📚 API Endpoints (resumen)

### Autenticación
- `POST /api/auth/register` – Registro
- `POST /api/auth/login` – Inicio de sesión (rate limiting y lockout)
- `POST /api/auth/refresh` – Renovación de tokens
- `GET /api/auth/me` – Perfil actual
- `POST /api/auth/forgot-password` – Solicitud de reset
- `POST /api/auth/reset-password` – Restablecimiento con reglas de contraseña estrictas

### Seguridad
- `GET /api/csrf-token` – Emite cookie `XSRF-TOKEN` y token CSRF
- `POST /api/security/csp-report` – Recepción de reportes CSP (exento de CSRF)
- `GET /api/health` – Verificación de estado

### Negocio
- Usuarios, Productos, Campesinos, Suscripciones, Pedidos, Pagos y Administración en `/api/*` (consultar `/routes`).

## 🔐 Autenticación y Seguridad

- JWT con expiraciones configurables (`JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`).
- CSRF por double-submit cookie (cabecera `x-csrf-token` y cookie `XSRF-TOKEN`).
- CSP con `report-uri` y cabecera `Report-To`.
- CORS estricto con lista blanca (`CORS_ALLOWED_ORIGINS` o `FRONTEND_URL`).
- Rate limiting en `/api/` y lockout de login por intentos fallidos.

## 🗄️ Base de Datos

- SQLite por defecto en desarrollo y pruebas (`config/database-sqlite.js`).
- Postgres opcional para producción (`config/database.js`, `config/production.js`).
- Sincronización automática (`sequelize.sync({ force: false })`).
- Migraciones ad-hoc en arranque para agregar columnas `image_data` y `is_hidden` si faltan.

## 🧪 Testing

- Estructura separada de pruebas (ver `docs/testing-structure.md`).
- Ejecutar desde la raíz:
```bash
npm test
npm run test:coverage
```
- Frontend: `cd frontend && npm run test`.
- Guías:
  - `docs/testing-auth.md`
  - `docs/testing-api.md`

## 🧾 Ejemplos de uso

### Obtener token CSRF y usarlo
```bash
# Obtener token (cookie y payload JSON con csrfToken)
curl -i http://localhost:5000/api/csrf-token

# Usar token en un POST protegido
curl -i -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: <TOKEN>" \
  -H "Cookie: XSRF-TOKEN=<TOKEN>" \
  --data '{"email":"user@example.com","password":"TuContraseñaSegura123!"}'
```

### Reporte CSP (PowerShell)
```powershell
curl.exe -i -X POST "http://localhost:5000/api/security/csp-report" -H "Content-Type: application/csp-report" --data-binary "@csp-report.json"
```

### Renovar tokens
```bash
curl -i -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  --data '{"refreshToken":"<REFRESH_TOKEN>"}'
```

### Salud del servicio
```bash
curl -s http://localhost:5000/api/health | jq
```

## 🧩 Requisitos del sistema

- Node.js 18+
- npm
- Desarrollo: SQLite (sin instalación adicional)
- Producción (opcional): PostgreSQL 12+

## 🔗 Enlaces útiles

- Guía de testing de autenticación: `docs/testing-auth.md`
- Guía de testing de API: `docs/testing-api.md`
- Estructura de testing: `docs/testing-structure.md`
- Reportes de cobertura: `coverage/lcov-report/index.html`

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Equipo

- Desarrollador Principal – Tu Nombre

## 📞 Contacto

- Email: info@cajasdelcampo.com
- Sitio Web: https://cajasdelcampo.com

## 🔭 Próximos pasos

- Migración a PostgreSQL en producción y pipeline de migraciones.
- Cache con Redis en endpoints críticos.
- Finalizar flujos de email (reset de contraseña) en producción.
- Tests E2E adicionales y CI/CD.
- Almacenamiento de imágenes en servicio externo (S3) en producción.

---

Gracias por usar Cajas del Campo 🌱
