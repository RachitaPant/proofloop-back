# ProofLoop Backend (Express)

A route-for-route mirror of the Spring Boot backend (`../backend`), so the
frontend can point at either one by changing `NEXT_PUBLIC_API_URL` — no
frontend code changes required.

## Why this exists

Spring Boot on Render needs a JVM with enough memory to boot comfortably,
which doesn't fit free/small Render instances well. This is a lightweight
Node/Express service with the same routes, same request/response JSON
shapes, and the same JWT auth model, so it deploys easily on Render's Node
runtime (or any Node host) and can be swapped in without touching the
frontend.

## Parity notes

- Same routes, same JSON field names (`id`, `createdByName`, `stepApprovals`,
  etc.) as `GET/POST /api/auth`, `/api/workflows`, `/api/requests`, `/api/admin`.
- Same JWT shape (`sub` = email, `role` claim, HS256) — tokens are
  interchangeable between the two backends **if `JWT_SECRET` matches**.
- Passwords are hashed with bcrypt on both sides, using the same hash
  format — a user created on one backend can log in on the other **if both
  point at the same MongoDB**.
- Same demo-data seeder (admin/reviewer/user + 2 workflows + 2 requests),
  gated by `NODE_ENV !== 'production'` the way Spring's seeder is gated by
  `@Profile("!prod")`.
- Same hourly SLA-escalation job and manual `/api/admin/trigger-sla-check`.

## Known divergence (by design)

The Spring Boot `RequestService` never actually populates
`stepApprovals`/`stepStartTimes` (the quorum/parallel-approval feature) or
`RequestAction.previousHash`/`currentHash` (the tamper-evident hash chain) —
those fields exist on the entity and DTOs but nothing in the Java service
writes to them. This Express backend reproduces the same
single-approver-per-step behavior for `stepApprovals`, but **does** compute
real SHA-256 hash chain values for `previousHash`/`currentHash`, since the
frontend's audit trail already renders those fields and Spring's version is
simply dead code rather than a depended-upon contract. Let us know if you'd
rather this be byte-for-byte including the no-op hashing, or if you'd like
the hash chain wired into the Spring Boot service too.

## Running locally

```bash
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET
npm install
npm run dev             # nodemon
# or: npm start
```

## Deploying on Render

- Runtime: Node (not Docker required, but a `Dockerfile` is included if you
  prefer a container build).
- Build command: `npm install`
- Start command: `npm start`
- Env vars: `MONGODB_URI`, `MONGODB_DATABASE`, `JWT_SECRET`,
  `JWT_EXPIRATION_MS`, `CORS_ALLOWED_ORIGINS`, `NODE_ENV=production`.

Then point the frontend's `NEXT_PUBLIC_API_URL` at this service's Render URL.
