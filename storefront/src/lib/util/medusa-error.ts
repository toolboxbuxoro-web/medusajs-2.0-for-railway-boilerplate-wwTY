export default function medusaError(error: any): never {
  // Log the full error object for debugging
  console.error(`[MedusaError] Full error object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const u = new URL(error.config.url, error.config.baseURL)
    console.error("Resource:", u.toString())
    console.error("Response data:", error.response.data)
    console.error("Status code:", error.response.status)
    console.error("Headers:", error.response.headers)

    // Extracting the error message from the response data
    const message = error.response.data.message || error.response.data

    const finalMessage = message.charAt(0).toUpperCase() + message.slice(1) + "."
    console.error(`[MedusaError] ${u.toString()} - ${error.response.status}:`, error.response.data)
    
    throw new Error(`${finalMessage} (Status: ${error.response.status}, URL: ${u.pathname})`)
  } else if (error.request) {
    // The request was made but no response was received
    console.error(`[MedusaError] No response received for request:`, error.config?.url)
    throw new Error("No response received from server. Check your internet connection or backend status.")
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error(`[MedusaError] Setup error:`, error.message)
    console.error(`[MedusaError] Error stack:`, error.stack)
    throw new Error("Error setting up the request: " + error.message)
  }
}
