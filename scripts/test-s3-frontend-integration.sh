#!/bin/bash

set -e

echo "🧪 S3 Frontend Integration Test"
echo "================================"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found. Creating it..."
    cat > .env.local << EOF
VITE_PRESIGNED_URL_ENDPOINT=https://mgnmda4fdc7pd33znjxoocpcqe0vpcby.lambda-url.eu-central-1.on.aws/
VITE_PUBLIC_API_BASE=https://api.matbakh.app
EOF
    echo "✅ .env.local created"
fi

# Check if development server is running
echo "🔍 Checking if development server is running..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Development server is running on http://localhost:5173"
else
    echo "❌ Development server not running. Please start it with:"
    echo "   npm run dev"
    echo "   # or"
    echo "   pnpm dev"
    echo ""
    echo "💡 After the fix, Vite should show:"
    echo "   ➜  Local:   http://localhost:5173/"
    exit 1
fi

# Test Lambda endpoint directly
echo "🔍 Testing Lambda endpoint directly..."
LAMBDA_URL="https://mgnmda4fdc7pd33znjxoocpcqe0vpcby.lambda-url.eu-central-1.on.aws/"

# Test with minimal valid request
TEST_PAYLOAD='{
  "bucket": "matbakh-files-uploads",
  "filename": "test-integration.jpg",
  "contentType": "image/jpeg",
  "folder": "user-uploads",
  "userId": "test-user-id",
  "fileSize": 1024
}'

echo "📤 Sending test request to Lambda..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$LAMBDA_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "$TEST_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "📥 Response Code: $HTTP_CODE"
echo "📥 Response Body: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Lambda endpoint is working correctly"
elif [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Lambda endpoint is responding (expected auth/validation error)"
else
    echo "❌ Unexpected response code: $HTTP_CODE"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Open your browser to http://localhost:5173"
echo "2. Navigate to a page with file upload functionality"
echo "3. Try uploading a test image or PDF file"
echo "4. Check browser DevTools Network tab for requests to:"
echo "   $LAMBDA_URL"
echo "5. Verify the file appears in S3 bucket: matbakh-files-uploads"
echo ""
echo "✨ Frontend integration is ready for testing!"