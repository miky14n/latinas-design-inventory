"use client";

import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

type Props = {
  onScan: (codigo: string) => void;
  onClose: () => void;
};

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
    if (!video.current || loading) return;
    setError("");
    setLoading(true);
    try {
      const reader = new BrowserMultiFormatReader();
      const scanner = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        video.current,
        (result, _error, scannerControls) => {
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
