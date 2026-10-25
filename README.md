<p align="center">
  <img src="public/logo.png" alt="Anchor Noir Studios Finance" width="280">
</p>

# Anchor Noir Studios Finance

A private finance tracker for **Anchor Noir Studios**. It records every client project, every payment
received, the savings share that has to move into the business savings account, withdrawals, expenses
and promotions, and shows how the business is doing month by month.

All amounts are in **South African Rand (ZAR)**.

---

## Contents

- [How the money flows](#how-the-money-flows)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [How the numbers are calculated](#how-the-numbers-are-calculated)
- [Security and access](#security-and-access)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Deploying](#deploying)
- [Customising lists](#customising-lists)
- [Troubleshooting](#troubleshooting)

---

## How the money flows

```
Client ──pays──▶ Ruben ──transfers savings % of each payment──▶ Business savings account
                   │                                                │
                   └── keeps the rest for operations                 ├── + interest
                                                                     └── − withdrawals (reason + approver)
```

1. A **project** is agreed with a client at a price and a **savings rate** (20% by default).
2. The client pays in one or more **payments** (deposit, instalments, final payment).
3. Each payment creates a **savings due** amount: `amount × savings rate`.
4. Ruben **transfers** that amount into the business savings account and records the transfer
   against the project.
5. The app reconciles **savings due vs transferred** for every project and flags anything still
   owed to savings.

---

## Features

| Page | What it does |
|---|---|
| **Dashboard** | Month picker. Tiles for client payments this month, savings received this month, outstanding client payments, savings awaiting transfer, savings balance, expenses and new projects. A 12-month trend of payments vs transfers, income by service category, and promotion performance. |
| **Projects** | Project register with auto-generated codes (`AN-001`, `AN-002`, …). Filter by status, promotion and category. Each project page shows agreed vs paid, savings due vs transferred, expenses and profit after costs. |
| **Client payments** | One row per deposit, instalment or final payment. Savings due is calculated automatically from the project's savings rate. |
| **Business savings** | Transfers from Ruben, interest and withdrawals (each withdrawal records a reason and who approved it). Shows the running balance and a reconciliation table per project (outstanding / settled / over-transferred). |
| **Expenses** | Project costs (linked to a project) and general business costs. |
| **Promotions** | Create promotions (e.g. *October Promo*, *BLACK OUT November*) and compare each one with regular pricing: projects won, agreed value, paid, expenses, profit and average deal size. |
| **Team** | Admins add or remove the people allowed to see the data, and set their role. |
| **Login** | Email + password sign-in through Supabase Auth. |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions, Cache Components, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Charts | Recharts 3 |
| Database & auth | [Supabase](https://supabase.com): Postgres, Auth, row level security |
| Supabase client | `@supabase/ssr` (cookie-based sessions on the server) |
| Language | TypeScript 5 |

> **Note:** Next.js 16 has breaking changes from earlier versions. For example, `middleware.ts` is now
> [`src/proxy.ts`](src/proxy.ts). See [`AGENTS.md`](AGENTS.md) and `node_modules/next/dist/docs/` before
> changing framework-level code.

---

## Project structure

```
anchor-noir-finance/
├── src/
│   ├── proxy.ts                  # Runs on every request: refreshes the session, redirects signed-out users to /login
│   ├── app/
│   │   ├── layout.tsx            # Root HTML layout
│   │   ├── globals.css           # Tailwind + design tokens
│   │   ├── login/                # Login page + sign-in server action
│   │   └── (app)/                # Everything behind login
│   │       ├── layout.tsx        # Sidebar, nav, "not on the team" gate
│   │       ├── (dashboard)/      # "/" dashboard
│   │       ├── projects/         # List, create, edit; [id] = project detail
│   │       ├── payments/
│   │       ├── savings/
│   │       ├── expenses/
│   │       ├── promotions/
│   │       └── team/
│   │       # Each folder has page.tsx, actions.ts (server actions) and loading.tsx (skeleton)
│   ├── components/               # Forms, tables, charts, nav, stat tiles, skeletons
│   └── lib/
│       ├── supabase/server.ts    # Server-side Supabase client
│       ├── auth.ts               # getSession / requireMember / requireAdmin
│       ├── finance.ts            # Per-project totals, savings balance, month ranges
│       ├── campaigns.ts          # Promotion performance roll-up
│       ├── queries.ts            # Shared data queries
│       ├── format.ts             # ZAR / date formatting
│       └── types.ts              # Types and editable dropdown lists
├── supabase/
│   └── migrations/               # Database schema, run in order
├── public/                       # Static assets
├── .env.example                  # Template for .env.local
└── next.config.ts
```

---

## Data model

Defined in [`supabase/migrations/`](supabase/migrations):

| Migration | Purpose |
|---|---|
| `0001_init.sql` | Team list, access-check functions, original tables, row level security |
| `0002_private_access_functions.sql` | Moves access-check functions into a `private` schema so they aren't exposed via the API |
| `0003_ruben_savings_model.sql` | Rebuilds the schema around the payments → savings model (current schema) |

### Tables

**`team_members`** — who may access the app
`email` (PK, lowercase) · `role` (`admin` \| `member`) · `added_at`

**`projects`**
`code` (auto `AN-###`) · `client` · `name` · `category` · `service` · `agreed_price` · `standard_price` ·
`campaign_id` → `campaigns` · `savings_rate` (0–100, default 20) · `status` · `website_url` ·
`client_industry` · `lead_source` · `start_date` · `due_date` · `completed_on` · `description` · `notes`

Statuses: `lead`, `quoted`, `in_progress`, `completed`, `on_hold`, `cancelled`.

**`payments`** — money received from clients
`project_id` → `projects` (restrict delete) · `received_on` · `kind` (`deposit` \| `instalment` \| `final` \| `other`) ·
`amount` · `savings_rate` · `savings_due` (generated: `round(amount × savings_rate / 100, 2)`) · `reference`

The `savings_rate` is **copied from the project when the payment is recorded** (by a database trigger
if not supplied), so changing a project's rate later never rewrites past payments.

**`savings_entries`** — the business savings account
`kind` (`transfer` \| `interest` \| `withdrawal`) · `occurred_on` · `amount` · `project_id` (optional) ·
`reference` · `reason` · `approved_by`

**`expenses`**
`spent_on` · `project_id` (optional; empty = general business cost) · `category` · `description` · `amount` · `paid_by`

**`campaigns`** — promotions
`name` (unique) · `starts_on` · `ends_on` · `notes`. Projects with no campaign count as **Regular pricing**.

Every table also stores `created_by` (the Supabase user) and `created_at`.

---

## How the numbers are calculated

| Figure | Formula |
|---|---|
| Savings due (per payment) | `amount × savings_rate / 100` |
| Savings balance | `transfers + interest − withdrawals` |
| Savings awaiting transfer | `max(0, total savings due − total transfers)` |
| Outstanding client payments | Sum over projects (excluding `lead` and `cancelled`) of `max(0, agreed_price − paid)` |
| Project savings outstanding | `savings due on the project − transfers linked to the project` |
| Profit after costs (project) | `paid − project expenses` |
| Promotion average deal | `total agreed price / number of projects` (cancelled projects excluded) |
| Income by service | Payments in the last 12 months grouped by project category |

The logic lives in [`src/lib/finance.ts`](src/lib/finance.ts) and [`src/lib/campaigns.ts`](src/lib/campaigns.ts).

---

## Security and access

Access is enforced **in the database**, not only in the UI.

- **Row level security** is on for every table. A signed-in user can read or write data only if their
  email is in `team_members` (checked by `private.is_team_member()`).
- Only **admins** can add, change or remove team members (`private.is_team_admin()`).
- The access-check functions live in a `private` schema and can't be called through the public API.
- Server actions also call `requireMember()` / `requireAdmin()` from [`src/lib/auth.ts`](src/lib/auth.ts)
  before writing.
- [`src/proxy.ts`](src/proxy.ts) redirects anyone who is not signed in to `/login`.
- A user who can sign in but isn't on the team list sees no data.

**Turn off public sign-ups** in Supabase: *Authentication → Sign In / Providers → Allow new users to sign up → off*.
People get logins by invitation only.

Never commit `.env.local`. It is already in `.gitignore`.

---

## Getting started

### Prerequisites

- Node.js 20 or newer
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Clone and install

```bash
git clone https://github.com/RubbenShisso/ANCHOR-NOIR-Studios-Finance.git
cd ANCHOR-NOIR-Studios-Finance
npm install
```

### 2. Set up the database

Run each file in [`supabase/migrations/`](supabase/migrations) **in order** in the Supabase SQL editor,
or with the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### 3. Add the first admin

```sql
insert into public.team_members (email, role) values ('you@example.com', 'admin');
```

### 4. Create logins

In Supabase go to *Authentication → Users → Add user* (or *Invite user*) and create a login with the
**same email**. Repeat for each team member, and add them on the **Team** page in the app.

### 5. Configure environment

```bash
cp .env.example .env.local
```

Fill in the values from *Supabase → Project Settings → API* (see below).

### 6. Run it

```bash
npm run dev
```

Open <http://localhost:3000> and sign in.

---

## Environment variables

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → Publishable key (`sb_publishable_…`) |

Both are safe to expose to the browser. Data is protected by row level security, not by keeping
these secret. **Never** put the `service_role` / secret key in this app.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Deploying

### Vercel (recommended)

1. Import this repository in Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as environment variables.
3. Deploy.
4. In Supabase, set *Authentication → URL Configuration → Site URL* to the deployed address so invite
   and password-reset emails link to the right place.

Any Node host that runs `npm run build && npm run start` works too.

---

## Customising lists

Project categories, lead sources, payment types, savings entry types and expense categories are defined
in [`src/lib/types.ts`](src/lib/types.ts). Categories, lead sources and expense categories are stored as
plain text, so you can rename or add them **without a database migration**.

Promotions are managed from the **Promotions** page.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Redirected to `/login` in a loop | Check `.env.local` values and restart `npm run dev`. |
| Signed in but see no data / "not on the team" | Add the user's email (lowercase) to `team_members`. |
| Can't change the team list | Only `admin` members can. Update the role in `team_members`. |
| New project gets no `AN-###` code | Make sure migration `0003` ran; it creates `project_code_seq`. |
| Turbopack picks the wrong project root | `next.config.ts` pins `turbopack.root` to this folder; keep it. |

---

© Anchor Noir Studios. Private, internal use.
