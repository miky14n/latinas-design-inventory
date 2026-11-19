"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Inicio", href: "/", active: (pathname: string) => pathname === "/" },
  {
    label: "Catálogo",
    href: "/catalogo/productos",
    active: (pathname: string) => pathname.startsWith("/catalogo/productos"),
  },
  { label: "Configuración del catálogo", href: "/catalogo/configuracion", active: (pathname: string) => pathname.startsWith("/catalogo/configuracion") },
  { label: "Módulos", href: "/#modules-heading", active: () => false },
];

export function Navbar({ canManageUsers = false }: { canManageUsers?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navItems = canManageUsers
    ? [...NAV_ITEMS, { label: "Usuarios", href: "/admin/usuarios", active: (path: string) => path.startsWith("/admin/usuarios") }]
    : NAV_ITEMS;

  if (pathname.startsWith("/auth/")) return null;

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
          <span className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-zinc-950">Latina&apos;s Design</span>
            <span className="text-xs text-zinc-500">Inventario y operaciones</span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = item.active(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
                  isActive ? "bg-zinc-100 text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 md:hidden"
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

      {isOpen && (
        <nav id="mobile-navigation" aria-label="Navegación móvil" className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
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
