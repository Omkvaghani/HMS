# Hospes — Multi-Tenant Hotel Management OS

A complete SaaS hotel management platform built with **Laravel 11** + **React 19**, featuring physical multi-tenant database isolation, a hospitality-warm UI, and three integrated portals:

- **Super Admin** — onboard new tenants, manage SaaS packages, monitor health
- **Hotel Admin (PMS)** — bookings, rooms, room classes, customers, dashboard
- **Public Booking Engine** — guest-facing reservation site at `/book/:subdomain`

## Stack

| Layer | Choice |
|---|---|
| Backend | Laravel 11, Sanctum (JWT-style API tokens), [stancl/tenancy](https://tenancyforlaravel.com/) for DB-per-tenant, [spatie/laravel-permission](https://spatie.be/docs/laravel-permission) for RBAC |
| Frontend | Vite + React 19 + TypeScript + Tailwind 4 (custom hospitality-warm theme) + TanStack Query + React Router |
| Database | MySQL — central registry (`hms_central`) + dynamic tenant DBs (`hms_tenant_<id>`) |
| Auth | Sanctum personal-access tokens, role-based middleware (`SUPER_ADMIN`, `HOTEL_ADMIN`, `STAFF`, `GUEST`) |

## Architecture

```
hms_central (registry)
├── users (super admins, hotel admins, guests)
├── tenants (one per hotel, status, package, domains)
├── packages (SaaS plans)
├── onboarding_requests (pending → approved → tenant provisioned)
└── personal_access_tokens

hms_tenant_<uuid> (per hotel — created on approval)
├── hotels, room_classes, rooms
├── bookings, booking_addons, booking_payments
├── customers (with ID document captures)
├── booking_engine_config, public_addons
└── staff, expenses, housekeeping_tasks, activity_logs
```

When a super-admin approves an onboarding request, the platform:
1. Creates a `Tenant` row in central DB.
2. **Provisions a fresh MySQL database** for the tenant (`hms_tenant_<id>`).
3. Runs all tenant migrations against it.
4. Creates the hotel's first `HOTEL_ADMIN` user (in central) with a temporary password.
5. Returns the credentials for secure delivery.

## Local development

### Prerequisites

- PHP 8.3+, Composer 2.x
- Node 20+, npm 10+
- MySQL 8.x running locally

### Backend

```bash
cd backend
cp .env.example .env       # Adjust DB credentials & SANCTUM_STATEFUL_DOMAINS
composer install
php artisan key:generate
mysql -u root -e "CREATE DATABASE hms_central;"
php artisan migrate --seed
php artisan serve            # http://localhost:8000
```

The seeder creates a super-admin (`admin@hms.local` / `password`) and three sample SaaS packages.

### Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the Laravel backend.

### Tenant booking site

After approving a tenant in the super-admin portal, visit the public booking site:

```
http://localhost:5173/book/<desired-subdomain>
```

In production, configure DNS so `<subdomain>.<your-domain>` resolves to the front-end and the API will look up the tenant by the subdomain stored on its central `domains` row.

## Project layout

```
backend/                 Laravel 11 API
  app/
    Http/Controllers/
      Auth/              Login, register, me, logout
      SuperAdmin/        Onboarding, Packages, Tenants
      HotelAdmin/        Dashboard, Hotels, Rooms, RoomClasses, Customers, Bookings
      Public/            BookingEngine (branding, availability, quote, book)
    Http/Middleware/
      EnsureRole         RBAC by user.role
      InitializeTenancyByUser
      InitializeTenancyBySubdomainParam
    Models/              User, Tenant, Package, OnboardingRequest, ActivityLog
    Models/Tenant/       Hotel, RoomClass, Room, Customer, Booking, *Addon, *Payment
    Services/
      TenantProvisioningService
      BookingPricingService
  database/migrations/   Central + tenant migrations
  routes/api.php         All API routes

frontend/                Vite + React 19 + TS
  src/
    components/          AdminShell, MarketingHeader, RequireAuth, PageHeader
    pages/
      marketing/         Landing, Apply
      auth/              SignIn, SignUp
      super-admin/       Layout, Dashboard, OnboardingInbox, Packages, Tenants
      hotel-admin/       Layout, Dashboard, Bookings, Rooms, RoomClasses, Customers
      book/              BookingEnginePage (the public guest portal)
    lib/
      api.ts             Axios client w/ token + 401 redirect
      auth.tsx           AuthProvider
      auth-context.ts    AuthContext + types
      use-auth.ts        useAuth hook
      format.ts          Currency / date helpers
      cn.ts              clsx + tailwind-merge
    index.css            Hospitality-warm theme tokens & utilities
```

## Theme

A single warm palette ties marketing, dashboards, and booking sites together:

- **Cream** backgrounds (`#fbf7f1` … `#ecdcc4`)
- **Sand / Copper / Cocoa** accents (`#d8bd8e` … `#2c1c0e`)
- **Leaf / Rose** for status (success / errors)
- **Fraunces** display + **Inter** body (loaded from Google Fonts)

The booking engine reads `primary_color` and `accent_color` from each tenant's `booking_engine_config` to apply per-hotel theming on top of the warm base.

## Quality gates

```bash
# Backend
cd backend && ./vendor/bin/pint --test       # PHP formatter check
php artisan test                              # PHPUnit (when written)

# Frontend
cd frontend && npm run lint && npm run build  # ESLint + tsc + Vite production build
```

## Roadmap (future PRs)

This PR delivers Phase 1 + Phase 2 (auth, multi-tenancy, super admin tenant approval, hotel admin dashboard + rooms/room classes/bookings/customers, booking engine).

Planned for follow-up PRs:
- Housekeeping board, expense tracking, staff & payroll
- Booking calendar grid view (timeline) + drag-to-rebook
- Invoicing with GST configurations
- Email notifications (Resend / SendGrid)
- Payment gateway integration (Stripe / Razorpay)
- Activity log viewer
- Reports (occupancy, revenue, ADR / RevPAR)
