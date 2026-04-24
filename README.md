# Funding Aggregator

> Гранттар, стипендиялар мен конкурстарды іздеуге арналған платформа  
> Платформа для поиска грантов, стипендий и конкурсов

[![CI/CD](https://github.com/YOUR_USERNAME/funding-aggregator/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/funding-aggregator/actions)

---

## Мазмұны / Содержание

1. [Технологиялар](#технологиялар)
2. [Жылдам бастау](#жылдам-бастау)
3. [Docker](#docker)
4. [API документация](#api-документация)
5. [Тесттер](#тесттер)
6. [Мониторинг](#мониторинг)
7. [Деплой](#деплой)

---

## Технологиялар

| Қабат | Технология |
|-------|-----------|
| Frontend | Vanilla JS, HTML5, CSS3 |
| Backend | Node.js 22, Express 4 |
| ORM | Prisma 6 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT + bcrypt + HttpOnly Cookie |
| Validation | Zod |
| Testing | Jest + Supertest + k6 |
| CI/CD | GitHub Actions |
| Deploy | Render.com |
| Monitoring | Prometheus + Grafana |
| Container | Docker + docker-compose |

---

## Жылдам бастау

```bash
git clone https://github.com/YOUR_USERNAME/funding-aggregator
cd funding-aggregator/backend

# 1. Зависимости
npm install

# 2. Prisma client генерациялау
npx prisma generate

# 3. Миграция
npx prisma migrate deploy

# 4. Seed (27 демо жазба)
npm run seed

# 5. Іске қосу
npm start
# → http://localhost:3000
```

**Демо аккаунт:** `admin@demo.local` / `admin123`

---

## Docker

### Production

```bash
# Бір команда — бәрін іске қосады
docker-compose up -d

# Тексеру
curl http://localhost:3000/api/health
```

### Development (hot reload)

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Monitoring stack (Prometheus + Grafana)

```bash
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Grafana: http://localhost:3001  (admin / admin)
# Prometheus: http://localhost:9090
```

---

## API документация

Base URL: `http://localhost:3000/api`

### Opportunities

| Method | Endpoint | Сипаттама |
|--------|----------|-----------|
| GET | `/opportunities` | Тізім (фильтрлер + сұрыптау) |
| GET | `/opportunities/:id` | Бір жазба |

**Query parameters:**

| Параметр | Мысал | Сипаттама |
|----------|-------|-----------|
| `kind` | `grant` \| `scholarship` \| `competition` | Тип |
| `country` | `Kazakhstan` | Ел |
| `field` | `AI` | Сала |
| `type` | `Research Grant` | Тип финансирования |
| `degree` | `Master` | Білім деңгейі |
| `deadlineDays` | `30` | Мерзімге дейін күн |
| `sort` | `newest` \| `deadline` \| `amount` | Сұрыптау |
| `q` | `climate` | Мәтін бойынша іздеу |
| `page` | `1` | Бет нөмірі |
| `limit` | `20` | Беттегі жазбалар (макс 100) |

**Мысал:**
```
GET /api/opportunities?kind=scholarship&country=Kazakhstan&degree=Master&sort=deadline
```

### Auth

| Method | Endpoint | Body | Сипаттама |
|--------|----------|------|-----------|
| POST | `/auth/register` | `{name, email, password}` | Тіркелу |
| POST | `/auth/login` | `{email, password}` | Кіру |
| POST | `/auth/logout` | — | Шығу |
| GET | `/auth/me` | — | Ағымдағы пайдаланушы |

### Favorites (авторизация қажет)

| Method | Endpoint | Сипаттама |
|--------|----------|-----------|
| GET | `/favorites` | Таңдаулылар тізімі |
| POST | `/favorites/:id/toggle` | Қосу/алу |

### Notifications (авторизация қажет)

| Method | Endpoint | Сипаттама |
|--------|----------|-----------|
| GET | `/notifications/settings` | Параметрлер |
| PUT | `/notifications/settings` | Сақтау |
| POST | `/notifications/test` | Тест хат жіберу |

### Admin (ADMIN рөлі қажет)

| Method | Endpoint | Сипаттама |
|--------|----------|-----------|
| POST | `/admin/opportunities` | Жаңа жазба |
| PATCH | `/admin/opportunities/:id` | Өзгерту |
| DELETE | `/admin/opportunities/:id` | Жою |
| POST | `/scraper/run` | Парсер іске қосу |
| GET | `/scraper/logs` | Парсер журналы |
| GET | `/scraper/stats` | Статистика |

### Metrics

```
GET /metrics  →  Prometheus exposition format
```

---

## Тесттер

```bash
# Unit тесттер
npm test

# Integration тесттер
npm run test:integration

# Барлығы + coverage
npm run test:coverage

# Жүктемелік тест (k6 орнатылуы керек)
k6 run tests/load/load-test.js

# Интенсивті жүктемелік тест
k6 run --vus 100 --duration 60s tests/load/load-test.js
```

**Тест қамтамасыздандыру:**
- Unit тесттер: auth логикасы, scraper utilities, filter/sort логикасы
- Integration тесттер: барлық API endpoint-тар, auth flow, favorites
- Load тесттер: 100 қатарлас пайдаланушы, p95 < 500ms

---

## Мониторинг

`/metrics` — Prometheus-пен үйлесімді endpoint:

- `http_requests_total` — HTTP сұраулар саны
- `http_request_duration_ms` — Жауап уақыты гистограммасы
- `http_errors_total` — 5xx қателер
- `db_opportunities_total` — Базадағы мүмкіндіктер
- `db_users_total` — Тіркелген пайдаланушылар
- `scraper_last_run_timestamp` — Парсер соңғы іске қосылуы
- `process_uptime_seconds` — Сервер жұмыс уақыты

---

## Деплой

### Render.com (ұсынылады)

1. GitHub-қа push
2. [render.com](https://render.com) → **New Blueprint**
3. Репозиторийді таңдау — Render `render.yaml` файлын оқиды
4. **Apply** → автоматты деплой

### PostgreSQL-ға ауысу

`.env`:
```env
DATABASE_URL="postgresql://user:pass@host:5432/funding"
```

`prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"   # sqlite → postgresql
  url      = env("DATABASE_URL")
}
```

```bash
npx prisma migrate dev
```

---

## Жоба құрылымы

```
backendfinal/
├── index.html              # Frontend
├── app.js                  # Frontend JS (SPA)
├── styles.css              # Frontend CSS
├── docker-compose.yml      # Production
├── docker-compose.dev.yml  # Development
├── docker-compose.monitoring.yml  # Prometheus + Grafana
├── render.yaml             # Render.com деплой
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── prisma/
    │   ├── schema.prisma   # 5 таблица
    │   ├── migrations/
    │   └── seed.js         # 27 демо жазба
    ├── src/
    │   ├── server.js       # Express app
    │   ├── auth.js         # JWT utilities
    │   ├── db.js           # Prisma client
    │   ├── middleware.js   # requireAuth, requireRole
    │   ├── metrics.js      # Prometheus metrics
    │   ├── scraper.js      # Web scraper (5 sources)
    │   ├── notifier.js     # Email notifications
    │   ├── cron.js         # Scheduler
    │   ├── mailer.js       # Native SMTP client
    │   └── routes/
    │       ├── auth.js
    │       ├── opportunities.js
    │       ├── favorites.js
    │       ├── admin.js
    │       ├── scraper.js
    │       └── notifications.js
    └── tests/
        ├── unit/
        │   ├── auth.test.js
        │   ├── scraper.test.js
        │   └── filters.test.js
        ├── integration/
        │   └── api.test.js
        └── load/
            └── load-test.js
```

---

© 2026 Funding Aggregator
