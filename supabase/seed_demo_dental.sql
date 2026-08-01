-- ============================================================================
-- Ittisalo Demo Seed: Dental/Medical Clinic Niche
-- 30 days of realistic dummy data for demo recording
-- Run in Supabase SQL Editor with service_role or superuser access
-- ============================================================================

-- STEP 0: Configure the Demo Tenant for Dental Niche
UPDATE public.tenants 
SET 
  niche = 'dental',
  business_name = 'SmileCare Dental Clinic',
  business_phone = '923001234567',
  meta_connected = true,
  plan = 'enterprise',
  plan_status = 'active',
  onboarding_completed = true,
  website = 'https://smilecare.pk',
  location = 'DHA Phase 5, Lahore',
  default_currency = 'PKR'
WHERE id = '00000000-0000-0000-0000-111111111111';

-- STEP 1: Create Conversations (35 patients over 30 days)
INSERT INTO public.conversations (id, tenant_id, platform, external_conversation_id, customer_name, status, created_at, updated_at) VALUES
('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923334567801', 'Ayesha Malik',    'resolved', now() - interval '29 days', now() - interval '29 days'),
('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923214567802', 'Ahmed Raza',      'resolved', now() - interval '28 days', now() - interval '28 days'),
('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923004567803', 'Fatima Noor',     'resolved', now() - interval '27 days', now() - interval '27 days'),
('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923154567804', 'Usman Tariq',     'resolved', now() - interval '26 days', now() - interval '26 days'),
('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923024567805', 'Zainab Shah',     'resolved', now() - interval '25 days', now() - interval '25 days'),
('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923364567806', 'Bilal Khan',      'resolved', now() - interval '23 days', now() - interval '23 days'),
('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923134567807', 'Sara Ahmed',      'resolved', now() - interval '22 days', now() - interval '22 days'),
('c0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923454567808', 'Hamza Ali',       'resolved', now() - interval '21 days', now() - interval '21 days'),
('c0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923074567809', 'Hira Butt',       'resolved', now() - interval '20 days', now() - interval '20 days'),
('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923234567810', 'Imran Siddiqui',  'resolved', now() - interval '19 days', now() - interval '19 days'),
('c0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923414567811', 'Anam Zaidi',      'resolved', now() - interval '18 days', now() - interval '18 days'),
('c0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923064567812', 'Omer Farooq',     'resolved', now() - interval '17 days', now() - interval '17 days'),
('c0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923504567813', 'Sana Qureshi',    'resolved', now() - interval '15 days', now() - interval '15 days'),
('c0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923184567814', 'Ali Hassan',      'resolved', now() - interval '14 days', now() - interval '14 days'),
('c0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923294567815', 'Mehak Iqbal',     'resolved', now() - interval '13 days', now() - interval '13 days'),
('c0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923564567816', 'Kamran Javed',    'resolved', now() - interval '12 days', now() - interval '12 days'),
('c0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923094567817', 'Nadia Aslam',     'resolved', now() - interval '11 days', now() - interval '11 days'),
('c0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923374567818', 'Faisal Mehmood',  'resolved', now() - interval '10 days', now() - interval '10 days'),
('c0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923174567819', 'Rabia Nawaz',     'resolved', now() - interval '9 days',  now() - interval '9 days'),
('c0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923424567820', 'Tariq Mahmood',   'resolved', now() - interval '8 days',  now() - interval '8 days'),
('c0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923254567821', 'Amna Riaz',       'resolved', now() - interval '7 days',  now() - interval '7 days'),
('c0000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923604567822', 'Shahid Awan',     'resolved', now() - interval '6 days',  now() - interval '6 days'),
('c0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923114567823', 'Maryam Hussain',  'resolved', now() - interval '5 days',  now() - interval '5 days'),
('c0000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923484567824', 'Junaid Akram',    'resolved', now() - interval '4 days',  now() - interval '4 days'),
('c0000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923034567825', 'Uzma Batool',     'resolved', now() - interval '3 days',  now() - interval '3 days'),
('c0000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923394567826', 'Adeel Akhtar',    'resolved', now() - interval '2 days',  now() - interval '2 days'),
('c0000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923164567827', 'Samina Rashid',   'resolved', now() - interval '2 days',  now() - interval '1 day'),
('c0000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923524567828', 'Waqas Gill',      'resolved', now() - interval '1 day',   now() - interval '1 day'),
('c0000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923274567829', 'Kiran Shahzadi',  'resolved', now() - interval '1 day',   now() - interval '12 hours'),
('c0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923674567830', 'Hassan Rauf',     'open',     now() - interval '4 hours', now() - interval '30 minutes'),
('c0000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923204567831', 'Lubna Iftikhar',  'open',     now() - interval '3 hours', now() - interval '45 minutes'),
('c0000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923547890832', 'Naveed Ashraf',   'open',     now() - interval '2 hours', now() - interval '1 hour'),
('c0000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923107890833', 'Sobia Parveen',   'resolved', now() - interval '5 hours', now() - interval '4 hours'),
('c0000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923657890834', 'Asad Mehmood',    'resolved', now() - interval '6 hours', now() - interval '5 hours'),
('c0000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-111111111111', 'whatsapp', '923457890835', 'Rubina Kanwal',   'resolved', now() - interval '8 hours', now() - interval '7 hours')
ON CONFLICT (tenant_id, external_conversation_id) DO NOTHING;


