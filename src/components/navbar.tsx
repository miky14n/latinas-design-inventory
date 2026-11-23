"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Inicio", href: "/", active: (pathname: string) => pathname === "/" },
  {
    label: "Productos",
    href: "/catalogo/productos",
    active: (pathname: string) => pathname.startsWith("/catalogo/productos"),
  },
  { label: "Configuración del catálogo", href: "/catalogo/configuracion", active: (pathname: string) => pathname.startsWith("/catalogo/configuracion") },
  { label: "Recepción de mercadería", href: "/inventario/recepciones", active: (pathname: string) => pathname === "/inventario/recepciones" },
  { label: "Traspasos", href: "/inventario/traspasos", active: (pathname: string) => pathname === "/inventario/traspasos" },
];

export function Navbar({ canManageUsers = false }: { canManageUsers?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const navItems = canManageUsers
    ? [...NAV_ITEMS, { label: "Usuarios", href: "/admin/usuarios", active: (path: string) => path.startsWith("/admin/usuarios") }]
    : NAV_ITEMS;

  if (pathname.startsWith("/auth/")) return null;

  async function cerrarSesion() {
    setCerrando(true);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/auth/sign-in");
      router.refresh();
    } catch {
      setError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
      setCerrando(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          aria-label="Latina's Design, inicio"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-sm font-semibold tracking-tight text-white">
            L
          </span>
          <span className="hidden flex-col sm:flex">
            <span className="text-sm font-semibold tracking-tight text-zinc-950">Latina&apos;s Design</span>
            <span className="text-xs text-zinc-500">Inventario y operaciones</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav aria-label="Navegación principal" className="hidden items-center gap-2 lg:flex">
            <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">Inicio</Link>
            {[
              { titulo: "Catálogo", items: navItems.filter(item => item.href.startsWith("/catalogo/")) },
              { titulo: "Inventario", items: navItems.filter(item => item.href.startsWith("/inventario/")) },
            ].map(grupo => <details key={grupo.titulo} className="relative">
              <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">{grupo.titulo} <span aria-hidden="true">▾</span></summary>
              <div className="absolute right-0 top-full z-50 mt-1 w-60 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">{grupo.items.map(item => <Link key={item.href} href={item.href} aria-current={item.active(pathname) ? "page" : undefined} onClick={e => e.currentTarget.closest("details")?.removeAttribute("open")} className={`block rounded-lg px-3 py-2 text-sm ${item.active(pathname) ? "bg-zinc-100 font-semibold text-zinc-950" : "text-zinc-700 hover:bg-zinc-50"}`}>{item.label}</Link>)}</div>
            </details>)}
            {canManageUsers && <Link href="/admin/usuarios" aria-current={pathname.startsWith("/admin/usuarios") ? "page" : undefined} className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">Usuarios</Link>}
          </nav>
          <button type="button" onClick={cerrarSesion} disabled={cerrando} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">{cerrando ? "Saliendo…" : "Cerrar sesión"}</button>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 lg:hidden"
        >
          {isOpen ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
        </div>
      </div>

      {error && <p role="alert" className="mx-auto max-w-7xl px-4 pb-2 text-sm text-red-700">{error}</p>}

      {isOpen && (
        <nav id="mobile-navigation" aria-label="Navegación móvil" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-zinc-200 bg-white px-4 py-3 lg:hidden">
          {navItems.map((item) => {
            const isActive = item.active(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? "bg-zinc-100 text-zinc-950" : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
