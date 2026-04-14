-- ─── 1. ENUM TYPES ───────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'shop_owner');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'wallet');

-- ─── 2. TABLES ───────────────────────────────────────────────────────────────

CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID,
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  
  seating_capacity INTEGER NOT NULL DEFAULT 0,
  table_count INTEGER NOT NULL DEFAULT 0,
  
  rating NUMERIC NOT NULL DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  opening_time TEXT NOT NULL DEFAULT '', 
  closing_time TEXT NOT NULL DEFAULT '', 
  is_open BOOLEAN NOT NULL DEFAULT true,
  
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  fcm_token TEXT,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  is_closed BOOLEAN NOT NULL DEFAULT false,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL,
  prep_time INTEGER NOT NULL,
  is_veg BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT NOT NULL DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT true,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  slot_id UUID REFERENCES public.time_slots(id) ON DELETE RESTRICT,
  
  status order_status NOT NULL DEFAULT 'pending',
  
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL DEFAULT 'upi',
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  
  ready_notification BOOLEAN NOT NULL DEFAULT false,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time NUMERIC NOT NULL
);

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  updated_by UUID REFERENCES public.users(id),
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_bookmarked_slots (
  user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slot_id  UUID NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, slot_id)
);

-- ─── 3. INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX idx_orders_shop_active ON public.orders(shop_id) WHERE status IN ('pending', 'preparing', 'ready');
CREATE INDEX idx_orders_user_time ON public.orders(user_id, inserted_at DESC);
CREATE INDEX idx_orders_slot ON public.orders(slot_id) WHERE status != 'cancelled';
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_menu_items_shop ON public.menu_items(shop_id);
CREATE INDEX idx_time_slots_shop_date ON public.time_slots(shop_id, date);

-- ─── 4. UPDATED_AT TRIGGERS ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
