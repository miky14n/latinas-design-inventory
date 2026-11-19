import { auth } from "@/lib/server/auth";
import { withDatabaseTransaction } from "@/app/api/_lib/db";
import { ProductListError } from "./errors";
import { authorize, listProducts, productDetail, type ProductFilters } from "./repository";

function optionalId(value: string | null) {
  if (!value) return null;
  if (!/^[1-9]\d{0,18}$/.test(value) || (value.length === 19 && value > "9223372036854775807"))
    throw new ProductListError("INVALID", "El identificador no es válido.");
  return value;
}
export async function readProducts(params: URLSearchParams) {
  const { data, error } = await auth.getSession();
  if (error || !data?.user?.id) throw new ProductListError("UNAUTHENTICATED", "Inicia sesión para continuar.");
  const id = optionalId(params.get("id"));
  const status = params.get("estado") || "todos";
  const page = Number(params.get("pagina") || "1");
  if (!["todos", "activos", "inactivos"].includes(status) || !Number.isSafeInteger(page) || page < 1 || page > 100000)
    throw new ProductListError("INVALID", "Los filtros no son válidos.");
  const filters: ProductFilters = { query: (params.get("buscar") || "").trim().slice(0, 200), category: optionalId(params.get("categoria")), brand: optionalId(params.get("marca")), status: status as ProductFilters["status"], page, includeOptions: params.get("opciones") === "1" };
  return withDatabaseTransaction(async (client) => {
    const verReservas = await authorize(client, data.user.id);
    return id ? productDetail(client, id, verReservas) : listProducts(client, filters);
  });
}
