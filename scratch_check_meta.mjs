// Check all Meta apps subscribed to your WhatsApp Business Account
// This will reveal if a second app (e.g., n8n) is also receiving webhooks

const WABA_ID = '26907295168876999'; // From your webhook payload entry.id
const ACCESS_TOKEN = 'EAAXPqV2iEIEBRphnXCiKCogqZABuNSFFvTasBZA7VYSfsYywIuaZBb4PTXsd7Uj6AP3ZCcZBDJFqG6LNTs5KCYF3841pGGgELyjvYSbGVSObuLFm2lArpy1gFCfy8NKHq3oqxdOBjV5SEx8uzfmkV0B5P0osU7w3YLwvZBKewBCYLAA6JquJAwlPXhbeesvC7ZC7gZDZD';

async function checkSubscriptions() {
  // 1. Check subscribed apps for the WABA
  console.log('=== Checking WABA Subscribed Apps ===');
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${WABA_ID}/subscribed_apps`,
      { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } }
    );
    const data = await res.json();
    console.log('Subscribed apps:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error checking subscribed apps:', e.message);
  }

  // 2. Check phone number details  
  console.log('\n=== Checking Phone Number Details ===');
  const PHONE_ID = '1081880905011541';
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_ID}?fields=verified_name,display_phone_number,quality_rating,messaging_limit_tier`,
      { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } }
    );
    const data = await res.json();
    console.log('Phone details:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 3. Check the WABA itself
  console.log('\n=== Checking WABA Details ===');
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${WABA_ID}?fields=name,id,message_template_namespace,on_behalf_of_business_info`,
      { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } }
    );
    const data = await res.json();
    console.log('WABA details:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkSubscriptions();
