-- 1. Add photo_urls column to quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';

-- 2. Create public bucket for quote photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-photos', 'quote-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies — anyone can read, anyone can upload, only admins delete
CREATE POLICY "Public read quote-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'quote-photos');

CREATE POLICY "Public upload quote-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'quote-photos');

CREATE POLICY "Admins delete quote-photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'quote-photos' AND public.has_role(auth.uid(), 'admin'::app_role));