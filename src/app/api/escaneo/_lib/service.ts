import { EscaneoError } from "./errors";

export function texto(valor: unknown, maximo: number): string {
  if (typeof valor !== "string" || !valor.length || valor.length > maximo) {
    throw new EscaneoError("La solicitud de escaneo no es válida.");
  }
  return valor;
}

export function uuid(valor: unknown): string {
  const id = texto(valor, 36);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
    throw new EscaneoError("La sesión no es válida.");
  }
  return id;
}

export function cursor(valor: unknown): string {
  if (valor === undefined) return "0";
  const numero = texto(valor, 19);
  if (!/^\d+$/.test(numero) || BigInt(numero) > BigInt("9223372036854775807")) {
    throw new EscaneoError("El cursor de mensajes no es válido.");
  }
  return numero;
}

export function mensaje(modalidad: string, lado: string, tipo: unknown, contenido: unknown) {
  const nombre = texto(tipo, 12);
  const permitidos = modalidad === "WEBRTC"
    ? (lado === "CELULAR" ? ["RESPUESTA", "CANDIDATO"] : ["OFERTA", "CANDIDATO"])
    : (lado === "CELULAR" ? ["CODIGO"] : []);
  if (!permitidos.includes(nombre) || !contenido || typeof contenido !== "object" ||
      Array.isArray(contenido) || JSON.stringify(contenido).length > 15000) {
    throw new EscaneoError("Mensaje inválido.");
  }
  if (nombre === "CODIGO") texto((contenido as Record<string, unknown>).codigo, 512);
  return { tipo: nombre, contenido };
}
