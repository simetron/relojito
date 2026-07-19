# Relojito

> Productivity app for time tracking.

**Relojito** is a web app for tracking how you spend your time, built with Next.js and Supabase. Log your hours, keep your sessions organized, and stay on top of your productivity.

🔗 **Live demo:** [relojito-lovat.vercel.app](https://relojito-lovat.vercel.app)

---

## Tech stack

- **[Next.js 14](https://nextjs.org/)** (App Router) with **TypeScript**
- **[Supabase](https://supabase.com/)** — Postgres database + authentication (`@supabase/ssr`, `@supabase/supabase-js`)
- **[Tailwind CSS](https://tailwindcss.com/)** for styling
- **[Font Awesome](https://fontawesome.com/)** for icons
- **[Vitest](https://vitest.dev/)** for testing
- Deployed on **[Vercel](https://vercel.com/)**

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.17 or later
- A [Supabase](https://supabase.com/) project (free tier works fine)

### 1. Clone and install

```bash
git clone https://github.com/simetrondev/relojito.git
cd relojito
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find both values in your Supabase dashboard under **Project Settings → API**.

> **Note:** `.env.local` is git-ignored and should never be committed. The anon key is safe to expose in the browser; never put your `service_role` key in a `NEXT_PUBLIC_*` variable or commit it to the repo.

### 3. Set up the database

Apply the SQL migrations in [`supabase/migrations`](./supabase/migrations) to your Supabase project. If you use the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref your-project-ref
supabase db push
```

Alternatively, run the migration SQL manually in the Supabase SQL editor.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start the development server             |
| `npm run build` | Build the app for production             |
| `npm run start` | Run the production build                 |
| `npm run lint`  | Run ESLint                               |
| `npm run test`  | Run the test suite with Vitest           |

---

## Project structure

```
relojito/
├── src/                      # Application source
│   └── lib/supabase/         # Supabase client, server & middleware helpers
├── supabase/migrations/      # Database schema migrations (SQL)
├── HTML_from_stitch/         # HTML design mockups
├── middleware.ts             # Auth session refresh (Supabase SSR)
├── next.config.mjs           # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
└── package.json
```

Authentication sessions are refreshed on each request via `middleware.ts`, which delegates to the Supabase SSR helpers in `src/lib/supabase`.

---

## Deployment

The app is deployed on **Vercel**. To deploy your own instance:

1. Import the repository into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables in the project settings.
3. Deploy.

---

## Contributing

Contributions are welcome. Open an issue to discuss a change, or submit a pull request.

## License

_No license has been specified yet. Add a `LICENSE` file to define how others may use this project._
