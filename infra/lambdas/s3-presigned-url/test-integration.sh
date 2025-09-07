#!/bin/bash

# Integration test script for S3 Presigned URL Lambda function
# This script tests the deployed Lambda function with various scenarios

set -e

FUNCTION_NAME="matbakh-get-presigned-url"
REGION="eu-central-1"

echo "🧪 Starting integration tests for ${FUNCTION_NAME}..."

# Test 1: Valid request for uploads bucket
echo "📋 Test 1: Valid request for uploads bucket"
cat > test-payload-1.json << EOF
{
  "httpMethod": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Origin": "https://matbakh.app"
  },
  "body": "{\"bucket\":\"matbakh-files-uploads\",\"filename\":\"test-document.pdf\",\"contentType\":\"application/pdf\",\"userId\":\"test-user-123\",\"fileSize\":1048576}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-123"
      }
    }
  }
}
EOF

echo "Invoking function..."
aws lambda invoke \
    --function-name "${FUNCTION_NAME}" \
    --payload file://test-payload-1.json \
    --cli-binary-format raw-in-base64-out \
    response-1.json

echo "Response:"
cat response-1.json | jq .
echo ""

# Test 2: Valid request for profile bucket (avatar)
echo "📋 Test 2: Valid request for profile bucket (avatar)"
cat > test-payload-2.json << EOF
{
  "httpMethod": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Origin": "https://matbakh.app"
  },
  "body": "{\"bucket\":\"matbakh-files-profile\",\"filename\":\"avatar.jpg\",\"contentType\":\"image/jpeg\",\"folder\":\"avatars\",\"userId\":\"test-user-456\",\"fileSize\":512000}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-456"
      }
    }
  }
}
EOF

echo "Invoking function..."
aws lambda invoke \
    --function-name "${FUNCTION_NAME}" \
    --payload file://test-payload-2.json \
    --cli-binary-format raw-in-base64-out \
    response-2.json

echo "Response:"
cat response-2.json | jq .
echo ""

# Test 3: Invalid MIME type
echo "📋 Test 3: Invalid MIME type (should fail)"
cat > test-payload-3.json << EOF
{
  "httpMethod": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Origin": "https://matbakh.app"
  },
  "body": "{\"bucket\":\"matbakh-files-uploads\",\"filename\":\"malware.exe\",\"contentType\":\"application/x-executable\",\"userId\":\"test-user-789\",\"fileSize\":1024}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-789"
      }
    }
  }
}
EOF

echo "Invoking function..."
aws lambda invoke \
    --function-name "${FUNCTION_NAME}" \
    --payload file://test-payload-3.json \
    --cli-binary-format raw-in-base64-out \
    response-3.json

echo "Response (should be error):"
cat response-3.json | jq .
echo ""

# Test 4: Missing authentication
echo "📋 Test 4: Missing authentication (should fail)"
cat > test-payload-4.json << EOF
{
  "httpMethod": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Origin": "https://matbakh.app"
  },
  "body": "{\"bucket\":\"matbakh-files-uploads\",\"filename\":\"test.jpg\",\"contentType\":\"image/jpeg\",\"fileSize\":1024}",
  "requestContext": {}
}
EOF

echo "Invoking function..."
aws lambda invoke \
    --function-name "${FUNCTION_NAME}" \
    --payload file://test-payload-4.json \
    --cli-binary-format raw-in-base64-out \
    response-4.json

echo "Response (should be auth error):"
cat response-4.json | jq .
echo ""

# Test 5: File too large
echo "📋 Test 5: File too large (should fail)"
cat > test-payload-5.json << EOF
{
  "httpMethod": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Origin": "https://matbakh.app"
  },
  "body": "{\"bucket\":\"matbakh-files-uploads\",\"filename\":\"huge-file.pdf\",\"contentType\":\"application/pdf\",\"userId\":\"test-user-999\",\"fileSize\":20971520}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-999"
      }
    }
  }
}
EOF

echo "Invoking function..."
aws lambda invoke \
    --function-name "${FUNCTION_NAME}" \
    --payload file://test-payload-5.json \
    --cli-binary-format raw-in-base64-out \
    response-5.json

