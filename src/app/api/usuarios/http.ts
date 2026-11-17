import { NextResponse } from "next/server";
import { UsuarioError } from "./_lib/errors";

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new UsuarioError("VALIDATION", "El cuerpo debe ser JSON válido.");
  }
}

export function usuarioErrorResponse(error: unknown) {
  if (error instanceof UsuarioError) {
    const statuses = {
      UNAUTHENTICATED: 401,
      FORBIDDEN: 403,
      VALIDATION: 400,
      CONFLICT: 409,
      NOT_FOUND: 404,
      AUTH_UNAVAILABLE: 502,
      IDENTITY_PROVIDER: 502,
    } as const;
    return NextResponse.json(
      { error: error.message },
      { status: statuses[error.code] },
    );
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return NextResponse.json(
      { error: "El registro ya existe." },
      { status: 409 },
    );
  }
  console.error("Error en API de usuarios", error);
  return NextResponse.json(
    { error: "No se pudo completar la operación." },
    { status: 500 },
  );
}
