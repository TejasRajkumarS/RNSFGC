# RNS Event Manager

Event management web app for **RNS First Grade College (RNSFC)** — a public college website (events, calendar, registration) plus an internal staff dashboard for managing events end-to-end: registrations, attendance, documents, expenses, certificates, and reports.

Built with **Next.js (App Router) + Firebase** (Auth, Firestore, Storage) and styled with **Tailwind CSS**.

---

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # then fill in your Firebase credentials
npm run setup:admin                # seed the first admin user in Firestore
npm run dev                        # start dev server at http://localhost:3000
```

> Requires **Node.js >= 22.6.0**.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client config (Console → Project settings) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase client config |
| `FIREBASE_PROJECT_ID` | Admin SDK (server-side) |
| `FIREBASE_CLIENT_EMAIL` | Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | Admin SDK service account private key |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket for documents/certificates |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint over the whole repo |
| `npm run typecheck` | TypeScript, no emit |
| `npm run test` | Unit tests (`node --test`, in `tests/`) |
| `npm run setup:admin` | Seed the first admin user (`scripts/seed-admin.mjs`) |
| `npm run screenshots` | Capture page screenshots with Playwright |

---

## Project Structure

```
RNS_Event/
├── app/                        # Next.js App Router — pages & API routes
│   ├── page.tsx                #   Public landing page
│   ├── login/                  #   Login page
│   ├── forgot-password/        #   Password reset
│   ├── events/                 #   Public events list (+ upcoming/ and completed/)
│   ├── event-calendar/         #   Semester event calendar
│   ├── registration/           #   Public event registration
│   ├── dashboard/              #   Staff dashboard (protected)
│   ├── student/                #   Student portal (protected)
│   ├── unauthorized/           #   Shown when a user lacks permission
│   └── api/                    #   REST API routes (see below)
│
├── components/                 # React components, grouped by role
│   ├── layout/                 #   Shared page furniture: Navbar, Footer, Hero,
│   │                           #   Section, PageShell, MenuOverlay, etc.
│   ├── events/                 #   Event features: EventCarousel, EventNavigation,
│   │                           #   DeleteEventButton
│   └── dashboard/              #   Dashboard UI: DashboardShell, icons
│
├── lib/                        # Business logic (no UI)
│   ├── firebase/               #   Firebase SDK setup: admin.ts (server),
│   │                           #   client.ts (browser), config.ts
│   ├── auth/                   #   Auth core: session, guards, permissions,
│   │                           #   transition-policy, errors, types
│   ├── services/               #   One module per domain: events, registrations,
│   │                           #   attendance, users, departments, documents,
│   │                           #   expenses, certificates, reports, audit
│   ├── workflows/              #   Multi-step domain flows (event lifecycle)
│   ├── api.ts                  #   Typed API client helpers
│   ├── validation.ts           #   Zod schemas
│   ├── rate-limit.ts           #   Request rate limiting
│   ├── pagination.ts           #   Pagination helpers
│   ├── serialize.ts            #   Firestore doc ↔ app types
│   ├── audit.ts                #   Audit logging helpers
│   └── navigation.ts           #   Route/nav constants
│
├── data/                       # Static/seed data (events.ts)
├── tests/                      # Unit tests mirroring lib/ modules
├── scripts/                    # One-off utilities (seed admin, screenshots)
├── public/                     # Static assets served at /
│
├── proxy.ts                    # Next.js middleware (Next 16 renamed
│                               # middleware.ts → proxy.ts): protects /dashboard
├── firestore.rules             # Firestore security rules
├── storage.rules               # Storage security rules
└── .env.local.example          # Template for environment variables
```

## API Routes (`app/api/`)

All routes are thin controllers: they validate input, check permissions via `lib/auth`, and delegate to `lib/services`.

| Route | Purpose |
|---|---|
| `POST /api/auth/signup` | Create account |
| `GET/POST /api/auth/session` | Read/create session cookie (`rns_session`) |
| `GET /api/auth/me` | Current user + permissions |
| `GET/POST /api/events` | List / create events |
| `GET/PATCH/DELETE /api/events/[id]` | Event detail |
| `POST /api/events/[id]/transition` | Move event through its lifecycle |
| `.../registrations` | Manage event registrations |
| `.../attendance` | Record attendance |
| `.../documents` | Upload/list event documents |
| `.../expenses` | Record event expenses |
| `.../certificates` | Issue certificates |
| `GET /api/events/[id]/report` (+ `/export`) | Event report / export |
| `GET/POST /api/departments` | Departments |
| `GET/POST /api/users` (+ `[uid]`) | User management (admin) |
| `GET /api/registrations/me` | My registrations |
| `GET /api/certificates/me` | My certificates |
| `POST /api/registration-requests` | Public registration request (no auth, rate-limited; stored in `registration_requests`) |
| `GET /api/audit-logs` | Audit trail (admin) |

## Where to Change What

| I want to... | Look in |
|---|---|
| Add/edit a page or screen | `app/<route>/page.tsx` |
| Add an API endpoint | `app/api/<route>/route.ts` |
| Change business rules for a domain | `lib/services/<domain>.ts` |
| Change roles/permissions | `lib/auth/permissions.ts` |
| Change the event lifecycle (draft → published → ...) | `lib/auth/transition-policy.ts` + `lib/workflows/events.ts` |
| Add validation rules | `lib/validation.ts` |
| Edit shared layout (nav, footer, hero) | `components/layout/` |
| Edit event UI components | `components/events/` |
| Edit dashboard UI | `components/dashboard/` |
| Change security rules | `firestore.rules` / `storage.rules` |

## Auth Model

- Sessions are stored in an `rns_session` cookie; `proxy.ts` (middleware) blocks `/dashboard` without it.
- Roles and permissions live in `lib/auth/permissions.ts`; route guards in `lib/auth/guards.ts`.
- Expired cookies don't redirect on public pages — `/login` validates via `GET /api/auth/me` to avoid redirect loops (see note in `proxy.ts`).
