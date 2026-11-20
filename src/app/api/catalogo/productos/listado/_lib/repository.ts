import type { PoolClient } from "@neondatabase/serverless";
import { ProductListError } from "./errors";

export interface ProductFilters { query: string; category: string | null; brand: string | null; status: "todos" | "activos" | "inactivos"; page: number; includeOptions: boolean }
export async function authorize(client: PoolClient, userId: string) {
  await client.query("SELECT set_config('app.usuario_id', $1, true)", [userId]);
  const result = await client.query<{ ver_reservas: boolean }>(`SELECT
    (r.codigo IN ('DUENA', 'ADMINISTRACION') OR EXISTS (
      SELECT 1 FROM tienda t WHERE t.id = u.tienda_id AND t.activo AND t.tipo = 'MAYORISTA'
    )) AS ver_reservas
    FROM usuario u JOIN rol r ON r.id = u.rol_id AND r.activo
    JOIN rol_permiso rp ON rp.rol_id = r.id JOIN permiso p ON p.id = rp.permiso_id
    WHERE u.id = $1 AND u.activo AND p.codigo = 'GESTIONAR_CATALOGO'`, [userId]);
  if (!result.rows.length) throw new ProductListError("FORBIDDEN", "Tu cuenta no tiene permiso para consultar el catálogo.");
  return result.rows[0].ver_reservas;
}
export async function listProducts(client: PoolClient, filters: ProductFilters) {
  const where = `WHERE ($1 = '' OR strpos(lower(p.nombre), lower($1)) > 0 OR strpos(lower(p.codigo_interno), lower($1)) > 0
    OR EXISTS (SELECT 1 FROM variante v JOIN codigo_variante cv ON cv.variante_id = v.id AND cv.sustituido_en IS NULL
      WHERE v.producto_id = p.id AND strpos(lower(cv.codigo), lower($1)) > 0))
    AND ($2::bigint IS NULL OR p.categoria_id IN (
      WITH RECURSIVE rama(id) AS (
        SELECT id FROM categoria WHERE id = $2::bigint
        UNION
        SELECT c.id FROM categoria c JOIN rama ON c.padre_id = rama.id
      )
      SELECT id FROM rama
    ))
    AND ($3::bigint IS NULL OR p.marca_id = $3::bigint)
    AND ($4 = 'todos' OR p.activo = ($4 = 'activos'))`;
  const params = [filters.query, filters.category, filters.brand, filters.status];
  const products = await client.query(`SELECT p.id::text AS id, p.codigo_interno, p.nombre, p.genero, p.activo,
      c.nombre AS categoria, m.nombre AS marca,
      (SELECT count(*)::integer FROM variante v WHERE v.producto_id = p.id) AS variantes
      FROM producto p JOIN categoria c ON c.id = p.categoria_id JOIN marca m ON m.id = p.marca_id
      ${where} ORDER BY lower(p.nombre), p.id LIMIT 25 OFFSET $5`, [...params, (filters.page - 1) * 25]);
  const total = await client.query<{ total: number }>(`SELECT count(*)::integer AS total FROM producto p ${where}`, params);
  const categories = filters.includeOptions ? await client.query("SELECT id::text AS id, nombre, activo FROM categoria ORDER BY lower(nombre), id") : null;
  const brands = filters.includeOptions ? await client.query("SELECT id::text AS id, nombre, activo FROM marca ORDER BY lower(nombre), id") : null;
  return { productos: products.rows, total: total.rows[0].total, categorias: categories?.rows ?? null, marcas: brands?.rows ?? null, pagina: filters.page, porPagina: 25 };
}
export async function productDetail(client: PoolClient, id: string, verReservas: boolean) {
  const product = await client.query(`SELECT p.id::text AS id, p.codigo_interno, p.nombre, p.descripcion, p.genero, p.activo,
    c.nombre AS categoria, m.nombre AS marca, e.nombre AS escala, mc.nombre AS modelo
    FROM producto p JOIN categoria c ON c.id = p.categoria_id JOIN marca m ON m.id = p.marca_id
    JOIN escala_talla e ON e.id = p.escala_id LEFT JOIN modelo_corte mc ON mc.id = p.modelo_corte_id WHERE p.id = $1`, [id]);
  if (!product.rows.length) throw new ProductListError("NOT_FOUND", "No se encontró el producto.");
  const variants = await client.query(`SELECT v.id::text AS id, v.activo, t.valor AS talla, c.nombre AS color, c.hex,
    ARRAY(SELECT codigo FROM codigo_variante WHERE variante_id = v.id AND sustituido_en IS NULL ORDER BY codigo) AS codigos
    FROM variante v JOIN talla t ON t.id = v.talla_id JOIN color c ON c.id = v.color_id
    WHERE v.producto_id = $1 ORDER BY c.nombre, t.orden, t.valor, v.id`, [id]);
  const locations = await client.query(`WITH stock AS (
      SELECT s.almacen_id, sum(s.disponible) AS disponible,
        sum(s.existencia) AS existencia, sum(s.reservado) AS reservado
      FROM v_stock_disponible s JOIN variante v ON v.id = s.variante_id
      WHERE v.producto_id = $1 GROUP BY s.almacen_id
    )
    SELECT a.id::text AS id, coalesce(t.nombre, a.nombre) AS nombre,
      coalesce(t.codigo, a.codigo) AS codigo, t.direccion,
      (t.marca_id IS NULL OR t.marca_id = (SELECT marca_id FROM producto WHERE id = $1)) AS admite_marca,
      coalesce(s.disponible, 0)::text AS disponible,
      CASE WHEN $2::boolean AND (t.tipo = 'MAYORISTA' OR (a.tienda_id IS NULL AND a.codigo = 'CENTRAL'))
        THEN json_build_object('fisicas', coalesce(s.existencia, 0)::text,
                               'reservadas', coalesce(s.reservado, 0)::text)
      END AS desglose
    FROM almacen a LEFT JOIN tienda t ON t.id = a.tienda_id
    LEFT JOIN stock s ON s.almacen_id = a.id
    WHERE a.activo AND (a.tienda_id IS NULL OR t.activo)
    ORDER BY lower(coalesce(t.nombre, a.nombre)), a.id`, [id, verReservas]);
  return { producto: product.rows[0], variantes: variants.rows, ubicaciones: locations.rows };
}
