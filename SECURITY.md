# Security Architecture & Implementation Reference

> **Confidential — Internal Engineering Reference**  
> *Last Updated: August 2026*  
> *Repository: `afaq-automation` (Ittisalo)*

---

## 1. System Overview & Deployment Topology

Ittisalo operates across a hybrid infrastructure architecture split between serverless and persistent container environments:

```
                               ┌────────────────────────────────────────┐
                               │             Vercel Edge / Lambda        │
                               │  - Next.js 16 App Router (Frontend)   │
                               │  - Tenant API Routes                   │
                               │  - E-Commerce Webhook Ingestion        │
                               └──────────────────┬─────────────────────┘
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                │                                 │                                 │
                ▼                                 ▼                                 ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
│     Upstash Redis (REST)      │ │   Railway Microservices       │ │     Supabase (PostgreSQL)     │
│  - Global Sliding-Window      │ │   (Docker Persistent Nodes)   │ │  - Row Level Security (RLS)   │
│    Rate-Limit State Store     │ │  - webhook-service (Fastify)  │ │  - pgvector Embeddings        │
│  - Zero Connection Leaks      │ │  - chat-service (Fastify)     │ │  - Audit Logging              │
└───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘
```

---

## 2. Encryption at Rest

### 2.1 Encryption Standard & Key Management
* **Algorithm**: **AES-256-GCM** (Galois/Counter Mode with 128-bit authentication tag).
* **Key Variable**: `TOKEN_ENCRYPTION_KEY`
  * 256-bit key represented as a 64-character hexadecimal string.
  * Configured in Railway (`webhook-service`, `chat-service`) and Vercel (`afaq-automation`).
* **Ciphertext Wire Format**:
  ```text
  enc:v1:<12-byte IV hex>:<16-byte Auth Tag hex>:<Ciphertext hex>
  ```
  * The `enc:v1:` prefix provides explicit schema versioning for zero-downtime key rotation.
  * Integrity validation: `decrypt()` verifies the GCM authentication tag before returning plaintext; any tampering causes decryption failure.
  * Null-safety: `decrypt(null)` and `decrypt(undefined)` return `null`/`undefined` gracefully without throwing runtime errors.

