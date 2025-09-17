-- Create table for partner KPIs
CREATE TABLE public.partner_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL,
  annual_revenue NUMERIC,
  seating_capacity INTEGER,
  food_cost_ratio NUMERIC,
  labor_cost_ratio NUMERIC,
  employee_count INTEGER,
  opening_hours JSONB,
  additional_kpis JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (partner_id) REFERENCES business_partners(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.partner_kpis ENABLE ROW LEVEL SECURITY;

-- Create policies for partner KPIs
CREATE POLICY "Partners can view their own KPIs" 
ON public.partner_kpis 
FOR SELECT 
USING (partner_id IN (
  SELECT id FROM business_partners WHERE user_id = auth.uid()
));

CREATE POLICY "Partners can create their own KPIs" 
ON public.partner_kpis 
FOR INSERT 
WITH CHECK (partner_id IN (
  SELECT id FROM business_partners WHERE user_id = auth.uid()
));

CREATE POLICY "Partners can update their own KPIs" 
ON public.partner_kpis 
FOR UPDATE 
USING (partner_id IN (
  SELECT id FROM business_partners WHERE user_id = auth.uid()
));

CREATE POLICY "Partners can delete their own KPIs" 
ON public.partner_kpis 
FOR DELETE 
USING (partner_id IN (
  SELECT id FROM business_partners WHERE user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_partner_kpis_updated_at
BEFORE UPDATE ON public.partner_kpis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();