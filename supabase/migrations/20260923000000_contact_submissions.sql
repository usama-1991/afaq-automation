-- Migration: 20260923000000_contact_submissions.sql
-- Table to hold marketing website demo request / contact form submissions

CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    industry TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending'
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous contact submission inserts
DROP POLICY IF EXISTS "Allow anonymous contact submission" ON public.contact_submissions;
CREATE POLICY "Allow anonymous contact submission" ON public.contact_submissions
    FOR INSERT WITH CHECK (true);

-- Allow authenticated / admin users to view submissions
DROP POLICY IF EXISTS "Allow authenticated read" ON public.contact_submissions;
CREATE POLICY "Allow authenticated read" ON public.contact_submissions
    FOR SELECT USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
