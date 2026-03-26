export function errorResponse(message: string, status: number = 500): Response {
  return Response.json({ error: message }, { status });
}

export function classifyError(err: unknown): { message: string; status: number } {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();

    if (msg.includes("rate limit") || msg.includes("429")) {
      return { message: "Rate limited by AI provider. Please wait a moment and try again.", status: 429 };
    }
    if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("invalid api key")) {
      return { message: "AI provider authentication failed. Check API key configuration.", status: 502 };
    }
    if (msg.includes("timeout") || msg.includes("timed out")) {
      return { message: "AI generation timed out. Try a shorter prompt or simpler content type.", status: 504 };
    }
    if (msg.includes("context length") || msg.includes("maximum")) {
      return { message: "Prompt too long for the AI model. Try a shorter prompt.", status: 413 };
    }

    return { message: err.message, status: 500 };
  }
  return { message: "An unexpected error occurred during generation.", status: 500 };
}
