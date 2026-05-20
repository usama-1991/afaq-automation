export interface QuickReply {
  label: string;
  text: string;
}

export interface QuickReplyCategory {
  category: string;
  replies: QuickReply[];
}

export interface DashboardMetric {
  label: string;
  value: string;
  desc: string;
  trend?: string; // e.g. "+12.4% vs last week"
}

export interface NicheConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  agentName: string;
  greeting: string;
  systemRole: string;
  knowledgeBase: { name: string; type: string; description: string }[];
  dos: string[];
  donts: string[];
  sampleConversations: SampleConvo[];
  contacts: Contact[];
  stats: { conversations: number; avgResponse: string; sentiment: string; sentimentScore: number; resolution: number };
  quickReplies: QuickReplyCategory[];
  dashboardMetrics: DashboardMetric[];
  keyPhrases: string[];
  appointmentBased: boolean;
  ecommerceEnabled: boolean;
}

export interface SampleConvo {
  id: number;
  customerName: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  channel: 'whatsapp' | 'instagram' | 'facebook';
  messages: { role: 'customer' | 'bot'; text: string; time: string; type?: 'text' | 'gallery' }[];
  status: 'active' | 'resolved' | 'pending';
  aiActive: boolean;
}

export interface Contact {
  id: number;
  name: string;
  phone: string;
  email: string;
  visits: number;
  lastVisit: string;
  totalSpent: string;
  tags: string[];
}

const restaurantConvos: SampleConvo[] = [
  {
    id: 1, customerName: 'Sara Ahmed', avatar: 'SA', lastMessage: 'What are your working hours?', time: '2 min ago', unread: 2, channel: 'whatsapp', status: 'active', aiActive: true,
    messages: [
      { role: 'customer', text: 'Hi, what are your working hours?', time: '10:41 AM' },
      { role: 'bot', text: "Hello! Welcome to our restaurant 🍽️ We're open Mon–Sat 12pm–11pm and Sunday 1pm–10pm. Would you like to make a reservation?", time: '10:41 AM' },
      { role: 'customer', text: 'Yes please, table for 4 tonight at 8pm', time: '10:42 AM' },
      { role: 'bot', text: "Perfect! I've noted a reservation for 4 guests tonight at 8:00 PM. Can I get your name and phone number to confirm?", time: '10:42 AM' },
    ],
  },
  {
    id: 2, customerName: 'Bilal Khan', avatar: 'BK', lastMessage: 'Sent gallery: Chicken Starters', time: '18 min ago', unread: 0, channel: 'instagram', status: 'resolved', aiActive: true,
    messages: [
      { role: 'customer', text: 'Can you share starters in chicken please?', time: '22:02' },
      { role: 'bot', text: 'Sure! Here are our chicken starter options:', time: '22:03', type: 'gallery' },
    ],
  },
  {
    id: 3, customerName: 'Fatima Noor', avatar: 'FN', lastMessage: 'Do you have halal options?', time: '1h ago', unread: 1, channel: 'whatsapp', status: 'pending', aiActive: false,
    messages: [
      { role: 'customer', text: 'Do you have halal options?', time: '9:15 AM' },
      { role: 'bot', text: 'Yes! All our meat is 100% halal certified 🥩 Our entire menu is halal. Is there anything specific you would like to know about?', time: '9:15 AM' },
    ],
  },
];

const realEstateConvos: SampleConvo[] = [
  {
    id: 1, customerName: 'Omar Sheikh', avatar: 'OS', lastMessage: 'I need a 3-bed flat in Karachi', time: '5 min ago', unread: 3, channel: 'whatsapp', status: 'active', aiActive: true,
    messages: [
      { role: 'customer', text: 'Hi, I am looking for a 3 bedroom flat in Karachi', time: '11:20 AM' },
      { role: 'bot', text: "Hello Omar! Great, I can help you find the perfect property 🏠 What's your budget range and preferred area in Karachi?", time: '11:20 AM' },
      { role: 'customer', text: 'Budget is 2-3 crore, DHA or Clifton preferred', time: '11:21 AM' },
      { role: 'bot', text: "Excellent choice! I have 12 properties matching your criteria in DHA and Clifton. Would you like to see listings or schedule a viewing?", time: '11:21 AM' },
    ],
  },
  {
    id: 2, customerName: 'Hina Malik', avatar: 'HM', lastMessage: 'What documents do I need?', time: '30 min ago', unread: 0, channel: 'whatsapp', status: 'resolved', aiActive: true,
    messages: [
      { role: 'customer', text: 'What documents do I need to buy a property?', time: '10:30 AM' },
      { role: 'bot', text: "To buy a property you'll need: CNIC (original + copies), NTN certificate, Bank statements (6 months), and Proof of income. I can guide you through the entire process!", time: '10:30 AM' },
    ],
  },
];

