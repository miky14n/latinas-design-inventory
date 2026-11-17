Aplicación de inventario para Latina's Design, construida con Next.js, TypeScript y Tailwind CSS.

## Getting Started

## Configuración local

Configura las variables privadas en `.env.local`:

- `DATABASE_URL`: conexión de PostgreSQL generada por Neon para el rol predeterminado del proyecto. Se usa solo desde el backend; nunca la expongas al navegador ni la declares con prefijo `NEXT_PUBLIC_`.
- `NEON_AUTH_BASE_URL` y `NEON_AUTH_COOKIE_SECRET`: configuración de Neon Auth para el servidor.

La API de catálogo verifica la sesión, que el perfil interno esté activo y el permiso `GESTIONAR_CATALOGO`. La carga inicial asigna ese permiso a `DUENA` y `ADMINISTRACION`; otros roles no pueden crear productos hasta que se les conceda expresamente. El servidor usa `DATABASE_URL`. Como el rol predeterminado de Neon puede tener privilegios amplios, la API debe validar cada operación y mantener la conexión exclusivamente en el servidor.

## Desarrollo

Inicia el servidor:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
