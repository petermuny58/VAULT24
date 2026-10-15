# Vault24 Bank — Frontend

Fictional digital banking UI for a cybersecurity hackathon. **Frontend only** — no backend, database, or server code in this package. All demo data is fictional.

## Stack

React + TypeScript + Vite + Tailwind CSS + React Router.

## Run locally

```bash
npm install
npm run dev
```

Mock mode is on by default (`VITE_USE_MOCK=true` in `.env`), so the UI works without a backend.

### Demo accounts (mock)

| Role     | Email                       | Password         |
|----------|-----------------------------|------------------|
| Customer | `chanda.mwansa@example.zm`  | `Vault24Secure!` |
| Customer | `mutale.banda@example.zm`   | `Vault24Secure!` |
| Locked   | `locked.user@example.zm`    | `Vault24Secure!` |
| Admin    | `admin@vault24.example`     | `Vault24Admin!!` |

## Pages

| Path                  | Description                                      |
|-----------------------|--------------------------------------------------|
| `/register`           | Create account (client-side validation)          |
| `/login`              | Sign in (generic errors; 423 lockout message)    |
| `/dashboard`          | Masked account, balance, last 5 transactions     |
| `/transfer`           | Two-step transfer with idempotency key           |
| `/transactions`       | Full transaction table                           |
| `/profile`            | Edit name, phone, address (email read-only)      |
| `/admin/customers`    | List customers; lock/unlock with confirm         |
| `/admin/audit-logs`   | Audit table with action filter                   |

## API contract

All calls go through `src/api/client.ts` using `fetch` with `credentials: "include"` (session via httpOnly cookie). Tokens, passwords, and balances are **never** stored in `localStorage` or `sessionStorage`.

Base URL: `import.meta.env.VITE_API_URL`

| Method | Path                              | Notes                                      |
|--------|-----------------------------------|--------------------------------------------|
| POST   | `/auth/register`                  | email, fullName, password                  |
| POST   | `/auth/login`                     | email, password                            |
| POST   | `/auth/logout`                    |                                            |
| GET    | `/auth/me`                        | current user + role                        |
| GET    | `/accounts/me`                    | accountNumber, balance (minor units)       |
| POST   | `/transfers`                      | recipientAccount, amount, idempotencyKey   |
| GET    | `/transactions`                   | current customer only                      |
| GET    | `/profile`                        |                                            |
| PUT    | `/profile`                        | fullName, phone, address                   |
| GET    | `/admin/customers`                | admin                                      |
| POST   | `/admin/customers/:id/lock`       | admin                                      |
| POST   | `/admin/customers/:id/unlock`     | admin                                      |
| GET    | `/admin/audit-logs`               | admin                                      |

Money amounts are integer **ngwee** (minor units). The UI converts for display only.

## Switch mock → real backend

1. Copy `.env.example` to `.env` if needed.
2. Set:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3000
```

3. Ensure the backend implements the endpoints above, sets an httpOnly session cookie, and allows credentials from the Vite origin (CORS + `Access-Control-Allow-Credentials`).

4. Restart `npm run dev`.

## Security notes (frontend)

- `ProtectedRoute` is a UX convenience; real authorization must be enforced on the server.
- Global 401 handling clears user state and redirects to `/login` with a session-expired notice.
- Errors shown to users are generic; raw server messages and stack traces are never rendered.
- No `dangerouslySetInnerHTML`.
