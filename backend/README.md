# Pajedhow Dhow Furnitures — Spring Boot Backend

REST API for the Pajedhow marketplace frontend. Built with **Spring Boot 3.5**, **Spring Security (JWT)**, **Spring Data JPA / Hibernate**, and **MySQL 8**.

It implements products, categories, suppliers, orders, customers, staff,
coupons, banners, reviews, activity logs, settings, reporting, and dashboard
analytics with role-based access control.

---

## Tech stack

| Concern         | Choice                                   |
|-----------------|------------------------------------------|
| Language        | Java 17                                  |
| Framework       | Spring Boot 3.5.x                         |
| Security        | Spring Security + JWT (jjwt 0.12)         |
| Persistence     | Spring Data JPA / Hibernate              |
| Database        | MySQL 8                                  |
| Build           | Maven                                    |
| Boilerplate     | Lombok                                   |

---

## Roles & access model

Two system roles:

| Role          | Scope                                                                 |
|---------------|-----------------------------------------------------------------------|
| `ADMIN`       | Full admin access, including staff management and order deletion      |
| `BUYER`       | Own profile, addresses, orders, and review submissions                |

Access is enforced two ways:
- **URL rules** in `SecurityConfig` (`/api/admin/**` requires `ADMIN`,
  `/api/account/**` requires `BUYER`).
- **Method-level `@PreAuthorize`** on sensitive admin operations for fine-grained control.

> Public registration always creates a `BUYER`. Administrator accounts are
> created from secured environment configuration or by an existing
> administrator.

---

## Getting started

### 1. Prerequisites
- JDK 17+ (JDK 21 LTS recommended)
- Maven 3.9+
- MySQL 8 running locally

### 2. Configure
Copy `backend/.env.example` to `backend/.env` and supply the database password,
a random Base64 JWT secret, and bootstrap administrator credentials.

### 3. Run
```bash
cd backend
mvn spring-boot:run
```
The API starts on `http://localhost:8080`. On startup, `DataSeeder` ensures the
administrator configured by `ADMIN_EMAIL` and `ADMIN_PASSWORD` exists. Existing
administrator passwords are not overwritten unless
`ADMIN_SYNC_PASSWORD=true` is set deliberately. Buyers register themselves via
`/api/auth/register` or social login.

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
| POST   | `/api/auth/password-reset/request`| Request a one-time reset link    |
| POST   | `/api/auth/password-reset/confirm`| Reset password with the token    |
| GET    | `/api/health`                     | Health check                    |
| GET    | `/api/config/whatsapp`            | WhatsApp contact number         |
| GET    | `/api/config/store`               | Public store settings           |
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

Set the frontend server-only `BACKEND_URL` to this API. Configure allowed
browser origins with `APP_CORS_ALLOWED_ORIGINS`.

## Production profile

Run with `SPRING_PROFILES_ACTIVE=prod`. The production profile:

- requires explicit database, public URL, and CORS settings;
- uses graceful shutdown and forwarded proxy headers;
- validates the schema (`ddl-auto=validate`) rather than mutating it; and
- uses a bounded Hikari connection pool.

Deploy reviewed schema changes before starting a production version. Use a
TLS-enabled JDBC URL and configure `SPRING_MAIL_*` when password-reset and
order email delivery are required. For an existing database created by the
pre-audit application, review and apply
`backend/db/migrations/V20260728__audit_schema_upgrade.sql` once before
starting this version.

## Security notes
- Passwords hashed with BCrypt.
- Stateless, versioned JWT auth; security-sensitive password changes revoke
  previously issued access and refresh tokens.
- All write operations validated with Bean Validation (`jakarta.validation`).
- Centralised error responses via `GlobalExceptionHandler` (consistent JSON shape + proper HTTP status codes).
- Set a strong base64-encoded `JWT_SECRET`, `ADMIN_EMAIL`, and
  `ADMIN_PASSWORD` in the secured production environment.
- Rotate the bootstrap admin password after first sign-in and leave
  `ADMIN_SYNC_PASSWORD=false`.
