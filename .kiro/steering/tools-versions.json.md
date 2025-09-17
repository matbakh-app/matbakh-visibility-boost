{
  "testing": {
    "jest": {
      "version": "29.7.0",
      "configFile": "jest.config.js",
      "testsDirectory": "__tests__/"
    },
    "playwright": {
      "version": "1.49.0",
      "configFile": "playwright.config.ts",
      "testsDirectory": "e2e/"
    }
  },
  "aws": {
    "aws-sdk-js-v3": {
      "version": "3.635.0",
      "packages": [
        "@aws-sdk/client-rds",
        "@aws-sdk/client-cognito-identity-provider"
      ]
    },
    "aws-cdk": {
      "version": "2.163.1",
      "configFile": "cdk.json"
    }
  },
  "frontend": {
    "react": {
      "version": "18.3.1",
      "notes": "mit Vite + Tailwind"
    },
    "vite": {
      "version": "5.3.3",
      "notes": "Entwicklung + Build"
    },
    "tailwindcss": {
      "version": "3.4.7"
    },
    "shadcn-ui": {
      "version": "0.9.0"
    }
  },
  "backend": {
    "node": {
      "version": "20.x",
      "notes": "alle Lambdas auf Node 20 migriert"
    },
    "python": {
      "version": "3.11",
      "notes": "für Python-Lambdas"
    },
    "redis": {
      "version": "7.x",
      "notes": "Memory Layer"
    },
    "postgresql": {
      "version": "15.x",
      "notes": "AWS RDS"
    }
  },
  "ai": {
    "claude-bedrock": {
      "version": "3.5-sonnet",
      "notes": "AWS Bedrock Claude 3.5 Sonnet"
    },
    "gemini": {
      "version": "Ready",
      "notes": "Provider Abstraction vorhanden"
    }
  },
  "ci": {
    "github-actions": {
      "version": "latest",
      "notes": "Deployment, Tests, Linting"
    }
  }
  "testing": {
  "jest": {
    "version": "29.7.0",
    "env": "node/jsdom",
    "configFile": "jest.config.js",
    "setupFile": "src/setupTests.ts"
  },
  "@testing-library/jest-dom": {
    "version": "6.3.0"
  },
  "@testing-library/react": {
    "version": "14.1.2"
  },
  "@testing-library/user-event": {
    "version": "14.5.1"
  },
  "ts-jest": {
    "version": "29.1.2"
  }
}
}
<!------------------------------------------------------------------------------------
   Add Rules to this file or a short description and have Kiro refine them for you:   
-------------------------------------------------------------------------------------> 