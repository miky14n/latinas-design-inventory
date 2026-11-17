"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirmPassword"))) {
      setError("Las contraseñas no coinciden.");
      setPending(false);
      return;
    }

    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError("El enlace no es válido o ya venció. Solicita uno nuevo.");
        return;
      }
      setComplete(true);
    } catch {
      setError("No se pudo restablecer la contraseña. Solicita un enlace nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <section className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        {complete ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-zinc-900">Contraseña actualizada</h1>
            <p className="text-sm leading-6 text-zinc-600">Ya puedes iniciar sesión con tu contraseña nueva.</p>
            <Link href="/auth/sign-in" className="rounded bg-zinc-900 px-4 py-2 text-center text-white">
              Ir al inicio de sesión
            </Link>
          </div>
        ) : !token ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-zinc-900">Enlace no válido</h1>
            <p className="text-sm leading-6 text-zinc-600">Solicita un nuevo enlace para restablecer tu contraseña.</p>
            <Link href="/auth/forgot-password" className="text-sm font-medium text-zinc-800 underline-offset-4 hover:underline">
              Solicitar enlace nuevo
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">Crea una contraseña</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Usa al menos 8 caracteres.</p>
            </div>
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Nueva contraseña
              <input name="password" type="password" required minLength={8} autoComplete="new-password" className="rounded border border-zinc-300 p-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Confirmar contraseña
              <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="rounded border border-zinc-300 p-2" />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={pending} className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50">
              {pending ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
