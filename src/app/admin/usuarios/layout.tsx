import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UsuarioError } from "@/app/api/usuarios/_lib/errors";
import { requireDuena } from "@/app/api/usuarios/_lib/service";

export const metadata = {
  title: "Gesti\u00f3n de usuarios \u00b7 Latina's Design",
  description: "Administra las cuentas y perfiles de acceso del equipo.",
};

export default function UsuariosLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm text-zinc-500">Verificando acceso...</p></main>}>
      <ProtectedUsuarios>{children}</ProtectedUsuarios>
    </Suspense>
  );
}

async function ProtectedUsuarios({ children }: { children: ReactNode }) {
  try {
    await requireDuena();
  } catch (error) {
    if (error instanceof UsuarioError && error.code === "UNAUTHENTICATED") redirect("/auth/sign-in");
    if (error instanceof UsuarioError && error.code === "FORBIDDEN") redirect("/");
    throw error;
  }
  return children;
}
