
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "admins read roles" ON public.user_roles FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Quotes
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_num integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_changed timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Nowe zamówienie (Nie ruszone)',
  company text DEFAULT '',
  kennitala text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  license_plate text DEFAULT '',
  part text DEFAULT '',
  part_links text DEFAULT '',
  standard_delivery text DEFAULT '',
  express_delivery text DEFAULT '',
  tracking_pl1 text DEFAULT '',
  tracking_pl2 text DEFAULT '',
  order_total text DEFAULT '',
  label_link text DEFAULT '',
  tracking_is text DEFAULT '',
  invoice text DEFAULT '',
  vin text DEFAULT '',
  comment text DEFAULT ''
);

-- Auto order number (start 1060)
CREATE SEQUENCE public.quotes_order_num_seq START 1060;
ALTER TABLE public.quotes ALTER COLUMN order_num SET DEFAULT nextval('public.quotes_order_num_seq');

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can submit a new quote
CREATE POLICY "public can insert quotes" ON public.quotes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only admins can read/update/delete
CREATE POLICY "admins read quotes" ON public.quotes FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update quotes" ON public.quotes FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete quotes" ON public.quotes FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update last_changed on row update
CREATE OR REPLACE FUNCTION public.touch_last_changed()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_changed := now();
  RETURN NEW;
END $$;

CREATE TRIGGER quotes_touch_last_changed
BEFORE UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.touch_last_changed();
