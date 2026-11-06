# Vansh Sharma — Personal Portfolio

A cinematic, interactive personal portfolio showcasing my journey, engineering experience, selected projects, and approach to building digital products.

Built with modern web technologies, immersive 3D visuals, smooth animations, and a responsive design.

## Overview

This portfolio is designed as an interactive experience rather than a traditional developer portfolio. It combines storytelling, motion, typography, and 3D visuals to present my work and technical journey.

## Features

- **Interactive Hero Section** — Animated particle-based portrait and immersive introduction.
- **3D Visual Experience** — Interactive 3D elements powered by Three.js and React Three Fiber.
- **Smooth Animations** — Scroll-based transitions and motion effects using GSAP.
- **About & Engineering Journey** — Personal introduction, learning journey, and engineering perspective.
- **Project Showcase** — Selected projects with descriptions and technical details.
- **Experience Section** — Professional experience and development journey.
- **Contact Form** — Functional contact form powered by EmailJS.
- **Responsive Design** — Optimized layouts for desktop, tablet, and mobile devices.
- **SEO Support** — Metadata, sitemap, and robots configuration.

## Tech Stack

| Category | Technologies |
|---|---|
| Framework | Next.js, React |
| Language | TypeScript |
| Styling | CSS |
| 3D Graphics | Three.js, React Three Fiber |
| Animation | GSAP, ScrollTrigger |
| Email Integration | EmailJS |
| Development Tools | Git, GitHub, VS Code |

## Project Structure

```text
Vansh_Portfolio/
├── app/
│   ├── api/
│   │   └── contact/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
├── data/
├── public/
│   └── images/
├── styles/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the project

```bash
cd Vansh_Portfolio
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
```

Only configure `EMAILJS_PRIVATE_KEY` if required by your EmailJS account.

Never commit `.env.local` or expose private credentials.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

Create an optimized production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Contact

**Vansh Sharma**

- Email: vanshsharmag1288@gmail.com
- LinkedIn: [Connect on LinkedIn](YOUR_LINKEDIN_URL)
- GitHub: [View GitHub Profile](YOUR_GITHUB_PROFILE_URL)

---

Designed and developed with curiosity, creativity, and a passion for building meaningful digital experiences.

© Vansh Sharma. All rights reserved.