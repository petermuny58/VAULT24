# Vault24
banking prototype for a axis codebase cybersecurity hackathon.


or go to 
https://vault-24.vercel.app/
https://vault-24-git-main-petermuny58s-projects.vercel.app/
https://vault-24-i3cl7xcgr-petermuny58s-projects.vercel.app/

.......
#NOTE
admin account: admin@vault24.example      pass: Vault24Admin!!
customer account can either be created or use;
customer: chanda.mwansa@example.zm        pass: Vault24Secure!

## At a glance

| Item | Details |
| --- | --- |
| Live frontend | https://vault-24.vercel.app |
| Final commit SHA | `TODO: paste after the freeze` |
| Reviewer access | `TODO: confirm AXIS reviewers are invited to this repo` |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, Django (`backend/`), SQLite |
| Backend hosting | `TODO: hosted URL, or "local only"` |

---

## 1. For judges: quick demo path

1. Log in as a **customer** (credentials below) and open the dashboard.
2. Make a transfer to the second customer and note the transaction reference.
3. Open transaction history and confirm the transfer appears.
4. Edit the profile (name, phone, address).
5. Log out, then log in as the **admin**.
6. Open the customer list and the audit log. The transfer and both logins should appear there.

### Demo credentials (fictional)

| Role | Email | Password |
| --- | --- | --- |
| Customer 1 | TODO | TODO |
| Customer 2 | TODO | TODO |
| Admin | TODO | TODO |

These accounts exist only for judging. Do not reuse these passwords anywhere else.

---

## 2. Features

| # | Required module | What it does | Status |
| --- | --- | --- | --- |
| 1 | Registration | Validates email and password, creates a user and account | TODO |
| 2 | Login, logout, sessions | Server-side session in an HttpOnly cookie; logout destroys it | TODO |
| 3 | Dashboard | Shows the account number and simulated balance | TODO |
| 4 | Transfers | Moves money between accounts and returns a transaction reference | TODO |
| 5 | Transaction history | Shows only the logged-in customer's transactions | TODO |
| 6 | Profile editing | Lets a customer edit their own details only | TODO |
| 7 | Admin/staff permissions | Separate role with its own pages and checks | TODO |
| 8 | Audit trail | Records security events without logging secrets | TODO |

**Smart extras:** `TODO: list each extra and what it does in one line (for example lockout after repeated failures, idempotent transfers, transfer confirmation step).`

---

## 3. How it is built

```
backend/
  api/          # models, views, permissions, audit logging
  vault24/      # Django settings and URLs
  manage.py
  requirements.txt
src/
  api/          # API client and mock data
  components/   # shared UI components
  hooks/        # auth state
  pages/        # customer and admin pages
  types/  utils/
```

The frontend talks to the backend only through `src/api`. Authentication uses a session cookie, so the frontend never stores tokens or passwords in the browser.

---

## 4. Running it locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
# TODO: seed command for the demo users, if any
python manage.py runserver 3000
```

### Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

### Environment variables

| Variable | Meaning |
| --- | --- |
| `VITE_API_URL` | Backend base URL, for example `http://localhost:3000` |
| `VITE_USE_MOCK` | `true` runs the UI on built-in mock data with no backend; `false` calls the real API |

Vite reads these when the site is **built**. On Vercel, set them in Project Settings and redeploy.

---

## 5. Security design

- **Passwords:** stored only as salted hashes, never in plain text, never logged.
- **Sessions:** server-side, HttpOnly cookie, destroyed on logout.
- **Authorization:** the user always comes from the session, never from an ID sent by the client. Admin routes require the admin role.
- **Input handling:** server-side validation, field whitelisting on profile updates, parameterized database queries.
- **Money:** integer amounts (ngwee), never floats.
- **Audit log:** records register, login success and failure, transfers, profile changes and admin actions, with no secrets.

`TODO: edit every line above so it matches what is actually implemented.`

---

## 6. Threat model

| # | Risk | Example attack | Mitigation |
| --- | --- | --- | --- |
| 1 | Broken access control (IDOR) | A customer edits an ID in a request to read another customer's data | Queries are scoped to the session user; IDs are never trusted from the client; admin routes check the role |
| 2 | Credential guessing | Automated login attempts against a known email | Lockout after repeated failures, rate limiting, one generic error message |
| 3 | Transfer abuse | Double-submit, replay, negative or fractional amounts, race conditions | Atomic database transaction, balance checked inside it, integer amounts only, idempotency key per transfer |

`TODO: adjust these so they match the risks the team actually tested and fixed.`

---

## 7. Testing and fixes

| Test | Result | Fix |
| --- | --- | --- |
| Five wrong passwords | TODO | TODO |
| Replaying a cookie after logout | TODO | TODO |
| Customer calling an admin route | TODO | TODO |
| Changing an ID in a request to another user's | TODO | TODO |
| Submitting the same transfer twice | TODO | TODO |

All testing was done only against our own local or deployed instance.

---

## 8. AI use disclosure

We used AI tools during this build. This section states exactly where. Every team member can explain, trace and modify every key feature live.

### Use cases

| Area | What AI was used for | Tool | What the team did |
| --- | --- | --- | --- |
| Authentication foundation | First version of registration, login, sessions, authorization checks and the audit log | Claude Sonnet 4.6 | `TODO: what was reviewed, tested and changed by hand` |
| Frontend | Scaffolding the pages and components from a written prompt (React/Tailwind UI running on mock data) | `TODO: tool name` | `TODO: what was reviewed and changed` |
| Planning and guidance | Explaining how auth and sessions work, suggesting a Django stack, listing a security checklist, mapping features to the scoring criteria | Claude | We chose the stack and decided what to build |
| Deployment troubleshooting | Diagnosing why the deployed login failed (missing environment variables on Vercel) | Claude | We applied and verified the fix |
| Documentation | Drafting the structure of this README | Claude | We filled in and verified every detail |
| `TODO: any other use` | `TODO` | `TODO` | `TODO` |

### What AI was not used for

`TODO: for example "the threat model risks we tested ourselves", "all manual security testing",

### How we verified AI output

- Read through generated code before committing it.
- Tested security behavior ourselves (lockout, session expiry, access control, duplicate transfers).
- `TODO: add anything else, such as code review between teammates.`

### Pre-existing code

`TODO: state whether any code was reused from earlier projects, what, and what changed. Write "None" if nothing was reused.`

---



---
