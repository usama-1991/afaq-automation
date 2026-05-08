# Meta API Setup Guide

## 1. Create a Meta Developer App
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Click **My Apps** -> **Create App**.
3. Select **Other** -> **Business**.
4. Enter your App Name and Contact Email.

## 2. Add Products
1. In your App Dashboard, scroll to **Add Products to Your App**.
2. Set up **WhatsApp**.
3. Set up **Messenger** (if applicable).
4. Set up **Instagram Graph API**.

## 3. Configure WhatsApp Cloud API
1. In the left menu, under WhatsApp, click **API Setup**.
2. Meta provides a temporary access token and a Test Phone Number.
3. For production, you will need to add a real phone number in **WhatsApp Manager**.
4. To get a permanent token, create a System User in your Meta Business Settings and generate a token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.

## 4. Set Up Webhooks
1. In your App Dashboard, click **Webhooks**.
2. Select **WhatsApp Business Account** from the dropdown.
3. Click **Subscribe to this object**.
4. Enter your Callback URL (e.g., `https://your-webhook-service.up.railway.app/webhook`).
5. Enter a Verify Token (this is a custom string you define). It must match the `META_WEBHOOK_VERIFY_TOKEN` in your `.env` file.
6. Click **Verify and Save**.
7. Subscribe to the `messages` field.

## 5. Environment Variables
Ensure your `docker-compose.yml` or Railway variables have:
- `META_APP_SECRET`: from your Meta App Settings -> Basic.
- `META_WEBHOOK_VERIFY_TOKEN`: the token you created in step 4.
- `META_ACCESS_TOKEN`: the permanent System User token.
