"use client";

import { useEffect, useRef } from "react";
import {
  ConexionEscaneo,
  solicitarEscaneo,
  type DatosConexionEscaneo,
  type MensajeEscaneo,
} from "./conexion";

function ConexionWebRTC({
  sesionId,
  onScan,
  setEstado,
  setError,
}: DatosConexionEscaneo) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let activo = true;
    let timer: ReturnType<typeof setTimeout>;
    let cursor = "0";
    const candidatos: RTCIceCandidateInit[] = [];
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    const canal = peer.createDataChannel("codigo");
    canal.onopen = () => {
      if (activo) setEstado("Celular conectado. Escanea el código.");
    };
    canal.onmessage = (event) => {
      if (
        activo &&
        typeof event.data === "string" &&
        event.data.length > 0 &&
        event.data.length <= 512
      ) {
        activo = false;
        onScanRef.current(event.data);
      }
    };
    peer.onicecandidate = (event) => {
      if (event.candidate)
        void solicitarEscaneo({
          accion: "enviar",
          id: sesionId,
          lado: "COMPUTADORA",
          tipo: "CANDIDATO",
          contenido: event.candidate.toJSON(),
        }).catch(() => {});
    };

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
          if (mensaje.tipo === "RESPUESTA") {
            await peer.setRemoteDescription({
              type: "answer",
              sdp: mensaje.contenido.sdp,
            });
            for (const candidato of candidatos)
              await peer.addIceCandidate(candidato);
          } else if (mensaje.tipo === "CANDIDATO") {
            if (peer.remoteDescription)
              await peer.addIceCandidate(mensaje.contenido);
            else candidatos.push(mensaje.contenido);
          }
        }
        if (activo) timer = setTimeout(consultar, 800);
      } catch (error) {
        if (activo)
          setError(
            error instanceof Error
              ? error.message
              : "No se pudo consultar la sesión.",
          );
      }
    }
    async function iniciar() {
      try {
        const oferta = await peer.createOffer();
        if (!activo) return;
        await peer.setLocalDescription(oferta);
        if (!activo) return;
        await solicitarEscaneo({
          accion: "enviar",
          id: sesionId,
          lado: "COMPUTADORA",
          tipo: "OFERTA",
          contenido: { type: oferta.type, sdp: oferta.sdp },
        });
        if (activo) await consultar();
      } catch (error) {
        if (activo)
          setError(
            error instanceof Error
              ? error.message
              : "No se pudo preparar la conexión.",
          );
      }
    }
    void iniciar();
    return () => {
      activo = false;
      clearTimeout(timer);
      peer.close();
    };
  }, [sesionId, setEstado, setError]);
  return null;
}

export function EscanerOP3({
  onScan,
  onClose,
}: {
  onScan: (codigo: string) => void;
  onClose: () => void;
}) {
  return (
    <ConexionEscaneo modalidad="WEBRTC" onScan={onScan} onClose={onClose}>
      {(datos) => <ConexionWebRTC {...datos} />}
    </ConexionEscaneo>
  );
}