-- STEP 2: Messages (realistic dental conversations)
INSERT INTO public.messages (tenant_id, conversation_id, sender_type, content, created_at) VALUES
-- Conv 1: Ayesha Malik - Scaling
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000001', 'customer', 'Assalam o Alaikum, I want to book an appointment for scaling and polishing please', now() - interval '29 days' + interval '10 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000001', 'bot', 'Walaikum Assalam! Welcome to SmileCare Dental Clinic. We would love to help you book a scaling and polishing appointment. Dr. Hassan is available on Wednesday at 3:00 PM or Thursday at 11:00 AM. Which time works best for you?', now() - interval '29 days' + interval '10 minutes 8 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000001', 'customer', 'Wednesday at 3 PM works', now() - interval '29 days' + interval '12 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000001', 'bot', 'Perfect! Your appointment is confirmed. Scaling and Polishing with Dr. Hassan Ahmed on Wednesday at 3:00 PM at SmileCare Dental, DHA Phase 5. Please arrive 10 minutes early. We will send a reminder the day before!', now() - interval '29 days' + interval '12 minutes 6 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000001', 'customer', 'Thank you so much! What will be the cost?', now() - interval '29 days' + interval '15 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000001', 'bot', 'Scaling and Polishing at SmileCare costs PKR 3,000 - 5,000 depending on the condition. Dr. Hassan will assess and give you the exact cost before starting. Any other questions?', now() - interval '29 days' + interval '15 minutes 7 seconds'),

-- Conv 2: Ahmed Raza - Root canal emergency
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000002', 'customer', 'Hi, I have severe tooth pain since 2 days. Is this an emergency?', now() - interval '28 days' + interval '5 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000002', 'bot', 'Hello Ahmed! I am sorry to hear about your pain. Severe tooth pain lasting 2 days could indicate a dental infection. We recommend an urgent consultation. Emergency Slot Available with Dr. Fatima Zahra (Endodontist) Today at 5:00 PM. Shall I book this for you?', now() - interval '28 days' + interval '5 minutes 9 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000002', 'customer', 'Yes please book it ASAP', now() - interval '28 days' + interval '6 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000002', 'bot', 'Emergency appointment confirmed! Emergency Dental Consultation with Dr. Fatima Zahra Today at 5:00 PM at SmileCare Dental, DHA Phase 5. In the meantime, you can take Brufen 400mg for pain relief. Avoid very hot or cold foods. See you soon!', now() - interval '28 days' + interval '6 minutes 7 seconds'),

-- Conv 3: Fatima Noor - Braces
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000003', 'customer', 'I want to get braces. How much do they cost and how long does the treatment take?', now() - interval '27 days' + interval '20 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000003', 'bot', 'Hi Fatima! Great question. Here are our orthodontic options: Metal Braces PKR 80,000-120,000 (12-18 months), Ceramic Braces PKR 120,000-160,000 (12-18 months), Invisalign PKR 250,000-400,000 (6-12 months). All prices include follow-up visits. We offer installment plans too! Dr. Usman Ali (Orthodontist) offers free initial consultations. Would you like to book one?', now() - interval '27 days' + interval '20 minutes 11 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000003', 'customer', 'Ceramic braces sound good. Can I do installments?', now() - interval '27 days' + interval '25 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000003', 'bot', 'Absolutely! For ceramic braces, we offer 3 Installments at PKR 53,000/month or 6 Installments at PKR 27,000/month. First consultation is FREE. Dr. Usman is available Saturday at 2:00 PM. Shall I book it?', now() - interval '27 days' + interval '25 minutes 8 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000003', 'customer', 'Yes please Saturday 2pm is perfect', now() - interval '27 days' + interval '28 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000003', 'bot', 'Booked! Free orthodontic consultation with Dr. Usman Ali, Saturday 2:00 PM. See you then!', now() - interval '27 days' + interval '28 minutes 6 seconds'),

-- Conv 4: Usman Tariq - Filling
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000004', 'customer', 'How much for a dental filling?', now() - interval '26 days' + interval '8 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000004', 'bot', 'Hi Usman! Filling prices at SmileCare: Composite Filling PKR 3,000-6,000, Ceramic Inlay PKR 8,000-12,000. Price depends on cavity size. Want to book a checkup?', now() - interval '26 days' + interval '8 minutes 9 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000004', 'customer', 'Book me for this Friday', now() - interval '26 days' + interval '11 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000004', 'bot', 'Filling consultation booked! Friday 2:00 PM with Dr. Hassan. See you!', now() - interval '26 days' + interval '11 minutes 6 seconds'),

-- Conv 5: Zainab Shah - Insurance
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000005', 'customer', 'Do you accept insurance? I have Jubilee Health', now() - interval '25 days' + interval '7 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000005', 'bot', 'Hi Zainab! Yes, we work with several insurance providers including Jubilee Health, EFU Life, Allianz, and Adamjee Insurance. Please bring your insurance card. We handle the claim process for you!', now() - interval '25 days' + interval '7 minutes 8 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000005', 'customer', 'Perfect. Book me for a general checkup', now() - interval '25 days' + interval '10 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000005', 'bot', 'General checkup booked! Monday 11:00 AM. Do not forget your Jubilee Health card.', now() - interval '25 days' + interval '10 minutes 6 seconds'),