### 2.2 Implementation Modules
* **Next.js App**: [`lib/crypto.ts`](file:///d:/my_automation/afaq-automation/lib/crypto.ts)
* **Webhook Service**: [`services/webhook-service/crypto.js`](file:///d:/my_automation/afaq-automation/services/webhook-service/crypto.js)
* **Chat Service**: [`services/chat-service/crypto.js`](file:///d:/my_automation/afaq-automation/services/chat-service/crypto.js)

### 2.3 Protected Fields Matrix
| Table | Column | Payload Type | Encrypted Keys / Fields |
|---|---|---|---|
| `public.tenants` | `wa_token_enc` | `TEXT` | Meta WhatsApp System User Access Token |
| `public.integration_credentials` | `credentials` | `JSONB` | `access_token` (Shopify, Salla, Zid)<br>`consumer_key`, `consumer_secret` (WooCommerce)<br>`webhook_secret` (Shopify, WooCommerce) |
| `public.calendar_integrations` | `credentials` | `JSONB` | `access_token`, `refresh_token` (Google Calendar) |
| `public.integrations` | `credentials` | `JSONB` | `access_token` (Meta Legacy Integration) |

---

## 3. Endpoint Authentication & Authorization Matrix

```
                      INBOUND TRAFFIC AUTHENTICATION FLOWS

[ Meta Graph API ]     ── POST /webhook ────────────────► [ Fastify webhook-service ]
                               X-Hub-Signature-256               │ crypto.timingSafeEqual()
                                                                 │ vs META_APP_SECRET
                                                                 ▼
[ Next.js API Route ]  ── POST https://chat.../send ────► [ Fastify chat-service ]
                               x-internal-api-key                │ crypto.timingSafeEqual()
                                                                 │ vs INTERNAL_SERVICE_KEY
                                                                 ▼
[ Shopify / Woo Store] ── POST /api/webhooks/... ──────► [ Vercel Next.js Routes ]
                               X-*-Hmac-Sha256 (Base64)          │ crypto.timingSafeEqual()
                                                                 │ vs Decrypted Stored Secret
```

### 3.1 Service-to-Service Internal Authentication
* **Shared Secret**: `INTERNAL_SERVICE_KEY`
* **Protocol**: Checked via `crypto.timingSafeEqual()` against caller header `x-internal-api-key`.
* **Endpoints Enforced**:
  1. **`POST https://chat.ittisalo.com/send`** ([`services/chat-service/server.js`](file:///d:/my_automation/afaq-automation/services/chat-service/server.js)):
     * Triggered by Next.js [`app/(app)/api/chat/send/route.ts`](file:///d:/my_automation/afaq-automation/app/(app)/api/chat/send/route.ts) when agents dispatch outbound WhatsApp/Instagram/Messenger replies.
     * Missing or mismatched header rejected with `401 Unauthorized`.
  2. **`POST /api/campaigns/send`** ([`services/webhook-service/server.js`](file:///d:/my_automation/afaq-automation/services/webhook-service/server.js)):
     * Internal campaign broadcast trigger.
     * Strictly requires `x-api-key: INTERNAL_SERVICE_KEY`. `SUPABASE_SERVICE_ROLE_KEY` and verify token fallbacks have been removed.
  3. **`POST /api/orders/sync`** ([`app/(app)/api/orders/sync/route.ts`](file:///d:/my_automation/afaq-automation/app/(app)/api/orders/sync/route.ts)):
     * Order confirmation sync endpoint.
     * Strictly requires `x-api-key: ORDERS_SYNC_API_KEY`. The legacy `N8N_API_KEY` fallback has been decommissioned.

### 3.2 External Webhook Ingestion (HMAC Signatures)
* **Meta Cloud API Webhook** (`POST /webhook` on `webhook-service`):
  * **Header**: `X-Hub-Signature-256` (`sha256=<hex_digest>`).
  * **Secret**: `META_APP_SECRET`.
  * **Raw Body Integrity**: Fastify is configured with a raw buffer content parser (`addContentTypeParser('application/json', { parseAs: 'buffer' }, ...)`), computing HMAC over `req.rawBody` before JSON parsing.
  * Handshake: `GET /webhook` remains intact for Meta's `hub.verify_token` challenge.
* **Shopify Webhooks** (`POST /api/webhooks/shopify`):
  * **Header**: `X-Shopify-Hmac-Sha256` (**Base64-encoded digest**).
  * **Secret**: Decrypted `webhook_secret` from `integration_credentials.credentials`.
  * **Raw Body**: Read via `await req.text()` before `JSON.parse()`.
  * **Missing-Secret Alerting**:
    1. Log tag: `[ECOMMERCE_WEBHOOK_AUTH_MISSING_SECRET]`
    2. Audit Log: Persistent entry in `public.audit_logs` (`severity: CRITICAL`)
    3. UI Alert: Sets `webhook_status: 'secret_missing'` on `credentials`, displaying an emergency banner in **Settings $\rightarrow$ eCommerce**.
* **WooCommerce Webhooks** (`POST /api/webhooks/woocommerce`):
  * **Header**: `x-wc-webhook-signature` (**Base64-encoded digest**).
  * **Secret**: Decrypted `webhook_secret` from `integration_credentials.credentials`.
  * **Alerting**: Identical 3-tier failure alerting pipeline as Shopify.

### 3.3 Tenant & User Session Authorization
* **Session Transport**: HTTP-only Secure Cookie managed by `@supabase/ssr`.
* **Tenant Isolation**:
  * Every authenticated request queries `public.users` to resolve `callerProfile.tenant_id`.
  * Route handlers explicitly assert object ownership (`conversations.tenant_id === callerProfile.tenant_id`) before initiating actions.
* **Super Admin Access**:
  * Database function `public.is_super_admin()` (`SECURITY DEFINER`) checks `users.role = 'super_admin'`.
  * Client-side hardcoded email strings have been removed from [`app/(app)/onboarding/page.tsx`](file:///d:/my_automation/afaq-automation/app/(app)/onboarding/page.tsx); routing relies on `profile?.role === 'super_admin'`.

### 3.4 Decommissioned Legacy Endpoints
* **`app/(app)/webhook/route.ts`**:
  * **Status**: **Deleted from repository**.
  * **Verification**: Returns `404 Not Found` in production on Vercel. Eliminates duplicate unauthenticated webhook bypasses.

---

## 4. Rate Limiting Architecture

| Endpoint | Platform | Throttle Cap | State Store | Keying Strategy | Violation Response |
|---|---|---|---|---|---|
| **`POST /webhook`** | Railway (`webhook-service`) | **600 req / min** | In-Memory (`@fastify/rate-limit`) | Client IP (`x-forwarded-for` / socket) | `429 Too Many Requests`<br>`Retry-After: <sec>` |
| **`POST /api/chat/send`** | Vercel (`afaq-automation`) | **60 req / min** | Upstash Redis (`@upstash/ratelimit`) | `callerProfile.tenant_id` | `429 Too Many Requests`<br>`Retry-After: <sec>` |
| **`POST /api/orders/sync`** | Vercel (`afaq-automation`) | **30 req / min** | Upstash Redis (`@upstash/ratelimit`) | `apiKey` or Client IP | `429 Too Many Requests`<br>`Retry-After: <sec>` |
| **`GET /api/availability`** | Vercel (`afaq-automation`) | **20 req / min** | Upstash Redis (`@upstash/ratelimit`) | Client IP | `429 Too Many Requests`<br>`Retry-After: <sec>` |
| **`POST /api/webhooks/shopify`** | Vercel (`afaq-automation`) | **120 req / min** | Upstash Redis (`@upstash/ratelimit`) | `${tenantId}:${clientIp}` | `429 Too Many Requests`<br>`Retry-After: <sec>` |
| **`POST /api/webhooks/woocommerce`**| Vercel (`afaq-automation`) | **120 req / min** | Upstash Redis (`@upstash/ratelimit`) | `${tenantId}:${clientIp}` | `429 Too Many Requests`<br>`Retry-After: <sec>` |

### 4.1 Serverless Rate Limiting via Upstash Redis
* **Implementation**: [`lib/rate-limit.ts`](file:///d:/my_automation/afaq-automation/lib/rate-limit.ts)
* **Design**: Uses atomic Redis sliding-window scripts executed over HTTP/REST (`UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`).
* **Why Not In-Memory on Vercel**: Serverless function instances spin up and down concurrently; an in-memory `Map` provides no cross-lambda protection and resets on cold starts. Upstash provides a unified global counter across all edge instances.
* **Local Development Fallback**: If Upstash environment variables are not detected, `checkRateLimit()` automatically falls back to an in-memory sliding window, preventing local development environments from breaking.

---

## 5. Background Scheduled Tasks (Cron Security)

All scheduled background operations are unified under [`services/webhook-service/cron.js`](file:///d:/my_automation/afaq-automation/services/webhook-service/cron.js):

| Job Name | Schedule | Concurrency Protection | Description |
|---|---|---|---|
| **Appointment Reminders** | `0 * * * *` (Hourly) | Status Flag (`reminder_sent = true`) | Dispatches 24h appointment reminders via Meta Cloud API. |
| **Lead Follow-Up** | `0 10 * * *` (Daily 10 AM) | Stage Transition (`temperature = 'cold'`) | Re-engages warm leads inactive for >48 hours. |
| **Calendar Watch Renewal** | `0 4 * * *` (Daily 4 AM) | Expiration Window (`webhook_expires_at`) | Renews Google Calendar push notification webhooks. |
| **KB Embedding Backfill** | `*/15 * * * *` (Every 15m) | In-Process Lock (`isBackfillRunning`) + `.limit(25)` | Backfills `text-embedding-3-small` vector embeddings for newly uploaded knowledge base rows. |

---

## 6. Scaling Considerations & Future Roadmap

When scaling beyond single-instance deployments, keep the following architectural factors in mind:

### 6.1 Horizontal Scaling on Railway ($N$ Container Replicas)
* **Current State**: `webhook-service` and `chat-service` run as **single container replicas** (`1 replica`). In-memory rate limiting and in-process `node-cron` run without cross-instance contention.
* **If Scaling to Multiple Replicas**:
  1. **Rate Limiting**: `@fastify/rate-limit` will maintain independent limits per container. To enforce strict global limits across replicas, supply `redis: new Redis(process.env.REDIS_URL)` to the Fastify rate-limit plugin registration.
  2. **Cron Duplication**: `node-cron` runs within each container process. If 3 replicas run, cron jobs would trigger 3 times concurrently.
     * *Mitigation*: Wrap cron executions in PostgreSQL advisory locks (`SELECT pg_try_advisory_lock(...)`) or isolate scheduled jobs into a dedicated single-replica worker container.

### 6.2 Key Rotation Protocol
* All AES-256-GCM ciphertexts are stamped with the `enc:v1:` header prefix.
* When rotating `TOKEN_ENCRYPTION_KEY`:
  1. Add `OLD_TOKEN_ENCRYPTION_KEY` to environment variables.
  2. Update `crypto.js` to attempt decryption with `TOKEN_ENCRYPTION_KEY` first, falling back to `OLD_TOKEN_ENCRYPTION_KEY`.
  3. Execute an automated backfill script to re-encrypt all stored tokens under `enc:v2:`.
  4. Decommission the old key.

---

## 7. Security Verification Script Inventory

The following automated test scripts verify the production security posture:

* [`scripts/test-meta-signature.mjs`](file:///d:/my_automation/afaq-automation/scripts/test-meta-signature.mjs): Verifies Meta webhook rejects unsigned/tampered payloads with 401 and accepts valid HMAC.
* [`scripts/test-chat-service-auth.mjs`](file:///d:/my_automation/afaq-automation/scripts/test-chat-service-auth.mjs): Verifies `POST https://chat.ittisalo.com/send` requires `x-internal-api-key`.
* [`scripts/test-ecommerce-webhooks.mjs`](file:///d:/my_automation/afaq-automation/scripts/test-ecommerce-webhooks.mjs): Tests Shopify and WooCommerce signature verification and missing-secret alerts.
* [`scripts/test-upstash-rate-limit.mjs`](file:///d:/my_automation/afaq-automation/scripts/test-upstash-rate-limit.mjs): Asserts sliding-window rate limit enforcement against Upstash Redis.
* [`scripts/migrate-encrypt-tokens.mjs`](file:///d:/my_automation/afaq-automation/scripts/migrate-encrypt-tokens.mjs): Token encryption migration harness with dry-run and backup snapshots.
* [`scripts/rollback-encrypt-tokens.mjs`](file:///d:/my_automation/afaq-automation/scripts/rollback-encrypt-tokens.mjs): Emergency automated token decryption rollback tool.
