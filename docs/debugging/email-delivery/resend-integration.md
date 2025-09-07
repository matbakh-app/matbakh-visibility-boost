# Resend Email Integration Debugging

## Problem
Issues with Resend email service integration, delivery failures, and spam issues.

## Common Issues

### 1. API Key Configuration
```bash
# Check if API key is properly stored in Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id matbakh-email-config \
  --region eu-central-1 \
  --query SecretString --output text | jq -r '.RESEND_API_KEY'

# Test API key validity
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/domains
```

### 2. Domain Verification
```bash
# Check domain status
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/domains

# Add domain if not exists
curl -X POST https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "matbakh.app"}'
```

### 3. Email Delivery Status
```javascript
// Check email delivery status
const checkEmailStatus = async (emailId) => {
  const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    }
  });
  
  const status = await response.json();
  console.log('Email status:', status);
  return status;
};
```

## Spam Prevention

### 1. Proper Email Headers
```javascript
const emailData = {
  from: 'noreply@matbakh.app',
  to: recipientEmail,
  subject: 'Bestätigen Sie Ihre E-Mail-Adresse',
  html: emailHtml,
  headers: {
    'X-Priority': '3',
    'X-MSMail-Priority': 'Normal',
    'X-Mailer': 'matbakh.app',
    'Reply-To': 'support@matbakh.app'
  },
  tags: [
    { name: 'category', value: 'email-verification' },
    { name: 'environment', value: 'production' }
  ]
};
```

### 2. Content Optimization
```html
<!-- Avoid spam triggers -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>E-Mail Bestätigung</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Bestätigen Sie Ihre E-Mail-Adresse</h2>
    <p>Vielen Dank für Ihr Interesse an unserem Visibility Check.</p>
    <p>
      <a href="{{confirmUrl}}" 
         style="background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        E-Mail bestätigen
      </a>
    </p>
    <p>Falls der Button nicht funktioniert, kopieren Sie diesen Link:</p>
    <p>{{confirmUrl}}</p>
  </div>
</body>
</html>
```

## Debugging Commands

### Test Email Sending
```bash
# Test email via curl
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@matbakh.app",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email</p>"
  }'
```

### Check Email Logs
```bash
# Get recent emails
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  "https://api.resend.com/emails?limit=10"

# Get specific email details
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  "https://api.resend.com/emails/EMAIL-ID"
```

## Common Solutions

### Fix Lambda Email Function
```javascript
const sendEmail = async (emailData) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result.id);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};
```

## Related Issues
- A3.2: Email spam issues and Resend integration
- Email delivery optimization