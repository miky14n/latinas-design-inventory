import { NextResponse } from "next/server";
import { CatalogError } from "./_lib/errors";
import { readCatalog, writeCatalog } from "./_lib/service";

function failure(error: unknown) {
  if (error instanceof CatalogError) {
    const status = { UNAUTHENTICATED: 401, FORBIDDEN: 403, INVALID: 400, NOT_FOUND: 404, CONFLICT: 409 }[error.code];
    return NextResponse.json({ error: error.message }, { status });
  }
  if (error && typeof error === "object" && "code" in error && error.code === "23505")
    return NextResponse.json({ error: "El código, prefijo o nombre ya está en uso." }, { status: 409 });
  if (error && typeof error === "object" && "code" in error && ["23503", "23514", "22003"].includes(String(error.code)))
    return NextResponse.json({ error: "Revisa las opciones y los datos ingresados." }, { status: 400 });
  console.error("Error al gestionar configuración del catálogo", error);
  return NextResponse.json({ error: "No se pudo completar la operación." }, { status: 500 });
}
export async function GET() {
  try { return NextResponse.json({ data: await readCatalog() }); } catch (error) { return failure(error); }
}
async function mutate(request: Request, editing: boolean) {
  try {
    const body = await request.json().catch(() => { throw new CatalogError("INVALID", "El cuerpo debe ser JSON válido."); });
    await writeCatalog(body, editing);
    return NextResponse.json({ ok: true }, { status: editing ? 200 : 201 });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) { return mutate(request, false); }
export async function PATCH(request: Request) { return mutate(request, true); }
