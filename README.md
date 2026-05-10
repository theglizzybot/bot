
# Minecraft-Discord-Bot

A Discord integration bot for Minecraft servers with a companion web frontend. This repository includes the bot server, API routes, and a React-based admin UI.

Contents
- [server](server/): Node + TypeScript server and Discord bot logic
- [client](client/): Frontend (Vite + React)
- [server/discord-bot.ts](server/discord-bot.ts): Bot entrypoint

Features
- Discord bot for Minecraft server integration
- Web UI for management and monitoring

Requirements
- Node.js 18 or newer
- npm or pnpm

Quick Start
1. Clone the repository:

```
git clone <repo-url>
cd Minecraft-Discord-Bot
```

2. Install dependencies:

```
npm install
# or with pnpm
pnpm install
```

Configuration
Create a `.env` file in the project root or set environment variables. Common environment variables used by the project (check the server files for exact usage):

- DISCORD_TOKEN — Discord bot token
- CLIENT_ID — Bot application client ID (optional)
- GUILD_ID — Test guild/server ID (optional)
- DATABASE_URL or MONGODB_URI — Database connection string (if applicable)

Development

Run the server in development mode:

```
npm run dev
```

Run the frontend dev server (inside the `client` folder):

```
cd client
npm run dev
```

Build & Production

Build the frontend and bundle the server:

```
npm run build
```

Start the built server:

```
npm run start
```

Helper scripts
- `npm run start-gui` — starts the GUI/launcher (`launcher.js`)
- `npm run start-windows` — runs `launcher.bat` on Windows

Project structure (short)
- `server/` — Backend, Discord bot logic, API routes
- `client/` — Vite + React UI
- `uploads/`, `shared/`, `boomie/` — auxiliary modules and assets

Contributing
- Open issues or submit pull requests. Please include a clear description of the change and rationale.

License
This project is released under the license specified in `package.json` (MIT).

Contact
- If you want me to expand the README (detailed env list, examples, screenshots, Docker/PM2 instructions), tell me which parts to add and I will update it.

