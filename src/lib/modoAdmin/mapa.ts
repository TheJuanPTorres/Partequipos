import { enlaceEditar, type DestinoEditar } from "@/lib/panel/enlaceEditar";

/**
 * MODO ADMINISTRACIÓN: el MAPA de una página, lo que responde `GET /api/modo-admin/mapa/`.
 *
 * Dice qué bloque de la página es qué ficha del panel. Cada bloque es un SELECTOR sobre el marcado
 * que la página ya tiene (la sección por su título) y el enlace a su ficha. Así el HTML público no
 * lleva nada del modo administración: ni atributos de edición ni ids internos.
 *
 * Lógica pura, con pruebas. La consulta a la base y la sesión están en la ruta.
 *
 * QUÉ SALE DE AQUÍ (dirección, 2026-11-24): solo el selector, una etiqueta fija escrita aquí (no
 * contenido de la base) y el enlace al panel, que lleva el id del documento. Ningún campo.
 */

/** A dónde lleva «Editar»: una ficha, un global o la lista de una colección. */
export type Destino = DestinoEditar | { lista: string };

export type BloqueMapa = { selector: string; etiqueta: string; destino: Destino };

export type MapaDePagina = {
  /** «Editar esta página»: la ficha de la página entera. */
  pagina: { etiqueta: string; destino: Destino } | null;
  /** «Ver borrador»: ruta del sitio (la vista previa), si esa página la tiene. */
  borrador: string | null;
  bloques: BloqueMapa[];
};

export const MAPA_VACIO: MapaDePagina = { pagina: null, borrador: null, bloques: [] };

/** La colección o el global que toca un destino (para mirar el permiso). */
export function recursoDe(destino: Destino): { tipo: "coleccion" | "global"; slug: string } {
  if ("lista" in destino) return { tipo: "coleccion", slug: destino.lista };
  if ("global" in destino) return { tipo: "global", slug: destino.global };
  return { tipo: "coleccion", slug: destino.coleccion };
}

const SLUG = /^[a-z0-9-]{1,60}$/;

/** El enlace al panel de un destino, o `null` si no es válido. */
export function hrefDe(destino: Destino): string | null {
  if ("lista" in destino) {
    return SLUG.test(destino.lista) ? `/admin/collections/${destino.lista}` : null;
  }
  return enlaceEditar(destino);
}

const porTitulo = (id: string) => `section[aria-labelledby="${id}"]`;

/**
 * LA PORTADA: cada sección, al grupo de la página «inicio» que la edita; sedes, testimonios y
 * preguntas, además, a su colección (lo que se añade o se quita está allí).
 */
export function mapaDePortada(idPagina: number | string): MapaDePagina {
  const enPagina = (campo: string): Destino => ({ coleccion: "paginas", id: idPagina, campo });
  return {
    pagina: { etiqueta: "la portada", destino: { coleccion: "paginas", id: idPagina } },
    borrador: null,
    bloques: [
      {
        selector: 'section[aria-roledescription="carrusel"]',
        etiqueta: "las diapositivas",
        destino: enPagina("hero"),
      },
      {
        selector: porTitulo("portada-nueva-titulo"),
        etiqueta: "Maquinaria nueva",
        destino: enPagina("seccionNueva"),
      },
      {
        selector: porTitulo("usados-kit-titulo"),
        etiqueta: "Maquinaria usada",
        destino: enPagina("seccionUsada"),
      },
      {
        selector: porTitulo("repuestos-kit-titulo"),
        etiqueta: "Repuestos",
        destino: enPagina("seccionRepuestos"),
      },
      {
        selector: porTitulo("marcas-repuestos-titulo"),
        etiqueta: "Marcas de repuestos",
        destino: enPagina("seccionMarcasRepuestos"),
      },
      {
        selector: porTitulo("portada-compania-titulo"),
        etiqueta: "Nuestra Compañía",
        destino: enPagina("seccionCompania"),
      },
      {
        selector: porTitulo("portada-catalogo-titulo"),
        etiqueta: "la llamada al catálogo",
        destino: enPagina("seccionCatalogo"),
      },
      {
        selector: porTitulo("portada-sedes-titulo"),
        etiqueta: "las sedes",
        destino: { lista: "sedes" },
      },
      {
        selector: porTitulo("portada-testimonios-titulo"),
        etiqueta: "los testimonios",
        destino: { lista: "testimonios" },
      },
      {
        selector: porTitulo("portada-faq-titulo"),
        etiqueta: "las preguntas frecuentes",
        destino: { lista: "preguntas-frecuentes" },
      },
    ],
  };
}

