
-- Update the has_gmail question to include the third option
UPDATE public.onboarding_questions 
SET options = '{
  "de": [
    {"value": "yes", "label": "Ja, ich habe bereits ein Gmail-Konto"}, 
    {"value": "no", "label": "Nein, ich benötige Hilfe beim Einrichten"},
    {"value": "no_google_registration", "label": "Nein, ich möchte mich ohne Google-Konto registrieren"}
  ], 
  "en": [
    {"value": "yes", "label": "Yes, I already have a Gmail account"}, 
    {"value": "no", "label": "No, I need help setting one up"},
    {"value": "no_google_registration", "label": "No, I want to register without a Google account"}
  ]
}'::jsonb
WHERE slug = 'has_gmail';
