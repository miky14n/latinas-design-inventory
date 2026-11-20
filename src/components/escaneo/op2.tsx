"use client";

import { useEffect, useRef } from "react";
import {
  ConexionEscaneo,
  solicitarEscaneo,
  type DatosConexionEscaneo,
  type MensajeEscaneo,
} from "./conexion";

export function ConsultarEscaneo({
  intervalo,
  sesionId,
  onScan,
  setError,
}: DatosConexionEscaneo & { intervalo: number }) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let activo = true;
    let timer: ReturnType<typeof setTimeout>;
    let cursor = "0";
    async function consultar() {
      try {
        const respuesta = await solicitarEscaneo({
          accion: "consultar",
          id: sesionId,
          lado: "COMPUTADORA",
          cursor,
        });
        if (!activo) return;
        for (const mensaje of respuesta.mensajes as MensajeEscaneo[]) {
          cursor = mensaje.id;
          if (mensaje.tipo === "CODIGO") {
            onScanRef.current(mensaje.contenido.codigo);
            return;
          }
        }
        timer = setTimeout(consultar, intervalo);
      } catch (error) {
        if (activo)
          setError(
            error instanceof Error
              ? error.message
              : "No se pudo consultar la sesión.",
          );
      }
    }
    void consultar();
    return () => {
      activo = false;
      clearTimeout(timer);
    };
  }, [sesionId, intervalo, setError]);
  return null;
}

export function EscanerOP2({
  onScan,
  onClose,
}: {
  onScan: (codigo: string) => void;
  onClose: () => void;
}) {
  return (
    <ConexionEscaneo modalidad="CONSULTAS" onScan={onScan} onClose={onClose}>
      {(datos) => <ConsultarEscaneo {...datos} intervalo={2500} />}
    </ConexionEscaneo>
  );
}
