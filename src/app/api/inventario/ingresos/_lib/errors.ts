export class IngresoError extends Error {
  constructor(readonly code: "SESION" | "PERMISO" | "DATOS", message: string) {
    super(message);
  }
}
