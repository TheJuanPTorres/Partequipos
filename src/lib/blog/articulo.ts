import type { ArticuloLista } from "./indice";

/**
 * Piezas PURAS del artículo del blog con el diseño propio (2026-10-26, dirección):
 * el autor que se muestra, el contenido sin la imagen principal repetida y los
 * «Post recientes» de la columna derecha. Sin Payload ni React: se prueban solas.
 */

/**
 * El autor que se muestra. WordPress firmaba con el usuario interno («3e6ll»):
 * un autor sin espacios ni mayúsculas parece un usuario, no un nombre, y sale
 * la firma de la empresa. Vacío, también.
 */
export function autorVisible(autor: string | null | undefined, empresa: string): string {
  const texto = autor?.trim() ?? "";
  if (!texto) return empresa;
  const pareceUsuario = !/\s/.test(texto) && texto === texto.toLowerCase();
  return pareceUsuario ? empresa : texto;
}

type Medio = { id?: number | null; filename?: string | null } | number | null | undefined;

/** Lo que identifica una imagen: su id y su fichero, con y sin el sufijo aleatorio del Blob. */
function claves(m: Medio): { id: number | null; fichero: string | null; base: string | null } {
  if (typeof m === "number") return { id: m, fichero: null, base: null };
  if (!m || typeof m !== "object") return { id: null, fichero: null, base: null };
  const fichero = m.filename?.trim().toLowerCase() || null;
  // `nombre-<sufijo aleatorio de 20 o más>.<ext>` → `nombre.<ext>`.
  const base = fichero ? fichero.replace(/-[a-z0-9]{20,}(?=\.[a-z0-9]+$)/, "") : null;
  return { id: m.id ?? null, fichero, base };
}

/** ¿Son la misma imagen? Mismo id, mismo fichero o mismo fichero sin el sufijo aleatorio. */
export function mismaImagen(a: Medio, b: Medio): boolean {
  const x = claves(a);
  const y = claves(b);
  if (x.id !== null && x.id === y.id) return true;
  if (x.fichero && x.fichero === y.fichero) return true;
  return !!x.base && x.base === y.base;
}

type Nodo = { type?: string; value?: Medio; children?: Nodo[] } & Record<string, unknown>;

/**
 * El contenido sin la imagen principal repetida: si la PRIMERA imagen del
 * contenido es la misma que la principal, se quita (y el párrafo que la
 * envolvía, si se queda vacío). Las demás, y una primera distinta, se quedan.
 * No muta el original.
 */
export function sinImagenPrincipal<T>(contenido: T, principal: Medio): T {
  const raiz = (contenido as { root?: Nodo } | null | undefined)?.root;
  if (!raiz?.children?.length || principal === null || principal === undefined) return contenido;

  for (let i = 0; i < raiz.children.length; i++) {
    const nodo = raiz.children[i]!;
    if (nodo.type === "upload") {
      if (!mismaImagen(nodo.value, principal)) return contenido;
      return conHijos(
        contenido,
        raiz,
        raiz.children.filter((_, j) => j !== i),
      );
    }
    const dentro = nodo.children?.findIndex((h) => h.type === "upload") ?? -1;
    if (dentro >= 0) {
      if (!mismaImagen(nodo.children![dentro]!.value, principal)) return contenido;
      const resto = nodo.children!.filter((_, j) => j !== dentro);
      const vacio = resto.every(
        (h) => h.type === "linebreak" || (h.type === "text" && !String(h.text ?? "").trim()),
      );
      const hijos = vacio
        ? raiz.children.filter((_, j) => j !== i)
        : raiz.children.map((n, j) => (j === i ? { ...n, children: resto } : n));
      return conHijos(contenido, raiz, hijos);
    }
  }
  return contenido;
}

function conHijos<T>(contenido: T, raiz: Nodo, children: Nodo[]): T {
  return { ...(contenido as object), root: { ...raiz, children } } as T;
}

/** «Post recientes»: los `n` más recientes, sin el actual. */
export function postRecientes(
  articulos: ArticuloLista[],
  idActual: number,
  n = 3,
): ArticuloLista[] {
  return articulos
    .filter((a) => a.id !== idActual)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, n);
}

/**
 * Los enlaces de compartir (sin scripts de terceros): Facebook, X, LinkedIn,
 * correo y WhatsApp, con la URL y el título codificados.
 */
export function enlacesCompartir(url: string, titulo: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(titulo);
  return [
    {
      red: "facebook",
      nombre: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    { red: "x", nombre: "X", href: `https://x.com/intent/post?url=${u}&text=${t}` },
    {
      red: "linkedin",
      nombre: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    },
    {
      red: "correo",
      nombre: "correo",
      href: `mailto:?subject=${t}&body=${encodeURIComponent(`${titulo}\n\n${url}`)}`,
    },
    {
      red: "whatsapp",
      nombre: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${titulo}: ${url}`)}`,
    },
  ] as const;
}
