import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Alta de Producto \u00b7 Latina's Design",
  description: "Registro de nuevo producto, selecci\u00f3n de escala, colores y matriz de variantes con c\u00f3digos.",
};

export default function NuevoProductoLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div>
        <nav aria-label="Ruta de navegaci&oacute;n" className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">Inicio</Link>
          <span>/</span>
          <span>Cat&aacute;logo</span>
          <span>/</span>
          <span className="font-medium text-zinc-900">Alta de Producto</span>
        </nav>
        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Nuevo Producto</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Registra un producto con su marca, categor&iacute;a, escala de tallas y genera su matriz de variantes con c&oacute;digos manuales.
            </p>
          </div>
        </div>
      </div>
      {children}
    </main>
  );
}
