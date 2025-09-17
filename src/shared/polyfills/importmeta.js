// src/polyfill-importmeta.js
// Jest polyfill for import.meta.env (Vite compatibility)

if (!global.import) {
  global.import = {
    meta: {
      env: {
        VITE_VC_API_PROVIDER: 'aws',
        VITE_PUBLIC_API_BASE: 'https://api.example.com/prod',
        VITE_CLOUDFRONT_URL: 'https://files.matbakh.app',
        MODE: 'test',
        PROD: false,
        DEV: true,
        SSR: false
      },
    },
  };
}

// Also mock fetch globally for Jest
if (!global.fetch) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, token: 'test-token' }),
  });
}