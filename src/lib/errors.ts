/**
 * Sanitizes error messages to prevent leaking database connection details,
 * server info, or internal database query structures to the user interface.
 */
export function getFriendlyErrorMessage(err: unknown, fallbackMessage = "An unexpected error occurred."): string {
  if (!err) return fallbackMessage;

  const message = err instanceof Error ? err.message : String(err);
  const lowerMessage = message.toLowerCase();

  // Detect internal database connection, pool, Prisma, socket, or host unreachable errors
  const isDbError =
    lowerMessage.includes("prisma") ||
    lowerMessage.includes("database") ||
    lowerMessage.includes("db") ||
    lowerMessage.includes("postgres") ||
    lowerMessage.includes("neon") ||
    lowerMessage.includes("conn") ||
    lowerMessage.includes("pool") ||
    lowerMessage.includes("socket") ||
    lowerMessage.includes("relation") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("unreachable") ||
    lowerMessage.includes("reach database");

  if (isDbError) {
    return "Unable to connect to the database server. Please try again in a few seconds.";
  }

  return message || fallbackMessage;
}
