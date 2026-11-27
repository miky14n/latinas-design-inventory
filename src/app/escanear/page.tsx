"use client";

import type { IScannerControls } from "@zxing/browser";
import {
  ChecksumException,
  FormatException,
  NotFoundException,
} from "@zxing/library";
import { crearLectorCodigos, restriccionesCamara } from "@/components/escaneo/camara";
import { useEffect, useRef, useState } from "react";

type Mensaje = { id: string; tipo: string; contenido: Record<string, string> };

export default function Escanear() {
  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<IScannerControls | null>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const canal = useRef<RTCDataChannel | null>(null);
  const credenciales = useRef({ id: "", token: "" });
  const montado = useRef(false);
  const iniciando = useRef(false);
  const [modalidad, setModalidad] = useState("");
  const [mensaje, setMensaje] = useState("Conectando…");
  const [abriendo, setAbriendo] = useState(false);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const id = params.get("id") || credenciales.current.id;
    const token = params.get("token") || credenciales.current.token;
    montado.current = true;
    credenciales.current = { id, token };
    history.replaceState(null, "", location.pathname);
    let activo = true;
    let timer: ReturnType<typeof setTimeout>;
    let cursor = "0";
    const pendientes: RTCIceCandidateInit[] = [];
    async function enviar(body: object) {
      const res = await fetch("/api/escaneo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, token, lado: "CELULAR", ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo conectar.");
      return data;
    }
    async function consultar() {
      try {
        const result = await enviar({ accion: "consultar", cursor });
        if (!activo) return;
        setModalidad(result.modalidad);
        if (result.modalidad !== "WEBRTC") {
          setMensaje("Listo para escanear.");
          return;
        }
        if (!peer.current) {
          peer.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          });
          peer.current.ondatachannel = (e) => {
            canal.current = e.channel;
            e.channel.onopen = () => {
              if (activo) {
                setConectado(true);
                setMensaje("Conectado. Abre la cámara.");
              }
            };
            e.channel.onclose = () => {
              if (activo) {
                setConectado(false);
                setMensaje("Se perdió la conexión con la computadora.");
              }
            };
          };
          peer.current.onicecandidate = (e) => {
            if (e.candidate)
              void enviar({
                accion: "enviar",
                tipo: "CANDIDATO",
                contenido: e.candidate.toJSON(),
              }).catch(() => {});
          };
        }
        for (const item of result.mensajes as Mensaje[]) {
          cursor = item.id;
          if (item.tipo === "OFERTA") {
            await peer.current.setRemoteDescription({
              type: "offer",
              sdp: item.contenido.sdp,
            });
            for (const candidato of pendientes)
              await peer.current.addIceCandidate(candidato);
            const respuesta = await peer.current.createAnswer();
            await peer.current.setLocalDescription(respuesta);
            await enviar({
              accion: "enviar",
              tipo: "RESPUESTA",
              contenido: { type: respuesta.type, sdp: respuesta.sdp },
            });
          } else if (item.tipo === "CANDIDATO") {
            if (peer.current.remoteDescription)
              await peer.current.addIceCandidate(item.contenido);
            else pendientes.push(item.contenido);
          }
        }
        timer = setTimeout(consultar, 800);
      } catch (e) {
        if (activo)
          setMensaje(e instanceof Error ? e.message : "No se pudo conectar.");
      }
    }
    void consultar();
    return () => {
      activo = false;
      montado.current = false;
      clearTimeout(timer);
      scanner.current?.stop();
      peer.current?.close();
      peer.current = null;
      canal.current = null;
    };
  }, []);

  async function abrir() {
    if (!video.current || iniciando.current || scanner.current) return;
    if (!window.isSecureContext) {
      setMensaje(
        "Para usar la cámara, abre el enlace de escaneo mediante HTTPS.",
      );
      return;
    }
    iniciando.current = true;
    setAbriendo(true);
    try {
      let leido = false;
      const lector = crearLectorCodigos();
      const controlesCamara = await lector.decodeFromConstraints(
        restriccionesCamara,
        video.current,
        async (resultado, scanError, controles) => {
          if (
            scanError &&
            !(
              scanError instanceof NotFoundException ||
              scanError instanceof ChecksumException ||
              scanError instanceof FormatException
            )
          ) {
            scanner.current = null;
            if (montado.current)
              setMensaje(
                "La lectura se interrumpió. Intenta abrir la cámara nuevamente.",
              );
            return;
          }
          if (!resultado || leido) return;
          leido = true;
          controles.stop();
          scanner.current = null;
          try {
            const codigo = resultado.getText();
            if (modalidad === "WEBRTC") {
              if (canal.current?.readyState !== "open")
                throw new Error("La computadora aún no está conectada.");
              canal.current.send(codigo);
            } else {
              const res = await fetch("/api/escaneo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...credenciales.current,
                  lado: "CELULAR",
                  accion: "enviar",
                  tipo: "CODIGO",
                  contenido: { codigo },
                }),
              });
              if (!res.ok)
                throw new Error(
                  "El enlace venció o no se pudo enviar el código.",
                );
            }
            if (montado.current) {
              setMensaje("Código enviado a la computadora.");
              setModalidad("");
            }
          } catch (e) {
            if (montado.current)
              setMensaje(
                e instanceof Error ? e.message : "No se pudo enviar el código.",
              );
          }
        },
      );
      if (montado.current && !leido) scanner.current = controlesCamara;
      else controlesCamara.stop();
    } catch {
      if (montado.current)
        setMensaje("No se pudo abrir la cámara. Revisa los permisos.");
    } finally {
      iniciando.current = false;
      if (montado.current) setAbriendo(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg space-y-4 px-4 py-8">
      <h1 className="text-xl font-semibold">Escanear código</h1>
      <p role="status" className="text-sm text-zinc-600">
        {mensaje}
      </p>
      <video
        ref={video}
        muted
        playsInline
        className="aspect-video w-full rounded-xl bg-zinc-950 object-contain"
      />
      {modalidad && (
        <button
          type="button"
          disabled={abriendo || (modalidad === "WEBRTC" && !conectado)}
          onClick={abrir}
          className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Abrir cámara
        </button>
      )}
    </main>
  );
}
