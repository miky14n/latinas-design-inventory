import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/server/auth";
import { requireGestionUsuarios } from "@/app/api/usuarios/_lib/service";

const modulos = [
  { nombre: "Productos y existencias", descripcion: "Consulta productos, tallas, colores y existencias por ubicación.", estado: "Para pruebas", href: "/catalogo/productos" },
  { nombre: "Configuración del catálogo", descripcion: "Administración de marcas, categorías, cortes, escalas, tallas y colores.", estado: "Para pruebas", href: "/catalogo/configuracion" },
  { nombre: "Registro de productos", descripcion: "Alta de productos con tallas, colores y códigos.", estado: "Para pruebas", href: "/catalogo/productos/nuevo" },
  { nombre: "Recepción de mercadería", descripcion: "Registro de mercadería recibida en el almacén central.", estado: "Para pruebas", href: "/inventario/recepciones" },
  { nombre: "Escaneo de códigos", descripcion: "Lectura desde la cámara y conexión con celular para completar el buscador.", estado: "Para pruebas", href: "/inventario/recepciones" },
  { nombre: "Gestión de usuarios", descripcion: "Cuentas, roles operativos y asignaciones a tiendas.", estado: "Para pruebas", href: "/admin/usuarios" },
  { nombre: "Traspasos entre ubicaciones", descripcion: "Envío y recepción de mercadería entre almacenes.", estado: "Pendiente" },
  { nombre: "Ventas y reservas", descripcion: "Ventas, líneas, pagos pendientes y reservas de productos.", estado: "Pendiente" },
  { nombre: "Caja", descripcion: "Sesiones y movimientos asociados a la operación diaria.", estado: "Pendiente" },
  { nombre: "Devoluciones", descripcion: "Registro de devoluciones y cambios vinculados a ventas.", estado: "Pendiente" },
  { nombre: "Comisiones", descripcion: "Reglas y liquidaciones de comisiones por venta.", estado: "Pendiente" },
];

export default function ModulosPage() {
  return <Suspense fallback={<main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10"><p role="status" className="text-sm text-zinc-500">Cargando módulos…</p></main>}>
    <ModulosInternos />
  </Suspense>;
}

async function ModulosInternos() {
  const { data, error } = await auth.getSession();
  if (error || !data?.user) redirect("/auth/sign-in");
  let tieneAcceso = false;
  try {
    await requireGestionUsuarios();
    tieneAcceso = true;
  } catch {
    tieneAcceso = false;
  }
  if (!tieneAcceso) redirect("/");

  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <Link href="/" className="text-sm text-zinc-600 hover:underline">Inicio</Link>
    <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">Seguimiento de módulos</h1>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {modulos.map(modulo => <article key={modulo.nombre} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold text-zinc-950">{modulo.nombre}</h2>
          <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${modulo.estado === "Para pruebas" ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>{modulo.estado}</span>
        </div>
        <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600">{modulo.descripcion}</p>
        {"href" in modulo && modulo.href && <Link href={modulo.href} className="mt-4 text-sm font-medium text-zinc-800 underline">Abrir {modulo.nombre.toLowerCase()}</Link>}
      </article>)}
    </div>
  </main>;
}
