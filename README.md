# 🌱 Cajas del Campo

Plataforma digital que conecta a campesinos y productores locales con consumidores finales a través de un modelo de suscripción de cajas de productos agrícolas.

## 🚀 Características Principales

- **Suscripciones de Productos Frescos**: Recibe cajas de productos del campo en tu hogar
- **Apoyo a Campesinos Locales**: Conecta directamente con productores colombianos
- **Gestión Completa**: Panel de administración para gestionar usuarios, productos y pedidos
- **Pagos Seguros**: Integración con pasarelas de pago (Stripe, PayU)
- **Interfaz Moderna**: Diseño responsive y experiencia de usuario optimizada

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **Sequelize** - ORM
- **JWT** - Autenticación
- **bcryptjs** - Hashing de contraseñas
- **express-validator** - Validación de datos

### Frontend
- **React.js** - Biblioteca de UI
- **Material-UI** - Componentes de UI
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **React Hook Form** - Manejo de formularios
- **Framer Motion** - Animaciones
- **React Query** - Manejo de estado del servidor

## 📁 Estructura del Proyecto

```
cajas-del-campo/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Address.js
│   │   ├── Farmer.js
│   │   ├── Product.js
│   │   ├── Subscription.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   ├── Payment.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── farmers.js
│   │   ├── subscriptions.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   └── admin.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── Auth/
│   │   │   └── UI/
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Admin/
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── theme.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── cajas-del-campo-especificaciones.txt
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/cajas-del-campo.git
cd cajas-del-campo
```

### 2. Configurar el Backend
```bash
cd backend
npm install
```

Crear archivo `.env` basado en `env.example`:
```bash
cp env.example .env
```

Configurar las variables de entorno:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cajas_del_campo
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
JWT_SECRET=tu_jwt_secret_muy_seguro
PORT=5000
NODE_ENV=development
```

### 3. Configurar la Base de Datos
```bash
# Crear la base de datos
createdb cajas_del_campo

# Ejecutar migraciones (se crean automáticamente al iniciar el servidor)
npm run dev
```

### 4. Configurar el Frontend
```bash
cd ../frontend
npm install
```

Crear archivo `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Ejecutar la Aplicación
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Obtener perfil actual

### Usuarios
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/users/addresses` - Obtener direcciones
- `POST /api/users/addresses` - Crear dirección

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `GET /api/products/categories/list` - Listar categorías

### Campesinos
- `GET /api/farmers` - Listar campesinos
- `GET /api/farmers/:id` - Obtener campesino
- `GET /api/farmers/:id/products` - Productos del campesino

### Suscripciones
- `GET /api/subscriptions/my-subscriptions` - Mis suscripciones
- `POST /api/subscriptions` - Crear suscripción
- `PUT /api/subscriptions/:id` - Actualizar suscripción
- `PATCH /api/subscriptions/:id/pause` - Pausar suscripción

### Pedidos
- `GET /api/orders/my-orders` - Mis pedidos
- `GET /api/orders/:id` - Obtener pedido
- `POST /api/orders/from-subscription/:id` - Crear pedido desde suscripción

### Administración
- `GET /api/admin/dashboard` - Dashboard administrativo
- `GET /api/admin/users` - Gestión de usuarios
- `GET /api/admin/products` - Gestión de productos
- `GET /api/admin/farmers` - Gestión de campesinos
- `GET /api/admin/orders` - Gestión de pedidos

## 🔐 Autenticación

La aplicación utiliza JWT (JSON Web Tokens) para la autenticación. Los tokens incluyen:
- `userId` - ID del usuario
- `role` - Rol del usuario (customer, admin)
- `exp` - Fecha de expiración

### Headers Requeridos
```
Authorization: Bearer <token>
Content-Type: application/json
```

## 🗄️ Base de Datos

### Modelos Principales
- **Users** - Usuarios del sistema
- **Addresses** - Direcciones de envío
- **Farmers** - Campesinos y productores
- **Products** - Productos agrícolas
- **Subscriptions** - Suscripciones de usuarios
- **Orders** - Pedidos de suscripciones
- **OrderItems** - Items de pedidos
- **Payments** - Pagos de pedidos

### Relaciones
- Un usuario puede tener múltiples direcciones
- Un usuario puede tener múltiples suscripciones
- Una suscripción genera múltiples pedidos
- Un pedido contiene múltiples productos
- Un campesino puede proveer múltiples productos

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🚀 Despliegue

### Backend (Heroku)
```bash
# Instalar Heroku CLI
# Crear aplicación
heroku create cajas-del-campo-api

# Configurar variables de entorno
heroku config:set DB_HOST=tu_host
heroku config:set DB_NAME=tu_db_name
# ... otras variables

# Desplegar
git push heroku main
```

### Frontend (Netlify)
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Construir y desplegar
cd frontend
npm run build
netlify deploy --prod --dir=build
```

## 🔒 Seguridad y políticas de cabeceras

Se reforzó la seguridad del backend con:

- Content Security Policy (CSP) estricta con reporte:
  - Directivas: `default-src 'self'`, `script-src 'self' https://js.stripe.com`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `img-src 'self' data: https: blob:`, `font-src 'self' https://fonts.gstatic.com`, `connect-src 'self' https://api.stripe.com`, `frame-src 'self' https://js.stripe.com`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`.
  - Reporte habilitado con `report-uri /api/security/csp-report` y cabecera `Report-To` (grupo `csp-endpoint`).
  - Endpoint de reporte CSP: `POST /api/security/csp-report` (exento de CSRF; acepta `application/csp-report` y `application/json`).

- CORS estricto:
  - Orígenes permitidos: `CORS_ALLOWED_ORIGINS` (o `FRONTEND_URL`), separados por comas.
  - Métodos: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
  - Cabeceras permitidas: `Content-Type, Authorization, x-csrf-token`.

- Otras cabeceras:
  - `Cross-Origin-Resource-Policy: same-site` (CORP).
  - `X-Frame-Options: DENY`.
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: no-referrer`.
  - `Strict-Transport-Security` (en producción bajo HTTPS).

### Reportes CSP
- Los reportes se guardan en `logs/security.log` con tipo `csp_report`.
- Ejemplo de envío manual (PowerShell):
  ```powershell
  curl.exe -i -X POST "http://localhost:<PORT>/api/security/csp-report" -H "Content-Type: application/csp-report" --data-binary "@csp-report.json"
  ```
  Donde `csp-report.json` contiene un objeto válido con la clave `csp-report`.

### CSRF (double-submit cookie)
- Obtener token: `GET /api/csrf-token`. El servidor emite cookie `XSRF-TOKEN`.
- Enviar el mismo token en cabecera `x-csrf-token` para `POST, PUT, PATCH, DELETE`.
- Protegidas rutas de negocio: `/api/auth`, `/api/users`, `/api/products`, `/api/subscriptions`, `/api/orders`, `/api/payments`, `/api/farmers`, `/api/admin`.
- El endpoint de reportes CSP está excluido.

### Variables de entorno
- `CORS_ALLOWED_ORIGINS`: lista de orígenes permitidos.
- `FRONTEND_URL`: origen único (fallback si no hay lista).
- `CSP_REPORT_URL`: URL del endpoint de reporte CSP (opcional).
- `ENCRYPTION_SECRET` o `JWT_SECRET`: secreto para firmar token CSRF.

### Verificación rápida
- Salud y cabeceras: `curl.exe -i http://localhost:<PORT>/api/health`.
- Preflight bloqueado: enviar `Origin: http://example.com` debe fallar.
- Preflight permitido: `Origin: http://localhost:3000` retorna `204` y `Access-Control-Allow-Origin`.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Desarrollador Principal** - [Tu Nombre](https://github.com/tu-usuario)
- **Diseñador UX/UI** - [Nombre del Diseñador](https://github.com/designer)
- **Product Manager** - [Nombre del PM](https://github.com/pm)

## 📞 Contacto

- **Email**: info@cajasdelcampo.com
- **Teléfono**: +57 (1) 234-5678
- **Sitio Web**: https://cajasdelcampo.com

## 🙏 Agradecimientos

- A todos los campesinos colombianos que hacen posible este proyecto
- A la comunidad de desarrolladores de código abierto
- A todos los usuarios que confían en nuestra plataforma

---

**¡Gracias por usar Cajas del Campo! 🌱**
