export class ProductListError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID" | "NOT_FOUND", message: string) { super(message); }
}
