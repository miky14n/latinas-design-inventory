import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { requireGestionUsuarios } from "@/app/api/usuarios/_lib/service";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Latina's Design — Control de Inventario",
  description: "Sistema de inventario y operaciones comerciales para Latina's Design.",
};

async function OwnerAwareNavbar() {
  await connection();
  let canManageUsers = false;
  try {
    await requireGestionUsuarios();
    canManageUsers = true;
  } catch {
    canManageUsers = false;
  }

  return <Navbar canManageUsers={canManageUsers} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 font-sans text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white">
        <Suspense fallback={<Navbar />}>
          <OwnerAwareNavbar />
        </Suspense>
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
