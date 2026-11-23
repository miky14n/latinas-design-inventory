import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/lib/server/auth";
import { requireGestionUsuarios } from "@/app/api/usuarios/_lib/service";

export const instant = false;

const accesos = [
  {
    href: "/catalogo/productos",
    nombre: "Productos y existencias",
    descripcion: "Consulta productos, tallas, colores y unidades disponibles por ubicación.",
    accion: "Ver productos",
  },
  {
    href: "/inventario/recepciones",
    nombre: "Recepción de mercadería",
    descripcion: "Registra la mercadería que llega al almacén central.",
    accion: "Registrar recepción",
  },
  {
    href: "/inventario/traspasos",
    nombre: "Traspasos entre ubicaciones",
    descripcion: "Envía mercadería y confirma su recepción en destino.",
    accion: "Ver traspasos",
  },
  {
    href: "/catalogo/configuracion",
    nombre: "Configuración del catálogo",
    descripcion: "Administra marcas, categorías, tallas y colores.",
    accion: "Abrir configuración",
  },
];

export default function Home() {
  return <Suspense fallback={<main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10"><p role="status" className="text-sm text-zinc-500">Cargando inicio…</p></main>}>
    <InicioAutenticado />
  </Suspense>;
}

async function InicioAutenticado() {
  await connection();
  const { data, error } = await auth.getSession();
  if (error || !data?.user) redirect("/auth/sign-in");

  let puedeGestionarUsuarios = false;
  try {
    await requireGestionUsuarios();
    puedeGestionarUsuarios = true;
  } catch {
    puedeGestionarUsuarios = false;
  }

  return <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <section className="relative overflow-hidden rounded-3xl border border-brand-gold/30 bg-gradient-to-br from-brand-primary via-[#fae9ed] to-brand-cream px-6 py-10 text-brand-text shadow-sm sm:px-10 sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-brand-gold/30 sm:h-80 sm:w-80" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-20 h-56 w-56 rounded-full border border-brand-gold/20" />
      <div className="relative max-w-2xl">
      <p className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-white/65 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-dark"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-gold-dark" /> Latina&apos;s Design · Inventario</p>
      <h1 className="mt-5 font-serif text-4xl tracking-tight sm:text-5xl">Hola, bienvenida</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-700 sm:text-base">
        Consulta tus productos y registra la mercadería que llega al almacén central.
      </p>
      <Link href="/catalogo/productos" className="mt-7 inline-flex items-center gap-3 rounded-xl bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-text shadow-sm transition hover:bg-[#d7b876] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-dark focus-visible:ring-offset-2">
        Consultar productos <span aria-hidden="true">→</span>
      </Link>
      </div>
    </section>

    <section aria-labelledby="accesos-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-dark">Tu espacio de trabajo</p>
      <h2 id="accesos-heading" className="mt-2 font-serif text-2xl tracking-tight text-zinc-950">Accesos rápidos</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accesos.map((acceso, index) => <Link key={acceso.href} href={acceso.href}
          className="group flex min-h-52 flex-col rounded-2xl border border-brand-gold/25 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-dark">
          <span aria-hidden="true" className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary font-serif text-lg text-brand-gold-dark">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="text-base font-semibold text-zinc-950">{acceso.nombre}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">{acceso.descripcion}</p>
          <span className="mt-5 text-sm font-semibold text-brand-gold-dark">{acceso.accion} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span></span>
        </Link>)}
        {puedeGestionarUsuarios && <Link href="/admin/usuarios"
          className="group flex min-h-52 flex-col rounded-2xl border border-brand-gold/25 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-dark">
          <span aria-hidden="true" className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary font-serif text-lg text-brand-gold-dark">05</span>
          <h3 className="text-base font-semibold text-zinc-950">Gestión de usuarios</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">Administra cuentas, roles y asignaciones a tiendas.</p>
          <span className="mt-5 text-sm font-semibold text-brand-gold-dark">Ver usuarios <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span></span>
        </Link>}
      </div>
    </section>
  </main>;
}
