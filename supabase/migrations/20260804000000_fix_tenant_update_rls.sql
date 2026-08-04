-- Enable users to update their own tenant settings (wa_phone_number_id, business_name, etc.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tenants' AND policyname = 'Users can update their own tenant'
    ) THEN
        CREATE POLICY "Users can update their own tenant" 
          ON public.tenants FOR UPDATE 
          USING (id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));
    END IF;
END $$;