/** LA FICHA DE UNA UNIDAD USADA: la ficha entera, y sus datos y sus fotos en su pestaña. */
export function mapaDeUsada(id: number | string, borrador: string | null): MapaDePagina {
  const ficha = { coleccion: "equipos-usados", id } as const;
  return {
    pagina: { etiqueta: "esta unidad", destino: ficha },
    borrador,
    bloques: [
      {
        selector: porTitulo("ficha-titulo"),
        etiqueta: "los datos y las fotos",
        destino: { ...ficha, pestana: "contenido" },
      },
      {
        selector: 'section[aria-label="Descripción y acciones"]',
        etiqueta: "la descripción",
        destino: { ...ficha, pestana: "contenido", campo: "descripcion" },
      },
    ],
  };
}

/** Lo que el usuario puede hacer, tal como lo da `payload.auth` (`permissions`). */
export type Permisos = {
  collections?: Record<string, unknown>;
  globals?: Record<string, unknown>;
};

/**
 * ¿Puede EDITAR ese recurso? Payload 3.89 da `update: true` o `update: { permission: true }` según
 * la versión del objeto; cualquier otra cosa (ausente, `false`, un filtro) cuenta como NO: el
 * botón no sale, y si saliera, el panel volvería a comprobarlo.
 */
export function puedeEditar(permisos: Permisos | null | undefined, destino: Destino): boolean {
  const { tipo, slug } = recursoDe(destino);
  const grupo = tipo === "global" ? permisos?.globals : permisos?.collections;
  const recurso = grupo?.[slug] as { update?: unknown } | undefined;
  const update = recurso?.update;
  if (update === true) return true;
  // Con filtro, Payload 3.89 da `{ permission: true, where }` (`sanitizePermissions`): puede editar
  // ALGUNOS documentos, no se sabe si este. Cuenta como NO (verificador, 2026-11-24).
  return (
    typeof update === "object" &&
    update !== null &&
    (update as { permission?: unknown }).permission === true &&
    !("where" in update)
  );
}

/** Lo que viaja al navegador: selector, etiqueta y enlace. */
export type RespuestaMapa = {
  pagina: { etiqueta: string; href: string } | null;
  borrador: string | null;
  bloques: Array<{ selector: string; etiqueta: string; href: string }>;
};

/** El mapa, SOLO con lo que ese usuario puede editar y con enlace válido. */
export function respuestaDelMapa(
  mapa: MapaDePagina,
  permisos: Permisos | null | undefined,
): RespuestaMapa {
  const enlazar = <T extends { destino: Destino }>(x: T) => {
    if (!puedeEditar(permisos, x.destino)) return null;
    const href = hrefDe(x.destino);
    return href ? { href } : null;
  };
  const pagina = mapa.pagina ? enlazar(mapa.pagina) : null;
  return {
    pagina: mapa.pagina && pagina ? { etiqueta: mapa.pagina.etiqueta, href: pagina.href } : null,
    borrador: pagina ? mapa.borrador : null,
    bloques: mapa.bloques.flatMap((b) => {
      const e = enlazar(b);
      return e ? [{ selector: b.selector, etiqueta: b.etiqueta, href: e.href }] : [];
    }),
  };
}
