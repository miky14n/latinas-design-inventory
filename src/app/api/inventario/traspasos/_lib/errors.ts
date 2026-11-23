export class TraspasoError extends Error {
  constructor(public code: "SESION" | "PERMISO" | "DATOS", message: string) { super(message); }
}
