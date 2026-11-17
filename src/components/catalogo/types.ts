export interface Marca {
  id: number;
  nombre: string;
  activo?: boolean;
}

export interface Categoria {
  id: number;
  padre_id: number | null;
  nombre: string;
  prefijo_codigo: string | null;
  activo?: boolean;
}

export interface ModeloCorte {
  id: number;
  categoria_id: number;
  nombre: string;
  activo?: boolean;
}

export interface Talla {
  id: number;
  escala_id: number;
  valor: string;
  orden: number;
  activo?: boolean;
}

export interface EscalaTalla {
  id: number;
  nombre: string;
  tipo: "DAMA" | "VARON" | "ALFABETICA" | "UNICA";
  activo?: boolean;
  tallas?: Talla[];
}

export interface Color {
  id: number;
  codigo: string;
  nombre: string;
  hex: string | null;
  activo?: boolean;
}

export interface ListaPrecio {
  id: number;
  codigo: string;
  nombre: string;
  moneda: string;
  activo?: boolean;
}

export interface CatalogoOptions {
  marcas: Marca[];
  categorias: Categoria[];
  modelosCorte: ModeloCorte[];
  escalas: EscalaTalla[];
  tallas?: Talla[];
  colores: Color[];
  listasPrecio: ListaPrecio[];
}

export type Genero = "DAMA" | "VARON" | "UNISEX";

export interface VariantCellState {
  talla_id: number;
  color_id: number;
  activo: boolean;
  codigo: string;
}

export interface ProductFormData {
  codigo_interno: string;
  nombre: string;
  descripcion: string;
  categoria_id: number | "";
  modelo_corte_id: number | "";
  escala_id: number | "";
  marca_id: number | "";
  genero: Genero;
  precios: Record<number, string>; // lista_id -> importe text
  selectedTallaIds: number[];
  selectedColorIds: number[];
  variants: Record<string, VariantCellState>; // key: `${color_id}-${talla_id}`
}

export type ProductGeneralFieldsData = Pick<
  ProductFormData,
  | "codigo_interno"
  | "nombre"
  | "descripcion"
  | "marca_id"
  | "genero"
  | "categoria_id"
  | "modelo_corte_id"
>;

export type ProductGeneralField = keyof ProductGeneralFieldsData;

export interface ProductoCreatePayload {
  codigo_interno: string;
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  modelo_corte_id?: number | null;
  escala_id: number;
  marca_id: number;
  genero: Genero;
  precios?: {
    lista_id: number;
    importe: number;
  }[];
  variantes: {
    talla_id: number;
    color_id: number;
    codigo: string;
  }[];
}
