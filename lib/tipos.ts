// Tipos de las tablas que usa el formulario (subconjunto del esquema SQL)

export type Atribucion = "ethos" | "luis" | "david" | "alex_esteban" | "alex_guerrero";

export type MetodoPago = "efectivo" | "transferencia" | "bizum" | "tpv" | "domiciliado" | "stripe";

export interface Categoria {
  id: number;
  tipo: "gasto" | "ingreso";
  grupo: string;
  nombre: string;
  es_inversion: boolean;
  es_fijo: boolean;
}

export interface Cuenta {
  id: number;
  codigo: string;
  nombre: string;
  es_transito: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  entrenador: Atribucion;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  fecha_alta?: string;
  fecha_baja?: string | null;
}

export const ATRIBUCIONES: { valor: Atribucion; etiqueta: string }[] = [
  { valor: "luis", etiqueta: "Luis" },
  { valor: "david", etiqueta: "David" },
  { valor: "ethos", etiqueta: "Ethos" },
  { valor: "alex_esteban", etiqueta: "Alex E." },
  { valor: "alex_guerrero", etiqueta: "Alex G." },
];

export const METODOS: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: "efectivo", etiqueta: "Efectivo" },
  { valor: "transferencia", etiqueta: "Transfer." },
  { valor: "bizum", etiqueta: "Bizum" },
  { valor: "tpv", etiqueta: "TPV" },
  { valor: "domiciliado", etiqueta: "Domicil." },
  { valor: "stripe", etiqueta: "Stripe" },
];

// Método más probable según la cuenta elegida (siempre modificable)
export const METODO_POR_CUENTA: Record<string, MetodoPago> = {
  banco: "transferencia",
  caja: "efectivo",
  tpv: "tpv",
  stripe: "stripe",
};
