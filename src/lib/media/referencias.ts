/**
 * DÓNDE SE USA UNA IMAGEN EN UN REGISTRO, Y CAMBIARLA POR OTRA (fotos ampliadas de más,
 * 2026-11-16): el script que sustituye una foto pequeña por su original grande
 * (`scripts/fotos/fotos-ampliadas.ts`) tiene que encontrar TODOS los sitios donde un registro
 * guarda el id de esa imagen —un campo suelto, una galería (`hasMany`), una fila de un array, un
 * bloque, un grupo o una pestaña, o un nodo de texto enriquecido— y cambiar exactamente esos.
 *
 * Se guía por los CAMPOS de la colección (como los define Payload) y no por adivinar en los datos:
 * un número igual al id en otro campo (un orden, un año) no se toca nunca. Puro, sin Payload.
 */

/** Un campo de Payload, con lo poco que hace falta aquí. */
export type CampoRef = {
  type: string;
  name?: string;
  relationTo?: string | string[];
  hasMany?: boolean;
  fields?: CampoRef[];
  blocks?: { slug: string; fields: CampoRef[] }[];
  tabs?: { name?: string; fields: CampoRef[] }[];
};

/** El camino hasta el valor dentro de los datos del registro: `["grupos", 3, "imagen"]`. */
export type Ruta = (string | number)[];

type Datos = Record<string, unknown>;

const esObjeto = (v: unknown): v is Datos => typeof v === "object" && v !== null;

/** El id de una relación tal como llega con `depth: 0` (número) o poblada (`{ id }`). */
export function idDe(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  if (esObjeto(v) && "id" in v) return idDe(v.id);
  return null;
}

const apuntaA = (rel: string | string[] | undefined, coleccion: string) =>
  Array.isArray(rel) ? rel.includes(coleccion) : rel === coleccion;

/** En un texto enriquecido (Lexical), cada nodo `{ relationTo: "media", value }` con ese id. */
function enTextoRico(v: unknown, id: number, coleccion: string, ruta: Ruta, out: Ruta[]) {
  if (Array.isArray(v)) {
    v.forEach((x, i) => enTextoRico(x, id, coleccion, [...ruta, i], out));
    return;
  }
  if (!esObjeto(v)) return;
  if (v.relationTo === coleccion && idDe(v.value) === id) out.push([...ruta, "value"]);
  for (const [k, x] of Object.entries(v)) {
    if (k !== "value" || v.relationTo !== coleccion)
      enTextoRico(x, id, coleccion, [...ruta, k], out);
  }
}

function recorrer(
  campos: CampoRef[],
  datos: unknown,
  id: number,
  coleccion: string,
  ruta: Ruta,
  out: Ruta[],
) {
  if (!esObjeto(datos)) return;
  for (const c of campos) {
    const valor = c.name ? datos[c.name] : undefined;
    switch (c.type) {
      case "upload":
      case "relationship": {
        if (!c.name || !apuntaA(c.relationTo, coleccion)) break;
        const poli = Array.isArray(c.relationTo);
        const mira = (v: unknown, r: Ruta) => {
          if (poli) {
            if (esObjeto(v) && v.relationTo === coleccion && idDe(v.value) === id)
              out.push([...r, "value"]);
          } else if (idDe(v) === id) out.push(r);
        };
        if (c.hasMany && Array.isArray(valor))
          valor.forEach((v, i) => mira(v, [...ruta, c.name!, i]));
        else mira(valor, [...ruta, c.name]);
        break;
      }
      case "array":
        if (c.name && Array.isArray(valor))
          valor.forEach((fila, i) =>
            recorrer(c.fields ?? [], fila, id, coleccion, [...ruta, c.name!, i], out),
          );
        break;
      case "blocks":
        if (c.name && Array.isArray(valor))
          valor.forEach((fila, i) => {
            const tipo = esObjeto(fila) ? fila.blockType : undefined;
            const bloque = c.blocks?.find((b) => b.slug === tipo);
            if (bloque) recorrer(bloque.fields, fila, id, coleccion, [...ruta, c.name!, i], out);
          });
        break;
      case "group":
        if (c.name) recorrer(c.fields ?? [], valor, id, coleccion, [...ruta, c.name], out);
        else recorrer(c.fields ?? [], datos, id, coleccion, ruta, out);
        break;
      case "tabs":
        for (const t of c.tabs ?? []) {
          if (t.name) recorrer(t.fields, datos[t.name], id, coleccion, [...ruta, t.name], out);
          else recorrer(t.fields, datos, id, coleccion, ruta, out);
        }
        break;
      case "row":
      case "collapsible":
        recorrer(c.fields ?? [], datos, id, coleccion, ruta, out);
        break;
      case "richText":
        if (c.name) enTextoRico(valor, id, coleccion, [...ruta, c.name], out);
        break;
    }
  }
}

/** Todos los sitios del registro que guardan esa imagen (`coleccion`, por defecto `media`). */
export function rutasDeImagen(
  campos: CampoRef[],
  datos: unknown,
  id: number,
  coleccion = "media",
): Ruta[] {
  const out: Ruta[] = [];
  recorrer(campos, datos, id, coleccion, [], out);
  return out;
}

/** El valor en esa ruta (o `undefined` si no existe). */
export function valorEn(datos: unknown, ruta: Ruta): unknown {
  let v: unknown = datos;
  for (const k of ruta) {
    if (Array.isArray(v) && typeof k === "number") v = v[k];
    else if (esObjeto(v)) v = v[String(k)];
    else return undefined;
  }
  return v;
}

/**
 * Los datos con el id de cada ruta cambiado a `nuevo`, sin tocar el original. Devuelve SOLO los
 * campos de primer nivel que cambian, que es lo que se manda en el `update` (un array o un bloque
 * se manda entero, con los ids de sus filas: Payload los conserva).
 */
export function conSustitucion(datos: Datos, rutas: Ruta[], nuevo: number): Datos {
  const copia = structuredClone(datos);
  for (const r of rutas) {
    const padre = valorEn(copia, r.slice(0, -1));
    const k = r[r.length - 1];
    if (Array.isArray(padre) && typeof k === "number") padre[k] = nuevo;
    else if (esObjeto(padre)) padre[String(k)] = nuevo;
  }
  const cambios: Datos = {};
  for (const k of new Set(rutas.map((r) => String(r[0])))) cambios[k] = copia[k];
  return cambios;
}

/** Ruta legible para el manifiesto y los mensajes: `grupos[3].imagen`. */
export function rutaLegible(ruta: Ruta): string {
  return ruta
    .map((k, i) => (typeof k === "number" ? `[${k}]` : i === 0 ? String(k) : `.${String(k)}`))
    .join("");
}
