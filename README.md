# URL Shortener API

API REST para acortar URLs con analytics, caching y autenticación.
Proyecto de portafolio para demostrar habilidades de backend.

## ✨ Características

- 🔐 **Autenticación** con JWT (register, login, logout, refresh token)
- ✂️ **Acortado de URLs** con códigos cortos únicos (nanoid)
- 📊 **Analytics** de clicks (por día, dispositivo, browser)
- 🚀 **Caching** con Redis para URLs populares
- 🛡️ **Rate limiting** global + específico por endpoint
- 📝 **Documentación** automática con Swagger/OpenAPI
- 🐳 **Deploy** con Docker Compose (app + PostgreSQL + Redis)
- 🤖 **CI/CD** con GitHub Actions (lint + test + build automático)
- ✅ **Testing** con Jest + Supertest

## 🛠️ Stack Tecnológico

| Capa            | Tecnología                              |
|-----------------|-----------------------------------------|
| Lenguaje        | TypeScript                              |
| Backend         | Express.js                              |
| Base de datos   | PostgreSQL 16                           |
| Caché           | Redis 7                                 |
| Autenticación   | JWT + bcrypt                            |
| Validación      | Zod                                     |
| Testing         | Jest + Supertest                        |
| Documentación   | Swagger / OpenAPI                       |
| DevOps          | Docker, GitHub Actions                  |

## 📁 Estructura del Proyecto

```
url-shortener/
├── src/
│   ├── config/          # Configuraciones (DB, Redis, env)
│   ├── controllers/     # Lógica de request/response
│   ├── middleware/       # Auth, rate limit, validación, errores
│   ├── models/          # Schemas de validación (Zod)
│   ├── routes/          # Endpoints REST
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Helpers, logger, respuestas
│   └── app.ts           # Configuración de Express
├── tests/
│   ├── unit/            # Tests aislados
│   └── integration/     # Tests de API completa
├── .github/workflows/   # CI/CD
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── tsconfig.json
├── .env.example
└── package.json
```

## 🚀 Cómo Empezar

### Requisitos
- Node.js 20+
- Docker y Docker Compose (recomendado)
- npm

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales
```

### 3. Levantar con Docker (recomendado)

Esto levanta app + PostgreSQL + Redis automáticamente:

```bash
docker compose up -d
```

### 4. O en desarrollo local

Necesitas PostgreSQL y Redis corriendo, luego:

```bash
npm run dev
```

### 5. Acceder

- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- Documentación Swagger: `http://localhost:3000/api-docs`

## 🔌 Endpoints

### Autenticación
| Método | Endpoint                  | Descripción             | Auth |
|--------|---------------------------|-------------------------|------|
| POST   | `/api/auth/register`      | Crear cuenta            | No   |
| POST   | `/api/auth/login`         | Iniciar sesión          | No   |
| POST   | `/api/auth/logout`        | Cerrar sesión           | Sí   |
| POST   | `/api/auth/refresh-token` | Renovar token           | No   |

### URLs
| Método | Endpoint            | Descripción            | Auth |
|--------|---------------------|------------------------|------|
| POST   | `/api/urls`         | Acortar URL            | Sí   |
| GET    | `/api/urls`         | Listar mis URLs        | Sí   |
| GET    | `/api/urls/:id`     | Detalle de URL         | Sí   |
| PATCH  | `/api/urls/:id`     | Actualizar URL         | Sí   |
| DELETE | `/api/urls/:id`     | Eliminar URL           | Sí   |
| GET    | `/:shortCode`       | Redirigir a URL orig.  | No   |

### Estadísticas
| Método | Endpoint                    | Descripción               | Auth |
|--------|-----------------------------|---------------------------|------|
| GET    | `/api/stats/overview`       | Resumen general           | Sí   |
| GET    | `/api/stats/urls/:id`       | Stats de una URL          | Sí   |
| GET    | `/api/stats/clicks-by-day`  | Clicks por día            | Sí   |
| GET    | `/api/stats/top-urls`       | Top 10 URLs más visitadas | Sí   |

## 🧪 Testing

```bash
# Unit tests
npm run test:unit

# Integration tests (requiere DB + Redis)
npm run test:integration

# Todos
npm test
```

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Rate limiting contra fuerza bruta y abuso
- Validación de inputs con Zod
- Helmet para headers de seguridad
- CORS configurado

## 👤 Autor

**Eduard Alejandro Vega Diaz**
- Email: alejandrovega.1593@gmail.com
- GitHub: [@alejandro1593](https://github.com/alejandro1593)

## 📄 Licencia

MIT
