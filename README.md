# Latina's Design Inventory

Aplicación fullstack de inventario para Latina's Design, construida con Next.js 16, TypeScript, Tailwind CSS y PostgreSQL en Neon.

## Requisitos

- Node.js y npm
- Una base PostgreSQL de Neon con el esquema del proyecto
- Neon Auth configurado

## Configuración local

Instala dependencias:

```bash
npm install
```

Crea `.env.local` en la raíz y configura las variables privadas del servidor:

```env
DATABASE_URL=
NEON_AUTH_BASE_URL=
NEON_AUTH_COOKIE_SECRET=
```

No agregues valores reales de estas variables al repositorio. `DATABASE_URL` conecta con Neon desde el backend. Las credenciales y la sesión de Neon Auth también se manejan en el servidor.

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para acceder desde otro dispositivo en la red local, inicia Next.js exponiendo el servidor en la interfaz de red de la computadora y usa la dirección local que indique la terminal. La cámara del navegador requiere HTTPS; para pruebas desde un celular, usa un túnel HTTPS hacia el servidor local.

## Compilación

```bash
npm run build
npm run start
```

El proyecto usa Cache Components. Las partes de la interfaz que dependen de sesión esperan una solicitud dentro de un límite `Suspense`, mientras el resto puede formar parte de la salida prerenderizada.

## Estructura

- `src/app`: páginas, layouts y Route Handlers de la API.
- `src/app/api`: validación, autorización, servicios y acceso a datos del servidor.
- `src/components`: componentes compartidos de interfaz.
- `src/lib/server`: utilidades compartidas exclusivas del servidor.

Las pantallas consumen la API mediante `fetch`. Las consultas SQL, reglas de negocio y credenciales permanecen en el backend.

## Despliegue

Configura `DATABASE_URL`, `NEON_AUTH_BASE_URL` y `NEON_AUTH_COOKIE_SECRET` en las variables de entorno privadas del proveedor de despliegue. No guardes secretos en archivos versionados, como `.gitignore`, ni en el código fuente. Si una credencial se expone en un commit, rótala y elimina la exposición del historial según el procedimiento del repositorio.

El proyecto puede desplegarse en Vercel o Netlify con el adaptador de Next.js correspondiente. Configura las variables de entorno en el proveedor y ejecuta el build de producción allí.
