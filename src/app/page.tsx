import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/lib/server/auth";
import Link from "next/link";

export const instant = false;

const modules = [
  {
    number: "01",
    title: "Catálogo",
    description: "Productos, modelos, variantes, tallas, colores y precios.",
    detail: "Productos · Variantes · Precios",
  },
  {
    number: "02",
    title: "Existencias y traspasos",
    description: "Consulta de stock por tienda y almacén, con movimientos trazables.",
    detail: "Stock · Documentos · Movimientos",
  },
  {
    number: "03",
    title: "Ventas y reservas",
    description: "Ventas, sus líneas, pagos pendientes y reservas de productos.",
    detail: "Ventas · Pagos · Reservas",
  },
  {
    number: "04",
    title: "Caja",
    description: "Sesiones de caja y movimientos asociados a la operación diaria.",
    detail: "Sesiones · Ingresos · Egresos",
  },
  {
    number: "05",
    title: "Devoluciones",
    description: "Registro de devoluciones y cambios vinculados a ventas.",
    detail: "Devoluciones · Cambios",
  },
  {
    number: "06",
    title: "Comisiones",
    description: "Reglas y liquidaciones de comisiones por venta.",
    detail: "Reglas · Liquidaciones",
  },
];

export default function Home() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm text-zinc-500">Cargando panel…</p></main>}>
      <AuthenticatedHome />
    </Suspense>
  );
}

async function AuthenticatedHome() {
  await connection();
  const { data, error } = await auth.getSession();
  if (error || !data?.user) redirect("/auth/sign-in");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section
        aria-labelledby="dashboard-heading"
        className="relative overflow-hidden rounded-3xl bg-zinc-950 px-6 py-8 text-white sm:px-10 sm:py-10"
      >
        <div aria-hidden="true" className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute -right-2 -top-10 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
              Panel de inicio
            </span>
            <h1 id="dashboard-heading" className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Hola, bienvenida
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">
              Administra el catálogo, las existencias y las operaciones de Latina&apos;s Design desde un solo lugar.
            </p>
          </div>
          <Link
            href="/catalogo/productos/nuevo"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            Agregar producto
          </Link>
        </div>
      </section>

      <section id="modules-heading" aria-labelledby="overview-heading">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Tu espacio de trabajo</p>
            <h2 id="overview-heading" className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
              Módulos de la primera versión
            </h2>
          </div>
          <p className="text-sm text-zinc-500">Datos disponibles al conectar cada módulo</p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <article
              key={module.number}
              className="group flex min-h-52 flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-semibold tabular-nums text-zinc-400">{module.number}</span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                  En preparación
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-base font-semibold text-zinc-950">{module.title}</h3>
                <p className="mt-2 text-sm leading-5 text-zinc-600">{module.description}</p>
              </div>
              <p className="mt-5 border-t border-zinc-100 pt-4 text-xs text-zinc-500">{module.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="getting-started-heading"
        className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Siguiente paso</p>
          <h2 id="getting-started-heading" className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">
            Inicio personalizado por rol
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Los gráficos y accesos rápidos se mostrarán según el rol y los permisos de la sesión. La protección por sesión ya está activa; los datos del dashboard se integrarán al conectar cada módulo.
          </p>
        </div>
      </section>
    </main>
  );
}