-- Conv 6: Bilal Khan - Whitening
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000006', 'customer', 'Do you offer teeth whitening? My friend got it done there', now() - interval '23 days' + interval '14 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000006', 'bot', 'Hi Bilal! Yes, we do! SmileCare offers In-Office Whitening (Zoom) PKR 15,000-25,000 (1 session, 45 mins), Home Whitening Kit PKR 8,000 (2 weeks), Combo Deal PKR 28,000 (In-office plus home kit). Results last 6-12 months. Want to book a session?', now() - interval '23 days' + interval '14 minutes 9 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000006', 'customer', 'In-office zoom whitening please. When is the earliest?', now() - interval '23 days' + interval '18 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000006', 'bot', 'Dr. Hassan has a slot tomorrow at 4:00 PM for Zoom Whitening. Please avoid tea and coffee 24 hours before the session for best results. Shall I confirm?', now() - interval '23 days' + interval '18 minutes 7 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000006', 'customer', 'Confirmed!', now() - interval '23 days' + interval '20 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000006', 'bot', 'Zoom Whitening booked! Tomorrow 4:00 PM with Dr. Hassan. See you there!', now() - interval '23 days' + interval '20 minutes 5 seconds'),

-- Conv 7: Sara Ahmed - Pediatric
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000007', 'customer', 'My daughter is 5 years old. She needs her first dental checkup. Do you handle pediatric cases?', now() - interval '22 days' + interval '9 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000007', 'bot', 'Hi Sara! Absolutely, we love our little patients! Dr. Ayesha Syed is our pediatric dentist. First visit includes complete dental examination, X-ray if needed, gentle cleaning, and brushing education for kids. First visit PKR 2,000. We make it fun so kids are not scared! Would you like to book?', now() - interval '22 days' + interval '9 minutes 10 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000007', 'customer', 'Monday 10 AM please', now() - interval '22 days' + interval '14 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000007', 'bot', 'Booked! Pediatric checkup with Dr. Ayesha Syed, Monday 10:00 AM. Your daughter will love it!', now() - interval '22 days' + interval '14 minutes 6 seconds'),

-- Conv 8-12 (shorter)
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000008', 'customer', 'Emergency! My kid fell and chipped his front tooth', now() - interval '21 days' + interval '5 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000008', 'bot', 'Please come right away, Hamza! Dr. Ayesha (Pediatric) has an emergency slot NOW. Bring the chipped piece if you found it. SmileCare DHA Phase 5.', now() - interval '21 days' + interval '5 minutes 7 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000009', 'customer', 'Is teeth whitening safe during pregnancy?', now() - interval '20 days' + interval '15 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000009', 'bot', 'Hi Hira! We recommend postponing cosmetic whitening during pregnancy. However, regular cleaning and scaling is safe and recommended! Would you like to book scaling?', now() - interval '20 days' + interval '15 minutes 8 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000009', 'customer', 'Yes please, scaling would be great', now() - interval '20 days' + interval '18 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000009', 'bot', 'Scaling booked! Saturday 11 AM with Dr. Hassan. Perfectly safe during pregnancy!', now() - interval '20 days' + interval '18 minutes 6 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000010', 'customer', 'What age should kids start dental visits?', now() - interval '19 days' + interval '12 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000010', 'bot', 'Great question, Imran! The American Dental Association recommends first visit by age 1 or when the first tooth appears. Our pediatric dentist Dr. Ayesha is wonderful with babies.', now() - interval '19 days' + interval '12 minutes 9 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000011', 'customer', 'I need teeth cleaning. Saturday available?', now() - interval '18 days' + interval '10 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000011', 'bot', 'Yes! Saturday 2 PM available with Dr. Hassan. Scaling and Polishing PKR 4,000. Booked!', now() - interval '18 days' + interval '10 minutes 7 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000012', 'customer', 'How long do dental implants last?', now() - interval '17 days' + interval '9 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000012', 'bot', 'Dental implants last 20-25 years with proper care. Many last a lifetime! They are the most durable tooth replacement option. Want to explore implants? Free consultation available!', now() - interval '17 days' + interval '9 minutes 10 seconds'),

-- Conv 13: Wisdom tooth
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000013', 'customer', 'I need to get my wisdom tooth removed. Is it very painful?', now() - interval '15 days' + interval '11 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000013', 'bot', 'Hi Sana! Wisdom tooth extraction is common and we make it painless. Local anesthesia ensures no pain during the procedure. We prescribe painkillers for 2-3 days recovery. Simple extraction PKR 5,000-8,000, Surgical extraction PKR 10,000-15,000. Dr. Fatima Zahra is available Friday at 11:00 AM. Would you like to book?', now() - interval '15 days' + interval '11 minutes 12 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000013', 'customer', 'Book it please', now() - interval '15 days' + interval '15 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000013', 'bot', 'Booked! Dr. Fatima Zahra, Friday 11:00 AM. Have a light meal 2 hours before. Avoid smoking 24 hours before. Bring someone to drive you home.', now() - interval '15 days' + interval '15 minutes 9 seconds'),

-- Conv 14: Implant
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000014', 'customer', 'I lost a tooth years ago. What are my options for replacement?', now() - interval '14 days' + interval '16 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000014', 'bot', 'Hi Ali! Your options: Dental Implant PKR 80,000-120,000 (permanent, most natural), Dental Bridge PKR 25,000-45,000 (fixed), Partial Denture PKR 15,000-25,000 (removable). Implants are the gold standard. Want a free consultation with Dr. Usman?', now() - interval '14 days' + interval '16 minutes 11 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000014', 'customer', 'Implant sounds best. Let me do the consultation first', now() - interval '14 days' + interval '20 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000014', 'bot', 'Consultation booked with Dr. Usman Ali (Implantologist). Tuesday 3:00 PM. No charges for the consultation!', now() - interval '14 days' + interval '20 minutes 7 seconds'),

