import { NextRequest, NextResponse } from 'next/server';

export const runtime = "nodejs"

export const GET = (req: NextRequest) => {
  // #region agent log
  ;(() => {
    const payload = {
      sessionId: "debug-session",
      runId: "railway",
      hypothesisId: "H5_healthcheck_endpoint_reached",
      location: "storefront/src/app/api/healthcheck/route.ts:GET",
      message: "Railway healthcheck hit /api/healthcheck",
      data: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        host: process.env.HOST,
        url: (req as any)?.url,
      },
      timestamp: Date.now(),
    }
    console.log("[agent-debug]", JSON.stringify(payload))
  })()
  // #endregion agent log

  return NextResponse.json({ status: 'ok' });
};