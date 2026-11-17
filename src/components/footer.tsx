import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
        <p className="font-medium text-zinc-600">Latina&apos;s Design · Inventario y operaciones</p>
        <div className="flex items-center gap-5">
          <Link href="/" className="transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900">
            Inicio
          </Link>
        </div>
      </div>
    </footer>
  );
}
