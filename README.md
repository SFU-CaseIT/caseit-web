
# CaseIT Website

The official website for CaseIT, a Simon Fraser University Beedie School of Business club focused on case competitions. The site gives students, alumni, sponsors, and visitors an overview of CaseIT's team, achievements, partnerships, events, competition results, and ways to get involved.

## Tech Stack

- Next.js with the App Router
- React and TypeScript
- Tailwind CSS
- `react-data-grid` for editable spreadsheet views
- `xlsx` for workbook and CSV import/export
- Supabase for authentication and admin functionality
- Microsoft Clarity for analytics
- Vercel-compatible deployment

## Project Structure

```text
app/
	(public)/          Public website pages and layouts
		2025/            2025 event content
		2026/            2026 event content
		about/           About CaseIT and get-involved pages
		contact/         Contact page
		history/         History, media, and recap pages
		sponsor/         Sponsor information and opportunities
	admin/             Admin login and protected admin pages
		(protected)/     Authenticated admin dashboard and workbook editor
components/          Reusable UI components and navigation
	admin/             Workbook editor and admin controls
content/              Text and page data used throughout the site
lib/admin/           Workbook data service and sync integration hooks
lib/supabase/         Supabase browser, server, and middleware helpers
public/               Images, fonts, logos, and other static assets
styles/               Global CSS and Tailwind styles
```

The public site is grouped under `app/(public)`. Parentheses indicate a Next.js route group and are not included in the URL. The protected admin area is available at `/admin` and requires Supabase authentication and authorization.

## Requirements

- Node.js 20.9 or newer
- npm
- Supabase credentials for features that use the admin area or Supabase-backed data

## Local Setup

From the repository root:

```bash
npm install
```

Create a local environment file from the provided template:

```bash
cp .env.example .env.local
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```

Set the following values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_CLARITY_PROJECT_ID=your-clarity-project-id
```

For admin push notifications, also set:

```env
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key
WEB_PUSH_VAPID_PRIVATE_KEY=your-vapid-private-key
WEB_PUSH_VAPID_SUBJECT=mailto:your-email@example.com
```

Web Push key pairs can be generated with `npx web-push generate-vapid-keys`. Keep the service-role key and VAPID private key server-only; only the VAPID public key is exposed to the browser. Apply `supabase/migrations/20261028000000_admin_push_subscriptions.sql` to the Supabase project before enabling notifications. Push permission is requested only after an admin clicks **Enable notifications**, and push requires HTTPS outside local development. Enabled subscriptions remain active when the PWA is closed or the admin signs out, until notifications are turned off in the admin page or browser settings.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The site reloads automatically as files are changed.

If PowerShell blocks `npm.ps1`, run the npm executable directly:

```powershell
npm.cmd run dev
```

## Available Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint and apply automatic fixes |
| `npm audit` | Audit all dependencies, including development tools |
| `npm audit --omit=dev` | Audit production dependencies only |

To test the production build locally:

```bash
npm run build
npm run start
```

## Content and Assets

- Add or update page copy in the appropriate file under `content/`.
- Add reusable UI in `components/` rather than duplicating page markup.
- Add images, fonts, and logos under `public/` and reference them with paths beginning with `/`.
- Add new pages in the matching directory under `app/(public)/`.

## Deployment

The project can be deployed to Vercel as a standard Next.js application:

1. Import the repository into Vercel.
2. Set the variables from `.env.example` in the project environment settings.
3. Use the default build command, `npm run build`.
4. Deploy.

Do not commit `.env.local` or any Supabase credentials to the repository.
