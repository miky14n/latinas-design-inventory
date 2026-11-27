"use client";

import { BrowserCodeReader, type IScannerControls } from "@zxing/browser";
import { AztecCodeReader, ChecksumException, Code128Reader, DataMatrixReader, FormatException, MaxiCodeReader, MicroQRCodeReader, MultiFormatOneDReader, NotFoundException, PDF417Reader, QRCodeReader, ReaderException, type Reader } from "@zxing/library";
import { useEffect, useRef, useState } from "react";

type Props = {
  onScan: (codigo: string) => void;
  onClose: () => void;
};

export const restriccionesCamara: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280, max: 1280 },
    height: { ideal: 720, max: 1280 },
  },
};

// Code 128 y QR se buscan en cada fotograma; los otros formatos, cada cuatro.
// ZXing 0.23 registra como inesperados los errores normales de cada lector.
export function crearLectorCodigos() {
  const prioritarios: Reader[] = [new Code128Reader(), new QRCodeReader()];
  const secundarios: Reader[] = [new MultiFormatOneDReader(), new MicroQRCodeReader(), new DataMatrixReader(), new AztecCodeReader(), new PDF417Reader(), new MaxiCodeReader()];
  let intentos = 0;
  const lector: Reader = {
    decode(imagen, hints) {
      const lectores = ++intentos % 4 === 0 ? [...prioritarios, ...secundarios] : prioritarios;
      for (const candidato of lectores) {
        try { return candidato.decode(imagen, hints); }
        catch (error) {
          if (error instanceof NotFoundException || error instanceof ChecksumException || error instanceof FormatException || error instanceof ReaderException) continue;
          throw error;
        }
      }
      throw new NotFoundException();
    },
    reset() { for (const candidato of [...prioritarios, ...secundarios]) candidato.reset(); intentos = 0; },
  };
  return new BrowserCodeReader(lector, new Map(), { delayBetweenScanAttempts: 100 });
}

export function CamaraEscaneo({ onScan, onClose }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const received = useRef(false);
  const mounted = useRef(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controls.current?.stop();
    };
  }, []);

  async function abrirCamara() {
    if (!video.current || loading || controls.current) return;
    setError("");
    setLoading(true);
    try {
      const reader = crearLectorCodigos();
      const scanner = await reader.decodeFromConstraints(
        restriccionesCamara,
        video.current,
        (result, scanError, scannerControls) => {
          if (scanError && !(scanError instanceof NotFoundException || scanError instanceof ChecksumException || scanError instanceof FormatException)) {
            if (mounted.current) setError("La lectura se interrumpió. Cierra el escáner e inténtalo nuevamente.");
            return;
          }
          if (!result || received.current) return;
          received.current = true;
          scannerControls.stop();
          onScan(result.getText());
        },
      );
      if (received.current || !mounted.current) scanner.stop();
      else controls.current = scanner;
    } catch {
      if (mounted.current) setError("No se pudo abrir la cámara. Comprueba los permisos e inténtalo de nuevo.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  return <section aria-label="Escanear código" className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
    <video ref={video} muted playsInline className="aspect-video w-full rounded-lg bg-zinc-950 object-contain" />
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex gap-3">
      <button type="button" onClick={abrirCamara} disabled={loading} className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {loading ? "Abriendo cámara…" : "Abrir cámara"}
      </button>
      <button type="button" onClick={() => { controls.current?.stop(); onClose(); }} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm">Cerrar</button>
    </div>
  </section>;
}