-- Conv 15-18
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000015', 'customer', 'My gums bleed when I brush. Is this serious?', now() - interval '13 days' + interval '14 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000015', 'bot', 'Hi Mehak, bleeding gums can indicate gingivitis. The good news is it is reversible with treatment! I recommend a dental cleaning plus checkup. Dr. Hassan can assess. Available this week! Shall I book?', now() - interval '13 days' + interval '14 minutes 9 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000015', 'customer', 'Yes please, earliest available', now() - interval '13 days' + interval '17 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000015', 'bot', 'Tomorrow 4:00 PM with Dr. Hassan. Cleaning plus gum assessment. PKR 4,500. See you!', now() - interval '13 days' + interval '17 minutes 6 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000016', 'customer', 'Assalam o Alaikum, what toothpaste do you recommend?', now() - interval '12 days' + interval '8 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000016', 'bot', 'Walaikum Assalam, Kamran! For general care Sensodyne or Colgate Total are excellent. For sensitivity Sensodyne Rapid Relief. For whitening Colgate Optic White. Always use soft bristle toothbrush! Need anything else?', now() - interval '12 days' + interval '8 minutes 8 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000017', 'customer', 'Can you send me the price list for all services?', now() - interval '11 days' + interval '11 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000017', 'bot', 'Of course, Nadia! Scaling PKR 3,000-5,000, Filling PKR 3,000-6,000, Root Canal PKR 12,000-18,000, Crown PKR 8,000-28,000, Extraction PKR 2,000-15,000, Whitening PKR 15,000-25,000, Braces PKR 80,000-400,000, Implant PKR 80,000-120,000. All treatments include consultation. Want to book?', now() - interval '11 days' + interval '11 minutes 11 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000018', 'customer', 'Booking for root canal follow-up', now() - interval '10 days' + interval '6 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000018', 'bot', 'Follow-up booked! Dr. Fatima Zahra, Thursday 1:00 PM. Root canal follow-up is included in your treatment cost. See you!', now() - interval '10 days' + interval '6 minutes 6 seconds'),

