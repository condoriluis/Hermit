-- ===================================================
-- Esquema de Base de Datos para Hermit (Supabase)
-- ===================================================

-- 1. Tabla de Licencias
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,                  -- Formato HERMIT-XXXX-XXXX-XXXX-XXXX
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'gratis',       -- 'gratis', 'mensual', 'anual'
  status TEXT NOT NULL DEFAULT 'active',     -- 'active', 'pending', 'expired', 'cancelled'
  payment_method TEXT DEFAULT 'free',        -- 'free', 'paypal', 'qr_bolivia'
  amount NUMERIC(10, 2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  founder BOOLEAN DEFAULT false,
  machines TEXT[] DEFAULT '{}',              -- Lista de HWIDs de computadoras activas (máx 2)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Pagos / Transacciones (Auditoría)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
  external_id TEXT,                          -- ID de orden PayPal o Nro de transacción QR
  method TEXT NOT NULL,                      -- 'paypal' o 'qr_bolivia'
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL,                    -- 'USD' o 'BOB'
  status TEXT NOT NULL,                      -- 'completed', 'pending', 'rejected'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda ultrarrápida
CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses(key);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON public.licenses(email);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON public.payments(external_id);

-- RLS (Row Level Security) habilitado por seguridad
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Política de lectura con Service Role (API backend)
CREATE POLICY "Servidor backend tiene acceso total a licenses"
  ON public.licenses
  FOR ALL
  USING (true);

CREATE POLICY "Servidor backend tiene acceso total a payments"
  ON public.payments
  FOR ALL
  USING (true);

