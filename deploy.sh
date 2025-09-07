#!/bin/bash

set -e

PROFILE="matbakh-dev"
STACK_NAME="MatbakhS3BucketsStack"
REGION="eu-central-1"
OUTPUTS_FILE="s3-outputs.json"

echo "🚀 Starte Deployment für $STACK_NAME mit Profil $PROFILE..."

# 1. Check ob AWS CLI existiert
if ! command -v aws &> /dev/null
then
    echo "❌ AWS CLI nicht installiert. Bitte installiere es zuerst: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi

# 2. Check ob Profil vorhanden
if ! aws configure list-profiles | grep -q "$PROFILE"; then
  echo "❌ Profil $PROFILE existiert nicht. Bitte einmalig konfigurieren mit:"
  echo "   aws configure --profile $PROFILE"
  exit 1
fi

# 3. SSO Login durchführen (falls nötig)
echo "🔐 Führe SSO Login durch für Profil $PROFILE..."
aws sso login --profile $PROFILE

# 4. Deploy ausführen
echo "📦 CDK Deploy startet..."
cd infra/aws
AWS_PROFILE=$PROFILE npx cdk deploy $STACK_NAME --require-approval never --outputs-file $OUTPUTS_FILE

# 5. Ergebnis anzeigen
echo ""
echo "✅ Deployment abgeschlossen. Outputs:"
cat $OUTPUTS_FILE

echo ""
echo "✨ Fertig. Stack erfolgreich deployed unter Profil $PROFILE."

# Optional: Presigned Lambda URL testen
if command -v jq &> /dev/null; then
    URL=$(jq -r '.MatbakhS3BucketsStack.PresignedUrlFunctionUrl' $OUTPUTS_FILE 2>/dev/null || echo "")
    if [ ! -z "$URL" ] && [ "$URL" != "null" ]; then
        echo "🌐 Presigned URL Lambda: $URL"
        echo "💡 Teste mit: curl -X POST $URL"
    fi
fi