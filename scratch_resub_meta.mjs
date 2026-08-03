const WABA_ID = '26907295168876999';
const ACCESS_TOKEN = 'EAAXPqV2iEIEBRphnXCiKCogqZABuNSFFvTasBZA7VYSfsYywIuaZBb4PTXsd7Uj6AP3ZCcZBDJFqG6LNTs5KCYF3841pGGgELyjvYSbGVSObuLFm2lArpy1gFCfy8NKHq3oqxdOBjV5SEx8uzfmkV0B5P0osU7w3YLwvZBKewBCYLAA6JquJAwlPXhbeesvC7ZC7gZDZD';

async function resubscribe() {
  // Re-subscribe our app (my_automation_CRM) to the WABA
  console.log('Re-subscribing my_automation_CRM to WABA...');
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${WABA_ID}/subscribed_apps`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await res.json();
    console.log('Result:', JSON.stringify(data));
  } catch (e) {
    console.error('Error:', e.message);
  }

  // Verify
  console.log('\n=== Verifying subscriptions ===');
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${WABA_ID}/subscribed_apps`,
    { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } }
  );
  const data = await res.json();
  console.log('Current apps:', JSON.stringify(data, null, 2));
}

resubscribe();
