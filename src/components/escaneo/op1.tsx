"use client";

import { ConexionEscaneo } from "./conexion";
import { ConsultarEscaneo } from "./op2";

export function EscanerOP1({
  onScan,
  onClose,
}: {
  onScan: (codigo: string) => void;
  onClose: () => void;
}) {
  return (
    <ConexionEscaneo modalidad="TIEMPO_REAL" onScan={onScan} onClose={onClose}>
      {(datos) => <ConsultarEscaneo {...datos} intervalo={800} />}
    </ConexionEscaneo>
  );
}
