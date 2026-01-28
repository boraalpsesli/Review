# Project Architecture

This document describes the folder structure and architectural patterns used in the Restaurant Review SaaS application.

## Overview

```
restaurant_saas/
├── backend/           # Python FastAPI backend
├── frontend/          # Next.js 14 frontend
├── docs/              # Documentation
├── scripts/           # Build/deployment scripts
└── docker-compose.yml # Container orchestration
```

---

## Backend Structure (FastAPI + Python)

```
backend/
├── app/
│   ├── api/
│   │   └── v1/            # API version 1 endpoints
│   │       ├── auth.py    # Authentication endpoints
│   │       ├── endpoints.py
│   │       └── places.py
│   ├── core/              # Core configuration
│   │   ├── config.py      # Settings and environment
│   │   ├── database.py    # Database connections
│   │   ├── dependencies.py # DI functions
│   │   └── security.py    # Auth utilities
│   ├── exceptions/        # Custom exception classes
│   │   ├── base.py        # Base exceptions
│   │   ├── auth.py        # Auth exceptions
│   │   └── analysis.py    # Analysis exceptions
│   ├── models/            # SQLAlchemy ORM models
│   ├── repositories/      # Data access layer
│   │   ├── user_repository.py
│   │   └── restaurant_repository.py
│   ├── schemas/           # Pydantic schemas (DTOs)
│   ├── services/          # Business logic
│   │   ├── ai_analyzer.py
│   │   ├── place_search.py
│   │   └── scraper.py
│   ├── worker/            # Celery background tasks
│   └── main.py            # FastAPI app entry
├── tests/                 # Test files
└── Dockerfile
```

### Backend Patterns

- **Layered Architecture**: API → Services → Repositories → Models
- **Dependency Injection**: Use `core/dependencies.py` for injecting repositories
- **API Versioning**: All endpoints under `/api/v1/`
- **Repository Pattern**: Data access abstracted through repository classes

---

## Frontend Structure (Next.js 14 + TypeScript)

```
frontend/
├── app/                   # Next.js App Router
│   ├── (auth)/            # Auth route group (no URL prefix)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/       # Dashboard route group
│   │   ├── analysis/
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── api/               # API routes (Next.js)
│   ├── globals.css
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/                # Generic UI components
│   ├── layout/            # Layout components
│   ├── Navbar.tsx
│   └── index.ts           # Barrel exports
├── context/               # React context providers
│   └── AuthContext.tsx
├── hooks/                 # Custom React hooks
│   └── useAuth.ts
├── lib/                   # Utilities and helpers
│   ├── api.ts             # API client
│   └── utils.ts           # Utility functions
├── types/                 # TypeScript definitions
│   ├── auth.ts
│   ├── analysis.ts
│   └── api.ts
├── public/                # Static assets
└── auth.ts                # NextAuth configuration
```

### Frontend Patterns

- **App Router**: Modern Next.js 14 routing with layouts
- **Route Groups**: `(auth)`, `(dashboard)` for logical organization without URL impact
- **Server Components**: Default to server components, `use client` only when needed
- **Type Safety**: Centralized TypeScript types in `types/`
- **Barrel Exports**: Index files for cleaner imports

---

## Key Principles

1. **Separation of Concerns** - Each folder has a single responsibility
2. **Dependency Injection** - Easily testable and mockable
3. **API Versioning** - Future-proof API changes
4. **Type Safety** - TypeScript on frontend, Pydantic on backend
5. **Clean Imports** - Barrel exports for cleaner import statements