-- Conv 19-29 (medium detail)
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000019', 'customer', 'Hi, I had a root canal done last week. When should I come for the crown?', now() - interval '9 days' + interval '13 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000019', 'bot', 'Hi Rabia! After root canal, we recommend getting the crown within 2-3 weeks. Crown Options: PFM Crown PKR 8,000-12,000, Zirconia Crown PKR 15,000-22,000 (most durable), E-max Crown PKR 20,000-28,000 (premium aesthetics). Dr. Hassan recommends Zirconia for back teeth. Shall I book your crown appointment?', now() - interval '9 days' + interval '13 minutes 10 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000019', 'customer', 'Zirconia please. Book for next week', now() - interval '9 days' + interval '16 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000019', 'bot', 'Crown preparation appointment booked! Dr. Hassan, next Wednesday 2:00 PM. The crown takes 5-7 days to fabricate after impressions. Total cost PKR 18,000.', now() - interval '9 days' + interval '16 minutes 7 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000020', 'customer', 'My denture is loose. Can you adjust it?', now() - interval '8 days' + interval '13 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000020', 'bot', 'Hi Tariq! Yes, denture adjustments are quick. Reline/Adjustment PKR 3,000-5,000, takes 30-45 minutes. Dr. Usman is available tomorrow 11 AM. Booked for you!', now() - interval '8 days' + interval '13 minutes 8 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000021', 'customer', 'Night guard for grinding teeth please', now() - interval '7 days' + interval '10 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000021', 'bot', 'Custom night guards at SmileCare: Soft Guard PKR 5,000, Hard Guard PKR 8,000. Takes 2 visits. Want to start?', now() - interval '7 days' + interval '10 minutes 8 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000021', 'customer', 'Hard guard please', now() - interval '7 days' + interval '13 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000021', 'bot', 'Night guard appointment booked! Monday 3:00 PM for impressions. See you!', now() - interval '7 days' + interval '13 minutes 6 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000022', 'customer', 'Do you have payment plans for expensive treatments?', now() - interval '6 days' + interval '9 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000022', 'bot', 'Absolutely, Shahid! SmileCare offers flexible installments: 3 months at 0 percent interest, 6 months with small processing fee, 12 months for treatments above PKR 50,000. We also accept JazzCash, EasyPaisa, and all bank cards!', now() - interval '6 days' + interval '9 minutes 9 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000023', 'customer', 'Appointment for TMJ pain treatment', now() - interval '5 days' + interval '14 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000023', 'bot', 'TMJ consultation booked with Dr. Fatima Zahra, Friday 11:00 AM. PKR 3,000 consultation. See you!', now() - interval '5 days' + interval '14 minutes 7 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000024', 'customer', 'I saw your special offer on Facebook. Still available?', now() - interval '4 days' + interval '7 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000024', 'bot', 'Yes, Junaid! Our special dental package PKR 7,500 (normally PKR 12,000) includes Scaling, Checkup, Free X-ray, and Whitening touch-up. Valid till end of month. Book now!', now() - interval '4 days' + interval '7 minutes 10 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000024', 'customer', 'Great deal! Book me this Saturday', now() - interval '4 days' + interval '10 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000024', 'bot', 'Package booked! Saturday 12:00 PM. Best deal of the month!', now() - interval '4 days' + interval '10 minutes 6 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000025', 'customer', 'Scaling appointment for next week', now() - interval '3 days' + interval '12 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000025', 'bot', 'Scaling booked! Tuesday 2:00 PM with Dr. Hassan. PKR 4,000. See you next week!', now() - interval '3 days' + interval '12 minutes 6 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000026', 'customer', 'My filling fell out. What should I do?', now() - interval '2 days' + interval '11 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000026', 'bot', 'Do not worry, Adeel! Keep the area clean and avoid chewing on that side. We have a slot tomorrow at 10:00 AM. Re-filling PKR 3,000-5,000. Shall I book?', now() - interval '2 days' + interval '11 minutes 8 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000026', 'customer', 'Yes please!', now() - interval '2 days' + interval '13 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000026', 'bot', 'Filling replacement booked! Tomorrow 10:00 AM with Dr. Hassan. See you!', now() - interval '2 days' + interval '13 minutes 5 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000027', 'customer', 'Can I get dental sealants for my children?', now() - interval '2 days' + interval '6 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000027', 'bot', 'Great preventive choice, Samina! Dental sealants PKR 1,500 per tooth. Quick painless procedure. Recommended for ages 6-14. Dr. Ayesha is available Thursday. Want to book for your children?', now() - interval '2 days' + interval '6 hours' + interval '9 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000027', 'customer', 'Book for both my kids please', now() - interval '2 days' + interval '6 hours 5 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000027', 'bot', 'Sealants booked for both kids! Thursday 3:00 PM with Dr. Ayesha. Excellent preventive care!', now() - interval '2 days' + interval '6 hours 5 minutes' + interval '6 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000028', 'customer', 'Price for zirconia crown?', now() - interval '1 day' + interval '10 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000028', 'bot', 'Hi Waqas! Zirconia crowns: Single crown PKR 15,000-22,000, Premium grade PKR 25,000. 2 visits over 1 week. Most durable and natural-looking option! Want to schedule?', now() - interval '1 day' + interval '10 minutes 8 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000028', 'customer', 'Schedule for next Monday', now() - interval '1 day' + interval '14 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000028', 'bot', 'Crown prep booked! Monday 11:00 AM with Dr. Hassan. PKR 18,000. See you!', now() - interval '1 day' + interval '14 minutes 6 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000029', 'customer', 'Do you do smile makeovers? How much for full mouth?', now() - interval '1 day' + interval '4 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000029', 'bot', 'Hi Kiran! Smile makeovers are our specialty! Full smile makeover typically includes 8-10 veneers, whitening, and gum contouring. Range PKR 200,000-400,000. 12-month installments available. Free consultation with Dr. Usman. Shall I book?', now() - interval '1 day' + interval '4 hours' + interval '11 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000029', 'customer', 'Yes, when is the earliest consultation?', now() - interval '12 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000029', 'bot', 'Free smile makeover consultation booked! Wednesday 4:00 PM with Dr. Usman Ali. He will create a digital smile design preview for you!', now() - interval '12 hours' + interval '7 seconds'),

-- Today conversations
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000030', 'customer', 'My tooth broke while eating. Need urgent help!', now() - interval '4 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000030', 'bot', 'Oh no, Hassan! A broken tooth needs immediate attention. Emergency slot available NOW with Dr. Fatima Zahra. Shall I book it immediately?', now() - interval '4 hours' + interval '8 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000030', 'customer', 'Yes Im on my way!', now() - interval '3 hours 55 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000030', 'bot', 'Emergency appointment confirmed! Dr. Fatima is ready for you. Please come directly to SmileCare, DHA Phase 5.', now() - interval '3 hours 55 minutes' + interval '6 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000031', 'customer', 'Hi, I need to book cleaning for me and my husband. Do you have discount for couple?', now() - interval '3 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000031', 'bot', 'Hi Lubna! Yes, we have a special Couple Scaling Package! Regular PKR 4,000 per person, Couple Deal PKR 6,000 total (save PKR 2,000!). Dr. Hassan has back-to-back slots available Saturday morning. Want me to book both of you?', now() - interval '3 hours' + interval '9 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000031', 'customer', 'That deal is great! Saturday morning please', now() - interval '2 hours 55 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000031', 'bot', 'Couple Scaling booked! Lubna Saturday 10:00 AM, Husband Saturday 10:30 AM. Dr. Hassan Ahmed. Total PKR 6,000 (couple deal). See you both Saturday!', now() - interval '2 hours 55 minutes' + interval '7 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000032', 'customer', 'Salam, I want to improve my smile. What cosmetic options do you have?', now() - interval '2 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000032', 'bot', 'Walaikum Assalam Naveed! Our cosmetic services: Porcelain Veneers PKR 18,000-25,000 per tooth, Zoom Whitening PKR 15,000-25,000, Composite Bonding PKR 5,000-8,000 per tooth. Veneers are the most popular for a Hollywood smile! Want a free cosmetic consultation?', now() - interval '2 hours' + interval '10 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000032', 'customer', 'Veneers for my front 4 teeth. How much total?', now() - interval '1 hour 50 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000032', 'bot', 'For 4 porcelain veneers total estimate PKR 72,000-100,000. Installment plan available in 3-6 months. Timeline is 2 visits over 2 weeks. Dr. Usman Ali handles all our cosmetic cases. Shall I book a consultation?', now() - interval '1 hour 50 minutes' + interval '9 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000033', 'customer', 'What are your clinic timings?', now() - interval '5 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000033', 'bot', 'SmileCare Dental Clinic hours: Mon-Fri 10:00 AM-8:00 PM, Saturday 10:00 AM-5:00 PM, Sunday Closed (Emergency only). DHA Phase 5, Lahore. Would you like to book an appointment?', now() - interval '5 hours' + interval '7 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000033', 'customer', 'No thanks just wanted to know. JazakAllah', now() - interval '4 hours 55 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000033', 'bot', 'You are welcome! Feel free to message us anytime you need dental care. Have a great day!', now() - interval '4 hours 55 minutes' + interval '5 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000034', 'customer', 'I want to reschedule my appointment from tomorrow to next week', now() - interval '6 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000034', 'bot', 'Hi Asad! Of course. Available next week: Monday 11:00 AM, Tuesday 3:00 PM, Thursday 10:00 AM. Which works for you?', now() - interval '6 hours' + interval '8 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000034', 'customer', 'Tuesday 3pm works', now() - interval '5 hours 50 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000034', 'bot', 'Rescheduled! Your appointment is now Tuesday 3:00 PM with Dr. Hassan. We will send a reminder the day before. See you then!', now() - interval '5 hours 50 minutes' + interval '6 seconds'),

