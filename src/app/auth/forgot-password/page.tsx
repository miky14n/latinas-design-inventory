"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);
    try {
      const result = await authClient.requestPasswordReset({
        email: String(form.get("email")).trim(),
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (result.error) {
        setError("No se pudo solicitar el enlace. Inténtalo de nuevo.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("No se pudo conectar. Inténtalo nuevamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <section className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        {submitted ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-zinc-900">Revisa tu correo</h1>
            <p className="text-sm leading-6 text-zinc-600">
              Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.
            </p>
            <Link href="/auth/sign-in" className="text-sm font-medium text-zinc-800 underline-offset-4 hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">Restablecer contraseña</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Te enviaremos un enlace para crear una contraseña nueva.
              </p>
            </div>
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Correo electrónico
              <input name="email" type="email" required autoComplete="email" className="rounded border border-zinc-300 p-2" />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={pending} className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50">
              {pending ? "Enviando…" : "Enviar enlace"}
            </button>
            <Link href="/auth/sign-in" className="text-center text-sm font-medium text-zinc-700 underline-offset-4 hover:underline">
              Volver al inicio de sesión
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
