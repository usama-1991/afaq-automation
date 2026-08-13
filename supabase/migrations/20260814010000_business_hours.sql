ALTER TABLE public.tenants
ADD COLUMN business_hours_start time without time zone DEFAULT '09:00:00',
ADD COLUMN business_hours_end time without time zone DEFAULT '18:00:00';
