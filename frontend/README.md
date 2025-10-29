# Frontend - XAI Financial Services

Next.js frontend for the Explainable AI in Financial Services research platform.

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Copy `.env.template` to `.env.local`:

```bash
cp .env.template .env.local
```

Set the backend API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, use your deployed backend URL:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## Running the App

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## Pages

- `/` - Home page with experiment link
- `/experiment` - Main experiment interface

## Deployment (Netlify)

### Option 1: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Option 2: Netlify Dashboard

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variable: `NEXT_PUBLIC_API_URL`
5. Deploy

## Project Structure

```
frontend/
├── app/
│   ├── experiment/       # Experiment page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── package.json          # Dependencies
├── next.config.js        # Next.js config
├── tailwind.config.ts    # Tailwind config
└── tsconfig.json         # TypeScript config
```

## Features

- Credit application form with validation
- Real-time API communication
- AI decision display with SHAP explanations
- Four rating sliders for participant feedback
- Responsive design with TailwindCSS

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Axios for API calls
