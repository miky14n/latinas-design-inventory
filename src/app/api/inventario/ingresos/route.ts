import { NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { IngresoError } from "./_lib/errors";
import { consultar, conAccesoCentral, registrar } from "./_lib/repository";
import { leerIngreso } from "./_lib/service";

async function responder(request: Request) {
  try {
    const { data, error } = await auth.getSession();
    if (error || !data?.user.id) throw new IngresoError("SESION", "Inicia sesión para continuar.");
    const usuario = data.user.id;
    if (request.method === "GET") {
      const buscar = new URL(request.url).searchParams.get("buscar");
      return NextResponse.json(await conAccesoCentral(usuario, db => consultar(db, buscar?.trim() ?? null)));
    }
    const ingreso = leerIngreso(await request.json().catch(() => null));
    return NextResponse.json(await conAccesoCentral(usuario, db => registrar(db, ingreso)));
  } catch (error) {
    if (error instanceof IngresoError) {
      return NextResponse.json({ error: error.message }, { status: { SESION: 401, PERMISO: 403, DATOS: 400 }[error.code] });
    }
    console.error("Error de ingresos de mercadería", error);
    return NextResponse.json({ error: "No se pudo completar la operación. Vuelve a intentarlo." }, { status: 500 });
  }
}

export const GET = responder;
export const POST = responder;
