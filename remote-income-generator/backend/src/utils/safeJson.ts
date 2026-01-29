/**
 * Safe JSON parsing utilities to prevent crashes from malformed data
 */

/**
 * Safely parse JSON with a fallback value
 * @param jsonString - The string to parse
 * @param fallback - Default value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) {
    return fallback;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('JSON parse error:', error instanceof Error ? error.message : 'Unknown error');
    return fallback;
  }
}

/**
 * Safely extract and parse JSON from a text response (e.g., from AI)
 * @param text - Text that may contain JSON
 * @param fallback - Default value if extraction/parsing fails
 * @returns Parsed value or fallback
 */
export function extractJsonFromText<T>(text: string, fallback: T): T {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON object found in text');
      return fallback;
    }
    return JSON.parse(jsonMatch[0]) as T;
  } catch (error) {
    console.error('JSON extraction error:', error instanceof Error ? error.message : 'Unknown error');
    return fallback;
  }
}

/**
 * Validate required environment variables
 * @param vars - Object mapping env var names to descriptions
 * @throws Error if any required variable is missing
 */
export function validateEnvVars(vars: Record<string, string>): void {
  const missing: string[] = [];

  for (const [name, description] of Object.entries(vars)) {
    if (!process.env[name]) {
      missing.push(`${name} (${description})`);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables:\n${missing.join('\n')}`);
  }
}

export default { safeJsonParse, extractJsonFromText, validateEnvVars };
