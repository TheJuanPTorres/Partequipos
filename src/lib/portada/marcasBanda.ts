/**
 * «Marcas de la banda» (2026-11-05, dirección): en la portada, la sección «Marcas de repuestos»
 * pinta los logos ELEGIDOS en el panel («inicio» → «Marcas de repuestos» → «Marcas de la banda»),
 * en el orden en que se arrastraron. Con la lista vacía, como siempre: todas las marcas de
 * repuestos con logo, por orden alfabético.
 *
 * LOGOS LIBRES (2026-11-08, dirección): la lista admite dos clases de fila (bloques
 * `src/collections/bloques/bandaLogos.ts`): una MARCA de repuestos existente o un LOGO LIBRE de un
 * fabricante que no es marca de maquinaria (imagen, nombre y enlace opcional). Este módulo no
 * importa nada: lo usa también la banda en el navegador (`rellenoDeBanda`). Lo que convierte las
 * filas en logos está en `kitCliente.ts` (`logosDeLaBandaDeRepuestos`).
 */

/** Lo que guarda un campo de relación: el id, o el documento si la consulta lo trajo poblado. */
export type ValorRelacion = number | string | { id: number | string } | null | undefined;

/** Una imagen subida tal como llega de Payload: el id o el documento con su URL y medidas. */
export type ImagenSubida =
  | number
  | string
  | {
      id?: number | string;
      url?: string | null;
      width?: number | null;
      height?: number | null;
      mimeType?: string | null;
    }
  | null
  | undefined;

/** Una fila de «Marcas de la banda», como la guarda el campo de bloques. */
export type FilaBanda =
  | { blockType: "bandaMarca"; id?: string | null; marca?: ValorRelacion }
  | {
      blockType: "bandaLogo";
      id?: string | null;
      imagen?: ImagenSubida;
      nombre?: string | null;
      enlace?: string | null;
    };

/** Una fila ya interpretada: el id de una marca, o un logo libre con su imagen poblada. */
export type FilaInterpretada =
  | { tipo: "marca"; marca: number }
  | {
      tipo: "logo";
      clave: string;
      nombre: string;
      imagen: { url: string; width: number; height: number };
      enlace: string | null;
    };

/** El id numérico de un valor de relación, o `null`. */
export function idDe(v: ValorRelacion): number | null {
  const crudo = typeof v === "object" && v !== null ? v.id : v;
  const id = typeof crudo === "string" ? Number(crudo) : crudo;
  return typeof id === "number" && Number.isInteger(id) ? id : null;
}

/**
 * Las filas en su orden, sin las que no se pueden pintar: una marca repetida (sale una vez, la
 * primera), un logo libre sin nombre o sin imagen poblada con sus medidas. El enlace, recortado
 * (vacío = sin enlace).
 */
export function filasDeLaBanda(filas: readonly FilaBanda[] | null | undefined): FilaInterpretada[] {
  const vistas = new Set<number>();
  const salida: FilaInterpretada[] = [];
  for (const [i, f] of (filas ?? []).entries()) {
    if (f.blockType === "bandaMarca") {
      const id = idDe(f.marca);
      if (id === null || vistas.has(id)) continue;
      vistas.add(id);
      salida.push({ tipo: "marca", marca: id });
      continue;
    }
    const nombre = f.nombre?.trim() ?? "";
    const img = typeof f.imagen === "object" && f.imagen !== null ? f.imagen : null;
    if (!nombre || !img?.url || !img.width || !img.height) continue;
    salida.push({
      tipo: "logo",
      clave: f.id ? String(f.id) : `logo-${i}`,
      nombre,
      imagen: { url: img.url, width: img.width, height: img.height },
      enlace: f.enlace?.trim() || null,
    });
  }
  return salida;
}

/** Validación del campo en el servidor: la misma marca no puede elegirse dos veces. */
export function validarMarcasSinRepetir(
  filas: readonly FilaBanda[] | null | undefined,
): true | string {
  const ids = (filas ?? [])
    .filter((f) => f.blockType === "bandaMarca")
    .map((f) => idDe((f as { marca?: ValorRelacion }).marca))
    .filter((id): id is number => id !== null);
  return new Set(ids).size === ids.length
    ? true
    : "Hay una marca repetida en «Marcas de la banda». Quita la copia: cada marca sale una vez.";
}

/**
 * Los logos de UNA copia de la banda en bucle: la lista repetida entera hasta tener al menos
 * `minimo`, para que dos copias cubran siempre el ancho de la banda (`BandaLogos`). Sin logos,
 * nada.
 */
export function rellenoDeBanda<T>(logos: readonly T[], minimo: number): T[] {
  if (logos.length === 0) return [];
  const vueltas = Math.max(1, Math.ceil(minimo / logos.length));
  return Array.from({ length: vueltas }, () => logos).flat();
}
