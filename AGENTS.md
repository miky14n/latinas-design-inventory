<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Higiene del repositorio

- Mantener en el repositorio únicamente archivos útiles para desarrollar, ejecutar, mantener o reproducir el proyecto: código, configuración compartida, dependencias declaradas, documentación vigente y pruebas permanentes necesarias.
- Guardar pruebas exploratorias o temporales realizadas por el agente, sus datos, capturas, trazas, informes y otros resultados desechables en `tmp/` o `test-results/`, que deben permanecer ignorados. Las pruebas automatizadas mantenidas como parte del proyecto y sus fixtures intencionales sí se conservan en el repositorio.
- Mantener fuera del repositorio credenciales, variables de entorno locales, configuración específica de la máquina, dependencias instaladas, cachés y archivos generados. Antes de crear archivos o terminar una tarea, revisar los nuevos archivos y actualizar `.gitignore` con reglas precisas cuando sea necesario, sin ocultar código o recursos requeridos.
- No subir, agregar al índice ni confirmar archivos sin una instrucción del usuario. `.gitignore` no deja de rastrear archivos que ya estén versionados; informar cualquier caso sin eliminarlo automáticamente.

## Convenciones del proyecto

- Diseñar todas las interfaces con Tailwind CSS. No agregar CSS plano, módulos CSS ni estilos en línea; consultar al usuario antes de cualquier excepción.
- Mantener las consultas SQL, validaciones de negocio y credenciales en el servidor. Las API viven en `src/app/api`, responden con `NextResponse` y el navegador solo consume sus endpoints.
- La conexión de la aplicación es la variable `DATABASE_URL` del rol predeterminado de Neon. No introducir ni migrar a un rol alterno como `DATABASE_URL_APP` sin indicación del usuario.
- La base de Neon configurada es producción. Tratar toda consulta o mutación mediante sus credenciales como acceso a producción; no ejecutar scripts, migraciones ni cambios de datos o Auth salvo autorización explícita para esa operación.
- Verificar la sesión de Neon Auth en el servidor. El ID de usuario debe obtenerse de esa sesión, nunca del cuerpo de la solicitud, y establecerse con `set_config('app.usuario_id', ..., true)` en la misma transacción que accede a datos protegidos.
- En el esquema de la aplicación `usuario.id` es texto y el ID de `neon_auth."user".id` es UUID. Al unir ambas tablas, comparar tipos explícitamente, por ejemplo `neon_auth."user".id::text = usuario.id`; no cambiar el tipo de `usuario.id` para resolver esa comparación.
- Los permisos del gestor se determinan por el rol interno activo `DUENA`. El rol `admin` de Neon Auth es un privilegio distinto, necesario para algunas operaciones administrativas de Auth; no asignarlo automáticamente por seleccionar un rol de la aplicación.
- La baja de usuarios es lógica: marcar `usuario.activo = false`, conservar el perfil y el historial, y revocar sesiones cuando corresponda. No borrar físicamente identidades ni perfiles desde el panel.

## Next.js instalado

- La versión instalada usa Cache Components (`cacheComponents: true`). Consultar primero la documentación local en `node_modules/next/dist/docs/` antes de usar APIs de Next.js.
- El acceso a sesión, cookies, base de datos u otros datos dinámicos debe quedar dentro de un límite `<Suspense>` adecuado para evitar errores `blocking-prerender-dynamic`. No llamar `connection()` directamente en el `RootLayout` ni al inicio de una página sin un límite `Suspense`; si hace falta, mover el trabajo a un componente asíncrono hijo bajo ese límite.
- Antes de iniciar `next dev`, comprobar si ya hay una instancia del proyecto en ejecución y reutilizar su puerto. No iniciar otro servidor o puerto si ya existe uno.

## Arquitectura limpia obligatoria
- Cada vista page.tsx define el contenido de su ruta y coordina sus flujos: carga de datos de pantalla, estado de interfaz y acciones que consumen la API. Si necesita metadatos o una comprobación de acceso de servidor, mantenerlos en el layout.tsx de la ruta para que page.tsx pueda ser la vista interactiva.
- Al crear o reorganizar componentes visuales, ubicarlos en src/components/<funcionalidad>; no crear componentes ni carpetas _components dentro de src/app. Los componentes reciben datos y callbacks; no cargan datos ni coordinan los flujos propios de una vista. Crear componentes cuando exista reutilización real o cuando dividir una pieza grande mejore claramente su mantenimiento.

- Mantener dependencias dirigidas hacia el núcleo: aplicación y dominio no importan Next.js, `NextResponse`, Neon Auth, `@neondatabase/serverless`, `server-only` ni módulos de interfaz.
- Mantener el backend dentro de `src/app/api`. La conexión compartida a Neon vive en `src/app/api/_lib/db.ts`; cada funcionalidad puede guardar su lógica interna bajo `src/app/api/<funcionalidad>/_lib/`.
- Para una funcionalidad, mantener una estructura corta y reconocible: `route.ts` para HTTP y `NextResponse`, `_lib/service.ts` para validación y reglas del flujo, `_lib/repository.ts` para SQL y transacciones del módulo, y `_lib/errors.ts` para errores del servicio. Añadir `_lib/identity.ts` solo cuando el adaptador externo tenga responsabilidades propias.
- Los Route Handlers convierten la solicitud a datos, invocan el servicio y traducen resultado o error a `NextResponse`. No duplicar reglas del servicio en rutas ni exponer servicios, consultas SQL o credenciales al navegador.
- Toda consulta SQL y transacción se ejecuta desde backend bajo `src/app/api`; mantener el SQL en el repositorio correspondiente para que el servicio y el transporte HTTP no mezclen persistencia.
- Mantener Neon Auth en el servidor. Cuando su flujo necesite un adaptador separado, ubicarlo dentro del `_lib` de la funcionalidad; no importar el SDK desde componentes de interfaz.
- Evitar una jerarquía general de `modules`, puertos o clases de caso de uso por cada operación si una estructura directa de servicio y repositorio resuelve la necesidad. Añadir abstracciones cuando exista reutilización o complejidad concreta que las justifique.
- Mantener los refactors dentro de la funcionalidad solicitada. Si otra funcionalidad parece requerir cambios para ajustarse a estas reglas, explicarlo y esperar indicación antes de ampliarle el refactor.
- `src/lib/server/**` solo conserva utilidades realmente compartidas que no sean específicas de una API; no ubicar allí SQL ni lógica de funcionalidades.
- La traducción de errores a códigos HTTP pertenece a la capa de API. Los errores del servicio usan códigos propios y no dependen de estados HTTP ni de `NextResponse`.
- Para operaciones de negocio, las pantallas consumen las API mediante `fetch`; usar Route Handlers y `NextResponse`, no Server Actions. No introducir una segunda vía de transporte sin autorización del usuario.
- En un refactor, conservar los contratos HTTP actuales; no cambiar el esquema ni ejecutar SQL de producción como parte de una reorganización de capas.
