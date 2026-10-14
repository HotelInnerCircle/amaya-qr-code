# Amaya Visitor Registration

Exhibition visitor registration system for **Amaya, Senior Living by Vera Vita**.

- **Public registration form** (`/`) — name, +91 mobile, email, home interest (1 / 2 / 2.5 / 3 / 3.5 BHK / Still exploring), optional WhatsApp/email consent. After registering, visitors get an instant **Download Brochure** button (the e-brochure PDF ships with the app).
- **QR source tagging** — point different QR codes at `/?src=standee1`, `/?src=desk`, `/?src=hoarding` and the dashboard + CSV show which placement generated each lead.
- **Admin dashboard** (`/admin`) — password-protected: live totals, today's count, brochure opens, opt-ins, enquiries by BHK type, recent registrations, one-click **CSV export** (opens in Excel). Auto-refreshes every 10 seconds.
- **Your own database** — everything stored in MongoDB that you control.

Stack: Next.js 14 (App Router) · Tailwind CSS · MongoDB · JWT cookie auth (jose).

---

## 1. Local setup

```bash
npm install
cp .env.example .env.local   # then edit .env.local
npm run dev                  # http://localhost:3000
```

### Environment variables (`.env.local`)

| Variable | What it is |
|---|---|
| `MONGODB_URI` | MongoDB connection string (Atlas free tier works) |
| `MONGODB_DB` | Database name (default `amaya`) |
| `ADMIN_EMAIL` | Email for the admin login at `/admin` |
| `ADMIN_PASSWORD` | Password for the admin login — use a strong one |
| `JWT_SECRET` | Long random string signing the session cookie — `openssl rand -base64 32` |

## 2. MongoDB Atlas (free)

1. Create a free cluster at <https://www.mongodb.com/cloud/atlas>.
2. Database Access → add a database user (username + password).
3. Network Access → allow access from anywhere (`0.0.0.0/0`) so Vercel can connect.
4. Copy the connection string into `MONGODB_URI`.

No schema setup needed — the `registrations` collection is created on the first registration.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Vercel → **New Project** → import the repo (defaults are fine).
3. Add the five environment variables above in Project → Settings → Environment Variables.
4. Deploy. The form is at `https://your-app.vercel.app/`, the dashboard at `/admin`.

## 4. Pages & API

| Route | Purpose |
|---|---|
| `/` | Public registration form + thank-you with brochure download |
| `/admin/login` | Admin sign-in |
| `/admin` | Protected live dashboard |
| `POST /api/register` | Save a registration (server-side validation) |
| `POST /api/brochure-opened` | Mark brochure engagement on a registration |
| `GET /api/admin/registrations` | List registrations (auth required) |
| `GET /api/admin/export` | CSV download (auth required) |

`/admin` and `/api/admin/*` are protected by `src/middleware.js` — a signed, httpOnly session cookie set on login (7-day expiry).

## 5. Registration document shape

```json
{
  "name": "…",
  "mobile": "+91 9xxxxxxxxx",
  "email": "…",
  "interest": "2 BHK",
  "consentFollowup": false,
  "brochureOpened": true,
  "brochureOpenedAt": "2026-10-14T06:08:35.016Z",
  "event": "Exhibition",
  "src": "standee1",
  "createdAt": "2026-10-14T06:08:28.255Z"
}
```

## 6. Swapping the brochure

Replace `public/brochure/Amaya-eBrochure.pdf` with the updated file (keep the name, or update `BROCHURE_PATH` in `src/app/page.js`).

## 7. Notes

- Consent is **unticked by default** and purely optional, per the Amaya WhatsApp/CRM framework. Only follow up with visitors whose export row shows `Follow-up Consent = Yes`.
- Keep `ADMIN_PASSWORD` and `JWT_SECRET` out of git — `.env*` files are ignored.
- For more admins later, the login can be moved to a `users` collection with hashed passwords; the current single-credential setup is deliberate for exhibition speed.
