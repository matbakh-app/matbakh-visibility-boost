-- Create table for Facebook/Meta webhook events
CREATE TABLE public.facebook_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  object_type text NOT NULL, -- page, instagram, user, etc.
  object_id text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'pending',
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facebook_webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can manage webhook events" 
ON public.facebook_webhook_events 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view webhook events" 
ON public.facebook_webhook_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Create updated_at trigger
CREATE TRIGGER update_facebook_webhook_events_updated_at
  BEFORE UPDATE ON public.facebook_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_facebook_webhook_events_event_type ON public.facebook_webhook_events(event_type);
CREATE INDEX idx_facebook_webhook_events_object_type ON public.facebook_webhook_events(object_type);
CREATE INDEX idx_facebook_webhook_events_processing_status ON public.facebook_webhook_events(processing_status);
CREATE INDEX idx_facebook_webhook_events_created_at ON public.facebook_webhook_events(created_at);

-- Create index on raw_payload for JSONB queries
CREATE INDEX idx_facebook_webhook_events_payload_gin ON public.facebook_webhook_events USING gin(raw_payload);