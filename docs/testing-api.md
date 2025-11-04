# Pruebas integrales de API y Frontend

Este documento describe los escenarios de prueba, criterios de aceptación y configuración del entorno para las rutas críticas de la API y las interacciones del frontend.

## Configuración de entorno
- `NODE_ENV=test` y SQLite en memoria (`:memory:`) para aislamiento.
- Limpieza automática entre suites usando `sequelize.sync({ force: true })` y truncado selectivo.
- CSRF double-submit cookie manejado mediante helper `getCsrfToken`.
- JWT firmado con `JWT_SECRET` de entorno o valor por defecto en `jest.setup.js`.
- Reportes de cobertura: `npm run test:coverage`.
- CI/CD: ejecutar `npm run test` en el pipeline antes de build/deploy.

## API /api/auth
### Registro
- Éxito 200: cuerpo con `accessToken`, `refreshToken`, `user`.
- Error 400: validaciones de email y password.
- Error 409/400: email duplicado.
- Error 500: JSON malformado.
- CSRF requerido (header `x-csrf-token` y cookie `XSRF-TOKEN`).

## API /api/users
### Perfil
- Éxito 200: retorna objeto `user` con propiedades esperadas.
- Error 401: sin token o token inválido.
### Actualización de perfil
- Éxito 200: actualiza `name`/`phone_number`.
- Error 400: validación de formato de `phone_number` y `name` vacío.
- Requiere CSRF para `PUT`.

## API /api/products
### Públicos
- Listado 200 con paginación.
- Detalle 200 con datos del `farmer` asociado.
- Detalle 404 si no existe.
### Admin (CRUD)
- Crear 201 con base64 o archivo; validaciones 400 (precio negativo, unit/category inválidos, `farmer_id` inválido).
- Actualizar 200 `PUT` y `PATCH` con cambios aplicados.
- Eliminar 200 y opcional verificación de ausencia/presencia según flags.
- Restaurar 200 con `PATCH /:id/restore`.
- Todos requieren JWT admin y CSRF.

## Frontend (RTL)
### Rutas protegidas
- `ProtectedRoute`: spinner mientras `loading=true`; redirige a `/login` sin usuario; renderiza children con usuario.
- `AdminRoute`: spinner; redirige a `/login` sin usuario; a `/dashboard` sin permisos; renderiza children con `isAdmin=true`.
### Login
- Muestra `Alert` de error ante `login` fallido.
- Valida formulario y muestra mensaje cuando hay errores.

## Criterios de aceptación generales
- Códigos de estado correctos según escenario.
- Estructura de respuesta valida (`message`, datos de entidad y/o `errors`).
- Validación de datos de entrada aplicada con mensajes claros.
- Manejo de errores consistente y seguro (sin fugas de detalles sensibles).
- Tiempos de respuesta aceptables (<1500ms en pruebas locales).

## Comandos útiles
- Backend: `npm run test` desde la raíz.
- Cobertura: `npm run test:coverage`.
- Frontend: `cd frontend && npm run test`.