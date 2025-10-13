// MATBAKH.APP – MCP STARTER (TypeScript)
// ------------------------------------------------------------
// Single-file starter for an MCP-compatible gateway that exposes
// tools to ChatGPT Apps and proxies execution to AWS Bedrock
// (or your own services) with Cognito-authenticated users.
//
// Files embedded below. Copy them into your repo 1:1.
// ------------------------------------------------------------

/*
📁 PROJECT STRUCTURE
.
├─ package.json
├─ tsconfig.json
├─ .env.example
├─ src/
│  ├─ server.ts            // Fastify server + MCP endpoints
│  ├─ bedrock.ts           // Bedrock client wrapper (placeholder)
│  ├─ auth.ts              // Cognito JWT verification (JWKs)
│  ├─ tools/
│  │  ├─ visibility.ts     // getVisibilityMetrics tool
│  │  ├─ umc.ts            // generatePost tool
│  │  └─ analysis.ts       // analyzePerformance tool
│  └─ types.ts             // shared types
└─ README.md
*/

// ------------------------- package.json -------------------------
// paste into package.json
{
  "name": "matbakh-mcp-starter",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx src/server.ts",
    "build": "tsc -p .",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "fastify": "^4.26.2",
    "fastify-cors": "^8.4.0",
    "fastify-helmet": "^11.1.1",
    "jose": "^5.9.3",
    "undici": "^6.19.8",
    "zod": "^3.23.8",
    "@aws-sdk/client-bedrock-runtime": "^3.645.0"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  }
}

// ------------------------- tsconfig.json ------------------------
// paste into tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "resolveJsonModule": true
  },
  "include": ["src"]
}

// ------------------------- .env.example -------------------------
// paste into .env (then provide real values)
PORT=8787
# AWS
AWS_REGION=eu-central-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
# Cognito (for user-auth via ChatGPT App OAuth callback hitting your backend)
COGNITO_ISSUER=https://cognito-idp.eu-central-1.amazonaws.com/<user-pool-id>
COGNITO_AUDIENCE=<app-client-id>

// --------------------------- src/types.ts -----------------------
export type McpTool = {
  name: string;
  description: string;
  input_schema?: unknown; // JSONSchema or Zod-like
};

export type McpListToolsResponse = {
  tools: McpTool[];
};

export type McpCallToolRequest = {
  tool_name: string;
  arguments?: Record<string, unknown>;
  // caller identity is taken from JWT
};

export type McpCallToolResponse = {
  content: Array<{ type: 'text' | 'json' | 'html'; text?: string; json?: unknown; html?: string }>;
};

// --------------------------- src/auth.ts ------------------------
import * as jose from 'jose';

const JWKS_CACHE = new Map<string, jose.JWTVerifyGetKey>();

export async function verifyCognitoJwt(token: string, issuer: string, audience: string) {
  const jwksUrl = new URL(`${issuer}/.well-known/jwks.json`);
  let getKey = JWKS_CACHE.get(issuer);
  if (!getKey) {
    const jwks = jose.createRemoteJWKSet(jwksUrl);
    getKey = jwks;
    JWKS_CACHE.set(issuer, getKey);
  }
  const { payload } = await jose.jwtVerify(token, getKey!, {
    issuer,
    audience,
  });
  return payload; // contains sub, email, etc.
}

// Utility to extract bearer token
export function getBearer(req: any): string | null {
  const h = req.headers['authorization'] || req.headers['Authorization'];
  if (!h || typeof h !== 'string') return null;
  const [typ, tok] = h.split(' ');
  return typ?.toLowerCase() === 'bearer' ? tok : null;
}

// -------------------------- src/bedrock.ts ----------------------
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export function makeBedrock() {
  const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'eu-central-1' });
  const modelId = process.env.BEDROCK_MODEL_ID!;
  return {
    async complete(prompt: string): Promise<string> {
      const body = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 512,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      };
      const res = await client.send(
        new InvokeModelCommand({
          modelId,
          body: new TextEncoder().encode(JSON.stringify(body)),
          contentType: 'application/json',
          accept: 'application/json',
        })
      );
      const decoded = JSON.parse(new TextDecoder().decode(res.body as Uint8Array));
      // Adapt for the chosen provider; below works for Anthropic-style on Bedrock
      const text = decoded?.output_text || decoded?.content?.[0]?.text || JSON.stringify(decoded);
      return text;
    },
  };
}

// ----------------------- src/tools/visibility.ts ----------------
import { McpTool, McpCallToolRequest, McpCallToolResponse } from '../types.js';

export const VisibilityTool: McpTool = {
  name: 'getVisibilityMetrics',
  description: 'Returns visibility KPIs (impressions, CTR, post count) for a given location & period',
  input_schema: {
    type: 'object',
    properties: {
      location: { type: 'string' },
      from: { type: 'string', format: 'date' },
      to: { type: 'string', format: 'date' },
    },
    required: ['location', 'from', 'to'],
  },
};

export async function callVisibilityTool(req: McpCallToolRequest, user: any): Promise<McpCallToolResponse> {
  const { location, from, to } = (req.arguments || {}) as Record<string, string>;
  // TODO: replace with real data sources (GBP/Meta/Your DB)
  const demo = {
    location,
    from,
    to,
    impressions: 18342,
    ctr: 0.034,
    posts: 12,
  };
  return { content: [{ type: 'json', json: demo }] };
}

// -------------------------- src/tools/umc.ts --------------------
import { McpTool, McpCallToolRequest, McpCallToolResponse } from '../types.js';
import { makeBedrock } from '../bedrock.js';

