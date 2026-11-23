import { connection, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { TraspasoError } from "./_lib/errors";
import { conAcceso, consultar, enviar, recibir } from "./_lib/repository";
import { leerEnvio, leerRecepcion } from "./_lib/service";

async function responder(request: Request) {
  await connection();
  try {
    const { data, error } = await auth.getSession();
    if (error || !data?.user.id) throw new TraspasoError("SESION", "Inicia sesión para continuar.");
    if (request.method === "GET") { const params = new URL(request.url).searchParams; return NextResponse.json(await conAcceso(data.user.id, (db, acceso) => consultar(db, acceso, params.get("origen"), params.get("buscar") ?? ""))); }
    const body: unknown = await request.json().catch(() => null);
    if (request.method === "POST") return NextResponse.json(await conAcceso(data.user.id, (db, acceso) => enviar(db, acceso, leerEnvio(body))));
    await conAcceso(data.user.id, (db, acceso) => recibir(db, acceso, leerRecepcion(body)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TraspasoError) return NextResponse.json({ error: error.message }, { status: { SESION: 401, PERMISO: 403, DATOS: 400 }[error.code] });
    console.error("Error de traspasos", error);
    return NextResponse.json({ error: "No se pudo completar la operación. Comprueba el stock y vuelve a intentarlo." }, { status: 500 });
  }
}
export const GET = responder;
export const POST = responder;
export const PATCH = responder;
