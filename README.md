# Paje Dhow Furniture

Next.js storefront with a thin `/api` gateway that proxies to the Spring Boot backend.

## Run locally

1. Start the backend on port **8080** (Spring Boot in `backend/`).
2. Copy `.env.example` to `.env.local` and set:

```env
BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Start the frontend:

```bash
pnpm install
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)

For the backend, copy `backend/.env.example` to `backend/.env`, provide a
MySQL password, a random Base64 JWT secret, and bootstrap administrator
credentials. Never commit either environment file.

## Auth roles

| Role | How created | After login |
|------|-------------|-------------|
| **ADMIN** | Seeded from secured environment variables | `/admin` |
| **BUYER** | Anyone who registers or uses Google/Facebook | `/account` |

The administrator email and password are supplied through the backend
`ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables. Never place live
credentials in source control or documentation. Rotate both values before the
first production deployment.

Public registration and social login always create a **BUYER**. Admins cannot use Google/Facebook.

### Social login setup

1. Create a Google OAuth **Web** client ID and set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
2. Create a Facebook app, add Facebook Login, and set `NEXT_PUBLIC_FACEBOOK_APP_ID`.
3. Restart `pnpm dev` after changing env values.

The frontend obtains a provider access token and sends it to `POST /api/auth/social`, which the Next.js gateway proxies to Spring Boot for verification.

## Production

- Run the backend with `SPRING_PROFILES_ACTIVE=prod`. This requires explicit
  database, application URL, and CORS environment values and validates the
  schema instead of changing it at runtime.
- Serve both applications over HTTPS and use a TLS-enabled `DB_URL`.
- Configure `SPRING_MAIL_*` values to activate password-reset and order emails.
- Replace local `public/uploads` storage with durable object storage before
  deploying multiple instances or an ephemeral/serverless frontend.
- Run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, and
  `mvn --file backend/pom.xml test` before release.
