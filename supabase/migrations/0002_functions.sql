CREATE OR REPLACE FUNCTION public.get_shop_queue_size(shop_uuid UUID) 
RETURNS INTEGER LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_queue INTEGER;
BEGIN
  SELECT COALESCE(SUM(oi.quantity), 0)::INTEGER
    INTO v_queue
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
   WHERE o.shop_id = shop_uuid AND o.status IN ('pending', 'preparing');
  RETURN v_queue;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_slot_used_capacity(slot_uuid UUID)
RETURNS INTEGER LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_used INTEGER;
BEGIN
  SELECT COALESCE(SUM(oi.quantity), 0)::INTEGER
    INTO v_used
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
   WHERE o.slot_id = slot_uuid AND o.status != 'cancelled';
  RETURN v_used;
END;
$$;


CREATE OR REPLACE FUNCTION public.create_order_v2(
  p_user_id   UUID,
  p_slot_id   UUID,
  p_shop_id   UUID,
  p_items     JSONB,  -- [{"menu_item_id": "...", "quantity": N, "price": 100}, ...]
  p_pay_meth  public.payment_method,
  p_tot_amt   NUMERIC
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_slot       public.time_slots%ROWTYPE;
  v_total_qty  INTEGER;
  v_used_qty   INTEGER;
  v_order_id   UUID;
  v_item       JSONB;
BEGIN
  SELECT * INTO v_slot FROM public.time_slots WHERE id = p_slot_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF v_slot.is_closed THEN
    RETURN jsonb_build_object('status', 'slot_closed');
  END IF;

  SELECT COALESCE(SUM((item->>'quantity')::INTEGER), 0)
    INTO v_total_qty
    FROM jsonb_array_elements(p_items) AS item;

  SELECT COALESCE(SUM(oi.quantity), 0)::INTEGER
    INTO v_used_qty
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
   WHERE o.slot_id = p_slot_id AND o.status != 'cancelled';

  IF (v_used_qty + v_total_qty) > v_slot.max_capacity THEN
    RETURN jsonb_build_object('status', 'slot_full', 'current', v_used_qty, 'max', v_slot.max_capacity);
  END IF;

  INSERT INTO public.orders (user_id, slot_id, shop_id, status, payment_method, payment_status, total_amount)
    VALUES (p_user_id, p_slot_id, p_shop_id, 'pending', p_pay_meth, 'pending', p_tot_amt)
    RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (order_id, menu_item_id, quantity, price_at_time)
      VALUES (
        v_order_id, 
        (v_item->>'menu_item_id')::UUID, 
        (v_item->>'quantity')::INTEGER, 
        (v_item->>'price')::NUMERIC
      );
  END LOOP;

  INSERT INTO public.order_status_history (order_id, status, updated_by)
    VALUES (v_order_id, 'pending', p_user_id);

  RETURN jsonb_build_object('status', 'ok', 'order_id', v_order_id);
END;
$$;
