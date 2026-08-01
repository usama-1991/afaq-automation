-- ============================================================================
-- Ittisalo Demo Seed: Campaigns & Templates (Dental)
-- ============================================================================

-- STEP 1: Demo Templates
INSERT INTO public.templates (id, tenant_id, name, category, language, status, header_type, body_text, footer_text, buttons) VALUES
('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-111111111111', 'scaling_offer', 'Marketing', 'en', 'APPROVED', 'None', 'Hi {{1}}, get 20% off on your next scaling and polishing appointment! Offer valid till Friday.', 'SmileCare Dental', '[{"type":"QUICK_REPLY","text":"Book Now"}]'),
('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-111111111111', 'appointment_reminder', 'Utility', 'en', 'APPROVED', 'None', 'Dear {{1}}, your appointment is confirmed for {{2}} at {{3}}.', 'SmileCare Dental', '[]')
ON CONFLICT DO NOTHING;

-- STEP 2: Demo Campaigns
INSERT INTO public.campaigns (id, tenant_id, name, template_id, template_name, segment_name, status, total_recipients, sent_count, delivered_count, read_count, failed_count, created_at, scheduled_at) VALUES
('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-111111111111', 'Summer Scaling Promo', 'd0000000-0000-0000-0000-000000000001', 'scaling_offer', 'All Patients', 'Completed', 150, 150, 148, 112, 2, now() - interval '5 days', now() - interval '5 days')
ON CONFLICT DO NOTHING;
