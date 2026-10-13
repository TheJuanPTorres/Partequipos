/**
 * Funciones puras de la importación del catálogo de REPUESTOS desde WordPress
 * (`scripts/repuestos/importar-repuestos.ts`). En WordPress el catálogo son
 * páginas de Elementor; `scripts/repuestos/extraer-xml.py` saca de cada una el
 * título, el texto y las fotos de su sección principal. Detalle y decisiones
 * en `docs/repuestos-importacion.md`.
 */
import { textoPlano } from "../blog/wordpress";
import { motivoAltFlojo } from "../media/altFlojo";
import { tituloPorDefecto } from "../seo/porDefecto";

export type Nivel = "marca" | "tipo" | "modelo" | "sinRuta";

/**
 * Nivel de una página por su ruta bajo `repuestos-maquinaria-pesada-marcas/`:
 * marca, tipo o modelo. Las 4 páginas de CASE con un nivel de más no tienen
 * ruta en el sitio nuevo (`docs/redirects-map.csv` las marca huérfanas).
 * `null` si no es del catálogo (la raíz, el índice de marcas, las categorías).
 */
export function nivelDePagina(segmentos: string[] | null): Nivel | null {
  if (!segmentos || segmentos.length === 0) return null;
  const niveles = ["marca", "tipo", "modelo", "sinRuta"] as const;
  return niveles[Math.min(segmentos.length, 4) - 1] ?? null;
}

/** Los borradores publicados por error (`…-copy`): no se migran (ADR 0004). */
export function esBorradorCopia(slug: string): boolean {
  return /-copy$/.test(slug);
}

/**
 * Nombre del modelo: el título de la página sin «Repuestos (para)» (ni
 * «maquinaria pesada», que lleva la página de tipo colocada como modelo). Así el
 * título por defecto del sitio nuevo («Repuestos {nombre}») es el título de
 * la página en WordPress. Se respeta la escritura del cliente.
 */
export function nombreDeModelo(tituloWp: string): string {
  return textoPlano(tituloWp)
    .replace(/^repuestos\s+(para\s+)?(maquinaria\s+pesada\b\s*)?/i, "")
    .trim();
}

/**
 * Nombre del tipo de equipo: el título de la página sin «Repuestos para
 * maquinaria pesada» ni la marca del final («… Miniexcavadora BOBCAT» →
 * «Miniexcavadora»). `null` si no queda nada.
 */
export function nombreDeTipo(tituloWp: string, marca: string): string | null {
  let t = textoPlano(tituloWp).replace(/^repuestos\s+(para\s+)?(maquinaria\s+pesada\b\s*)?/i, "");
  for (const v of [marca, marca.split(/\s+/)[0] ?? ""].filter(Boolean)) {
    const fin = new RegExp(`\\s+${v.replace(/[^\p{L}\p{N}]+/gu, "[\\s-]*")}\\s*$`, "iu");
    if (fin.test(t)) {
      t = t.replace(fin, "");
      break;
    }
  }
  t = t.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : null;
}

const compacto = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export type Codigo = { valor: string | null; origen: "titulo" | "slug" | "ninguno" };

/**
 * Código del modelo («320D»): lo que sigue a la marca en el nombre. Se prueba
 * con la marca entera y con su primera palabra («CASE» por «Case
 * Construction»), sin mirar mayúsculas, espacios ni guiones. Si la marca no
 * aparece, lo que sigue a la marca en el slug, en mayúsculas.
 */
export function codigoDeModelo(nombre: string, marca: string, slug: string): Codigo {
  const palabras = nombre.split(/\s+/).filter(Boolean);
  const variantes = [compacto(marca), compacto(marca.split(/\s+/)[0] ?? "")].filter(Boolean);
  for (const v of variantes) {
    // La marca puede ocupar varias palabras («LINK BELT»): se acumulan hasta igualarla.
    for (let i = 0; i < palabras.length; i++) {
      let acumulado = "";
      for (let j = i; j < palabras.length; j++) {
        acumulado += compacto(palabras[j] ?? "");
        if (acumulado === v) {
          const resto = palabras
            .slice(j + 1)
            .join(" ")
            .trim();
          // «CASE» seguido de «CONSTRUCTION» es la marca entera, no el código.
          const esLaMarcaEntera = compacto(palabras.slice(i).join("")) === variantes[0];
          if (resto && !esLaMarcaEntera) return { valor: resto, origen: "titulo" };
        }
        if (acumulado.length >= v.length) break;
      }
    }
  }
  const marcaSlug = marca
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const i = slug.indexOf(`-${marcaSlug}-`);
  if (i >= 0) {
    return { valor: slug.slice(i + marcaSlug.length + 2).toUpperCase(), origen: "slug" };
  }
  return { valor: null, origen: "ninguno" };
}

/**
 * Texto de la página, tal cual (decisión de dirección, 2026-10-13), en texto
 * plano para el campo `descripcion`: un párrafo por línea en blanco, sin
 * etiquetas y con las entidades decodificadas.
 */
