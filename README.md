# PortGen — Online Portfolio Template Generator

PortGen is a responsive website for creating, saving, previewing, and sharing an online portfolio. Users enter their information, choose one of three designs, and save the portfolio to Supabase. A portfolio can remain private or be published at a shareable URL.

## Project status

- **Published website:** Not deployed from this source snapshot. Deploy the project and replace this line with the working public URL before submission.
- **Database:** Supabase (Postgres, anonymous authentication, and Storage).
- **Hosting target:** Vercel static hosting.
- **Templates:** Simple, Modern, and Creative.

The local development URL is not a public submission URL.

## Features

- Create a portfolio with a required full name and optional profile picture, email, contact number, address, and biography.
- Add multiple education, project, work-experience, and social-link entries; edit or remove entries in the form.
- Enter skills as a comma-separated list.
- Switch between exactly three templates and see a live preview while editing.
- Save, retrieve, update, and delete portfolios stored in Supabase.
- Keep portfolios private by default. Opt in to publishing and share the public `/p/:id` link.
- Upload JPG, PNG, or WebP profile pictures up to 2 MB to Supabase Storage.
- View sample portfolios at `/examples/simple`, `/examples/modern`, and `/examples/creative`. Examples use built-in data and do not create database records.

## Templates

| Template | Design |
| --- | --- |
| **Simple** | Clean, centered presentation with a light neutral palette and restrained sections. |
| **Modern** | Dark green, structured layout with a strong hero and organized content cards. |
| **Creative** | Expressive forest-green design with lime accents, abstract shapes, and illustrated project panels. |

The template picker is part of the portfolio editor; it is not a separate route. Users can change the template before saving or while editing a saved portfolio.

## Technologies

- React 19
- React Router
- Vite
- Lucide React
- Supabase JavaScript client
- Supabase Postgres, Row Level Security (RLS), anonymous authentication, and Storage
- Vercel (intended deployment platform)

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Home page, template overview, and links to start creating a portfolio. |
| `/editor?template=simple` | Create a portfolio, preselecting the requested template. The `modern` and `creative` values are also supported. |
| `/editor/:id` | Edit a portfolio belonging to the current anonymous Supabase session. |
| `/manage` | List, edit, delete, and access the public links for portfolios in the current session. |
| `/examples/:template` | Display a built-in example for `simple`, `modern`, or `creative`. |
| `/p/:id` | Display a portfolio only when it has been published. |

Vercel rewrites application routes to the SPA entry point so direct navigation and refresh work for these routes.

## Data and privacy

The `public.portfolios` table stores:

- Portfolio ID, owner ID, creation time, and last-updated time.
- Name, email, contact number, address, biography, and profile image URL.
- Education, skills, projects, work experience, and social links as JSONB arrays.
- Template key (`simple`, `modern`, or `creative`) and the `is_published` flag.

`supabase-setup.sql` creates the table, a timestamp trigger, RLS policies, and the `profile-images` Storage bucket and upload/delete policies. Owners can read and manage their own portfolios. Public visitors can read published portfolios; unpublished portfolio records are not available through the public portfolio page.

PortGen currently uses **anonymous Supabase sessions instead of email/password accounts**. A user's private portfolio manager is tied to the anonymous session retained by that browser. Clearing browser storage or switching browsers/devices may make that private workspace unavailable. Published portfolios can be viewed by anyone with their public link.

The `profile-images` bucket is public so portfolio pages can display uploaded images. Upload and delete operations are restricted by Storage policy to the authenticated anonymous user's folder. Do not store sensitive information in a public portfolio or profile image.

## Supabase setup

1. Create a Supabase project.
2. In Supabase Authentication settings, enable anonymous sign-ins.
3. Open the Supabase SQL Editor and run [`supabase-setup.sql`](./supabase-setup.sql) for a new project. It creates the schema, owner/public access policies, trigger, and storage configuration.
4. For an existing database that already has the portfolio table and owner policies, review the schema first. If publishing has not been configured, run [`supabase-publish-migration.sql`](./supabase-publish-migration.sql). Do not run the fresh-project setup blindly over an existing production database.
5. Create `.env.local` in the project root with the project URL and publishable key:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

   Use the values for your Supabase project. The publishable key is intended for client-side use and must be protected by correct RLS policies. **Never put a Supabase secret/service-role key in a `VITE_` variable or commit it to source control.**

The app throws a configuration error at startup if either environment variable is missing.

## Run locally

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Vite prints the local URL when the development server starts. This URL is for development only.

Useful commands:

```sh
npm run build    # Create the production bundle in dist/
npm run preview  # Serve the production bundle locally
npm run lint     # Run Oxlint
```

## Deploy to Vercel

1. Import the repository into Vercel.
2. Use the Vite build command `npm run build` and output directory `dist`.
3. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Vercel project's environment variables for the environments you will deploy.
4. Deploy the site.
5. Test the deployed site end to end: create a portfolio, save it, refresh and verify it remains in the manager, edit it, publish it, open `/p/:id` in a signed-out/private browser, and delete it.
6. Replace the project status at the top of this README with the deployed public URL. Do not submit a localhost URL.

The repository includes [`vercel.json`](./vercel.json) with SPA rewrites for `/manage`, `/editor`, `/editor/:id`, `/examples/:template`, and `/p/:id`.

## Screenshots

Existing captures are in [`screenshots/`](./screenshots/):

- The home and Creative template screenshots were recaptured on 2026-10-16 to show the latest homepage mockup and forest-green/lime Creative design.
- [Home page](./screenshots/home.png)
- [Portfolio manager](./screenshots/manage.png)
- [Portfolio editor](./screenshots/editor.png)
- [Simple template](./screenshots/template-simple.png)
- [Modern template](./screenshots/template-modern.png)
- [Creative template](./screenshots/template-creative.png)

The example data on the template pages is built into the app; the manager/editor captures use temporary QA data.

## Project structure

```text
.
├── public/                         # Static public assets
├── screenshots/                    # UI captures
├── src/
│   ├── components/                 # Shared layout components
│   ├── lib/                        # Supabase client, auth, and example data
│   ├── pages/                      # Home, editor, manager, and public portfolio
│   ├── App.jsx                     # Routes
│   ├── index.css                   # Application and template styles
│   └── main.jsx                    # React entry point
├── supabase-setup.sql              # Fresh Supabase database/storage setup
├── supabase-publish-migration.sql  # Publishing migration for existing projects
├── vercel.json                     # SPA rewrites for Vercel
└── vite.config.js                  # Vite configuration
```

## Submission checklist

- [ ] Deploy the website and add the working public URL above.
- [ ] Confirm the Supabase project is online and configured with the included schema and policies.
- [ ] Test create, save, retrieve, edit, publish, public-view, and delete flows on the deployed site.
- [ ] Refresh the home and Creative screenshots after the latest design changes.
- [ ] Submit the source code and database platform information. Never submit passwords, secret keys, or service-role keys.
