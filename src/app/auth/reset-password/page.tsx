import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6"><p className="text-sm text-zinc-600">Cargando…</p></main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
