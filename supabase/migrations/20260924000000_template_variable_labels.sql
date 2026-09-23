-- Add variable_labels and sample_values to templates table
ALTER TABLE public.templates 
  ADD COLUMN IF NOT EXISTS variable_labels JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sample_values JSONB DEFAULT '{}'::jsonb;
