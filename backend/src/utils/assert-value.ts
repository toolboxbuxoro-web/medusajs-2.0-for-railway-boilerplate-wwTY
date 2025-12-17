/**
 * Assert that a value is not undefined. If it is, throw an error with the provided message.
 * @param v - Value to assert
 * @param errorMessage - Error message to throw if value is undefined
 */
export function assertValue<T extends string | undefined>(
  v: T | undefined,
  errorMessage: string,
): T {
  if (v === undefined) {
    // #region agent log
    ;(() => {
      const payload = {
        sessionId: "debug-session",
        runId: "railway",
        hypothesisId: "H1_backend_crashes_due_to_missing_required_env",
        location: "backend/src/utils/assert-value.ts:assertValue",
        message: "assertValue failed",
        data: { errorMessage },
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

    throw new Error(errorMessage)
  }

  return v
}