('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000035', 'customer', 'Booking for dental checkup, first time patient', now() - interval '8 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000035', 'bot', 'Welcome to SmileCare, Rubina! First-time checkup includes full oral exam, digital X-rays, cleaning if needed, and treatment plan. First visit PKR 2,500 (includes everything!). Dr. Hassan is available tomorrow 3:00 PM. Shall I book?', now() - interval '8 hours' + interval '10 seconds'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000035', 'customer', 'Yes, 3pm works. See you tomorrow!', now() - interval '7 hours 55 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000035', 'bot', 'First visit booked! Tomorrow 3:00 PM with Dr. Hassan. Welcome to the SmileCare family!', now() - interval '7 hours 55 minutes' + interval '6 seconds')
ON CONFLICT DO NOTHING;


-- STEP 3: Appointments
INSERT INTO public.appointments (tenant_id, conversation_id, patient_name, patient_phone, doctor_name, treatment_type, appointment_date, appointment_time, status, is_new_patient, estimated_revenue, niche, notes) VALUES
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000001', 'Ayesha Malik',    '923334567801', 'Dr. Hassan Ahmed',   'Scaling & Polishing', (now() - interval '27 days')::date, '15:00', 'completed', false, 4000,  'dental', 'Regular cleaning'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000002', 'Ahmed Raza',      '923214567802', 'Dr. Fatima Zahra',   'Root Canal',          (now() - interval '28 days')::date, '17:00', 'completed', true,  15000, 'dental', 'Emergency - severe pain'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000003', 'Fatima Noor',     '923004567803', 'Dr. Usman Ali',      'Braces Consultation', (now() - interval '24 days')::date, '14:00', 'completed', true,  0,     'dental', 'Free consultation'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000004', 'Usman Tariq',     '923154567804', 'Dr. Hassan Ahmed',   'Dental Filling',      (now() - interval '23 days')::date, '14:00', 'completed', false, 5000,  'dental', 'Composite filling'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000006', 'Bilal Khan',      '923364567806', 'Dr. Hassan Ahmed',   'Zoom Whitening',      (now() - interval '22 days')::date, '16:00', 'completed', true,  20000, 'dental', 'In-office whitening'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000007', 'Sara Ahmed',      '923134567807', 'Dr. Ayesha Syed',    'Pediatric Checkup',   (now() - interval '20 days')::date, '10:00', 'completed', true,  2000,  'dental', 'Child first visit'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000013', 'Sana Qureshi',    '923504567813', 'Dr. Fatima Zahra',   'Wisdom Extraction',   (now() - interval '12 days')::date, '11:00', 'completed', false, 12000, 'dental', 'Surgical extraction'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000014', 'Ali Hassan',      '923184567814', 'Dr. Usman Ali',      'Implant Consultation',(now() - interval '11 days')::date, '15:00', 'completed', true,  0,     'dental', 'Free implant assessment'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000015', 'Mehak Iqbal',     '923294567815', 'Dr. Hassan Ahmed',   'Gum Treatment',       (now() - interval '12 days')::date, '16:00', 'completed', false, 4500,  'dental', 'Scaling plus gum assessment'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000019', 'Rabia Nawaz',     '923174567819', 'Dr. Hassan Ahmed',   'Zirconia Crown',      (now() + interval '3 days')::date,  '14:00', 'confirmed', false, 18000, 'dental', 'Crown prep after root canal'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000024', 'Junaid Akram',    '923484567824', 'Dr. Hassan Ahmed',   'Dental Package',      (now() + interval '2 days')::date,  '12:00', 'confirmed', true,  7500,  'dental', 'Special package deal'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000025', 'Uzma Batool',     '923034567825', 'Dr. Hassan Ahmed',   'Scaling & Polishing', (now() + interval '4 days')::date,  '14:00', 'confirmed', false, 4000,  'dental', 'Regular cleaning'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000028', 'Waqas Gill',      '923524567828', 'Dr. Hassan Ahmed',   'Zirconia Crown',      (now() + interval '3 days')::date,  '11:00', 'confirmed', false, 18000, 'dental', 'Crown preparation'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000029', 'Kiran Shahzadi',  '923274567829', 'Dr. Usman Ali',      'Smile Makeover',      (now() + interval '1 day')::date,   '16:00', 'confirmed', true,  0,     'dental', 'Free cosmetic consultation'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000030', 'Hassan Rauf',     '923674567830', 'Dr. Fatima Zahra',   'Emergency Repair',    (now())::date,                      '11:00', 'confirmed', true,  8000,  'dental', 'Broken tooth emergency'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000031', 'Lubna Iftikhar',  '923204567831', 'Dr. Hassan Ahmed',   'Couple Scaling',      (now() + interval '2 days')::date,  '10:00', 'pending',   true,  6000,  'dental', 'Couple scaling deal'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000035', 'Rubina Kanwal',   '923457890835', 'Dr. Hassan Ahmed',   'First Visit Checkup', (now() + interval '1 day')::date,   '15:00', 'pending',   true,  2500,  'dental', 'New patient registration')
ON CONFLICT DO NOTHING;


-- STEP 4: Funnel Events
INSERT INTO public.funnel_events (tenant_id, conversation_id, stage, metadata, created_at) VALUES
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000001', 'conversation_started', '{"source": "whatsapp"}', now() - interval '29 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000001', 'product_intent_detected', '{"service": "scaling"}', now() - interval '29 days' + interval '1 minute'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000001', 'order_confirmed', '{"service": "scaling", "amount": 4000}', now() - interval '29 days' + interval '12 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000002', 'conversation_started', '{"source": "whatsapp"}', now() - interval '28 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000002', 'order_confirmed', '{"service": "root_canal", "amount": 15000}', now() - interval '28 days' + interval '6 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000003', 'conversation_started', '{"source": "whatsapp"}', now() - interval '27 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000003', 'catalog_viewed', '{"items": ["metal_braces", "ceramic_braces", "invisalign"]}', now() - interval '27 days' + interval '20 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000003', 'order_confirmed', '{"service": "ceramic_braces", "amount": 160000}', now() - interval '27 days' + interval '28 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000004', 'conversation_started', '{"source": "whatsapp"}', now() - interval '26 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000004', 'order_confirmed', '{"service": "filling", "amount": 5000}', now() - interval '26 days' + interval '11 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000005', 'conversation_started', '{"source": "whatsapp"}', now() - interval '25 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000005', 'order_confirmed', '{"service": "checkup", "amount": 2000}', now() - interval '25 days' + interval '10 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000006', 'conversation_started', '{"source": "whatsapp"}', now() - interval '23 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000006', 'order_confirmed', '{"service": "zoom_whitening", "amount": 20000}', now() - interval '23 days' + interval '20 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000007', 'conversation_started', '{"source": "whatsapp"}', now() - interval '22 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000007', 'order_confirmed', '{"service": "pediatric_checkup", "amount": 2000}', now() - interval '22 days' + interval '14 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000008', 'conversation_started', '{"source": "whatsapp"}', now() - interval '21 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000008', 'order_confirmed', '{"service": "emergency_pediatric", "amount": 6000}', now() - interval '21 days' + interval '5 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000009', 'conversation_started', '{"source": "whatsapp"}', now() - interval '20 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000009', 'order_confirmed', '{"service": "scaling", "amount": 4000}', now() - interval '20 days' + interval '18 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000013', 'conversation_started', '{"source": "whatsapp"}', now() - interval '15 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000013', 'order_confirmed', '{"service": "wisdom_extraction", "amount": 12000}', now() - interval '15 days' + interval '15 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000014', 'conversation_started', '{"source": "whatsapp"}', now() - interval '14 days'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000014', 'catalog_viewed', '{"items": ["implant", "bridge", "denture"]}', now() - interval '14 days' + interval '16 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000030', 'conversation_started', '{"source": "whatsapp"}', now() - interval '4 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000030', 'order_confirmed', '{"service": "emergency_repair", "amount": 8000}', now() - interval '3 hours 55 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000031', 'conversation_started', '{"source": "whatsapp"}', now() - interval '3 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000031', 'order_confirmed', '{"service": "couple_scaling", "amount": 6000}', now() - interval '2 hours 55 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000032', 'conversation_started', '{"source": "whatsapp"}', now() - interval '2 hours'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000032', 'catalog_viewed', '{"items": ["veneers", "whitening", "bonding"]}', now() - interval '2 hours' + interval '5 minutes'),
('00000000-0000-0000-0000-111111111111', 'c0000000-0000-0000-0000-000000000032', 'checkout_initiated', '{"service": "veneers_4", "amount": 85000}', now() - interval '1 hour 50 minutes')
ON CONFLICT DO NOTHING;


