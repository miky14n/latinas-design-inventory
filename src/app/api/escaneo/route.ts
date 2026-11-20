import { NextResponse } from "next/server";
import { networkInterfaces } from "node:os";
import { auth } from "@/lib/server/auth";
import { withDatabaseTransaction } from "@/app/api/_lib/db";
import { EscaneoError } from "./_lib/errors";
import { cerrar, consultarMensajes, crear, guardarMensaje, movil, propietario } from "./_lib/repository";
import { cursor, mensaje, texto, uuid } from "./_lib/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accion = texto(body.accion, 20);
    if (accion === "crear") {
      const { data, error } = await auth.getSession();
      if (error || !data?.user?.id) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
      const modalidad = texto(body.modalidad, 20);
      if (!["TIEMPO_REAL", "CONSULTAS", "WEBRTC"].includes(modalidad)) throw new EscaneoError("Modalidad inválida.");
      const sesion = await withDatabaseTransaction(db => crear(db, data.user.id, modalidad));
      const origen = new URL(request.url);
      let direccionRed: string | null = null;
      if (["localhost", "127.0.0.1", "[::1]"].includes(origen.hostname)) {
        const direcciones = Object.values(networkInterfaces()).flatMap(lista => lista ?? [])
          .filter(interfaz => interfaz.family === "IPv4" && !interfaz.internal);
        if (direcciones.length === 1) {
          origen.hostname = direcciones[0].address;
          direccionRed = origen.origin;
        }
      }
      return NextResponse.json({ ...sesion, direccionRed });
    }
    const id = uuid(body.id);
    const lado = texto(body.lado, 16);
    if (!["COMPUTADORA", "CELULAR"].includes(lado)) throw new EscaneoError("Solicitud inválida.");
    let usuario = "";
    if (lado === "COMPUTADORA") {
      const { data, error } = await auth.getSession();
      if (error || !data?.user?.id) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
      usuario = data.user.id;
    }
    const token = lado === "CELULAR" ? texto(body.token, 64) : "";
    if (lado === "CELULAR" && !/^[a-f0-9]{64}$/.test(token)) throw new EscaneoError("Enlace inválido.");
    return await withDatabaseTransaction(async db => {
      const sesion = lado === "CELULAR" ? await movil(db, id, token) : await propietario(db, usuario, id);
      if (accion === "consultar") {
        const mensajes = await consultarMensajes(db, id, cursor(body.cursor), lado);
        return NextResponse.json({ modalidad: sesion.modalidad, mensajes });
      }
      if (accion === "cerrar" && lado === "COMPUTADORA") {
        await cerrar(db, id);
        return NextResponse.json({ ok: true });
      }
      if (accion === "enviar") {
        if (sesion.estado === "COMPLETADA") throw new EscaneoError("La sesión ya terminó.");
        const datos = mensaje(sesion.modalidad, lado, body.tipo, body.contenido);
        await guardarMensaje(db, id, lado, datos.tipo, datos.contenido);
        return NextResponse.json({ ok: true });
      }
      throw new EscaneoError("Solicitud inválida.");
    });
  } catch (error) {
    if (error instanceof EscaneoError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Error al procesar escaneo", error);
    return NextResponse.json({ error: "No se pudo completar el escaneo." }, { status: 500 });
  }
}
