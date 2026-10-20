/**
 * AJUSTES DE DIRECCIÓN A LOS DATOS DE SERVICIO TÉCNICO (2026-10-20): lógica pura
 * de `scripts/servicio-lubricantes/ajustes-servicio-tecnico.ts`. Decisión de
 * dirección sobre el «tal cual» de WordPress: los títulos en tipo frase, los
 * pasos de siniestros en tipo frase, la frase del taller en negrita y una
 * descripción para el vídeo de YouTube del alistamiento.
 *
 * Cada cambio dice qué valor espera encontrar (`de`) y cuál pone (`a`): si el
 * valor actual no es `de` (lo editó alguien en el panel), NO se toca y se avisa.
 * La retirada hace lo contrario, solo si el valor actual sigue siendo `a`.
 */

export const DESCRIPCION_YOUTUBE_ALISTAMIENTO =
  "Conoce cómo alistamos la maquinaria pesada usada en nuestros talleres: la revisamos, le hacemos el mantenimiento que necesita y la probamos antes de entregarla, para que llegue lista para trabajar.";

const FRASE_TALLER =
  "Contamos con personal calificado y altamente capacitado, junto con herramientas especializadas para esta labor.";

/** Dónde está el valor: un campo del bloque, la etiqueta de un paso o la negrita de un párrafo. */
export type Campo =
  | { tipo: "campo"; nombre: string }
  | { tipo: "paso"; indice: number }
  | { tipo: "negrita"; parrafo: string };

export type Cambio = {
  ancla: string;
  campo: Campo;
  de: string | null;
  a: string | null;
};

export const CAMBIOS: Cambio[] = [
  {
    ancla: "taller",
    campo: { tipo: "campo", nombre: "antetitulo" },
    de: "EN PARTEQUIPOS",
    a: "En Partequipos",
  },
  {
    ancla: "taller",
    campo: { tipo: "campo", nombre: "titulo" },
    de: "CONTAMOS CON UN EXCELENTE SERVICIO TÉCNICO",
    a: "contamos con un excelente servicio técnico",
  },
  // La negrita se representa como «sí»/«no».
  { ancla: "taller", campo: { tipo: "negrita", parrafo: FRASE_TALLER }, de: "no", a: "sí" },
  {
    ancla: "posventa",
    campo: { tipo: "campo", nombre: "titulo" },
    de: "CONTAMOS CON TÉCNICOS ALTAMENTE ESPECIALIZADOS Y CALIFICADOS.",
    a: "Contamos con técnicos altamente especializados y calificados.",
  },
  {
    ancla: "Siniestros",
    campo: { tipo: "campo", nombre: "titulo" },
    de: "¿TUVISTE UN ACCIDENTE CON TU MAQUINARIA AMARILLA?",
    a: "¿Tuviste un accidente con tu maquinaria amarilla?",
  },
  { ancla: "Siniestros", campo: { tipo: "paso", indice: 0 }, de: "VALORACIÓN", a: "Valoración" },
  { ancla: "Siniestros", campo: { tipo: "paso", indice: 1 }, de: "REPARACIÓN", a: "Reparación" },
  { ancla: "Siniestros", campo: { tipo: "paso", indice: 2 }, de: "REPUESTOS", a: "Repuestos" },
  {
    ancla: "alistamiento",
    campo: { tipo: "campo", nombre: "descripcionYoutube" },
    de: null,
    a: DESCRIPCION_YOUTUBE_ALISTAMIENTO,
  },
];

type Nodo = { type?: string; text?: string; format?: number; children?: Nodo[] };
export type Bloque = Record<string, unknown> & { ancla?: string | null };

const normal = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

function parrafoDe(b: Bloque, texto: string): Nodo | undefined {
  const raiz = (b.texto as { root?: Nodo } | null | undefined)?.root;
  return raiz?.children?.find(
    (p) =>
      p.type === "paragraph" &&
      (p.children ?? [])
        .map((h) => h.text ?? "")
        .join("")
        .trim() === texto,
  );
}

function leer(b: Bloque, c: Campo): string | null {
  if (c.tipo === "campo") return normal(b[c.nombre]);
  if (c.tipo === "paso") {
    const pasos = b.pasos as { etiqueta?: string }[] | undefined;
    return normal(pasos?.[c.indice]?.etiqueta);
  }
  const p = parrafoDe(b, c.parrafo);
  if (!p) return null;
  const textos = (p.children ?? []).filter((h) => typeof h.text === "string");
  return textos.length && textos.every((h) => ((h.format ?? 0) & 1) === 1) ? "sí" : "no";
}

function escribir(b: Bloque, c: Campo, valor: string | null): Bloque {
  const copia = structuredClone(b);
  if (c.tipo === "campo") copia[c.nombre] = valor;
  else if (c.tipo === "paso") {
    const pasos = copia.pasos as { etiqueta?: string | null }[];
    pasos[c.indice]!.etiqueta = valor;
  } else {
    const p = parrafoDe(copia, c.parrafo)!;
    for (const h of p.children ?? []) {
      if (typeof h.text !== "string") continue;
      h.format = valor === "sí" ? (h.format ?? 0) | 1 : (h.format ?? 0) & ~1;
    }
  }
  return copia;
}

export type Resultado = {
  bloques: Bloque[];
  aplicados: Cambio[];
  /** Ya tenían el valor nuevo (una segunda pasada). */
  yaEstaban: Cambio[];
  /** Tenían otro valor (editado en el panel) o no existen: no se tocan. */
  saltados: { cambio: Cambio; actual: string | null }[];
};

/**
 * Aplica (`sentido: "aplicar"`) o deshace (`"retirar"`) los cambios sobre los
 * bloques de la página. Solo toca un valor si es el esperado.
 */
export function ajustar(
  bloques: Bloque[],
  cambios: Cambio[],
  sentido: "aplicar" | "retirar",
): Resultado {
  let actuales = bloques;
  const aplicados: Cambio[] = [];
  const yaEstaban: Cambio[] = [];
  const saltados: Resultado["saltados"] = [];
  for (const cambio of cambios) {
    const [esperado, nuevo] = sentido === "aplicar" ? [cambio.de, cambio.a] : [cambio.a, cambio.de];
    const i = actuales.findIndex((b) => b.ancla === cambio.ancla);
    const actual = i < 0 ? null : leer(actuales[i]!, cambio.campo);
    if (i >= 0 && actual === nuevo) {
      yaEstaban.push(cambio);
      continue;
    }
    if (i < 0 || actual !== esperado) {
      saltados.push({ cambio, actual });
      continue;
    }
    actuales = actuales.map((b, j) => (j === i ? escribir(b, cambio.campo, nuevo) : b));
    aplicados.push(cambio);
  }
  return { bloques: actuales, aplicados, yaEstaban, saltados };
}
