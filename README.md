<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:FF8C42,10:FFA500,20:FFD700,30:FF8C42,40:8B4513,50:FFD700,60:FFA500,70:FF8C42,80:FFD700,90:FFA500,100:8B4513&height=200&section=header&text=🍊%20TEBONSMA%20🍊&fontSize=60&fontColor=ffffff&animation=twinkling&fontAlignY=50&rotate=0" />
  <source media="(prefers-color-scheme: light)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:FF8C42,10:FFA500,20:FFD700,30:FF8C42,40:8B4513,50:FFD700,60:FFA500,70:FF8C42,80:FFD700,90:FFA500,100:8B4513&height=200&section=header&text=🍊%20TEBONSMA%20🍊&fontSize=60&fontColor=ffffff&animation=twinkling&fontAlignY=50&rotate=0" />
  <img alt="Header" src="https://capsule-render.vercel.app/api?type=waving&color=0:FF8C42,10:FFA500,20:FFD700,30:FF8C42,40:8B4513,50:FFD700,60:FFA500,70:FF8C42,80:FFD700,90:FFA500,100:8B4513&height=200&section=header&text=🍊%20TEBONSMA%20🍊&fontSize=60&fontColor=ffffff&animation=twinkling&fontAlignY=50&rotate=0" width="100%" />
</picture>

<div align="center">

[![Live Site](https://img.shields.io/badge/🌐_Live-tebonsma.no-FF8C42?style=for-the-badge)](https://tebonsma.no)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

## 📋 Overview

TEBONSMA's official website - a modern, interactive web experience featuring a custom Flappy Bird game, animated UI components, and a dynamic member showcase. Built with React, TypeScript, and cutting-edge web technologies for maximum performance and visual appeal.

<div align="center">

| Feature                        | Description                                      |
| ------------------------------ | ------------------------------------------------ |
| 🎮 **Flappy-Teb Game**         | Custom Flappy Bird with Jarritos bottles        |
| ✨ **ChromaGrid Showcase**     | Interactive member cards with spotlight effects |
| 🌊 **WebGL Backgrounds**       | DarkVeil & Aurora shader effects                 |
| 🎨 **GSAP Animations**         | Smooth, performance-optimized transitions        |
| 🎯 **PillNav Navigation**      | Animated pill-style navigation bar               |
| 📱 **Fully Responsive**        | Mobile-first design with adaptive layouts        |
| 🎭 **Framer Motion**           | Spring-based modal animations                    |
| 🎵 **Audio Integration**       | Background music & sound effects in game         |

</div>

---

## 🏗️ Tech Stack

### Frontend

| Technology                                                                                                                 | Purpose                  |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)                           | UI Framework             |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)            | Type Safety              |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)                              | Build Tool & Dev Server  |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)          | Utility-first CSS        |
| ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white)       | Client-side Routing      |
| ![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=flat-square&logo=greensock&logoColor=white)                         | Advanced Animations      |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)          | React Animation Library  |

### Hosting & Deployment

