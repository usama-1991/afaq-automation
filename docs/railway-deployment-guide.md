# Railway Deployment Guide

We have structured the application as a single Git repository containing the Next.js frontend and multiple Node.js microservices. Railway makes it incredibly easy to deploy this setup.

## Option A: Using `railway.json` (Recommended for Monorepos)
You can define multiple services inside a `railway.json` file. Since we have a `docker-compose.yml`, Railway natively understands Docker Compose setups if you import the project.

## Option B: Deploying Services Manually in Railway Dashboard
1. Go to [Railway.app](https://railway.app/).
2. Create a New Project -> **Deploy from GitHub repo**.
3. Select this repository. Railway will detect the Next.js app at the root by default.
4. Go to the project canvas, click **New** -> **GitHub Repo** and select this repo again.
5. In the settings of the newly added service, go to **Build** -> **Root Directory** and set it to `/services/auth-service`.
6. Repeat step 4 and 5 for all other microservices (`tenant-service`, `webhook-service`, `chat-service`, `agent-service`, `billing-service`).

## Adding Supabase Database
1. You can provision PostgreSQL natively in Railway, but for Supabase Realtime and Auth, we highly recommend creating a project on [Supabase.com](https://supabase.com).
2. Grab your Supabase URL, Anon Key, and Service Role Key from the Supabase dashboard (Project Settings -> API).

## Environment Variables
1. In Railway, click on **Variables** (Shared Variables or Service Variables).
2. Add all variables from the `.env.example` file.
3. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to the Next.js frontend build.

## Domains
1. Go to the Next.js service settings -> **Networking** -> **Generate Domain**.
2. Do the same for your `webhook-service` so Meta can reach it. (e.g., `https://webhook-service-production.up.railway.app/webhook`).
