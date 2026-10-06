# Tebonsma.no

[![CI](https://github.com/TEBONSMA/Tebonsma.no/actions/workflows/ci.yml/badge.svg)](https://github.com/TEBONSMA/Tebonsma.no/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

Source code for the website of TEBONSMA, live at [tebonsma.no](https://tebonsma.no).

The site is a single-page application built with React and TypeScript. It presents the
organisation, its members and events, offers member sign-in with a self-service account
page, and hosts a small collection of browser games with a shared leaderboard.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Local sign-in with mock auth](#local-sign-in-with-mock-auth)
- [Project structure](#project-structure)
- [Continuous integration](#continuous-integration)
- [Deployment](#deployment)
- [License](#license)

## Features

| Area | Description |
| --- | --- |
| Public pages | Home, About, Contact, and an events calendar |
| Member accounts | OpenID Connect sign-in and a `/konto` page for editing profile details and avatar |
| Mail | Webmail for members' own `@tebonsma.no` mailboxes (`/mail`): folders, conversations, labels, search, rich text, drafts, attachments, undo send, snooze, send later, auto-reply, and sharing a mail with a member or to the feed. Notifications about new mail show in the bell, and unread mail is counted in the menu |
| Games | Flappy Teb, Snake Teb and 2048 Teb, served as standalone canvas games |
| Leaderboard | Flappy Teb scores are submitted to and ranked by the API |
| Motion and UI | Animated components built on Motion and Tailwind CSS, responsive from mobile up |

### Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/about` | About |
| `/contact` | Contact |
| `/games` | Game overview |
| `/games/flappy-teb` | Flappy Teb (with leaderboard) |
| `/games/:slug` | Other games, such as `snake-teb` and `2048-teb` |
| `/konto` | Member account page (requires sign-in) |
| `/feed`, `/feed/:id` | News feed and a single post |
| `/kalender` | Event calendar |
| `/mail` | Webmail, the inbox (requires sign-in) |
| `/mail/:folder`, `/mail/:folder/:id` | A folder, and a mail or conversation in it. `:folder` is `inbox`, `sent`, `drafts`, `archive`, `junk`, `trash`, `snoozed`, `scheduled`, `favorites`, `unread`, `shared`, `all`, or one of the member's own folders |
| `/mail/autosvar` | Auto-reply and mail settings (signature, undo time, conversations, permission for sending later) |
| `/mail/tillatelse` | Where the login provider sends the member back after they give the permission for sending later |
| `/auth/callback` | OIDC redirect target |

## Tech stack

| Concern | Technology |
| --- | --- |
| UI | React 19 with the React Compiler |
| Language | TypeScript |
| Build and dev server | Vite |
| Styling | Tailwind CSS 4, `tw-animate-css`, Geist fonts via Fontsource |
| Routing | React Router |
| Animation | Motion |
| Authentication | `oidc-client-ts` (OpenID Connect, authorization code flow) |
| Quality | ESLint, `tsc` type checking, GitHub Actions |
| Hosting | Apache on Debian |

## Architecture

```
Browser (teb-app)
  ├── auth.tebonsma.no   OIDC login (Authelia)
  └── api.tebonsma.no    Profile, leaderboard, feed and mail API (tebonsma-api)
                           ├── LLDAP              member directory
                           └── mail.tebonsma.no   members' mailboxes (IMAP, SMTP, ManageSieve)
```

- **Frontend:** this repository. The app lives in [`teb-app/`](teb-app).
- **Backend:** `tebonsma-api`, a small Node.js API that edits
  the signed-in member's own LLDAP entry and stores the Flappy Teb scoreboard. It is
  developed in a separate repository.
- **Sign-in:** the site is an OIDC public client (`tebonsma-web`) using the authorization
  code flow. Tokens are sent to the API as `Authorization: Bearer <token>`.
- **Mail:** the browser never talks to the mail server. The API opens the member's mailbox with
  the member's own access token and passes mail to the site as JSON. Mail from others is cleaned
  by the API and shown in a sandboxed frame. See the `tebonsma-api` README for how it works and
  what the mail server needs.

## Getting started

### Prerequisites

- Node.js 22 or newer (the version used in CI)
- npm

### Installation

```bash
git clone https://github.com/TEBONSMA/Tebonsma.no.git
cd Tebonsma.no/teb-app
npm install
npm run dev
```

The dev server runs at <http://localhost:5173>.

By default the app uses the production services, `https://auth.tebonsma.no` for sign-in
and `https://api.tebonsma.no` for the API. To work on anything behind sign-in without a
real account, use [mock auth](#local-sign-in-with-mock-auth).

### Configuration

Both values are optional and are read at build time by Vite.

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_AUTH_AUTHORITY` | `https://auth.tebonsma.no` | OIDC provider the site signs in against |
| `VITE_API_URL` | `https://api.tebonsma.no` | Base URL of the API |

`npm run dev:mock` loads these from [`teb-app/.env.mock`](teb-app/.env.mock). To use other
values yourself, put them in `teb-app/.env.local`.

## Scripts

Run all commands from `teb-app/`.

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server against the real auth and API |
| `npm run dev:mock` | Start the dev server against the local mock auth and API |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Local sign-in with mock auth

`npm run dev` signs in against the real `auth.tebonsma.no` and talks to the real API. To
work on anything behind sign-in without a real account, use the mock setup instead. It
starts a local API and a mock login server, and nothing touches real accounts.

1. In the `tebonsma-api` repository, start the API and the mock login server:

   ```bash
   npm run dev:mock
   ```

2. In `Tebonsma.no/teb-app`, start the site pointed at them (settings in `.env.mock`):

   ```bash
   npm run dev:mock
   ```

Clicking "Logg inn" opens a page where you pick a test user. There are no passwords.

| User | Groups | Use for |
| --- | --- | --- |
| `dev` | `tebonsma` | An ordinary member |
| `admin` | `tebonsma`, `lldap_admin` | What administrators see |

The mock login server listens on `http://localhost:9091` and the API on
`http://localhost:8787`. Mail works against the mock too: both users start with a few mails, and
mail between them is delivered, so there is no mail server to set up. See the `tebonsma-api` README for details.

## Project structure

```
Tebonsma.no/
├── .github/
│   ├── workflows/ci.yml          # Lint and build on pull requests and pushes to main
│   └── dependabot.yml            # Dependency update configuration
└── teb-app/
    ├── public/                   # Static assets, copied as-is into the build
    │   ├── .htaccess             # SPA routing for Apache
    │   ├── audio/                # Background music and game sounds
    │   ├── games/                # Standalone canvas games (index.html, game.js, style.css)
    │   │   ├── flappy-teb/
    │   │   ├── snake-teb/
    │   │   └── 2048-teb/
    │   ├── gifs/
    │   └── images/
    ├── src/
    │   ├── account/              # Profile context and provider
    │   ├── auth/                 # OIDC user manager, auth context and provider
    │   ├── components/           # Shared UI (Header, Footer, Calendar, MembersGrid, ...)
    │   │   ├── feed/             # The feed, and the notification bell and its polling
    │   │   ├── mail/             # Webmail: sidebar, list, conversation view, composer and editor, menus
    │   │   ├── fancy/            # Animated layout blocks
    │   │   └── reactbits/        # Animated card components
    │   ├── lib/                  # API client, games, events, members, mail and utilities
    │   ├── pages/                # Route components
    │   ├── App.tsx               # Routes
    │   ├── globals.css           # Tailwind theme (brand colors, fonts) and global styles
    │   └── main.tsx              # Entry point
    ├── .env.mock                 # Settings used by `npm run dev:mock`
    ├── components.json           # shadcn/ui configuration
    ├── eslint.config.js
    ├── vite.config.ts
    └── tsconfig*.json
```

### Adding a game

Games are self-contained pages under `teb-app/public/games/<slug>/`. To add one, put its
files there and add an entry to [`src/lib/games.ts`](teb-app/src/lib/games.ts) with its
slug, title, description, thumbnail, source path and aspect ratio. It then appears on
`/games` and is served at `/games/<slug>`. The game is embedded in an iframe.

### Design tokens

Brand colors and fonts are defined as Tailwind theme variables in
[`src/globals.css`](teb-app/src/globals.css), for example `teb-green`, `teb-orange` and
`navy`, with Geist Sans and Geist Mono as the typefaces.

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull request and on
pushes to `main`. It installs dependencies with `npm ci`, checks that `react` and
`react-dom` versions match (React fails to start otherwise, and a build alone does not
catch it), then runs `npm run lint` and `npm run build`. The job is named
"Lint and build" and is the status check to require in the branch rule for `main`.

Dependabot opens pull requests for dependency updates.

## Deployment

The site is a static build served by Apache.

```bash
cd teb-app
npm ci
npm run build
```

Upload the contents of `teb-app/dist/` to the web root of the server.

### SPA routing

Routes such as `/games` and `/konto` are handled in the browser, so the server has to
fall back to `index.html` for unknown paths. `teb-app/public/.htaccess` does this and is
copied into `dist/` by the build. Make sure it ends up next to `index.html` and that
`mod_rewrite` is enabled and `AllowOverride` permits it.

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>
```

Static files are served from disk, so no Apache restart is needed after a deploy.

## License

© TEBONSMA. All rights reserved.
