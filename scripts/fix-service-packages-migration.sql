-- Fix service_packages table migration issue
-- This script resolves the column "period" does not exist error

-- First, drop the existing table if it exists (to start clean)
DROP TABLE IF EXISTS public.service_packages CASCADE;

-- Recreate the table with all required columns
CREATE TABLE public.service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly', 'one-time')),
    features JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON public.service_packages(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_service_packages_period ON public.service_packages(period);

-- Enable RLS
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service packages are viewable by everyone" ON public.service_packages
    FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Only admins can manage service packages" ON public.service_packages
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Insert sample data
INSERT INTO public.service_packages (name, description, price, period, features) VALUES
('Basic VC', 'Basic Visibility Check with essential insights', 0.00, 'one-time', 
 '["Basic visibility analysis", "Google My Business check", "Social media presence", "Basic recommendations"]'),
('Professional VC', 'Comprehensive visibility analysis with detailed reports', 29.99, 'one-time',
 '["Complete visibility analysis", "Competitive benchmarking", "Detailed PDF report", "Action plan", "Email support"]'),
('Business Dashboard', 'Monthly dashboard access with ongoing monitoring', 49.99, 'monthly',
 '["Real-time monitoring", "Monthly reports", "Trend analysis", "Priority support", "Custom recommendations"]'),
('Enterprise Solution', 'Full-service digital presence management', 199.99, 'monthly',
 '["Complete management", "Dedicated account manager", "Custom integrations", "24/7 support", "Advanced analytics"]');

-- Add comment
COMMENT ON TABLE public.service_packages IS 'Service packages offered by matbakh.app';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_service_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_service_packages_updated_at
    BEFORE UPDATE ON public.service_packages
    FOR EACH ROW EXECUTE FUNCTION public.handle_service_packages_updated_at();