const TOKEN = 'EAAXPqV2iEIEBRphnXCiKCogqZABuNSFFvTasBZA7VYSfsYywIuaZBb4PTXsd7Uj6AP3ZCcZBDJFqG6LNTs5KCYF3841pGGgELyjvYSbGVSObuLFm2lArpy1gFCfy8NKHq3oqxdOBjV5SEx8uzfmkV0B5P0osU7w3YLwvZBKewBCYLAA6JquJAwlPXhbeesvC7ZC7gZDZD';

async function verifyToken() {
  console.log("Checking Meta Access Token validity via Graph API /me...");
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${TOKEN}`);
    const data = await res.json();
    
    if (!res.ok) {
      console.error("❌ Meta API Error:", data);
      return;
    }
    
    console.log("✅ Token is VALID!");
    console.log("Connected Page/App Details:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("❌ Fetch failed:", e.message);
  }
}

verifyToken();
