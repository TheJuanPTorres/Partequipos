import { z } from "zod";

/**
 * Validación de los formularios públicos.
 *
 * Vive aparte de la Server Action para poder probarla sin levantar Payload ni
 * Next, y porque es la ÚNICA validación que cuenta: lo que valide el navegador
 * es cortesía para el usuario, no seguridad (CLAUDE.md §5). Cualquiera puede
 * enviar un POST a la acción saltándose el formulario.
 */

/** Tipos de solicitud; deben coincidir con el `select` de la colección. */
export const TIPOS_SOLICITUD = ["contacto", "cotizacion", "repuesto"] as const;

/**
 * Clasificación opcional del formulario de la página de marca de repuestos.
 * Valores y etiquetas, en el orden del diseño; deben coincidir con los
 * `select` `interes` y `perfil` de la colección `solicitudes`.
 */
export const INTERESES = [
  { valor: "cotizar", etiqueta: "Cotizar productos" },
  { valor: "muestras", etiqueta: "Muestras/prototipos" },
  { valor: "asesoria", etiqueta: "Asesoría general" },
  { valor: "otro", etiqueta: "Otro" },
] as const;
export const PERFILES = [
  { valor: "empresa", etiqueta: "Empresa" },
  { valor: "comprador", etiqueta: "Comprador" },
  { valor: "emprendedor", etiqueta: "Emprendedor" },
  { valor: "proveedor", etiqueta: "Proveedor" },
  { valor: "empleado", etiqueta: "Empleado" },
  { valor: "otro", etiqueta: "Otro" },
] as const;
const VALORES_INTERES = INTERESES.map((i) => i.valor) as [string, ...string[]];
const VALORES_PERFIL = PERFILES.map((p) => p.valor) as [string, ...string[]];
export type TipoSolicitud = (typeof TIPOS_SOLICITUD)[number];

/** Longitudes máximas. Cortan el abuso antes de llegar a la base. */
export const MAX = { nombre: 120, correo: 200, telefono: 40, empresa: 160, mensaje: 4000 } as const;

/*
 * Teléfono: se acepta cualquier combinación de dígitos, espacios, guiones,
 * paréntesis y un `+` inicial, con entre 7 y 15 dígitos.
 *
 * Deliberadamente laxo. Colombia mezcla fijos de 7 cifras con indicativo,
 * móviles de 10 y números internacionales; una expresión estricta rechazaría
 * clientes reales, y rechazar un lead válido es peor que guardar un teléfono
 * mal escrito que el comercial verá igualmente.
 */
const TELEFONO = /^[+]?[\d\s\-().]{7,25}$/;
const soloDigitos = (v: string) => v.replace(/\D/g, "").length;

const textoObligatorio = (campo: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Escribe tu ${campo}.`)
    .max(max, `El campo ${campo} no puede pasar de ${max} caracteres.`);

const textoOpcional = (max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .max(max, mensaje)
    .optional()
    .transform((v) => (v ? v : undefined));

export const esquemaSolicitud = z.object({
  tipo: z.enum(TIPOS_SOLICITUD, { message: "Tipo de solicitud no válido." }),

  nombre: textoObligatorio("nombre", MAX.nombre).min(2, "El nombre es demasiado corto."),

  correo: z
    .string()
    .trim()
    .min(1, "Escribe tu correo.")
    .max(MAX.correo, "El correo es demasiado largo.")
    .email("Ese correo no parece válido.")
    // Se normaliza a minúsculas: evita duplicados por mayúsculas al deduplicar.
    .transform((v) => v.toLowerCase()),

  telefono: z
    .string()
    .trim()
    .max(MAX.telefono, "El teléfono es demasiado largo.")
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || (TELEFONO.test(v) && soloDigitos(v) >= 7), {
      message: "Ese teléfono no parece válido. Ejemplo: +57 317 670 7071.",
    }),

  empresa: textoOpcional(MAX.empresa, "El nombre de la empresa es demasiado largo."),

  mensaje: textoObligatorio("mensaje", MAX.mensaje).min(
    10,
    "Cuéntanos un poco más: al menos 10 caracteres.",
  ),

  /*
   * Clasificación opcional: solo una opción de lista cerrada, ningún texto
   * libre. Un valor desconocido se rechaza; ausente o vacío, se ignora.
   */
  interes: z
    .enum(VALORES_INTERES, { message: "Elige una opción de la lista." })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  perfil: z
    .enum(VALORES_PERFIL, { message: "Elige una opción de la lista." })
    .optional()
    .or(z.literal("").transform(() => undefined)),

  /*
   * Campos que NO escribe el usuario: los pone la página. Se validan igual,
   * porque llegan por el mismo POST y nada impide manipularlos.
   */
  referenciaTipo: z.enum(["equipos-nuevos", "modelos-repuesto"]).optional(),
  referenciaId: z.coerce.number().int().positive().optional(),
  referenciaTexto: textoOpcional(300, "Referencia demasiado larga."),
  origen: textoOpcional(500, "Origen demasiado largo."),
});

export type DatosSolicitud = z.infer<typeof esquemaSolicitud>;

/** Errores por campo, en la forma que consume el formulario. */
export type ErroresCampo = Partial<Record<string, string>>;

/**
 * Valida y devuelve o los datos o los errores por campo.
 *
 * Se queda con el PRIMER error de cada campo: mostrar tres mensajes sobre el
 * mismo input no ayuda a corregirlo.
 */
export function validarSolicitud(
  entrada: unknown,
): { ok: true; datos: DatosSolicitud } | { ok: false; errores: ErroresCampo } {
  const resultado = esquemaSolicitud.safeParse(entrada);
  if (resultado.success) return { ok: true, datos: resultado.data };

  const errores: ErroresCampo = {};
  for (const issue of resultado.error.issues) {
    const campo = String(issue.path[0] ?? "formulario");
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return { ok: false, errores };
}

/** Convierte un `FormData` en el objeto plano que espera el esquema. */
export function desdeFormData(formData: FormData): Record<string, unknown> {
  const leer = (clave: string) => {
    const v = formData.get(clave);
    return typeof v === "string" ? v : undefined;
  };

  return {
    tipo: leer("tipo"),
    nombre: leer("nombre"),
    correo: leer("correo"),
    telefono: leer("telefono"),
    empresa: leer("empresa"),
    mensaje: leer("mensaje"),
    interes: leer("interes"),
    perfil: leer("perfil"),
    referenciaTipo: leer("referenciaTipo"),
    referenciaId: leer("referenciaId"),
    referenciaTexto: leer("referenciaTexto"),
    origen: leer("origen"),
  };
}