export function textoDePagina(html: string): string | null {
  const parrafos = html
    .split(/<\/p>|<br\s*\/?>\s*<br\s*\/?>/i)
    .map((p) => textoPlano(p))
    .filter(Boolean);
  return parrafos.length ? parrafos.join("\n\n") : null;
}

/**
 * ¿Parece llevar un dato de contacto (correo, teléfono, enlace de WhatsApp)?
 * Es el texto de una página pública del catálogo, pero si lo lleva no se
 * importa sin que alguien lo mire (CLAUDE.md §9, datos reales del cliente).
 */
export function pareceDatoDeContacto(texto: string): boolean {
  return /@|wa\.me|whatsapp|\+?\d[\d\s().-]{8,}\d/i.test(texto);
}

/** El sufijo de marca de los títulos de WordPress («- Partequipos», «| Partequipos»). */
const SUFIJO_WP = /\s*[-|–—]\s*partequipos(\s+colombia)?\s*$/i;

/**
 * Título para buscadores: el `<title>` que hoy publica WordPress
 * (`docs/url-map.csv`), sin su sufijo de marca, porque el sitio nuevo añade
 * « | Partequipos» (`tituloConMarca`). `null` si coincide con el título por
 * defecto: entonces no hace falta guardarlo y el campo queda vacío.
 */
export function tituloSeo(
  tituloVivo: string | null | undefined,
  porDefecto: string,
): string | null {
  const limpio = textoPlano(tituloVivo ?? "")
    .replace(SUFIJO_WP, "")
    .trim();
  if (!limpio) return null;
  return compacto(limpio) === compacto(porDefecto) ? null : limpio;
}

/** Título por defecto de un modelo en el sitio nuevo (el mismo que pinta la ficha). */
export const tituloPorDefectoModelo = (nombre: string) => tituloPorDefecto.modeloRepuesto(nombre);

/**
 * Meta descripción: la que hoy publica WordPress, si la hay. Es de plantilla
 * («Explora nuestra amplia selección de…»), pero lleva el nombre de cada
 * página y es la que ve Google hoy.
 */
export function descripcionSeo(descripcionViva: string | null | undefined): string | null {
  return textoPlano(descripcionViva ?? "") || null;
}

/**
 * Fotos genéricas: las que salen en `umbral` páginas o más (una imagen de
 * relleno repetida en 23 modelos). No son foto del equipo: no se importan.
 */
export function fotosGenericas(paginas: { fotos: { idWp: number }[] }[], umbral = 5): Set<number> {
  const usos = new Map<number, number>();
  for (const p of paginas)
    for (const id of new Set(p.fotos.map((f) => f.idWp))) usos.set(id, (usos.get(id) ?? 0) + 1);
  return new Set([...usos].filter(([, n]) => n >= umbral).map(([id]) => id));
}

/** Formatos de origen → el que se sube a `Media`. AVIF se convierte a WebP (dirección, 2026-10-13). */
const FORMATOS: Record<string, { ext: string; mimetype: string; convertir: boolean }> = {
  jpg: { ext: "jpg", mimetype: "image/jpeg", convertir: false },
  jpeg: { ext: "jpg", mimetype: "image/jpeg", convertir: false },
  png: { ext: "png", mimetype: "image/png", convertir: false },
  webp: { ext: "webp", mimetype: "image/webp", convertir: false },
  avif: { ext: "webp", mimetype: "image/webp", convertir: true },
};

export type FotoPlan = { fichero: string; mimetype: string; convertir: boolean; formatoWp: string };

/**
 * Nombre determinista de una foto en `Media`: el id del adjunto (único y
 * estable, para no subirla dos veces) y el nombre del modelo, para que se
 * reconozca en el panel. `null` si no es una foto que `Media` admita.
 */
export function fotoDeRepuesto(urlWp: string, idAdjunto: number, nombre: string): FotoPlan | null {
  const formatoWp = (urlWp.split("?")[0]?.split(".").pop() ?? "").toLowerCase();
  const f = FORMATOS[formatoWp];
  if (!f) return null;
  const base = nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return {
    fichero: `wp-repuesto-${idAdjunto}-${base}.${f.ext}`,
    mimetype: f.mimetype,
    convertir: f.convertir,
    formatoWp,
  };
}

/**
 * Texto alternativo: el de WordPress sin restos de numeración del fichero
 * («(1)», «-01»); si queda flojo (vacío, corto, genérico o el nombre del
 * fichero, que `Media` rechazaría), el nombre del modelo.
 */
export function altDeRepuesto(altWp: string, nombre: string, ficheroWp?: string): string {
  const limpio = textoPlano(altWp)
    .replace(/\s*\(\d+\)\s*$/, "")
    .replace(/[\s-]+0\d{1,2}$/, "")
    .replace(/[\s-]+$/, "")
    .trim();
  return motivoAltFlojo(limpio, ficheroWp) ? nombre : limpio;
}
