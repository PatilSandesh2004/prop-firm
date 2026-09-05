# 08 SaaS Readiness — What Needs to Change to Sell This

## Current state, honestly

This is a working trading-terminal engine (market data, order execution, positions, P&L) sitting behind a **fully manual, single-admin commerce process**: a buyer picks a package, pays via UPI/bank transfer, messages a screenshot to a WhatsApp number, and a human admin manually approves the purchase and provisions the account — "credentials shared within 3 hours" (`backend/app/api/challenges.py`). There is no payment gateway, no automated provisioning, no customer-facing purchase UI (the frontend has no checkout screen at all — these are backend-only endpoints), and the "QR code" the API returns is a literal placeholder (`https://example.com/qr/propfirm-india`).

That's fine for a handful of trusted users you onboard by hand. It does not hold up as a self-service SaaS product. Below is what closes that gap, in priority order.

---

## Tier 0 — Legal & regulatory (resolve before taking paying customers at scale)

This is the one section that isn't a coding task, and it's the one I'd act on first.

- **The business model itself needs legal sign-off.** "Pay an entry fee, pass a simulated trading evaluation, get a funded account, receive a share of profits" is a business model that Indian regulators (SEBI/RBI) have actively scrutinized for platforms operating without proper registration or in ways that resemble unregistered investment schemes. Get a securities/fintech lawyer to review the exact structure (entry fee, evaluation, payout mechanics) before marketing this publicly or processing real payouts. I'm flagging this, not blocking it — it's your business decision, but it's the kind of thing that's far cheaper to fix before launch than after.
- **`AccountGraduationService.graduate_account`** currently just flips a `FUNDED` account into existence with no KYC, no payout mechanism, no tax handling — it's explicitly a POC stub (`execution_provider_key="SIMULATED"`). Before any real money changes hands on a payout, you need KYC/AML on the recipient and a real payout ledger (with TDS/tax withholding handled correctly for Indian payouts).
- **No Terms of Service, Privacy Policy, Risk Disclosure, or Refund Policy exist anywhere in this repo.** A trading-adjacent product taking payment needs all four before it can legally onboard the public.
- **Data protection**: you're storing email addresses and (currently hardcoded) WhatsApp numbers. India's DPDP Act has consent/notice/breach-disclosure obligations — worth a compliance pass once you're collecting real user data at scale, not just seeded test users.

---

## Tier 1 — Blockers (these break trust or revenue directly)

1. **Payment automation.** Replace the WhatsApp-screenshot-and-wait flow with a real gateway (Razorpay is the natural fit for INR). Concretely:
   - `POST /challenges/purchase` should create a real payment order via the gateway's API and return a real checkout URL/session, not a placeholder QR image.
   - A webhook endpoint verifies payment success server-side (never trust a client-reported "I paid" call) and automatically calls the same account-provisioning logic that `admin.approve_purchase` runs today — turning a 3-hour manual SLA into instant self-service activation.
   - Keep the manual admin-approval path as a fallback/override, not the primary path.

2. **Account/order ownership isolation.** Covered in the earlier improvements list, but it matters more now: `GET /accounts` returns every user's accounts with no filtering, and every `/accounts/{id}/...` route trusts the URL with no check that the account belongs to the caller (`get_current_user` exists in `dependencies/auth.py` but isn't wired into `api/accounts.py` or `api/orders.py`). Selling this means strangers' account data and trading state need to be provably isolated per customer — this is the difference between a bug and a data breach once you have real customers.

3. **No customer-facing purchase UI.** `frontend/src/marketing/` (the public site, merged in from a separate marketing-site build on 2026-09-01 — see `10_CHANGES_2026-09-01.md`) now has real login/register (`frontend/src/context/AuthContext.jsx` against `POST /auth/login` / `/auth/register`) and a `ChallengesPage` describing the packages, but registering only ever creates the same generic free EVALUATION account — there's still no package-selection/checkout screen wired to `POST /challenges/purchase`, no purchase-history page, and no "your account is pending activation" state. Buying a challenge is still a backend API call plus a WhatsApp message; a paying customer needs a UI for all of it.

---

