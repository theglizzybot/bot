# Emergency Hamburg RP Bot Portal

## Overview

This is a web portal for managing an "Emergency Hamburg RP" Discord bot. It provides a dashboard-style admin interface where users can monitor bot status, view connected Discord servers and channels, send messages to Discord channels, and manage applications (Bewerbungen). The interface is primarily in German with i18n support for English. The project follows a full-stack TypeScript architecture with a React frontend and Express backend, with a Discord.js bot running alongside the server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React with TypeScript (no SSR/RSC)
- **Routing:** Wouter (lightweight client-side router)
- **State/Data Fetching:** TanStack React Query for server state management
- **UI Components:** shadcn/ui (new-york style) built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS custom properties for theming. The app uses a dark theme by default with emergency-themed colors (dark grays, reds, blues)
- **Forms:** React Hook Form with Zod resolvers
- **Internationalization:** i18next with react-i18next, supporting German (default) and English
- **Build Tool:** Vite with React plugin
- **Path Aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Pages
- `/` — Dashboard with bot status cards (online status, uptime, version, server count)
- `/servers` — Lists Discord servers and their channels the bot is connected to
- `/send-message` — Form to send messages to specific Discord channels via the bot
- `/applications` — View and filter applications submitted through Discord

### Backend
- **Runtime:** Node.js with Express
- **Language:** TypeScript, compiled with tsx (dev) and esbuild (production)
- **API Pattern:** RESTful JSON API under `/api/` prefix
- **Key Endpoints:**
  - `GET /api/bot/status` — Bot online status and stats
  - `GET /api/discord/servers` — List servers and channels
  - `POST /api/discord/send-message` — Send a message to a channel
  - `GET /api/applications` — List applications
- **Validation:** Zod schemas shared between client and server (in `shared/schema.ts`)

### Discord Bot
- **Library:** discord.js v14
- **Runs in-process** alongside the Express server (not a separate service)
- **Intents:** Guilds, GuildMessages
- **Features:** Slash commands (ping, help, info, apply, announcement, startup), application modals, rotating activity status
- **Token:** Read from `DISCORD_BOT_TOKEN` environment variable

### Data Layer
- **Schema Definition:** Drizzle ORM with PostgreSQL dialect (`shared/schema.ts`)
- **Database:** PostgreSQL via `@neondatabase/serverless` driver
- **Current Storage:** In-memory storage (`MemStorage` class in `server/storage.ts`) — the database schema is defined but the app currently uses an in-memory Map for applications
- **Schema Push:** `drizzle-kit push` via `npm run db:push`
- **Tables:**
  - `applications` — id (UUID), discord_name, discord_id, category, content, status, timestamp

### Shared Code
- `shared/schema.ts` contains Drizzle table definitions, Zod validation schemas, and TypeScript types used by both client and server
- Key shared types: `Application`, `InsertApplication`, `DiscordServer`, `BotStatus`
- `sendMessageSchema` validates message sending requests

### Development Setup
- Dev server uses Vite middleware integrated into Express for HMR
- Production build: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.js`
- Replit-specific plugins included conditionally (cartographer, dev-banner, runtime-error-modal)

## External Dependencies

### Discord API
- **discord.js v14** for bot functionality
- Requires `DISCORD_BOT_TOKEN` environment variable
- Bot registers slash commands and handles interactions

### Database
- **PostgreSQL** via Neon serverless driver (`@neondatabase/serverless`)
- Requires `DATABASE_URL` environment variable
- **Drizzle ORM** for schema definition and query building
- **drizzle-kit** for schema migrations/push
- **connect-pg-simple** included for session storage (available but not currently wired up)

### Key NPM Packages
- `@tanstack/react-query` — async state management
- `react-hook-form` + `@hookform/resolvers` — form handling
- `zod` + `drizzle-zod` — validation and schema generation
- `i18next` + `react-i18next` + `i18next-browser-languagedetector` — internationalization
- `wouter` — client-side routing
- `lucide-react` — icons
- Full shadcn/ui component library (Radix UI primitives)
- `recharts` — charting library (available via chart component)
- `embla-carousel-react` — carousel component
- `vaul` — drawer component
- `date-fns` — date formatting