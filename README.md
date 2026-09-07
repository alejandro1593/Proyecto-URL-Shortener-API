# URL Shortener API + Frontend

Proyecto de portafolio: un **acortador de URLs** completo con API REST, base de datos, caching, autenticación, analytics y un frontend minimalista que la consume.

---

## ✨ Características

| Área | Funcionalidad |
|------|---------------|
| 🔐 **Autenticación** | Registro, login, logout y refresh token con JWT |
| ✂️ **URLs cortas** | Códigos únicos automáticos o personalizados, con expiración opcional |
| 📊 **Analytics** | Clicks por día, dispositivo y navegador, top de URLs |
| 🚀 **Caching** | URLs populares servidas desde Redis |
| 🛡️ **Seguridad** | Contraseñas con bcrypt, rate limiting, validación con Zod, helmet |
| 🖥️ **Frontend** | Interfaz minimalista (HTML/CSS/JS plano) para usar todo lo anterior |
| 📝 **Docs** | Swagger interactivo en `/api-docs` |
| 🐳 **DevOps** | Docker Compose + CI/CD con GitHub Actions |

## 🏗️ Estructura

```
├── backend/    → API REST (TypeScript + Express + PostgreSQL + Redis)
├── frontend/   → Interfaz de usuario (vanilla JS, sin dependencias)
├── .github/    → Pipeline CI/CD
└── INFORMACION_DEL_PROYECTO.txt  → Detalle técnico: tecnologías y por qué
```

## 🚀 Cómo empezar

### Requisitos
- Node.js 20+
- Docker + Docker Compose

### 1. Levantar el backend (dependencias + base de datos)

```bash
cd backend
docker compose up -d
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs`

### 2. Levantar el frontend

```bash
cd frontend
npm start
```

- Web: `http://localhost:3001`

> El CORS del backend ya permite peticiones desde `http://localhost:3001`.

## 🔌 Endpoints principales

**Autenticación**
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Crear cuenta | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/refresh-token` | Renovar token | No |
| POST | `/api/auth/logout` | Cerrar sesión | Sí |

**URLs**
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/urls` | Acortar URL | Sí |
| GET | `/api/urls` | Listar mis URLs | Sí |
| GET | `/api/urls/:id` | Detalle | Sí |
| PATCH | `/api/urls/:id` | Actualizar | Sí |
| DELETE | `/api/urls/:id` | Eliminar | Sí |
| GET | `/:shortCode` | Redirigir a la URL original | No |

**Estadísticas**
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/stats/overview` | Resumen general | Sí |
| GET | `/api/stats/urls/:id` | Stats de una URL | Sí |
| GET | `/api/stats/clicks-by-day` | Clicks por día | Sí |
| GET | `/api/stats/top-urls` | Top 10 URLs | Sí |

## 🧪 Testing

```bash
cd backend
npm test                 # todos los tests
npm run test:unit        # solo unitarios
npm run test:integration # requiere DB + Redis
```

## 🛠️ Stack

**Backend**: Node.js · TypeScript · Express 4 · PostgreSQL 16 · Redis 7 · JWT · bcrypt · Zod · Jest · Docker
**Frontend**: HTML · CSS · JavaScript puro (sin frameworks) · servidor estático Node
**DevOps**: Docker Compose · GitHub Actions

> Detalle completo de cada tecnología y el motivo de su elección en [`INFORMACION_DEL_PROYECTO.txt`](./INFORMACION_DEL_PROYECTO.txt).

## 👤 Autor

**Eduard Alejandro Vega Diaz**
- GitHub: [@alejandro1593](https://github.com/alejandro1593)

## 📄 Licencia

MIT