-- STEP 5: Reviews
INSERT INTO public.reviews (tenant_id, customer_name, customer_phone, rating, review_text, created_at) VALUES
('00000000-0000-0000-0000-111111111111', 'Ayesha Malik',    '923334567801', 5, 'Best scaling experience ever! Dr. Hassan was very gentle and professional. The WhatsApp booking was so convenient!', now() - interval '26 days'),
('00000000-0000-0000-0000-111111111111', 'Ahmed Raza',      '923214567802', 5, 'Had an emergency root canal and they squeezed me in same day. Dr. Fatima is amazing. Pain free procedure!', now() - interval '25 days'),
('00000000-0000-0000-0000-111111111111', 'Fatima Noor',     '923004567803', 5, 'Got ceramic braces from Dr. Usman. 4 months in and my teeth are already so much better!', now() - interval '20 days'),
('00000000-0000-0000-0000-111111111111', 'Bilal Khan',      '923364567806', 4, 'Zoom whitening results are fantastic! 5 shades whiter in one session. Worth every rupee!', now() - interval '18 days'),
('00000000-0000-0000-0000-111111111111', 'Sara Ahmed',      '923134567807', 5, 'Dr. Ayesha was so sweet with my daughter. She was not scared at all! Will definitely bring her back.', now() - interval '15 days'),
('00000000-0000-0000-0000-111111111111', 'Sana Qureshi',    '923504567813', 5, 'Wisdom tooth extraction was quick and painless. Dr. Fatima explained everything beforehand. Highly recommend!', now() - interval '8 days'),
('00000000-0000-0000-0000-111111111111', 'Mehak Iqbal',     '923294567815', 4, 'Came for bleeding gums, turns out I had early gingivitis. After treatment my gums feel so much healthier.', now() - interval '7 days'),
('00000000-0000-0000-0000-111111111111', 'Hira Butt',       '923074567809', 5, 'Got scaling done during pregnancy, very safe and comfortable. The bot on WhatsApp answered all my questions instantly!', now() - interval '5 days'),
('00000000-0000-0000-0000-111111111111', 'Amna Riaz',       '923254567821', 4, 'Custom night guard fits perfectly. No more jaw pain in the mornings! Professional service.', now() - interval '3 days'),
('00000000-0000-0000-0000-111111111111', 'Junaid Akram',    '923484567824', 5, 'Special package was incredible value! Scaling plus whitening for only PKR 7,500. Booking through WhatsApp was so easy.', now() - interval '1 day')
ON CONFLICT DO NOTHING;


