#!/bin/bash

# Deploy Cognito Frontend Integration - Task A2.x
# Update frontend to use Cognito authentication

set -e

echo "🚀 DEPLOYING COGNITO FRONTEND INTEGRATION"
echo "========================================="
echo ""

# Step 1: Update main.tsx to initialize Cognito
echo "📝 Step 1: Updating main.tsx..."
if ! grep -q "CognitoAuthProvider" src/main.tsx; then
    echo "   Adding Cognito imports and provider to main.tsx"
    
    # Create backup
    cp src/main.tsx src/main.tsx.backup
    
    # Add Cognito imports and provider
    cat > src/main.tsx.new << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Auth Providers - Cognito Migration
import { CognitoAuthProvider } from '@/contexts/CognitoAuthContext'
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext'

import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Feature flag for Cognito migration
const USE_COGNITO = import.meta.env.VITE_USE_COGNITO === 'true'

console.log('🔐 Auth Provider:', USE_COGNITO ? 'Cognito' : 'Legacy')

const AuthProvider = USE_COGNITO ? CognitoAuthProvider : SimpleAuthProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <SpeedInsights />
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)
EOF

    mv src/main.tsx.new src/main.tsx
    echo "   ✅ main.tsx updated with Cognito support"
else
    echo "   ✅ main.tsx already has Cognito support"
fi

echo ""

# Step 2: Add environment variable for feature flag
echo "📝 Step 2: Adding Cognito feature flag..."
if ! grep -q "VITE_USE_COGNITO" .env; then
    echo "VITE_USE_COGNITO=false" >> .env
    echo "   ✅ Added VITE_USE_COGNITO=false to .env"
else
    echo "   ✅ VITE_USE_COGNITO already exists in .env"
fi

# Step 3: Build and test
echo ""
echo "🔨 Step 3: Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi

echo ""
echo "🎯 COGNITO FRONTEND INTEGRATION COMPLETE"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo "   ✅ Cognito auth context created"
echo "   ✅ Legacy auth compatibility maintained"
echo "   ✅ Feature flag system implemented"
echo "   ✅ Build successful"
echo ""
echo "🔧 Next Steps:"
echo "   1. Test authentication flows"
echo "   2. Enable Cognito with VITE_USE_COGNITO=true"
echo "   3. Deploy to production"
echo ""