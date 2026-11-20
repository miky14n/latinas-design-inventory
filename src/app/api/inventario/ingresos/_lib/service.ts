import { IngresoError } from "./errors";

function id(value: unknown): value is string {
  return typeof value === "string" && /^[1-9]\d{0,18}$/.test(value)
    && (value.length < 19 || value <= "9223372036854775807");
}

export function leerIngreso(body: unknown) {
  if (!body || typeof body !== "object" || !("clave" in body) || typeof body.clave !== "string"
    || !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(body.clave)
    || !("origen" in body) || !id(body.origen)
    || !("lineas" in body) || !Array.isArray(body.lineas) || !body.lineas.length) {
    throw new IngresoError("DATOS", "Selecciona el origen y agrega al menos una variante.");
  }
  const variantes = new Set<string>();
  const lineas = body.lineas.map((linea: unknown) => {
    if (!linea || typeof linea !== "object" || !("variante_id" in linea) || !id(linea.variante_id)
      || !("cantidad" in linea) || typeof linea.cantidad !== "number" || !Number.isInteger(linea.cantidad)
      || linea.cantidad < 1 || linea.cantidad > 2147483647 || variantes.has(linea.variante_id)) {
      throw new IngresoError("DATOS", "Cada variante debe aparecer una vez y tener una cantidad entera positiva.");
    }
    variantes.add(linea.variante_id);
    return { variante_id: linea.variante_id, cantidad: linea.cantidad };
  });
  return { origen: body.origen, clave: body.clave, lineas };
}