-- STEP 6: Knowledge Base
INSERT INTO public.knowledge_base (tenant_id, kb_type, title, content, is_active, created_at) VALUES
('00000000-0000-0000-0000-111111111111', 'text', 'SmileCare Clinic Overview', 'SmileCare Dental Clinic is a premium dental care facility located in DHA Phase 5, Lahore. We provide comprehensive dental services including general dentistry, orthodontics, endodontics, oral surgery, pediatric dentistry, and cosmetic dentistry.', true, now() - interval '30 days'),
('00000000-0000-0000-0000-111111111111', 'faq', 'Clinic Hours and Location', 'Mon-Fri 10 AM-8 PM, Saturday 10 AM-5 PM, Sunday closed (emergencies only). Located in DHA Phase 5, Lahore. Free parking available. Walk-ins welcome for emergencies.', true, now() - interval '30 days'),
('00000000-0000-0000-0000-111111111111', 'text', 'Our Doctors', 'Dr. Hassan Ahmed - General Dentistry (10+ years). Dr. Fatima Zahra - Endodontics and Oral Surgery (8 years). Dr. Usman Ali - Orthodontics and Implants (12 years). Dr. Ayesha Syed - Pediatric Dentist (6 years).', true, now() - interval '30 days'),
('00000000-0000-0000-0000-111111111111', 'text', 'Services and Pricing', 'Scaling PKR 3,000-5,000. Filling PKR 3,000-6,000. Root Canal PKR 12,000-18,000. Crown PKR 8,000-28,000. Extraction PKR 2,000-15,000. Whitening PKR 15,000-25,000. Braces PKR 80,000-400,000. Implant PKR 80,000-120,000. Veneers PKR 18,000-25,000 per tooth.', true, now() - interval '30 days'),
('00000000-0000-0000-0000-111111111111', 'faq', 'Insurance and Payment', 'We accept Jubilee Health, EFU Life, Allianz, Adamjee Insurance. Installment plans: 3 months (0% interest), 6 months, 12 months for treatments above PKR 50,000. Payment: Cash, cards, JazzCash, EasyPaisa.', true, now() - interval '30 days'),
('00000000-0000-0000-0000-111111111111', 'text', 'Emergency Protocol', 'For dental emergencies call or WhatsApp immediately. Same-day emergency slots available. No emergency surcharge. First aid: rinse with warm salt water, apply cold compress, avoid aspirin on gum area.', true, now() - interval '30 days')
ON CONFLICT DO NOTHING;


-- STEP 7: AI Agent
INSERT INTO public.agents (tenant_id, name, prompt, is_active) VALUES
('00000000-0000-0000-0000-111111111111', 'SmileCare AI Assistant', 'You are SmileCare Dental Clinic AI assistant on WhatsApp. Help patients book appointments, provide info about services and pricing, answer FAQs. Be caring and professional. Quote prices in PKR. Doctors: Dr. Hassan (General), Dr. Fatima (Endodontics), Dr. Usman (Orthodontics), Dr. Ayesha (Pediatric).', true)
ON CONFLICT DO NOTHING;


-- STEP 8: Usage Metrics
INSERT INTO public.usage_metrics (tenant_id, month, conversations_count, messages_sent, campaigns_sent, templates_submitted, kb_entries_count) VALUES
('00000000-0000-0000-0000-111111111111', to_char(now(), 'YYYY-MM'), 35, 186, 2, 4, 6)
ON CONFLICT (tenant_id, month) DO UPDATE SET
  conversations_count = 35,
  messages_sent = 186,
  campaigns_sent = 2,
  templates_submitted = 4,
  kb_entries_count = 6;

-- DONE!
