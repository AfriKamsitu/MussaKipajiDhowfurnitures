# Paje Dhow Furniture

Next.js storefront with a thin `/api` gateway that proxies to the Spring Boot backend.

## Run locally

1. Start the backend on port **8080** (Spring Boot in `backend/`).
2. Copy env if needed: `.env.local` should contain:

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

## Auth roles

| Role | How created | After login |
|------|-------------|-------------|
| **ADMIN** | Seeded (`Pajedhowfurniture@gmail.com`) | `/admin` |
| **BUYER** | Anyone who registers or uses Google/Facebook | `/account` |

Admin login:

- Email: `Pajedhowfurniture@gmail.com`
- Password: `Mussa@paje2026`

Public registration and social login always create a **BUYER**. Admins cannot use Google/Facebook.

### Social login setup

1. Create a Google OAuth **Web** client ID and set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
2. Create a Facebook app, add Facebook Login, and set `NEXT_PUBLIC_FACEBOOK_APP_ID`.
3. Restart `pnpm dev` after changing env values.

The frontend obtains a provider access token and sends it to `POST /api/auth/social`, which the Next.js gateway proxies to Spring Boot for verification.
