## Project Information

- **Published website:** [https://portfolio-generator-virid-five.vercel.app/]
- **Database:** Supabase (Postgres, username/password authentication, Edge Functions, and Storage).
- **Database Project:** PortGen - Is a responsive website for creating, saving, previewing, and sharing an online portfolio. Users enter their information, choose one of three designs, and save the portfolio to Supabase. A portfolio can remain private or be published at a shareable URL
- **Hosting target:** Vercel static hosting.
- **Templates:** Simple, Modern, and Creative.

## Features

- Create a portfolio with a required full name and optional profile picture, email, contact number, address, and biography.
- Add multiple education, project, work-experience, and social-link entries; edit or remove entries in the form.
- Enter skills as a comma-separated list.
- Switch between exactly three templates and see a live preview while editing.
- Save, retrieve, update, and delete portfolios stored in Supabase.
- Register with a username, email address, and password; sign in with username and password. Private portfolios are protected by Supabase Row Level Security and owned by the signed-in account.
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
- Supabase Postgres, Row Level Security (RLS), username/password authentication, Edge Functions, and Storage
- Vercel (intended deployment platform)

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Home page, template overview, and links to start creating a portfolio. |
| `/login` | Sign in or create an account. |
| `/editor?template=simple` | Create a portfolio, preselecting the requested template. The `modern` and `creative` values are also supported. |
| `/editor/:id` | Edit a portfolio owned by the signed-in account. |
| `/manage` | List, edit, delete, and access public links for portfolios owned by the signed-in account. |
| `/examples/:template` | Display a built-in example for `simple`, `modern`, or `creative`. |
| `/p/:id` | Display a portfolio only when it has been published. |

Vercel rewrites application routes to the SPA entry point so direct navigation and refresh work for these routes.

## Data and privacy

The `public.portfolios` table stores:

- Portfolio ID, owner ID, creation time, and last-updated time.
- Name, email, contact number, address, biography, and profile image URL.
- Education, skills, projects, work experience, and social links as JSONB arrays.
- Template key (`simple`, `modern`, or `creative`) and the `is_published` flag.

`supabase-setup.sql` creates the table, a timestamp trigger, RLS policies, and the `profile-images` Storage bucket and upload/delete policies. Non-anonymous account holders can read and manage their own portfolios. Public visitors can read published portfolios; unpublished portfolio records are not available to other accounts.

Editor and manager routes require a non-anonymous Supabase account. Registration collects a username, email address, and password; sign-in only asks for username and password. A Supabase Edge Function privately maps usernames to registered email addresses so that mapping is never exposed to browsers. If a visitor already has a portfolio workspace in an anonymous session, registration upgrades that session and keeps its owner ID. If an earlier registration created an auth account but did not save its username mapping, the user can retry registration with that email and password to restore the mapping and sign in without deleting the account or its portfolios. Existing published portfolios remain readable by anyone with their public link.

Email confirmation is disabled, so registration does not send a verification message. Email is collected as the Supabase account identifier; password recovery by email is not currently implemented. Users should keep their password safe. Usernames are 3–24 characters and may contain lowercase letters, numbers, and underscores.

The `profile-images` bucket is public so portfolio pages can display uploaded images. Upload and delete operations are restricted by Storage policy to the signed-in owner's folder, but image URLs remain publicly accessible. Do not store sensitive information in a public portfolio or profile image.

## Supabase setup

1. Create a Supabase project.
2. In Supabase Authentication settings, enable the Email provider for password authentication and **disable Confirm email** so account creation can complete without verification. Configure the site URL and redirect URLs for local and deployed environments.
3. Open the Supabase SQL Editor and run [`supabase-setup.sql`](./supabase-setup.sql) for a new project. It creates the schema, private username mapping, owner/public access policies, trigger, and storage configuration.
4. For an existing database, review the schema first and run [`supabase-auth-migration.sql`](./supabase-auth-migration.sql) to restrict private portfolios and image uploads to non-anonymous account owners and install private username mapping. The migration also renames legacy `owner_id` columns to `user_id` where needed. If publishing has not been configured, also review and run [`supabase-publish-migration.sql`](./supabase-publish-migration.sql). Do not run the fresh-project setup blindly over an existing production database.
5. Install the Supabase CLI, link the local project, and deploy the username authentication function:

   ```sh
   supabase functions deploy username-auth
   ```

   The function uses Supabase's built-in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` secrets. Its `Verify JWT with legacy secret` setting must be disabled because the function performs its own auth checks and the client uses a publishable key. Never expose the service-role key to the browser or commit it to source control.
6. Create `.env.local` in the project root with the project URL and publishable key:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

   Use the values for your Supabase project. The publishable key is intended for client-side use and must be protected by correct RLS policies. **Never put a Supabase secret/service-role key in a `VITE_` variable or commit it to source control.**

The app throws a configuration error at startup if either environment variable is missing. Username sign-in and registration require the deployed `username-auth` Edge Function.

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
5. Deploy the `username-auth` Edge Function and test the deployed site end to end: create two accounts and verify each account can only manage its own private portfolios, save and edit a portfolio, publish it, open `/p/:id` signed out, and delete it.
6. Replace the project status at the top of this README with the deployed public URL. Do not submit a localhost URL.

The repository includes [`vercel.json`](./vercel.json) with SPA rewrites for `/login`, `/manage`, `/editor`, `/editor/:id`, `/examples/:template`, and `/p/:id`.

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
├── supabase-auth-migration.sql     # Account-only owner policy migration
├── supabase/                       # Supabase Edge Function and local configuration
├── vercel.json                     # SPA rewrites for Vercel
└── vite.config.js                  # Vite configuration
```

## Group 1 - Section 7

Members:

- Gacang, Clyde A.
- Jugan, Ranier JR. G.
- Jumamoy, Rhyn Angelo Y.
- Lutchavez, Khurt Miguel C.
- Diacoma, Via D.
- Trazo, Haroeh
- Tumongha, Jan Thomas