const dentalConvos: SampleConvo[] = [
  {
    id: 1, customerName: 'Aisha Butt', avatar: 'AB', lastMessage: 'Book appointment for scaling', time: '3 min ago', unread: 2, channel: 'whatsapp', status: 'active', aiActive: true,
    messages: [
      { role: 'customer', text: 'I need to book an appointment for scaling and polishing', time: '2:10 PM' },
      { role: 'bot', text: "Hello! Welcome to our dental clinic 😊 We have availability for scaling & polishing this week. Dr. Hassan is available Tuesday at 3pm or Thursday at 11am. Which works for you?", time: '2:10 PM' },
      { role: 'customer', text: 'Thursday 11am please', time: '2:11 PM' },
      { role: 'bot', text: "Booked! ✅ Appointment confirmed: Thursday 11:00 AM with Dr. Hassan for Scaling & Polishing. You'll receive a reminder 24 hours before. Is there anything else?", time: '2:11 PM' },
    ],
  },
  {
    id: 2, customerName: 'Zaid Hassan', avatar: 'ZH', lastMessage: 'Do you do teeth whitening?', time: '45 min ago', unread: 0, channel: 'instagram', status: 'resolved', aiActive: true,
    messages: [
      { role: 'customer', text: 'Do you do teeth whitening?', time: '1:20 PM' },
      { role: 'bot', text: "Yes! We offer professional teeth whitening services starting from PKR 8,000. Results last 6-12 months. Would you like to book a consultation?", time: '1:20 PM' },
    ],
  },
];

const ecommerceConvos: SampleConvo[] = [
  {
    id: 1, customerName: 'Maryam Ali', avatar: 'MA', lastMessage: 'I want to order 2 kurtis size M', time: '1 min ago', unread: 3, channel: 'whatsapp', status: 'active', aiActive: true,
    messages: [
      { role: 'customer', text: 'Hi I want to order 2 kurtis in size M', time: '3:05 PM' },
      { role: 'bot', text: "Hello Maryam! Welcome to our store 🛍️ Which designs are you interested in? You can browse our catalog at our website or I can share our latest collection.", time: '3:05 PM' },
      { role: 'customer', text: 'Send me the lawn collection please', time: '3:06 PM' },
      { role: 'bot', text: "Here's our latest Lawn 2026 collection! 👗 Prices start from PKR 2,500. Which design do you like?", time: '3:06 PM', type: 'gallery' },
    ],
  },
  {
    id: 2, customerName: 'Sana Qureshi', avatar: 'SQ', lastMessage: 'Where is my order?', time: '20 min ago', unread: 1, channel: 'whatsapp', status: 'pending', aiActive: false,
    messages: [
      { role: 'customer', text: 'I placed order #1042 2 days ago, where is it?', time: '2:40 PM' },
      { role: 'bot', text: "Hi Sana! I checked order #1042 — it was dispatched yesterday via TCS and is currently in transit. Expected delivery tomorrow by 6pm. Tracking: TCS-8847263.", time: '2:40 PM' },
    ],
  },
];

