import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  const defaultRegion = process.env.NEXT_PUBLIC_DEFAULT_REGION;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const results: any = {
    env: {
      NEXT_PUBLIC_MEDUSA_BACKEND_URL: backendUrl || 'MISSING',
      NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: publishableKey ? `${publishableKey.slice(0, 8)}...${publishableKey.slice(-4)}` : 'MISSING',
      NEXT_PUBLIC_DEFAULT_REGION: defaultRegion || 'MISSING (defaulting to us in code)',
      NEXT_PUBLIC_BASE_URL: baseUrl || 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
    },
    tests: {}
  };

  if (backendUrl) {
    try {
      const start = Date.now();
      const response = await fetch(`${backendUrl}/store/regions`, {
          headers: {
              'x-publishable-api-key': publishableKey || '',
              'Content-Type': 'application/json'
          }
      });
      const duration = Date.now() - start;
      const body = await response.text();
      
      results.tests.backend_connectivity = {
        status: response.status,
        ok: response.ok,
        duration_ms: duration,
        response_preview: body.slice(0, 100) + (body.length > 100 ? '...' : '')
      };
    } catch (e: any) {
      results.tests.backend_connectivity = {
        error: e.message,
        stack: e.stack
      };
    }
  } else {
      results.tests.backend_connectivity = "Skipped - no backend URL";
  }

  return NextResponse.json(results);
};