| Technology                                                                                          | Purpose       |
| --------------------------------------------------------------------------------------------------- | ------------- |
| ![Apache](https://img.shields.io/badge/Apache-D22128?style=flat-square&logo=apache&logoColor=white) | Web Server    |
| ![Debian](https://img.shields.io/badge/Debian-A81D33?style=flat-square&logo=debian&logoColor=white) | Server OS     |

---

## 📁 Project Structure

```
teb-app/
├── public/                      # Static assets
│   ├── audio/
│   │   ├── bgmusic/            # Background music tracks (6 songs)
│   │   └── gamesounds/         # Game sound effects
│   ├── games/
│   │   └── flappy-teb/         # Standalone Flappy Bird game
│   │       ├── game.js         # Canvas-based game logic
│   │       ├── index.html      # Game HTML
│   │       └── style.css       # Game styling
│   ├── gifs/
│   └── images/
│       ├── background/         # Game backgrounds (30+)
│       └── flappy/             # Bird sprites & assets
│
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Site navigation
│   │   ├── Footer.tsx          # Site footer
│   │   ├── fancy/
│   │   │   ├── blocks/
│   │   │   │   └── media-between-text.tsx
│   │   │   └── text/
│   │   │       ├── letter-3d-swap.tsx
│   │   │       ├── text-rotate.tsx
│   │   │       └── variable-font-hover-by-random-letter.tsx
│   │   └── reactbits/
│   │       ├── Aurora.tsx      # WebGL aurora background
│   │       ├── ChromaGrid.tsx  # Animated member showcase
│   │       ├── DarkVeil.tsx    # WebGL dark shader background
│   │       └── PillNav.tsx     # Animated navigation pills
│   │
│   ├── pages/
│   │   ├── Home.tsx            # Landing page
│   │   ├── FlappyGame.tsx      # Game page
│   │   ├── Contact.tsx         # Contact information
│   │   └── Persons.tsx         # Team members showcase
│   │
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   │
│   ├── styles/
│   │   └── fancy.css           # Custom CSS with Tailwind theme
│   │
│   ├── App.tsx                 # Main app component
│   ├── App.css                 # App-level styles
│   ├── globals.css             # Global styles & overrides
│   └── main.tsx                # React entry point
│
├── components.json             # shadcn/ui configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite build configuration
```

---

## 🎮 Flappy-Teb Game

A fully-featured Flappy Bird clone with TEBONSMA branding:

### Game Features

| Feature                  | Description                                         |
| ------------------------ | --------------------------------------------------- |
| 🎲 **Random Assets**     | 3 bird sprites, 30+ backgrounds loaded randomly    |
| 🍾 **Jarritos Pipes**    | Stretched bottle images as obstacles               |
| 💥 **Collision Physics** | Bottle-shaped hitboxes (neck/body detection)       |
| 🎉 **Celebrations**      | Random GIFs at milestone scores (7, 21)            |
| 🎵 **Audio System**      | Looping background music + crash/milestone sounds  |
| 🏆 **Score Tracking**    | Real-time scoring with milestone events            |
| 🎨 **Grayscale Effects** | Canvas backdrop filters for visual polish          |

### Game Architecture

- **Canvas API** - Pure JavaScript rendering (534 lines)
- **Fixed Dimensions** - 400×600px game canvas
- **GSAP Integration** - quickSetter for performance
- **Asset Randomization** - Fresh experience every game
- **Audio Management** - Continuous music across sessions

---

## ✨ UI Components

### ChromaGrid

Interactive grid showcasing team members with:

- **Spotlight Effect** - GSAP-powered mouse-following spotlight
- **Grayscale Masks** - Radial gradients reveal color on hover
- **Modal System** - Framer Motion spring animations
- **Responsive Layout** - Mobile-centered, desktop side-by-side
- **Scroll Locking** - Body scroll prevention when modal open

### PillNav

Animated navigation with:

- **Circular Hover** - Pills expand with circular geometry
- **Label Animations** - Text slides vertically on hover
- **Logo Rotation** - 360° spin on hover
- **Mobile Menu** - Hamburger with GSAP transforms
- **Delayed Hide** - Smart timeout for smooth UX

### DarkVeil & Aurora

WebGL shader backgrounds:

- **Fragment Shaders** - GLSL-based visual effects
- **Gradient Overlays** - Navy fallback for compatibility
- **Performance** - GPU-accelerated rendering
- **Responsive** - Fixed positioning, full viewport coverage

---

## 🎨 Design System

### Color Palette

The site uses Jarritos-inspired orange/gold gradients:

- **Primary** - `#FF8C42` (Jarritos Orange)
- **Secondary** - `#FFA500` (Gold)
- **Accent** - `#FFD700` (Light Gold)
- **Dark** - `#8B4513` (Brown)

### Tailwind Configuration

Custom theme extending Tailwind with:

- `teb-green` - Brand color for nav pills
- CSS variables for dynamic theming
- Mobile-first breakpoints
- Custom utility classes in `fancy.css`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/teb.git
cd teb/teb-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Logging in locally

`npm run dev` logs in against the real `auth.tebonsma.no` and talks to the real API. To
work on anything behind login without a real account, use the mock login instead:

```bash
# In the tebonsma-api repo: starts the API and a mock login server
npm run dev:mock

# In teb-app: starts the site pointed at them (settings in .env.mock)
npm run dev:mock
```

"Logg inn" then opens a page where you pick a test user, `dev` (ordinary member) or
`admin` (in `lldap_admin`). No passwords, and nothing touches the real accounts.

---

## 📦 Dependencies

### Production

| Package              | Version  | Purpose                      |
| -------------------- | -------- | ---------------------------- |
| `react`              | ^19.2.1  | UI Framework                 |
| `react-dom`          | ^19.2.0  | React DOM renderer           |
| `react-router-dom`   | ^7.9.6   | Routing                      |
| `gsap`               | ^3.13.0  | Advanced animations          |
| `motion`             | ^12.23.24| React animation library      |
| `tailwindcss`        | ^4.1.17  | Utility-first CSS            |
| `@tailwindcss/vite`  | ^4.1.17  | Tailwind Vite plugin         |
| `clsx`               | ^2.1.1   | Conditional class joining    |
| `tailwind-merge`     | ^3.4.0   | Tailwind class merging       |
| `ogl`                | ^1.0.11  | WebGL library for shaders    |
| `lucide-react`       | ^0.553.0 | Icon library                 |

### Development

| Package                       | Purpose             |
| ----------------------------- | ------------------- |
| `vite`                        | Build tool          |
| `typescript`                  | Type checking       |
| `@vitejs/plugin-react`        | React plugin        |
| `eslint`                      | Linting             |
| `typescript-eslint`           | TypeScript linting  |
| `autoprefixer` & `postcss`    | CSS processing      |
| `babel-plugin-react-compiler` | React optimization  |

---

## 🌍 Deployment

### Apache Configuration

The site requires a `.htaccess` file for SPA routing:

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

Place this in `public/.htaccess` - it will be included in the build.

### Build & Deploy

```bash
# Build for production
npm run build

# Upload dist/ contents to server
# Ensure .htaccess is in the root with index.html

# Restart Apache (on server)
sudo systemctl restart apache2
```

---

## 🎯 Key Features Explained

### Game Integration

The Flappy-Teb game is served via iframe from `/games/flappy-teb/`:

```tsx
<iframe 
  src="/games/flappy-teb/index.html"
  className="w-full aspect-[2/3] max-w-[400px]"
/>
```

Background music persists across game restarts using a `musicStarted` flag.

### Member Cards Animation

ChromaGrid uses GSAP's `quickSetter` for 60fps spotlight tracking:

```typescript
setX.current = gsap.quickSetter(el, '--x', 'px');
setY.current = gsap.quickSetter(el, '--y', 'px');
```

Modal animations use Framer Motion's spring physics:

```typescript
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: "spring", damping: 25, stiffness: 300 }}
/>
```

---

## 📄 License

© 2025 TEBONSMA. All rights reserved.

---

<div align="center">

[![Visit TEBONSMA](https://img.shields.io/badge/Visit_Site-tebonsma.no-FF8C42?style=flat-square)](https://tebonsma.no)
[![Play Flappy-Teb](https://img.shields.io/badge/🎮_Play-Flappy_Teb-FFA500?style=flat-square)](https://tebonsma.no/flappy)

</div>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:8B4513,5:FFD700,10:FFA500,15:FF8C42,20:FFD700,25:8B4513,30:FFA500,35:FF8C42,40:FFD700,45:FFA500,50:8B4513,55:FFD700,60:FF8C42,65:FFA500,70:FFD700,75:8B4513,80:FF8C42,85:FFA500,90:FFD700,95:FF8C42,100:8B4513&height=120&section=footer&animation=blinking" />
  <source media="(prefers-color-scheme: light)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:8B4513,5:FFD700,10:FFA500,15:FF8C42,20:FFD700,25:8B4513,30:FFA500,35:FF8C42,40:FFD700,45:FFA500,50:8B4513,55:FFD700,60:FF8C42,65:FFA500,70:FFD700,75:8B4513,80:FF8C42,85:FFA500,90:FFD700,95:FF8C42,100:8B4513&height=120&section=footer&animation=blinking" />
  <img alt="Footer" src="https://capsule-render.vercel.app/api?type=waving&color=0:8B4513,5:FFD700,10:FFA500,15:FF8C42,20:FFD700,25:8B4513,30:FFA500,35:FF8C42,40:FFD700,45:FFA500,50:8B4513,55:FFD700,60:FF8C42,65:FFA500,70:FFD700,75:8B4513,80:FF8C42,85:FFA500,90:FFD700,95:FF8C42,100:8B4513&height=120&section=footer&animation=blinking" width="100%" />
</picture>
