export type UsuarioErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "CONFLICT"
  | "NOT_FOUND"
  | "AUTH_UNAVAILABLE"
  | "IDENTITY_PROVIDER";

export class UsuarioError extends Error {
  constructor(
    readonly code: UsuarioErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "UsuarioError";
  }
}
