export const runtime = "nodejs"

export async function GET() {
  // #region agent log
  ;(() => {
    const payload = {
      sessionId: "debug-session",
      runId: "railway",
      hypothesisId: "H4_health_endpoint_reached_storefront",
      location: "storefront/src/app/health/route.ts:GET",
      message: "Storefront /health hit",
      data: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        host: process.env.HOST,
        pid: process.pid,
      },
      timestamp: Date.now(),
    }
    console.log("[agent-debug]", JSON.stringify(payload))
    fetch("http://127.0.0.1:7242/ingest/0a4ffe82-b28a-4833-a3aa-579b3fd64808", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {})
  })()
  // #endregion agent log

  return Response.json(
    { status: "ok" },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    }
  )
}


