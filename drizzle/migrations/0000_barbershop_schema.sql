CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

CREATE TYPE public.app_role AS ENUM ('admin','staff');
CREATE TYPE public.appointment_status AS ENUM ('pending','confirmed','completed','cancelled','no_show');
CREATE TYPE public.payment_method AS ENUM ('pix','cash','credit','debit');

-- roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_first_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

-- settings (single row)
CREATE TABLE public.settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name text NOT NULL DEFAULT 'Barbearia Imperial',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  open_time time NOT NULL DEFAULT '09:00',
  close_time time NOT NULL DEFAULT '19:00',
  lunch_start time,
  lunch_end time,
  open_days int[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  slot_interval_min int NOT NULL DEFAULT 30,
  buffer_min int NOT NULL DEFAULT 0,
  default_duration_min int NOT NULL DEFAULT 30,
  min_advance_hours int NOT NULL DEFAULT 1,
  max_days_ahead int NOT NULL DEFAULT 30,
  cancel_min_hours int NOT NULL DEFAULT 2,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.settings FOR UPDATE TO authenticated
USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'))) WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- services
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  duration_min int NOT NULL DEFAULT 30 CHECK (duration_min > 0),
  category text NOT NULL DEFAULT 'Cabelo',
  image_url text,
  icon text NOT NULL DEFAULT 'scissors',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- barbers
CREATE TABLE public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_url text,
  phone text NOT NULL DEFAULT '',
  specialty text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.barber_services (
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (barber_id, service_id)
);
CREATE INDEX barber_services_service_idx ON public.barber_services(service_id);
CREATE TABLE public.working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  weekday int NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  UNIQUE (barber_id, weekday)
);
CREATE TABLE public.blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  barber_id uuid REFERENCES public.barbers(id) ON DELETE CASCADE,
  start_time time,
  end_time time,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blocked_dates_date_idx ON public.blocked_dates(date);
CREATE INDEX blocked_dates_barber_idx ON public.blocked_dates(barber_id);

GRANT SELECT ON public.services, public.barbers, public.barber_services, public.working_hours, public.blocked_dates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services, public.barbers, public.barber_services, public.working_hours, public.blocked_dates TO authenticated;
GRANT ALL ON public.services, public.barbers, public.barber_services, public.working_hours, public.blocked_dates TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active services" ON public.services FOR SELECT TO anon USING (active);
CREATE POLICY "Auth reads services" ON public.services FOR SELECT TO authenticated USING (active OR (SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins insert services" ON public.services FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins update services" ON public.services FOR UPDATE TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'))) WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins delete services" ON public.services FOR DELETE TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

CREATE POLICY "Public reads active barbers" ON public.barbers FOR SELECT TO anon USING (active);
CREATE POLICY "Auth reads barbers" ON public.barbers FOR SELECT TO authenticated USING (active OR (SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins insert barbers" ON public.barbers FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins update barbers" ON public.barbers FOR UPDATE TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'))) WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins delete barbers" ON public.barbers FOR DELETE TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

CREATE POLICY "Anyone reads barber_services" ON public.barber_services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert barber_services" ON public.barber_services FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins delete barber_services" ON public.barber_services FOR DELETE TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

CREATE POLICY "Anyone reads working_hours" ON public.working_hours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert working_hours" ON public.working_hours FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins update working_hours" ON public.working_hours FOR UPDATE TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'))) WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins delete working_hours" ON public.working_hours FOR DELETE TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

CREATE POLICY "Anyone reads blocked_dates" ON public.blocked_dates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert blocked_dates" ON public.blocked_dates FOR INSERT TO authenticated WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins update blocked_dates" ON public.blocked_dates FOR UPDATE TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'))) WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins delete blocked_dates" ON public.blocked_dates FOR DELETE TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- clients
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE CHECK (phone ~ '^[0-9]{10,11}$'),
  email text,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- appointments
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id),
  barber_id uuid NOT NULL REFERENCES public.barbers(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'confirmed',
  price numeric(10,2) NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  reschedule_requested boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    barber_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status IN ('pending','confirmed','completed'))
);
CREATE INDEX appointments_client_idx ON public.appointments(client_id, starts_at DESC);
CREATE INDEX appointments_starts_idx ON public.appointments(starts_at);
CREATE INDEX appointments_service_idx ON public.appointments(service_id);
-- payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  method public.payment_method NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  notes text NOT NULL DEFAULT ''
);
CREATE INDEX payments_appt_idx ON public.payments(appointment_id);
CREATE INDEX payments_paid_idx ON public.payments(paid_at);
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Geral',
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  spent_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients, public.appointments, public.payments, public.expenses TO authenticated;
GRANT ALL ON public.clients, public.appointments, public.payments, public.expenses TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage clients" ON public.clients FOR ALL TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'))) WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins manage appointments" ON public.appointments FOR ALL TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'))) WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'))) WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins manage expenses" ON public.expenses FOR ALL TO authenticated USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'))) WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- seed configuration (not appointments)
INSERT INTO public.settings (id, shop_name, address, phone, email, instagram, lunch_start, lunch_end)
VALUES (1, 'Barbearia Imperial', 'Rua Augusta, 1200 — Consolação, São Paulo - SP', '11987654321', 'contato@barbeariaimperial.com.br', '@barbeariaimperial', '12:00', '13:00');

INSERT INTO public.services (name, description, price, duration_min, category, icon, sort_order) VALUES
('Corte tradicional','Corte clássico na tesoura e máquina, com acabamento na navalha.',45,30,'Cabelo','scissors',1),
('Degradê','Fade preciso, do zero ao topo, com desenho perfeito.',55,45,'Cabelo','scissors',2),
('Barba','Barba modelada com toalha quente e navalha.',35,30,'Barba','razor',3),
('Corte + barba','O combo completo para sair impecável.',80,60,'Combo','crown',4),
('Sobrancelha','Limpeza e alinhamento na navalha.',15,15,'Acabamento','sparkles',5),
('Pigmentação','Preenchimento de falhas em barba ou cabelo.',40,30,'Acabamento','droplet',6);

INSERT INTO public.barbers (name, photo_url, phone, specialty, bio) VALUES
('Rafael Monteiro','asset:b1','11990000001','Degradê e barba','15 anos transformando estilos.'),
('Lucas Andrade','asset:b2','11990000002','Cortes clássicos','Precisão e acabamento impecável.');

INSERT INTO public.barber_services (barber_id, service_id) SELECT b.id, s.id FROM public.barbers b CROSS JOIN public.services s;
INSERT INTO public.working_hours (barber_id, weekday, start_time, end_time)
SELECT b.id, d, '09:00', '19:00' FROM public.barbers b CROSS JOIN generate_series(1,6) d;