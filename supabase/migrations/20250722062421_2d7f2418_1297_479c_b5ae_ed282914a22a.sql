-- Create facebook_oauth_tokens table for storing Facebook authentication tokens
CREATE TABLE public.facebook_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facebook_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  email TEXT,
  scopes TEXT[] DEFAULT ARRAY['public_profile', 'email'],
  consent_given BOOLEAN NOT NULL DEFAULT true,
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicate tokens per user
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.facebook_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
CREATE POLICY "Users can view their own Facebook tokens" 
ON public.facebook_oauth_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Facebook tokens" 
ON public.facebook_oauth_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Facebook tokens" 
ON public.facebook_oauth_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Facebook tokens" 
ON public.facebook_oauth_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_facebook_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_facebook_oauth_tokens_updated_at
BEFORE UPDATE ON public.facebook_oauth_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_facebook_oauth_tokens_updated_at();

-- Add helpful indexes
CREATE INDEX idx_facebook_oauth_tokens_user_id ON public.facebook_oauth_tokens(user_id);
CREATE INDEX idx_facebook_oauth_tokens_facebook_user_id ON public.facebook_oauth_tokens(facebook_user_id);