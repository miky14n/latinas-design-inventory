import { TraspasoError } from "./errors";

const id = (v: unknown): v is string => typeof v === "string" && /^[1-9]\d{0,18}$/.test(v) && (v.length < 19 || v <= "9223372036854775807");
export function leerEnvio(value: unknown) {
  if (!value || typeof value !== "object" || !("clave" in value) || typeof value.clave !== "string" || !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(value.clave) || !("origen" in value) || !id(value.origen) || !("destino" in value) || !id(value.destino) || value.origen === value.destino || !("lineas" in value) || !Array.isArray(value.lineas) || !value.lineas.length || value.lineas.length > 100) throw new TraspasoError("DATOS", "Selecciona ubicaciones diferentes y agrega productos.");
  const vistos = new Set<string>();
  const lineas = value.lineas.map((l: unknown) => {
    if (!l || typeof l !== "object" || !("variante_id" in l) || !id(l.variante_id) || vistos.has(l.variante_id) || !("cantidad" in l) || typeof l.cantidad !== "number" || !Number.isInteger(l.cantidad) || l.cantidad < 1 || l.cantidad > 2147483647) throw new TraspasoError("DATOS", "Cada variante debe tener una cantidad entera positiva y aparecer una sola vez.");
    vistos.add(l.variante_id); return { variante_id: l.variante_id, cantidad: l.cantidad };
  });
  return { clave: value.clave.toLowerCase(), origen: value.origen, destino: value.destino, lineas: lineas.sort((a,b) => BigInt(a.variante_id) < BigInt(b.variante_id) ? -1 : 1) };
}
export function leerRecepcion(value: unknown) {
  if (!value || typeof value !== "object" || !("documento" in value) || !id(value.documento) || !("lineas" in value) || !Array.isArray(value.lineas) || !value.lineas.length || value.lineas.length > 100 || !("motivo" in value) || typeof value.motivo !== "string" || value.motivo.length > 1000) throw new TraspasoError("DATOS", "Revisa las cantidades y el motivo de recepción.");
  const ids = new Set<string>();
  const lineas = value.lineas.map((l: unknown) => {
    if (!l || typeof l !== "object" || !("variante_id" in l) || !id(l.variante_id) || ids.has(l.variante_id) || !("buenas" in l) || typeof l.buenas !== "number" || !Number.isInteger(l.buenas) || l.buenas < 0 || l.buenas > 2147483647 || !("danadas" in l) || typeof l.danadas !== "number" || !Number.isInteger(l.danadas) || l.danadas < 0 || l.danadas > 2147483647) throw new TraspasoError("DATOS", "Las cantidades deben ser números enteros no negativos.");
    ids.add(l.variante_id); return { variante_id: l.variante_id, buenas: l.buenas, danadas: l.danadas };
  });
  return { documento: value.documento, motivo: value.motivo.trim(), lineas };
}
