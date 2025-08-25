-- Create business_contact_data table for public business information (GDPR-compliant)
CREATE TABLE public.business_contact_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES public.business_partners(id) ON DELETE CASCADE,

  -- Public: Company/Business name
  company_name TEXT NOT NULL,

  -- Structured business address (not private!)
  address_line1 TEXT NOT NULL,
  house_number TEXT NOT NULL,
  address_line2 TEXT,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT,
  country TEXT NOT NULL,

  -- Public contact data for the business (e.g. info@, business phone)
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_website TEXT,

  -- Social Media as JSONB (business profiles only!)
  socials JSONB DEFAULT '{}' CHECK (jsonb_typeof(socials) = 'object'),
    -- e.g. { "facebook_url": "...", "instagram_handle": "...", ... }

  -- Competitors as JSONB array
  competitors JSONB DEFAULT '[]' CHECK (jsonb_typeof(competitors) = 'array'),
    -- e.g. [ { "name": "...", "website": "..." }, ... ]

  -- Source and audit
  data_source TEXT NOT NULL DEFAULT 'user_input',
  verified BOOLEAN NOT NULL DEFAULT false,
  last_enriched_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create private contacts table for GDPR-sensitive personal data
CREATE TABLE public.partner_private_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.business_partners(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  -- These email/phone are personal! Only for communication with the contact person.
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_contact_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_private_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_contact_data
CREATE POLICY "Users can view their own business contact data"
  ON public.business_contact_data FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.business_partners 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own business contact data"
  ON public.business_contact_data FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.business_partners 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own business contact data"
  ON public.business_contact_data FOR UPDATE
  USING (
    customer_id IN (
      SELECT id FROM public.business_partners 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own business contact data"
  ON public.business_contact_data FOR DELETE
  USING (
    customer_id IN (
      SELECT id FROM public.business_partners 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for partner_private_contacts
CREATE POLICY "Users can view their own private contacts"
  ON public.partner_private_contacts FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.business_partners 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own private contacts"
  ON public.partner_private_contacts FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.business_partners 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own private contacts"
  ON public.partner_private_contacts FOR UPDATE
  USING (
    customer_id IN (
      SELECT id FROM public.business_partners 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own private contacts"
  ON public.partner_private_contacts FOR DELETE
  USING (
    customer_id IN (
      SELECT id FROM public.business_partners 
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_business_contact_data_customer_id ON public.business_contact_data(customer_id);
CREATE INDEX idx_business_contact_data_email ON public.business_contact_data(contact_email);
CREATE INDEX idx_business_contact_data_country ON public.business_contact_data(country);
CREATE INDEX idx_partner_private_contacts_customer_id ON public.partner_private_contacts(customer_id);

-- Triggers for updated_at
CREATE TRIGGER update_business_contact_data_updated_at
  BEFORE UPDATE ON public.business_contact_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_private_contacts_updated_at
  BEFORE UPDATE ON public.partner_private_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.business_contact_data IS 'GDPR-compliant storage of all business, public contact data of a company, never personally identifiable.';
COMMENT ON COLUMN public.business_contact_data.company_name IS 'Company name, required field, for all public processes';
COMMENT ON TABLE public.partner_private_contacts IS 'GDPR-sensitive personal contact persons, separate from business data';

-- Admin policies for both tables
CREATE POLICY "Admins can manage business contact data"
  ON public.business_contact_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage private contacts"
  ON public.partner_private_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );