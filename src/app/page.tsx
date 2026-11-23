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
    <section className="overflow-hidden rounded-3xl bg-zinc-950 px-6 py-9 text-white sm:px-10 sm:py-12">
      <p className="text-sm font-medium text-zinc-400">Latina&apos;s Design</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Hola, bienvenida</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">
        Consulta tus productos y registra la mercadería que llega al almacén central.
      </p>
      <Link href="/catalogo/productos" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        Consultar productos
      </Link>
    </section>

    <section aria-labelledby="accesos-heading">
      <h2 id="accesos-heading" className="text-xl font-semibold tracking-tight text-zinc-950">Accesos</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accesos.map(acceso => <Link key={acceso.href} href={acceso.href}
          className="group flex min-h-44 flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950">
          <h3 className="text-base font-semibold text-zinc-950">{acceso.nombre}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">{acceso.descripcion}</p>
          <span className="mt-5 text-sm font-medium text-zinc-900 underline underline-offset-4">{acceso.accion}</span>
        </Link>)}
        {puedeGestionarUsuarios && <Link href="/admin/usuarios"
          className="group flex min-h-44 flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950">
          <h3 className="text-base font-semibold text-zinc-950">Gestión de usuarios</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">Administra cuentas, roles y asignaciones a tiendas.</p>
          <span className="mt-5 text-sm font-medium text-zinc-900 underline underline-offset-4">Ver usuarios</span>
        </Link>}
      </div>
    </section>
  </main>;
}
