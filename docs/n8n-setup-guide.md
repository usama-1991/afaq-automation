# n8n Setup Guide

## Overview
We use n8n to handle complex AI agent routing and custom workflows when a message is received from Meta.

## Installation (Docker)
1. Add the following to a `docker-compose.yml` (or use Railway):
```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.yourdomain.com/
      - GENERIC_TIMEZONE=UTC
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
```
2. Run `docker-compose up -d`

## Setup
1. Navigate to `http://localhost:5678` (or your domain).
2. Create an admin account.
3. Go to **Workflows** -> **Import from File**.
4. Import the `n8n-templates.json` file provided in this folder.
5. In the imported workflow, configure the **Webhook** node to generate a Production URL.
6. Copy that Webhook URL and place it in your `.env.example` under `N8N_WEBHOOK_URL`.
7. Activate the workflow.

Now, whenever `agent-service` triggers n8n, the workflow will process the message and use AI nodes (OpenAI/Anthropic) to determine the response!
