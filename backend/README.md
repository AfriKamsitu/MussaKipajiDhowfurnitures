# Pajedhow Dhow Furnitures — Spring Boot Backend

Production-ready REST API for the Pajedhow marketplace frontend. Built with **Spring Boot 3.3**, **Spring Security (JWT)**, **Spring Data JPA / Hibernate**, and **MySQL 8**.

It mirrors the frontend domain exactly: products, categories, suppliers, orders, customers, staff, coupons, banners, reviews, activity logs, and dashboard analytics — with role-based access control for the admin surface and a secure customer account area.

---

## Tech stack

| Concern         | Choice                                   |
|-----------------|------------------------------------------|
| Language        | Java 17                                  |
| Framework       | Spring Boot 3.3.5                         |
| Security        | Spring Security + JWT (jjwt 0.12)         |
| Persistence     | Spring Data JPA / Hibernate              |
| Database        | MySQL 8                                  |
| Build           | Maven                                    |
| Boilerplate     | Lombok                                   |

---

## Roles & access model

Five system roles (mirroring the frontend):

| Role          | Scope                                                                 |
|---------------|-----------------------------------------------------------------------|
| `ADMIN`       | Full admin access, including staff management and order deletion      |
| `BUYER`       | Own profile, addresses, orders, and review submissions                |

Access is enforced two ways:
- **URL rules** in `SecurityConfig` (`/api/admin/**` requires a staff role, `/api/account/**` requires login).
- **Method-level `@PreAuthorize`** on sensitive admin operations for fine-grained control.

> On registration, emails starting with `admin@` are provisioned as `ADMIN`; everyone else becomes a `BUYER`. Staff accounts are otherwise created by an admin via `/api/admin/staff`.

---

## Getting started

### 1. Prerequisites
- JDK 17+
- Maven 3.9+
- MySQL 8 running locally (the app auto-creates the `pajedhow` database)

### 2. Configure
Copy `.env.example` and adjust, or set the variables in your shell / IDE run config. Sensible defaults are baked into `application.yml`, so with a default local MySQL (`root`/`root`) you can run without any config.

### 3. Run
```bash
cd backend
mvn spring-boot:run
```
The API starts on `http://localhost:8080`. On startup, `DataSeeder` ensures the ADMIN account exists and fills catalog data if empty:

| Role  | Email                           | Password         |
|-------|---------------------------------|------------------|
| Admin | `Pajedhowfurniture@gmail.com`   | `Mussa@paje2026` |

Buyers register themselves via `/api/auth/register` or social login. Disable seeding with `APP_SEED_ENABLED=false`.

### 4. Build a jar
```bash
mvn clean package
java -jar target/pajedhow-backend-1.0.0.jar
```

---

## Authentication flow

1. `POST /api/auth/register` or `POST /api/auth/login` → returns `{ accessToken, refreshToken, user }`.
2. Send `Authorization: Bearer <accessToken>` on protected requests.
3. When the access token expires, `POST /api/auth/refresh` with the refresh token.

---

## API reference

### Public (no auth)
| Method | Path                              | Description                     |
|--------|-----------------------------------|---------------------------------|
| POST   | `/api/auth/register`              | Create a customer account       |
| POST   | `/api/auth/login`                 | Login                           |
| POST   | `/api/auth/social`                | Buyer-only social login via Google/Facebook |
| POST   | `/api/auth/refresh`               | Exchange refresh token          |
| GET    | `/api/health`                     | Health check                    |
| GET    | `/api/config/whatsapp`            | WhatsApp contact number         |
| GET    | `/api/products`                   | List published products (paged, `q`, `category`) |
| GET    | `/api/products/slug/{slug}`       | Product by slug                 |
| GET    | `/api/products/{id}`              | Product by id                   |
| GET    | `/api/products/{id}/reviews`      | Published reviews for a product |
| GET    | `/api/categories`                 | List categories                 |
| GET    | `/api/categories/{slug}`          | Category by slug                |
| GET    | `/api/suppliers`                  | List suppliers                  |
| GET    | `/api/banners/active`             | Active banners                  |
| GET    | `/api/reviews/product/{id}`       | Published reviews for a product |

### Customer (auth: any logged-in user)
| Method | Path                          | Description                 |
|--------|-------------------------------|-----------------------------|
| GET    | `/api/auth/me`                | Current user                |
| GET/PUT| `/api/account/profile`        | View / update profile       |
| GET/POST | `/api/account/addresses`    | List / add address          |
| PUT/DELETE | `/api/account/addresses/{id}` | Update / delete address  |
| GET    | `/api/account/orders`         | My orders                   |
| POST   | `/api/account/orders`         | Place an order (checkout)   |
| POST   | `/api/account/reviews`        | Submit a review (pending)   |

### Admin (auth: staff roles)
| Method | Path                                   | Roles                              |
|--------|----------------------------------------|------------------------------------|
| GET    | `/api/admin/dashboard`                 | any staff                          |
| GET    | `/api/admin/activity`                  | any staff                          |
| CRUD   | `/api/admin/products`                  | ADMIN only |
| CRUD   | `/api/admin/categories`                | same as products                   |
| CRUD   | `/api/admin/suppliers`                 | same as products                   |
| GET/POST | `/api/admin/orders`                  | ADMIN only |
| PATCH  | `/api/admin/orders/{id}/status`        | ADMIN only        |
| DELETE | `/api/admin/orders/{id}`               | ADMIN only                        |
| GET    | `/api/admin/customers`                 | ADMIN only                          |
| PATCH  | `/api/admin/customers/{id}/status`     | ADMIN only                |
| CRUD   | `/api/admin/staff`                     | ADMIN only                        |
| CRUD   | `/api/admin/coupons`                   | ADMIN only                |
| CRUD   | `/api/admin/banners`                   | ADMIN only         |
| GET    | `/api/admin/reviews`, `/reviews/pending` | any staff                        |
| PATCH  | `/api/admin/reviews/{id}/status`       | ADMIN only |
| DELETE | `/api/admin/reviews/{id}`              | ADMIN only                |

---

## Project structure
```
backend/src/main/java/com/pajedhow/backend/
├── config/        AppProperties, SecurityConfig, DataSeeder
├── controller/    Public + customer controllers
│   └── admin/     Admin controllers
├── dto/           Request/response records
├── entity/        JPA entities (+ enums, Role)
├── exception/     Custom exceptions + GlobalExceptionHandler
├── mapper/        Entity → DTO mappers
├── repository/    Spring Data repositories
├── security/      JWT service, filter, user details, principal
├── service/       Business logic
└── util/          SecurityUtils, Slugs
```

---

## Connecting the frontend

Point the Next.js app at this API (e.g. `NEXT_PUBLIC_API_URL=http://localhost:8080`) and send the JWT as a `Bearer` token. CORS already allows `http://localhost:3000` and `:5173` — add your deployed origin via `APP_CORS_ORIGINS`.

## Security notes
- Passwords hashed with BCrypt.
- Stateless JWT auth (no server sessions).
- All write operations validated with Bean Validation (`jakarta.validation`).
- Centralised error responses via `GlobalExceptionHandler` (consistent JSON shape + proper HTTP status codes).
- Set a strong `APP_JWT_SECRET` and `APP_SEED_ENABLED=false` in production.