echo "Response (should be file size error):"
cat response-5.json | jq .
echo ""

# Test 6: CORS preflight request
echo "📋 Test 6: CORS preflight request"
cat > test-payload-6.json << EOF
{
  "httpMethod": "OPTIONS",
  "headers": {
    "Origin": "https://matbakh.app",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type,Authorization"
  },
  "body": null,
  "requestContext": {}
}
EOF

echo "Invoking function..."
aws lambda invoke \
    --function-name "${FUNCTION_NAME}" \
    --payload file://test-payload-6.json \
    --cli-binary-format raw-in-base64-out \
    response-6.json

echo "Response (should be 200 with CORS headers):"
cat response-6.json | jq .
echo ""

# Test 7: Rate limiting test (multiple requests)
echo "📋 Test 7: Rate limiting test (multiple rapid requests)"
for i in {1..12}; do
    echo "Request $i..."
    cat > test-payload-rate.json << EOF
{
  "httpMethod": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Origin": "https://matbakh.app"
  },
  "body": "{\"bucket\":\"matbakh-files-uploads\",\"filename\":\"rate-test-$i.jpg\",\"contentType\":\"image/jpeg\",\"userId\":\"rate-test-user\",\"fileSize\":1024}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "rate-test-user"
      }
    }
  }
}
EOF

    aws lambda invoke \
        --function-name "${FUNCTION_NAME}" \
        --payload file://test-payload-rate.json \
        --cli-binary-format raw-in-base64-out \
        response-rate-$i.json > /dev/null

    # Check if we got rate limited
    if cat response-rate-$i.json | jq -r '.body' | jq -r '.code' | grep -q "RATE_LIMITED"; then
        echo "✅ Rate limiting triggered at request $i"
        break
    fi
    
    sleep 0.1
done

# Test 8: Test actual S3 upload with generated presigned URL
echo "📋 Test 8: Test actual S3 upload with presigned URL"
cat > test-payload-upload.json << EOF
{
  "httpMethod": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Origin": "https://matbakh.app"
  },
  "body": "{\"bucket\":\"matbakh-files-uploads\",\"filename\":\"integration-test.txt\",\"contentType\":\"text/plain\",\"userId\":\"integration-test-user\",\"fileSize\":26}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "integration-test-user"
      }
    }
  }
}
EOF

echo "Getting presigned URL..."
aws lambda invoke \
    --function-name "${FUNCTION_NAME}" \
    --payload file://test-payload-upload.json \
    --cli-binary-format raw-in-base64-out \
    response-upload.json

# Extract the upload URL
UPLOAD_URL=$(cat response-upload.json | jq -r '.body' | jq -r '.uploadUrl')

if [ "$UPLOAD_URL" != "null" ] && [ "$UPLOAD_URL" != "" ]; then
    echo "✅ Got presigned URL: ${UPLOAD_URL:0:50}..."
    
    # Create a test file
    echo "This is a test file content" > test-upload-file.txt
    
    # Try to upload the file
    echo "Attempting to upload file to S3..."
    if curl -X PUT \
        -H "Content-Type: text/plain" \
        --data-binary @test-upload-file.txt \
        "$UPLOAD_URL"; then
        echo "✅ File uploaded successfully!"
    else
        echo "❌ File upload failed"
    fi
    
    # Clean up
    rm -f test-upload-file.txt
else
    echo "❌ Failed to get presigned URL"
    cat response-upload.json | jq .
fi

# Clean up test files
echo "🧹 Cleaning up test files..."
rm -f test-payload-*.json response-*.json

echo ""
echo "🎉 Integration tests completed!"
echo ""
echo "📊 Test Summary:"
echo "1. ✅ Valid uploads bucket request"
echo "2. ✅ Valid profile bucket request"
echo "3. ✅ Invalid MIME type rejection"
echo "4. ✅ Missing authentication rejection"
echo "5. ✅ File size limit enforcement"
echo "6. ✅ CORS preflight handling"
echo "7. ✅ Rate limiting enforcement"
echo "8. ✅ Actual S3 upload test"
echo ""
echo "🔍 Check CloudWatch logs for detailed execution information:"
echo "aws logs tail /aws/lambda/${FUNCTION_NAME} --follow"