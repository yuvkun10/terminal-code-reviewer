const secretAssignment =
  /\b([A-Z0-9_]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD|PASSWD|PRIVATE[_-]?KEY)[A-Z0-9_]*)(\s*=\s*)("[^"]*"|'[^']*'|`[^`]*`|[^\s#]+)/gi;
const codeSecretAssignment =
  /\b(password|passwd|secret|token|apiKey|api_key|privateKey|private_key)\b(\s*[:=]\s*)("[^"]*"|'[^']*'|`[^`]*`|[^\s,;}]+)/gi;
const bearerToken = /\b(Authorization\s*:\s*Bearer\s+)[^\s"']+/gi;
const openAiKey = /\bsk-(?:proj|svcacct|admin)?-[A-Za-z0-9_-]{16,}/g;
const genericLongToken = /\b[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g;

export function redactSecrets(input: string): string {
  return input
    .replace(secretAssignment, (_match, key: string, operator: string) => `${key}${operator}[REDACTED]`)
    .replace(codeSecretAssignment, (_match, key: string, operator: string) => `${key}${operator}[REDACTED]`)
    .replace(bearerToken, (_match, prefix: string) => `${prefix}[REDACTED]`)
    .replace(openAiKey, "[REDACTED_OPENAI_KEY]")
    .replace(genericLongToken, "[REDACTED_TOKEN]");
}
