# Matbakh Visibility Batch Service

AWS Bedrock integration für die Restaurant-Sichtbarkeitsanalyse von matbakh.app.

## 🎯 Zweck

Dieser Service nutzt AWS Bedrock (Claude-Modelle) um detaillierte Analysen der Online-Sichtbarkeit von Restaurants zu erstellen.

## 📋 Verfügbare Modelle

Basierend auf deiner AWS Console:
- ✅ Claude 3 Sonnet (`anthropic.claude-3-sonnet-20240229-v1:0`)
- ✅ Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) 
- ✅ Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`) **[EMPFOHLEN]**

## 🚀 Setup

### 1. Dependencies installieren
```bash
cd services/visibility-batch
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
# Fülle deine AWS Credentials ein
```

### 3. Test ausführen
```bash
npm test
# oder
npm run dev
```

## 🔧 Konfiguration

### AWS Credentials
Du brauchst folgende AWS-Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION=eu-central-1`

### Model Selection
Standardmäßig wird Claude 3.5 Sonnet verwendet (bestes Text & Vision Model).
Änderbar via `BEDROCK_MODEL_ID` in .env.

## 📊 Input/Output Schema

### Input
```json
{
  "businessName": "Restaurant Name",
  "location": "Stadt, Stadtteil",
  "mainCategory": "Kategorie",
  "googleName": "google-handle",
  "facebookName": "facebook-handle", 
  "instagramName": "instagram-handle",
  "benchmarks": [{"name": "Competitor", "score": 75}]
}
```

### Output
```json
{
  "overallScore": 75,
  "platformAnalyses": [...],
  "benchmarks": [...],
  "quickWins": [...],
  "categoryInsights": [...],
  "swotAnalysis": {...}
}
```

## 🔄 Integration in matbakh.app

Nach erfolgreichem Test wird dieser Service in die Edge Function `enhanced-visibility-check` integriert.

## 🛠️ Troubleshooting

### Häufige Fehler:
1. **InvalidCredentials**: AWS-Keys prüfen
2. **ModelNotFound**: Model-ID in AWS Console verificieren  
3. **AccessDenied**: Bedrock-Permissions prüfen
4. **TimeoutError**: Network/Region-Settings prüfen

### Debug-Modus:
```bash
DEBUG=true npm test
```