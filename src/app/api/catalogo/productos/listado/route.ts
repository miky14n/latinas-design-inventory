import { NextResponse } from "next/server";
import { ProductListError } from "./_lib/errors";
import { readProducts } from "./_lib/service";

export async function GET(request: Request) {
  try { return NextResponse.json({ data: await readProducts(new URL(request.url).searchParams) }); }
  catch (error) {
    if (error instanceof ProductListError) {
      const status = { UNAUTHENTICATED: 401, FORBIDDEN: 403, INVALID: 400, NOT_FOUND: 404 }[error.code];
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("Error al consultar productos", error);
    return NextResponse.json({ error: "No se pudieron consultar los productos." }, { status: 500 });
  }
}