## Tier 2 — Product completeness & operations

- **Admin panel UI.** `api/admin.py` is JSON-only (list purchases, approve, list users) — there's no dashboard. At any real volume, you need a UI to search users, see account state, approve/reject purchases, and intervene on disputes without hand-crafting `curl` calls.
- **Real audit logging.** An `AuditEvent` model and an `app/audit/` module exist, but `GET /admin/audit-events` returns a hardcoded placeholder string — nothing is actually logged. For a money-adjacent product you'll want an immutable trail of every order, balance change, and admin action, both for your own dispute resolution and because a regulator or payment processor may eventually ask for it.
- **Notifications.** Nothing currently emails or texts a user when: their purchase is approved, their account is activated, they breach a risk rule (max daily loss / drawdown — right now this only silently flips `account.status` in the DB), or they pass/fail an evaluation. Customers expect to be told these things without polling the app.
- **Order-type completeness.** `LIMIT` orders are accepted by the API and then immediately rejected by the matching engine; `SL`/`SL_M` aren't implemented at all. Either build them or remove them from what the UI/API advertise — a paying customer hitting "not yet supported" on a basic order type is a support ticket and a refund request.
- **Real margin data before real money is at risk.** The short-sell margin check added in this pass is a deliberate approximation (see `06_CHANGES_AND_FIXES.md`) — fine for simulated EVALUATION accounts, not something I'd trust unmodified on a real-money `FUNDED` account routed to a live broker.

---

## Tier 3 — Infrastructure & reliability

- **Secrets management.** Credentials currently live in a single `.env` file (correctly gitignored, but that's the only protection). Move to a real secrets manager (e.g., cloud provider's secret store, or at minimum encrypted environment injection in CI/CD) once more than one person touches production config.
- **Multi-instance readiness.** The quote cache silently falls back to per-process memory if Redis is unreachable, and the new live-P&L broadcast subscriber map (`services/broadcast_service.py`) is also in-process memory. That's correct for one API instance; if you ever run more than one for uptime/scale, both need to be Redis-backed (pub/sub) rather than "fallback when convenient," or users connected to different instances will see inconsistent data.
- **CORS/JWT hardening.** Wildcard CORS with credentials enabled, and a default JWT secret that will silently work if nobody overrides it (`core/config.py`) — both need to fail loudly (refuse to boot) if left at insecure defaults outside local development.
- **Schema management.** `main.py` auto-creates tables on startup *and* Alembic migrations exist separately — pick one (Alembic) before you have production data you can't afford to lose to a drift-related mistake.
- **Backups & disaster recovery** for whatever database you land on in production (currently SQLite locally / Postgres in Docker) — none configured yet.
- **Observability**: structured logging exists, but there's no error tracking (Sentry or similar), no uptime/alerting, and no dashboards. You will not know a customer is affected until they tell you.
- **CI/CD + staging environment.** No pipeline currently runs the new `backend/tests/` suite automatically; there's also no staging environment separate from local Docker.
- **Rate limiting / abuse protection** on public endpoints — signup, login, purchase-intent, and order placement are all currently unlimited.

---

## Tier 4 — Growth features (once the above is solid)

- Subscription/recurring pricing options, discount codes, referral/affiliate tracking — currently every "package" is a single one-time purchase with a fixed price.
- Multiple concurrent challenge attempts, retry discounts, leaderboards — common expectations in this market segment.
- Mobile-responsive layout or a dedicated mobile app (current UI is a fixed desktop terminal layout).
- Support for brokers beyond Upstox, if you want to serve traders who don't have an Upstox account.

---

## Suggested sequencing

If I were prioritizing the next few work packets:

1. Get the legal/regulatory read done in parallel with everything else — it can reshape the payout model, so better to know early.
2. Fix account/order ownership isolation (small, contained, prevents a real breach).
3. Wire a real payment gateway with webhook-driven auto-provisioning, and build the minimal checkout + "my purchases" UI to go with it.
4. Stand up basic audit logging and notification emails — both are needed the moment you have real customers filing support requests.
5. Everything in Tier 3 becomes necessary once you're not the only person who can fix a production incident by SSHing in.
