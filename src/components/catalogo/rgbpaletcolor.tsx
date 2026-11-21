"use client";

import { useRef, useState, type PointerEvent } from "react";

function rgbToHsv(hex: string) {
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), diff = max - min;
  const hue = !diff ? 0 : max === r ? ((g - b) / diff + 6) % 6 : max === g ? (b - r) / diff + 2 : (r - g) / diff + 4;
  return { hue: Math.round(hue * 60) % 360, saturation: max ? diff / max : 0, value: max };
}
function hsvToHex(hue: number, saturation: number, value: number) {
  const h = hue / 60, chroma = value * saturation, x = chroma * (1 - Math.abs(h % 2 - 1)), m = value - chroma;
  const channels = h < 1 ? [chroma, x, 0] : h < 2 ? [x, chroma, 0] : h < 3 ? [0, chroma, x] : h < 4 ? [0, x, chroma] : h < 5 ? [x, 0, chroma] : [chroma, 0, x];
  return "#" + channels.map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}


export function RgbPaletColor({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const paletteButton = useRef<HTMLButtonElement>(null);

  function openPalette() {
    if (!paletteOpen && /^#[0-9a-f]{6}$/i.test(value)) {
      const current = rgbToHsv(value);
      setHue(current.hue); setSaturation(current.saturation); setBrightness(current.value);
    }
    setPaletteOpen((open) => !open);
  }
  function chooseTone(nextHue: number, nextSaturation: number, nextBrightness: number) {
    setHue(nextHue); setSaturation(nextSaturation); setBrightness(nextBrightness);
    onChange(hsvToHex(nextHue, nextSaturation, nextBrightness));
  }
  function chooseFromSquare(event: PointerEvent<HTMLDivElement>) {
    if (event.type === "pointermove" && event.buttons !== 1) return;
    if (event.type === "pointerdown") event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    const clamp = (number: number) => Math.min(1, Math.max(0, number));
    chooseTone(hue, clamp((event.clientX - rect.left) / rect.width), 1 - clamp((event.clientY - rect.top) / rect.height));
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
<div className="relative shrink-0" onKeyDown={(event) => { if (event.key === "Escape") { setPaletteOpen(false); paletteButton.current?.focus(); } }}>
                    <button ref={paletteButton} type="button" aria-label="Elegir color" aria-expanded={paletteOpen} aria-controls="selector-color" onClick={openPalette} className="flex h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950">
                      <span aria-hidden="true" className="h-6 w-8 rounded border border-zinc-300" style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000" }} />
                      Elegir
                    </button>
                    {paletteOpen && <div id="selector-color" className="fixed inset-x-4 bottom-4 z-[60] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-2 sm:w-72">
                      <div aria-hidden="true" onPointerDown={chooseFromSquare} onPointerMove={chooseFromSquare} className="relative h-36 w-full touch-none cursor-crosshair overflow-hidden rounded-lg border border-zinc-200">
                        <svg className="pointer-events-none absolute inset-0 h-full w-full"><rect width="100%" height="100%" fill={hsvToHex(hue, 1, 1)} /></svg>
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                        <svg className="pointer-events-none absolute inset-0 h-full w-full"><circle cx={`${saturation * 100}%`} cy={`${(1 - brightness) * 100}%`} r="5" fill="none" stroke="white" strokeWidth="2" /></svg>
                      </div>
                      <label className="mt-3 block text-xs font-medium text-zinc-700">Tono<input type="range" min="0" max="359" value={hue} onChange={(event) => chooseTone(Number(event.target.value), saturation, brightness)} className="mt-1 w-full accent-zinc-900" /></label>
                      <label className="mt-2 block text-xs font-medium text-zinc-700">Saturación<input type="range" min="0" max="100" value={Math.round(saturation * 100)} onChange={(event) => chooseTone(hue, Number(event.target.value) / 100, brightness)} className="mt-1 w-full accent-zinc-900" /></label>
                      <label className="mt-2 block text-xs font-medium text-zinc-700">Brillo<input type="range" min="0" max="100" value={Math.round(brightness * 100)} onChange={(event) => chooseTone(hue, saturation, Number(event.target.value) / 100)} className="mt-1 w-full accent-zinc-900" /></label>
                      <button type="button" onClick={() => { setPaletteOpen(false); paletteButton.current?.focus(); }} className="mt-2 text-xs font-medium text-zinc-700 underline hover:text-zinc-950">Cerrar</button>
                    </div>}
                  </div>
      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
        Selector original
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(event) => onChange(event.target.value)} className="h-10 w-12 cursor-pointer rounded border border-zinc-300 bg-white p-1" />
      </label>
    </div>
  );
}
