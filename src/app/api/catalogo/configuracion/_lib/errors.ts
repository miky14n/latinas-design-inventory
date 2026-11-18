export class CatalogError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID" | "NOT_FOUND" | "CONFLICT", message: string) { super(message); }
}
