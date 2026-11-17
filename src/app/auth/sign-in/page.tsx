"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const result = await authClient.signIn.email({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      if (result.error) setError("No se pudo iniciar sesión. Comprueba tus datos.");
      else { router.push("/"); router.refresh(); }
    } catch {
      setError("No se pudo conectar. Inténtalo nuevamente.");
    } finally { setPending(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Iniciar sesión</h1>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">Correo
          <input name="email" type="email" required autoComplete="email" className="rounded border border-zinc-300 p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700">Contraseña
          <input name="password" type="password" required autoComplete="current-password" className="rounded border border-zinc-300 p-2" />
        </label>
        <Link href="/auth/forgot-password" className="self-end text-sm font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
          ¿Olvidaste tu contraseña?
        </Link>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={pending} className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50">{pending ? "Ingresando..." : "Ingresar"}</button>
      </form>
    </main>
  );
}