export const GeneratePostTool: McpTool = {
  name: 'generatePost',
  description: 'Generates a social post (text + hashtags) for a given persona and goal',
  input_schema: {
    type: 'object',
    properties: {
      persona: { type: 'string', enum: ['Solo-Sarah', 'Ketten-Katrin', 'Bewahrer-Ben', 'Wachstums-Walter'] },
      goal: { type: 'string' },
      topic: { type: 'string' },
    },
    required: ['persona', 'goal', 'topic'],
  },
};

export async function callGeneratePost(req: McpCallToolRequest, user: any): Promise<McpCallToolResponse> {
  const { persona, goal, topic } = (req.arguments || {}) as Record<string, string>;
  const br = makeBedrock();
  const prompt = `You are an assistant for a restaurant visibility platform. Persona: ${persona}. Goal: ${goal}. Topic: ${topic}. Generate a concise IG/FB post with CTA and 5 hashtags.`;
  const text = await br.complete(prompt);
  return { content: [{ type: 'text', text }] };
}

// ----------------------- src/tools/analysis.ts ------------------
import { McpTool, McpCallToolRequest, McpCallToolResponse } from '../types.js';

export const AnalyzePerformanceTool: McpTool = {
  name: 'analyzePerformance',
  description: 'Analyze last campaign metrics and return recommendations',
  input_schema: {
    type: 'object',
    properties: {
      campaignId: { type: 'string' }
    },
    required: ['campaignId']
  }
};

export async function callAnalyzePerformance(req: McpCallToolRequest, user: any): Promise<McpCallToolResponse> {
  const { campaignId } = (req.arguments || {}) as Record<string, string>;
  // TODO: Replace with your analytics engine / DB queries
  const analysis = {
    campaignId,
    summary: 'CTR below target on weekday posts; video posts outperform images by 23%.',
    recommendations: [
      'Post between 11:30–13:00 and 18:00–20:00 local time',
      'Use short vertical videos (<20s) with menu highlight',
      'Add location hashtag + city in headline',
    ],
  };
  return { content: [{ type: 'json', json: analysis }] };
}

// --------------------------- src/server.ts ----------------------
import Fastify from 'fastify';
import helmet from 'fastify-helmet';
import cors from 'fastify-cors';
import { verifyCognitoJwt, getBearer } from './auth.js';
import { McpListToolsResponse, McpCallToolRequest, McpCallToolResponse } from './types.js';
import { VisibilityTool, callVisibilityTool } from './tools/visibility.js';
import { GeneratePostTool, callGeneratePost } from './tools/umc.js';
import { AnalyzePerformanceTool, callAnalyzePerformance } from './tools/analysis.js';

const PORT = Number(process.env.PORT || 8787);
const COGNITO_ISSUER = process.env.COGNITO_ISSUER!;
const COGNITO_AUDIENCE = process.env.COGNITO_AUDIENCE!;

const app = Fastify({ logger: true });
await app.register(helmet);
await app.register(cors, { origin: true });

// Auth hook – verifies Cognito JWT from ChatGPT App OAuth flow
app.addHook('preHandler', async (req, res) => {
  if (req.routerPath?.startsWith('/mcp')) {
    const token = getBearer(req);
    if (!token) {
      res.code(401);
      throw new Error('Missing bearer token');
    }
    try {
      const user = await verifyCognitoJwt(token, COGNITO_ISSUER, COGNITO_AUDIENCE);
      // @ts-ignore
      (req as any).user = user;
    } catch (e: any) {
      req.log.error(e, 'JWT verify failed');
      res.code(401);
      throw new Error('Invalid token');
    }
  }
});

// MCP: list tools
app.get('/mcp/tools', async (req, res) => {
  const resp: McpListToolsResponse = {
    tools: [VisibilityTool, GeneratePostTool, AnalyzePerformanceTool],
  };
  return resp;
});

// MCP: call tool
app.post('/mcp/call', async (req, res) => {
  const body = req.body as McpCallToolRequest;
  const user = (req as any).user;
  let out: McpCallToolResponse;
  switch (body.tool_name) {
    case 'getVisibilityMetrics':
      out = await callVisibilityTool(body, user);
      break;
    case 'generatePost':
      out = await callGeneratePost(body, user);
      break;
    case 'analyzePerformance':
      out = await callAnalyzePerformance(body, user);
      break;
    default:
      res.code(404);
      return { content: [{ type: 'text', text: `Unknown tool: ${body.tool_name}` }] };
  }
  return out;
});

app.get('/health', async () => ({ ok: true }));

app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  console.log(`[MCP] matbakh gateway listening on :${PORT}`);
});

// --------------------------- README.md --------------------------
/*
# matbakh.app – MCP Starter (TypeScript)

## 1) Install
pnpm i  # or npm i / yarn
cp .env.example .env
# set COGNITO_ISSUER & COGNITO_AUDIENCE, AWS_REGION & BEDROCK_MODEL_ID

## 2) Run (dev)
pnpm dev
# http://localhost:8787/health

## 3) Test MCP endpoints
curl http://localhost:8787/mcp/tools
curl -X POST http://localhost:8787/mcp/call \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"tool_name":"generatePost","arguments":{"persona":"Solo-Sarah","goal":"Lunch Promo","topic":"Pasta Monday"}}'

## 4) Connect to ChatGPT (Apps / Developer Mode)
- Register this server URL as your MCP Streaming URL
- Provide OAuth (Cognito) so ChatGPT can fetch a user JWT to call your tools

## Notes
- Tools are simple examples; replace internals with your VC/UMC/Analytics
- Bedrock wrapper uses Anthropic via Bedrock; adapt to your models as needed
- Keep JWT verification strict & add rate-limits in production
*/
