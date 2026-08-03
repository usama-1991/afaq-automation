const WABA_ID = '26907295168876999';
const ACCESS_TOKEN = 'EAAXPqV2iEIEBRphnXCiKCogqZABuNSFFvTasBZA7VYSfsYywIuaZBb4PTXsd7Uj6AP3ZCcZBDJFqG6LNTs5KCYF3841pGGgELyjvYSbGVSObuLFm2lArpy1gFCfy8NKHq3oqxdOBjV5SEx8uzfmkV0B5P0osU7w3YLwvZBKewBCYLAA6JquJAwlPXhbeesvC7ZC7gZDZD';

// Apps to REMOVE (keep only my_automation_CRM = 1635701210878081)
const appsToRemove = [
  { id: '2202427980234937', name: 'WA DevX Webhook Events 1P App' },
  { id: '987975820849657', name: 'RealEstateBot' },
];

async function unsubscribeApps() {
  for (const app of appsToRemove) {
    console.log(`\nUnsubscribing "${app.name}" (${app.id}) from WABA...`);
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${WABA_ID}/subscribed_apps`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ app_id: app.id }),
        }
      );
      const data = await res.json();
      console.log(`Result:`, JSON.stringify(data));
    } catch (e) {
      console.error(`Error unsubscribing ${app.name}:`, e.message);
    }
  }

  // Verify
  console.log('\n=== Verifying remaining subscriptions ===');
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${WABA_ID}/subscribed_apps`,
    { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } }
  );
  const data = await res.json();
  console.log('Remaining apps:', JSON.stringify(data, null, 2));
}

unsubscribeApps();
