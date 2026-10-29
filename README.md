# CaseIT Website

The website for CaseIT, a case competition club at SFU Beedie. Built with Next.js, React, TypeScript, and Supabase.

## Local setup

Requires Node.js 20.9 or newer and npm.

```bash
npm install
```

Copy `.env.example` to `.env.local` and provide the Supabase credentials. Configure the Clarity and web push variables if those features are needed. Never commit credentials.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The `/admin` area requires an authorized Supabase account.

## Commands

- `npm run dev` - start the development server
- `npm run build` - build for production
- `npm run start` - serve the production build
- `npm run lint` - run ESLint with automatic fixes

## Deployment

Deploy as a Next.js application, setting the required environment variables in the hosting provider.
