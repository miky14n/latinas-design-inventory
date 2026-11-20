"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";

export type MensajeEscaneo = {
  id: string;
  tipo: string;
  contenido: Record<string, string>;
};
type Modalidad = "TIEMPO_REAL" | "CONSULTAS" | "WEBRTC";
export type DatosConexionEscaneo = {
  sesionId: string;
  onScan: (codigo: string) => void;
  setEstado: (estado: string) => void;
  setError: (error: string) => void;
};

export async function solicitarEscaneo(body: object) {
  const response = await fetch("/api/escaneo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo conectar.");
  return data;
}

export function ConexionEscaneo({
  modalidad,
  onScan,
  onClose,
  children,
}: {
  modalidad: Modalidad;
  onScan: (codigo: string) => void;
  onClose: () => void;
  children: (datos: DatosConexionEscaneo) => ReactNode;
}) {
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [estado, setEstado] = useState("Preparando enlace…");
  const [direccion, setDireccion] = useState("");
  const [enlace, setEnlace] = useState<{ id: string; token: string } | null>(
    null,
  );
  useEffect(() => {
    let activo = true;
    let sesionId = "";
    async function iniciar() {
      try {
        const datos = await solicitarEscaneo({ accion: "crear", modalidad });
        sesionId = datos.id;
        if (!activo) {
          await solicitarEscaneo({
            accion: "cerrar",
            id: datos.id,
            lado: "COMPUTADORA",
          });
          return;
        }
        const esLocal = ["localhost", "127.0.0.1", "[::1]"].includes(
          location.hostname,
        );
        setDireccion(esLocal ? datos.direccionRed || "" : location.origin);
        setEnlace({ id: datos.id, token: datos.token });
        setEstado(
          "Indica una dirección accesible desde tu celular y abre el QR.",
        );
      } catch (error) {
        if (activo)
          setError(
            error instanceof Error
              ? error.message
              : "No se pudo preparar el enlace.",
          );
      }
    }
    void iniciar();
    return () => {
      activo = false;
      if (sesionId)
        void solicitarEscaneo({
          accion: "cerrar",
          id: sesionId,
          lado: "COMPUTADORA",
        }).catch(() => {});
    };
  }, [modalidad]);

  useEffect(() => {
    if (!enlace || !direccion) return;
    const credenciales = enlace;
    let activo = true;
    async function generar() {
      try {
        const url = new URL(direccion);
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.username ||
          url.password ||
          url.pathname !== "/" ||
          url.search ||
          url.hash ||
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
        ) {
          throw new Error(
            "Usa una dirección de red o HTTPS accesible desde el celular.",
          );
        }
        url.pathname = "/escanear";
        url.hash = new URLSearchParams(credenciales).toString();
        const imagen = await QRCode.toDataURL(url.toString(), {
          width: 280,
          margin: 2,
        });
        if (activo) {
          setQr(imagen);
          setError("");
        }
      } catch (error) {
        if (activo) {
          setQr("");
          setError(
            error instanceof Error ? error.message : "Dirección inválida.",
          );
        }
      }
    }
    void generar();
    return () => {
      activo = false;
    };
  }, [direccion, enlace]);

  return (
    <section
      className="mt-3 rounded-xl border border-zinc-200 p-4"
      aria-label="Conectar celular"
    >
      <p role="status" className="text-sm text-zinc-700">
        {estado}
      </p>
      <label className="mt-3 block text-sm font-medium text-zinc-700">
        Dirección para el celular
        <input
          type="url"
          value={direccion}
          onChange={(event) => {
            setQr("");
            setDireccion(event.target.value);
          }}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>
      {direccion.startsWith("http://") && (
        <p className="mt-2 text-sm text-amber-800">
          Para abrir la cámara desde el celular necesitas una dirección HTTPS.
        </p>
      )}
      {qr && (
        <Image
          src={qr}
          alt="QR para abrir el escáner en el celular"
          width={224}
          height={224}
          unoptimized
          className="mt-3 h-56 w-56"
        />
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {enlace && children({ sesionId: enlace.id, onScan, setEstado, setError })}
      <button
        type="button"
        onClick={onClose}
        className="mt-3 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      >
        Cerrar
      </button>
    </section>
  );
}
