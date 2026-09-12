export function withWarnings<T extends object>(payload: T, warnings: string[] | undefined): T & { warnings?: string[] } {
  return warnings && warnings.length > 0 ? { ...payload, warnings } : payload
}