export const niches: NicheConfig[] = [
  {
    id: 'restaurant',
    label: 'Restaurant / Food',
    icon: '🍽️',
    color: '#dc2626', // Keep main red highlights for cohesiveness or distinct warm color
    bgColor: '#fffbeb',
    agentName: 'FoodBot',
    greeting: "Hello! Welcome to our restaurant 🍽️ How can I help you today? I can help with reservations, menu queries, and orders.",
    systemRole: "You are a friendly restaurant assistant. Help customers with table reservations, menu information, order tracking, halal certification queries, operating hours, and special requests. Always be warm and welcoming.",
    knowledgeBase: [
      { name: 'Restaurant Menu 2026.pdf', type: 'PDF', description: 'Full menu with prices and descriptions' },
      { name: 'Operating Hours & Location', type: 'Text', description: 'Hours, address, Google Maps link' },
      { name: 'Reservation Guidelines', type: 'Document', description: 'Booking rules, party sizes, deposit policy' },
    ],
    dos: ['Always greet warmly', 'Confirm reservations with details', 'Suggest popular dishes', 'Mention daily specials'],
    donts: ['Never share other customers info', "Don't promise discounts without approval", 'Never argue with customers'],
    sampleConversations: restaurantConvos,
    contacts: [
      { id: 1, name: 'Sara Ahmed', phone: '+92 300 1234567', email: 'sara@gmail.com', visits: 8, lastVisit: '2 days ago', totalSpent: 'PKR 12,400', tags: ['Regular', 'VIP'] },
      { id: 2, name: 'Bilal Khan', phone: '+92 321 9876543', email: 'bilal@gmail.com', visits: 3, lastVisit: '1 week ago', totalSpent: 'PKR 4,200', tags: ['New'] },
      { id: 3, name: 'Fatima Noor', phone: '+92 333 5556667', email: '', visits: 12, lastVisit: 'Today', totalSpent: 'PKR 28,000', tags: ['VIP', 'Regular'] },
    ],
    stats: { conversations: 247, avgResponse: '1.2', sentiment: 'Positive', sentimentScore: 0.82, resolution: 91 },
    appointmentBased: true,
    ecommerceEnabled: false,
    keyPhrases: ['reservation', 'table', 'menu', 'hours', 'halal', 'book', 'location'],
    quickReplies: [
      {
        category: 'Booking & Timing',
        replies: [
          { label: 'Hours & Location', text: "We're open Mon–Sat 12pm–11pm and Sunday 1pm–10pm. We're located at Block 5, Clifton, Karachi! 📍" },
          { label: 'Confirm Reservation', text: "Perfect! I've noted a reservation for 4 guests tonight at 8:00 PM. Can I get your name and phone number to confirm?" }
        ]
      },
      {
        category: 'Menu & Food',
        replies: [
          { label: 'Halal Certificate', text: "Yes! All our meat is 100% halal certified 🥩 Our entire menu is halal. Is there anything specific you would like to know?" },
          { label: 'Recommend Starters', text: "Our top starter recommendations are the Honey Chilli Wings and Creamy Garlic Mushrooms! 🌶️🍄" }
        ]
      }
    ],
    dashboardMetrics: [
      { label: 'Total Bookings', value: '42', desc: 'Reservations scheduled today', trend: '+14% vs yesterday' },
      { label: 'Avg Table Size', value: '3.8', desc: 'Average guests per booking' },
      { label: 'Table No-Shows', value: '2', desc: 'Missed table bookings', trend: '-50% from last week' }
    ]
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    icon: '🏠',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    agentName: 'PropBot',
    greeting: "Hello! I'm your property assistant 🏠 Looking to buy, sell, or rent? Tell me what you need and I'll find the best options for you.",
    systemRole: "You are a professional real estate assistant. Help clients find properties based on their budget and preferences, provide information about listings, schedule viewings, explain documentation requirements, and answer queries about the buying/renting process.",
    knowledgeBase: [
      { name: 'Current Listings 2026.xlsx', type: 'Spreadsheet', description: 'All available properties with prices' },
      { name: 'Documentation Guide.pdf', type: 'PDF', description: 'Step-by-step buying/renting process' },
      { name: 'Area Price Guide.pdf', type: 'PDF', description: 'Market rates by neighbourhood' },
    ],
    dos: ['Qualify budget before showing listings', 'Confirm viewing appointments', 'Provide exact property details', 'Follow up after viewings'],
    donts: ['Never quote prices without checking current listings', "Don't promise unavailable properties", 'Never share client personal details'],
    sampleConversations: realEstateConvos,
    contacts: [
      { id: 1, name: 'Omar Sheikh', phone: '+92 321 1112223', email: 'omar@email.com', visits: 5, lastVisit: 'Today', totalSpent: '—', tags: ['Buyer', 'Hot Lead'] },
      { id: 2, name: 'Hina Malik', phone: '+92 300 4445556', email: 'hina@email.com', visits: 2, lastVisit: '3 days ago', totalSpent: '—', tags: ['Renter'] },
    ],
    stats: { conversations: 183, avgResponse: '2.1', sentiment: 'Positive', sentimentScore: 0.75, resolution: 87 },
    appointmentBased: true,
    ecommerceEnabled: false,
    keyPhrases: ['buy', 'rent', 'flat', 'house', 'viewing', 'price', 'dha', 'clifton'],
    quickReplies: [
      {
        category: 'Property Tours',
        replies: [
          { label: 'Schedule Viewing', text: "I'd love to show you the property! Are you free for a viewing this Saturday at 2:00 PM or Sunday at 11:00 AM?" },
          { label: 'Required Documents', text: "To buy or rent a property, you'll need: CNIC (original + copies), NTN certificate, 6 months bank statements, and income proof. 📋" }
        ]
      },
      {
        category: 'Available Listings',
        replies: [
          { label: 'DHA DHA-V Listings', text: "We have exclusive premium 3-Bed apartments in DHA Phase 6 and 8. Prices start from PKR 2.8 Crore. Would you like a brochure? 🏢" }
        ]
      }
    ],
    dashboardMetrics: [
      { label: 'Hot Prospects', value: '18', desc: 'Leads actively seeking listings', trend: '+20% this week' },
      { label: 'Active Listings', value: '154', desc: 'Properties currently in catalog' },
      { label: 'Scheduled Viewings', value: '12', desc: 'Site visits planned this weekend', trend: '+3 viewings' }
    ]
  },
  {
    id: 'dental',
    label: 'Dental Clinic',
    icon: '🦷',
    color: '#10b981',
    bgColor: '#ecfdf5',
    agentName: 'DentalBot',
    greeting: "Hello! Welcome to our dental clinic 😊 I can help you book appointments, answer questions about our services, and share pricing. How can I assist?",
    systemRole: "You are a dental clinic assistant. Help patients book appointments, provide information about dental services and pricing, send appointment reminders, answer FAQs about procedures, and handle rescheduling requests. Always be caring and professional.",
    knowledgeBase: [
      { name: 'Services & Pricing.pdf', type: 'PDF', description: 'All dental services with prices' },
      { name: 'Doctors Schedule', type: 'Spreadsheet', description: 'Doctor availability calendar' },
      { name: 'Pre/Post Care Instructions', type: 'Document', description: 'Patient care guidelines' },
    ],
    dos: ['Confirm appointment details', 'Send pre-appointment reminders', 'Be empathetic with anxious patients', 'Always recommend consulting doctor for diagnosis'],
    donts: ['Never diagnose medical conditions', "Don't guarantee specific treatment outcomes", 'Never share patient records'],
    sampleConversations: dentalConvos,
    contacts: [
      { id: 1, name: 'Aisha Butt', phone: '+92 300 7778889', email: 'aisha@email.com', visits: 4, lastVisit: 'Today', totalSpent: 'PKR 22,000', tags: ['Regular'] },
      { id: 2, name: 'Zaid Hassan', phone: '+92 321 2223334', email: '', visits: 1, lastVisit: '1 week ago', totalSpent: 'PKR 3,500', tags: ['New'] },
    ],
    stats: { conversations: 312, avgResponse: '0.9', sentiment: 'Positive', sentimentScore: 0.88, resolution: 94 },
    appointmentBased: true,
    ecommerceEnabled: false,
    keyPhrases: ['scaling', 'appointment', 'whitening', 'dentist', 'pain', 'consultation'],
    quickReplies: [
      {
        category: 'Bookings',
        replies: [
          { label: 'Suggest Clinic Hours', text: "We're open Mon–Sat 9am–8pm. Dr. Hassan is available on Tuesday at 3:00 PM or Thursday at 11:00 AM. Which one works?" },
          { label: 'Confirm Scaling', text: "Confirmed! ✅ Scaling & Polishing appointment on Thursday at 11:00 AM with Dr. Hassan. Please arrive 10 min early." }
        ]
      },
      {
        category: 'Treatments',
        replies: [
          { label: 'Teeth Whitening Cost', text: "Our professional teeth whitening packages start from PKR 8,000. Results are visible in a single session! 🦷✨" }
        ]
      }
    ],
    dashboardMetrics: [
      { label: 'OPD Appointments', value: '28', desc: 'Patients booked today', trend: '+5 patients' },
      { label: 'Patient Retention', value: '94.2%', desc: 'Return visits percentage' },
      { label: 'Avg Ticket Value', value: 'PKR 7,500', desc: 'Average dental service spend', trend: '+12% vs last month' }
    ]
  },
  {
    id: 'ecommerce',
    label: 'eCommerce / Fashion',
    icon: '🛍️',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    agentName: 'ShopBot',
    greeting: "Hello! Welcome to our store 🛍️ Browse our latest collection, place orders, or track your existing orders — all right here on WhatsApp!",
    systemRole: "You are an eCommerce sales assistant. Help customers browse products, place orders, process payments via EasyPaisa/JazzCash/Stripe, track deliveries, handle returns and exchanges, and answer product queries. Be enthusiastic and helpful.",
    knowledgeBase: [
      { name: 'Product Catalog 2026.pdf', type: 'PDF', description: 'Full catalog with images and prices' },
      { name: 'Shipping & Returns Policy', type: 'Document', description: 'Delivery timeframes and return rules' },
      { name: 'Size Guide.pdf', type: 'PDF', description: 'Sizing chart for all products' },
    ],
    dos: ['Show product images when relevant', 'Upsell complementary products', 'Confirm order details before payment', 'Send order confirmation immediately'],
    donts: ["Don't promise delivery dates you can't confirm", 'Never share payment card details via chat', "Don't accept returns without following policy"],
    sampleConversations: ecommerceConvos,
    contacts: [
      { id: 1, name: 'Maryam Ali', phone: '+92 333 9990001', email: 'maryam@gmail.com', visits: 7, lastVisit: 'Today', totalSpent: 'PKR 18,600', tags: ['VIP', 'Regular'] },
      { id: 2, name: 'Sana Qureshi', phone: '+92 300 1112222', email: 'sana@email.com', visits: 3, lastVisit: '5 days ago', totalSpent: 'PKR 6,200', tags: ['Regular'] },
    ],
    stats: { conversations: 521, avgResponse: '1.8', sentiment: 'Neutral', sentimentScore: 0.65, resolution: 83 },
    appointmentBased: false,
    ecommerceEnabled: true,
    keyPhrases: ['order', 'track', 'lawn', 'kurti', 'size', 'price', 'delivery'],
    quickReplies: [
      {
        category: 'Ordering & Sizes',
        replies: [
          { label: 'Ask Size & Code', text: "Sure! Could you please let me know your preferred size (S, M, L, XL) and the design name so I can check availability? 👗" },
          { label: 'Confirm Order Details', text: "Awesome! I've registered your order for Lawn Kurti (Size M). Total is PKR 2,500. Please share your complete delivery address." }
        ]
      },
      {
        category: 'Shipping & Returns',
        replies: [
          { label: 'Tracking Info', text: "You can track your package via TCS using your tracking number: TCS-8847263. Delivery takes 2-3 business days! 🚚" },
          { label: 'Return Policy Details', text: "We offer a hassle-free 7-day return policy for unused items with original tags intact. 🔄" }
        ]
      }
    ],
    dashboardMetrics: [
      { label: 'Gross Revenue', value: 'PKR 30,140.00', desc: 'Sales generated today', trend: '+18.2% vs yesterday' },
      { label: 'Conversion Rate', value: '63.6%', desc: 'Purchase Intent to Order', trend: '+3.1% this week' },
      { label: 'AI Orders Made', value: '7', desc: 'Orders closed by bot interactions' }
    ]
  },
  {
    id: 'salon',
    label: 'Salon / Spa',
    icon: '💅',
    color: '#ec4899',
    bgColor: '#fdf2f8',
    agentName: 'GlowBot',
    greeting: "Hi beautiful! 💅 Welcome to our salon. Book appointments, explore our services, or ask about prices — I'm here to help!",
    systemRole: "You are a salon/spa assistant. Help customers book appointments for hair, nails, facials, and other beauty services. Provide pricing, check stylist availability, send reminders, and handle cancellations.",
    knowledgeBase: [
      { name: 'Services Menu.pdf', type: 'PDF', description: 'All beauty services with prices' },
      { name: 'Stylist Availability', type: 'Spreadsheet', description: 'Booking calendar per stylist' },
    ],
    dos: ['Always ask for preferred stylist', 'Confirm appointment 24h before', 'Suggest add-ons that complement booking', 'Send aftercare tips'],
    donts: ["Don't double-book appointments", 'Never suggest specific medical skin treatments', "Don't promise specific results"],
    sampleConversations: [],
    contacts: [],
    stats: { conversations: 198, avgResponse: '1.5', sentiment: 'Positive', sentimentScore: 0.85, resolution: 89 },
    appointmentBased: true,
    ecommerceEnabled: false,
    keyPhrases: ['hair', 'nails', 'stylist', 'facial', 'bridal', 'book'],
    quickReplies: [
      {
        category: 'Services',
        replies: [
          { label: 'Confirm Styling Slot', text: "Glow on! 💅 You're booked for Hair Highlights with Sarah on Friday at 3:00 PM. We look forward to pampering you!" },
          { label: 'Bridal Package Info', text: "Our premium bridal package starts at PKR 25,000, including full makeup, hair styling, and skin prep. 👰✨" }
        ]
      }
    ],
    dashboardMetrics: [
      { label: 'Stylist Capacity', value: '88%', desc: 'Active stylists scheduled today', trend: '+5%' },
      { label: 'Services Booked', value: '34', desc: 'Beauty bookings today' },
      { label: 'Repeat Rate', value: '76%', desc: 'Loyal customer return percentage' }
    ]
  },
  {
    id: 'clinic',
    label: 'Medical Clinic',
    icon: '🏥',
    color: '#06b6d4',
    bgColor: '#ecfeff',
    agentName: 'MediBot',
    greeting: "Hello! Welcome to our clinic 🏥 I can help you book appointments, check doctor availability, and answer general health queries.",
    systemRole: "You are a medical clinic assistant. Help patients book appointments with appropriate doctors, provide information about clinic services, handle appointment reminders and rescheduling. Never provide medical diagnosis — always recommend consulting a doctor.",
    knowledgeBase: [
      { name: 'Doctors & Specializations', type: 'Document', description: 'All doctors, specializations, schedules' },
      { name: 'Services & Fees', type: 'PDF', description: 'Consultation and procedure pricing' },
    ],
    dos: ['Always recommend appropriate specialist', 'Confirm appointment with full details', 'Remind patients to bring relevant reports'],
    donts: ['NEVER diagnose or prescribe', "Don't share other patient information", 'Never promise specific medical outcomes'],
    sampleConversations: [],
    contacts: [],
    stats: { conversations: 156, avgResponse: '1.1', sentiment: 'Positive', sentimentScore: 0.79, resolution: 92 },
    appointmentBased: true,
    ecommerceEnabled: false,
    keyPhrases: ['doctor', 'opd', 'appointment', 'fee', 'consultation', 'reports'],
    quickReplies: [
      {
        category: 'Patient Booking',
        replies: [
          { label: 'OPD Schedule Slot', text: "Booked! Your OPD consultation is confirmed for Dr. Irfan (Cardiologist) on Monday at 10:00 AM. Please bring previous reports. 🏥" },
          { label: 'No Diagnosis Alert', text: "Please consult our physician directly for any medical concerns, as we cannot provide diagnosis or write prescriptions over chat. 👨‍⚕️" }
        ]
      }
    ],
    dashboardMetrics: [
      { label: 'OPD Appointments', value: '45', desc: 'Total patients schedule today', trend: '+8 today' },
      { label: 'Emergency Walk-ins', value: '3', desc: 'Critical case arrivals today' },
      { label: 'Patient Care Rating', value: '4.8/5.0', desc: 'Post-consultation customer score' }
    ]
  },
];

export function getNiche(id: string): NicheConfig {
  return niches.find(n => n.id === id) ?? niches[0];
}
