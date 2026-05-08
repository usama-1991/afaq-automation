# Detailed Railway Manual Deployment Guide

This guide provides a step-by-step walkthrough for deploying the **Afaq Automation** monorepo on Railway. Since the project contains a Next.js frontend and six independent Node.js microservices, we use Railway's "Root Directory" feature to isolate each deployment.

## Phase 1: Deploying the Frontend (Root)

1.  **Login to Railway**: Go to [Railway.app](https://railway.app/).
2.  **Create Project**: Click **New Project** > **Deploy from GitHub repo**.
3.  **Select Repo**: Select your `afaq-automation` repository.
4.  **Automatic Detection**: Railway will detect the `package.json` at the root and deploy the Next.js app automatically. 
5.  **Configure Frontend Variables**: 
    - Go to the service **Variables** tab.
    - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Phase 2: Deploying Microservices

For each microservice in the `services/` directory, follow these steps:

### 1. Add the Service to Canvas
- On the Project Canvas, click **New** (top right) > **GitHub Repo**.
- Select the `afaq-automation` repository again.

### 2. Set the Root Directory
- Click on the newly created service card.
- Go to the **Settings** tab.
- Scroll to **Build** > **Root Directory**.
- Set it to the specific service path (e.g., `/services/webhook-service`).
- Railway will restart the build using ONLY the files in that folder.

### 3. Configure Networking
- Go to the **Variables** tab and add `PORT` (e.g., `3003` for webhook-service).
- If the service needs to be public (like `webhook-service` for Meta API):
    - Go to **Settings** > **Networking**.
    - Click **Generate Domain**.
    - Use this URL as your Callback URL in the Meta Developer Portal.

---

## Phase 3: Service Port Mapping

Ensure each service is configured with its corresponding port in the **Variables** tab:

| Service | Path | Default Port | Public URL Required? |
| :--- | :--- | :--- | :--- |
| **Frontend** | `/` | 3000 | Yes |
| **Auth Service** | `/services/auth-service` | 3001 | No |
| **Tenant Service** | `/services/tenant-service` | 3002 | No |
| **Webhook Service** | `/services/webhook-service` | 3003 | **Yes** (For Meta) |
| **Chat Service** | `/services/chat-service` | 3004 | No |
| **Agent Service** | `/services/agent-service` | 3005 | No |
| **Billing Service** | `/services/billing-service` | 3006 | No |

## Phase 4: Shared Environment Variables

Most services will need access to your Supabase credentials. You can create a **Reference Variable** or simply paste them into each service:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `META_ACCESS_TOKEN` (for Chat and Webhook services)
