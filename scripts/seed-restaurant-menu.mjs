// scripts/seed-restaurant-menu.mjs
// Populates Gourmet Bites Bistro with a full menu catalog & pricing in knowledge_base and products tables

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPaths = ['.env.local', '.env'];
  for (const envPath of envPaths) {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valParts] = trimmed.split('=');
          const val = valParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const RESTAURANT_TENANT_ID = '11111111-1111-4111-a111-111111111111'; // Gourmet Bites Bistro

const MENU_PRODUCTS = [
  { name: 'Artisan BBQ Chicken Wings', category: 'Starters', price: 14.99, description: 'Crispy fried wings tossed in house smoky BBQ sauce with ranch dip.' },
  { name: 'Truffle Mushroom Burger', category: 'Burgers', price: 18.50, description: 'Angus beef patty, black truffle aioli, swiss cheese, and sauteed mushrooms on brioche bun.' },
  { name: 'Double Cheese Smash Burger', category: 'Burgers', price: 16.00, description: 'Dual smashed Angus patties, cheddar cheese, caramelized onions, pickles & secret sauce.' },
  { name: 'Creamy Alfredo Fettuccine', category: 'Pasta', price: 17.99, description: 'Fresh fettuccine pasta in rich parmesan garlic cream sauce with grilled chicken breast.' },
  { name: 'Wood-Fired Pepperoni Pizza', category: 'Pizza', price: 21.99, description: 'Thin crust sourdough pizza with Italian pepperoni, mozzarella, and fresh basil.' },
  { name: 'Loaded Gourmet Fries', category: 'Starters', price: 8.99, description: 'Crispy fries topped with melted cheddar, jalapenos, crispy bacon bits & chipotle drizzle.' },
  { name: 'Molten Chocolate Lava Cake', category: 'Desserts', price: 9.50, description: 'Warm chocolate cake with oozing center, served with vanilla bean ice cream.' },
  { name: 'Fresh Mint Lemonade', category: 'Beverages', price: 4.99, description: 'Refreshing blended lemon, fresh mint leaves, and crushed ice.' }
];

const MENU_KB = {
  title: 'Gourmet Bites Bistro Delivery Menu & Pricing 2026',
  content: `=== GOURMET BITES BISTRO DELIVERY MENU & PRICING ===

1. STARTERS & APPETIZERS:
- Artisan BBQ Chicken Wings ($14.99): Crispy wings with smoky BBQ sauce & ranch.
- Loaded Gourmet Fries ($8.99): Melted cheddar, jalapenos & chipotle drizzle.

2. GOURMET BURGERS & MAINS:
- Truffle Mushroom Burger ($18.50): Angus beef, truffle aioli & swiss cheese.
- Double Cheese Smash Burger ($16.00): Dual Angus patties with cheddar & secret sauce.
- Wood-Fired Pepperoni Pizza ($21.99): Sourdough crust with Italian pepperoni.

3. PASTA, DESSERTS & DRINKS:
- Creamy Alfredo Fettuccine ($17.99): Parmesan cream sauce with grilled chicken.
- Molten Chocolate Lava Cake ($9.50): Warm cake with vanilla bean ice cream.
- Fresh Mint Lemonade ($4.99): Fresh mint and lemon blend.

DELIVERY INFO & POLICIES:
- Average Delivery Time: 30 to 45 minutes.
- Payment Methods Accepted: Cash on Delivery (COD) and Online Card Payment.
- We require customer name, delivery address, email, and payment method to confirm any order.`
};

async function seedRestaurantMenu() {
  console.log('🍔 Seeding Gourmet Bites Bistro Full Food Menu & Knowledge Base...\n');

  // 1. Seed Knowledge Base Entry
  await supabase.from('knowledge_base').delete().eq('tenant_id', RESTAURANT_TENANT_ID).eq('title', MENU_KB.title);
  const { error: kbErr } = await supabase
    .from('knowledge_base')
    .insert({
      tenant_id: RESTAURANT_TENANT_ID,
      title: MENU_KB.title,
      content: MENU_KB.content,
      kb_type: 'menu',
      is_active: true
    });

  if (kbErr) {
    console.error('❌ Failed to insert menu KB entry:', kbErr.message);
  } else {
    console.log('✅ Knowledge Base Menu Article added successfully!');
  }

  // 2. Seed Products Table
  await supabase.from('products').delete().eq('tenant_id', RESTAURANT_TENANT_ID);
  for (const prod of MENU_PRODUCTS) {
    const { error: pErr } = await supabase
      .from('products')
      .insert({
        tenant_id: RESTAURANT_TENANT_ID,
        name: prod.name,
        category: prod.category,
        price: prod.price,
        description: prod.description
      });

    if (pErr) {
      console.warn(`⚠️ Warning inserting product ${prod.name}: ${pErr.message}`);
    } else {
      console.log(`✅ Product added: ${prod.name} ($${prod.price})`);
    }
  }

  console.log('\n🎉 Gourmet Bites Bistro Menu & Pricing Seeded Successfully!\n');
}

seedRestaurantMenu().catch(err => {
  console.error('Fatal Menu Seeding Error:', err);
  process.exit(1);
});
