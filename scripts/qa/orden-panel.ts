/**
 * QA DEL ORDEN DEL PANEL, POR EFECTO (tanda 21, tarea 2, PR-6; 2026-11-23). SOLO EL PREVIEW.
 *
 *   ORDEN_PREVIEW=https://partequipos-xxxx.vercel.app \
 *     npm run preview:ejecutar -- npx payload run scripts/qa/orden-panel.ts
 *
 * Para CADA listado ordenable desde el panel: toma los dos primeros elementos (en su orden) que se
 * ven en su página pública, les INTERCAMBIA la clave de orden en la base del preview, revalida el
 * preview y comprueba en el HTML que la web los muestra en el orden nuevo; después los DEJA COMO
 * ESTABAN, revalida otra vez y comprueba que el orden ha vuelto. Todo en una tanda (una
 * revalidación por fase), para no cargar el preview. Una línea por listado: OK, FALLO o «no se ve»
 * (no hay dos elementos en la página).
 *
 * Se niega con cualquier base o almacén que no sea el del preview (`puedeTocarHeroDePrueba`), y con
 * una URL que no sea de un preview (`origenDePreview`). Si algo falla a mitad, el `finally` devuelve
 * las claves. Necesita `REVALIDACION_TOKEN` del preview.
 */
import { sql } from "@payloadcms/db-postgres";
import { getPayload, type CollectionSlug, type Payload } from "payload";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { rutas } from "../../src/lib/routes";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) throw new Error(`[orden-panel] se niega: ${veredicto.motivo}`);
const origen = origenDePreview(process.env.ORDEN_PREVIEW ?? "");
if (!origen) throw new Error("[orden-panel] ORDEN_PREVIEW no es la URL de un preview del proyecto");
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "";
const token = process.env.REVALIDACION_TOKEN ?? "";
if (!token) throw new Error("[orden-panel] falta REVALIDACION_TOKEN del preview");

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload: Payload = await getPayload({ config });

const decir = (t: string) => process.stdout.write(`${t}\n`);
const barra = (r: string) => (r.endsWith("/") ? r : `${r}/`);

/** Un elemento de un listado: su id, su clave de orden y cómo se reconoce en el HTML. */
type Elemento = { id: number; clave: string; marca: string };

/** Un listado: dónde se pinta y sus elementos EN SU ORDEN (los de un mismo padre, si es un join). */
type Caso = {
  nombre: string;
  tabla: string;
  columna: string;
  pagina: string;
  zona: "main" | "header";
  /** La marca es texto visible (no un enlace). */
  porTexto?: boolean;
  elementos: Elemento[];
  /** Alternativas de un mismo listado (un padre cada una): vale la primera que se vea. */
  grupo?: string;
};

type Doc = Record<string, unknown> & { id: number };
const s = (v: unknown) => (typeof v === "string" ? v : "");

async function docs(collection: CollectionSlug, sort: string): Promise<Doc[]> {
  const r = await payload.find({
    collection,
    sort,
    depth: 1,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });
  return r.docs as unknown as Doc[];
}
const slugDe = (v: unknown) => (v && typeof v === "object" ? s((v as Doc).slug) : "");
const idDe = (v: unknown) =>
  typeof v === "number" ? v : v && typeof v === "object" ? (v as Doc).id : null;

/**
 * Agrupa por padre y devuelve los grupos con al menos `n` elementos (para los joins), como mucho 8:
 * se usa el primero cuya página enseña dos (un tipo sin modelos o una marca oculta no se pintan).
 */
function grupos<T>(lista: T[], padre: (x: T) => unknown, n = 2): T[][] {
  const mapa = new Map<unknown, T[]>();
  for (const x of lista) mapa.set(padre(x), [...(mapa.get(padre(x)) ?? []), x]);
  return [...mapa.values()].filter((g) => g.length >= n).slice(0, 8);
}

const col = (slug: string) => slug.replace(/-/g, "_");
const COLECCION = (slug: CollectionSlug) => ({ tabla: col(slug), columna: "_order" });
const JOIN = (hija: CollectionSlug, join: string) => ({
  tabla: col(hija),
  columna: `_${col(hija)}_${join}_order`,
});

async function casos(): Promise<Caso[]> {
  const lista: Caso[] = [];
  // Repuestos.
  {
    const d = await docs("marcas", "_order");
    lista.push({
      nombre: "Repuestos: marcas (índice de marcas)",
      ...COLECCION("marcas"),
      pagina: rutas.marcas(),
      zona: "main",
      elementos: d.map((m) => ({
        id: m.id,
        clave: s(m._order),
        marca: barra(rutas.marca(s(m.slug))),
      })),
    });
  }
  {
    const d = (await docs("categorias-tecnicas", "_order")).filter((c) => !c.padre);
    lista.push({
      nombre: "Repuestos: categorías técnicas (índice)",
      ...COLECCION("categorias-tecnicas"),
      pagina: rutas.categoriasRepuestos(),
      zona: "main",
      elementos: d.map((c) => ({
        id: c.id,
        clave: s(c._order),
        marca: barra(rutas.categoriaRepuestos(s(c.slug))),
      })),
    });
  }
  const slugMarcaRepuestos = new Map(
    (await docs("marcas", "_order")).map((m) => [m.id, s(m.slug)]),
  );
  {
    const k = "_tipos-equipo_tipos_order";
    for (const g of grupos(
      (await docs("tipos-equipo", k)).filter((t) => !t.slugPadre && slugDe(t.marca)),
      (t) => idDe(t.marca),
    )) {
      const marca = slugDe(g[0]?.marca);
      lista.push({
        nombre: `Repuestos: tipos de la marca «${marca}»`,
        grupo: "tipos-equipo",
        ...JOIN("tipos-equipo", "tipos"),
        pagina: rutas.marca(marca),
        zona: "main",
        elementos: g.map((t) => ({
          id: t.id,
          clave: s(t[k]),
          marca: barra(rutas.tipo(marca, s(t.slug))),
        })),
      });
    }
  }
  {
    const k = "_modelos-repuesto_modelos_order";
    for (const g of grupos(
      (await docs("modelos-repuesto", k)).filter(
        (m) => m.tipo && typeof m.tipo === "object" && !(m.tipo as Doc).slugPadre,
      ),
      (m) => idDe(m.tipo),
    )) {
      const tipo = g[0]?.tipo as Doc;
      const marca = slugMarcaRepuestos.get(idDe(tipo.marca) ?? -1) ?? "";
      const t = s(tipo.slug);
      lista.push({
        nombre: `Repuestos: modelos del tipo «${marca}/${t}»`,
        grupo: "modelos-repuesto",
        ...JOIN("modelos-repuesto", "modelos"),
        pagina: rutas.tipo(marca, t),
        zona: "main",
        elementos: g.map((m) => ({
          id: m.id,
          clave: s(m[k]),
          marca: barra(rutas.modelo(marca, t, s(m.slug))),
        })),
      });
    }
  }
  // Maquinaria nueva. En el megamenú, «Aditamentos» va aparte y una marca con enlace externo lleva
  // fuera: no son de la lista de marcas.
  {
    const d = (await docs("marcas-maquinaria", "_order")).filter(
      (m) => m.disenoPagina !== "aditamentos" && !s(m.enlaceExterno) && m.mostrarEnWeb !== false,
    );
    lista.push({
      nombre: "Nueva: marcas (megamenú)",
      ...COLECCION("marcas-maquinaria"),
      pagina: "/",
      zona: "header",
      elementos: d.map((m) => ({
        id: m.id,
        clave: s(m._order),
        marca: barra(rutas.marcaMaquinaria(s(m.slug))),
      })),
    });
  }
  {
    const k = "_tipos-maquinaria_tipos_order";
    for (const g of grupos(await docs("tipos-maquinaria", k), (t) => idDe(t.marca), 2)) {
      const marca = slugDe(g[0]?.marca);
      lista.push({
        nombre: `Nueva: tipos de la marca «${marca}»`,
        grupo: "tipos-maquinaria",
        ...JOIN("tipos-maquinaria", "tipos"),
        pagina: rutas.marcaMaquinaria(marca),
        zona: "main",
        elementos: g.map((t) => ({
          id: t.id,
          clave: s(t[k]),
          marca: barra(rutas.tipoMaquinaria(marca, s(t.slug))),
        })),
      });
    }
  }
  {
    const k = "_equipos-nuevos_equipos_order";
    for (const g of grupos(await docs("equipos-nuevos", k), (e) => idDe(e.tipo), 2)) {
      const marca = slugDe(g[0]?.marca);
      const tipo = slugDe(g[0]?.tipo);
      lista.push({
        nombre: `Nueva: equipos del tipo «${marca}/${tipo}»`,
        grupo: "equipos-nuevos",
        ...JOIN("equipos-nuevos", "equipos"),
        pagina: rutas.tipoMaquinaria(marca, tipo),
        zona: "main",
        elementos: g.map((e) => ({
          id: e.id,
          clave: s(e[k]),
          marca: barra(rutas.equipoNuevo(marca, tipo, s(e.slug))),
        })),
      });
    }
  }
  {
    const d = await docs("categorias-maquinaria", "_order");
    lista.push({
      nombre: "Nueva: categorías (índice de tipos)",
      ...COLECCION("categorias-maquinaria"),
      pagina: rutas.nuevaTipos(),
      zona: "main",
      elementos: d.map((c) => ({
        id: c.id,
        clave: s(c._order),
        marca: barra(rutas.categoriaNueva(s(c.slug))),
      })),
    });
  }
  // Usados.
  {
    const d = await docs("categorias-usada", "_order");
    lista.push({
      nombre: "Usados: categorías (megamenú)",
      ...COLECCION("categorias-usada"),
      pagina: "/",
      zona: "header",
      elementos: d.map((c) => ({
        id: c.id,
        clave: s(c._order),
        marca: barra(rutas.categoriaUsada(s(c.slug))),
      })),
    });
  }
  // Lubricantes.
  {
    const k = "_categorias-lubricante_lineas_order";
    const g = grupos(await docs("categorias-lubricante", k), (c) => idDe(c.marca))[0] ?? [];
    const marca = slugDe(g[0]?.marca);
    lista.push({
      nombre: `Lubricantes: líneas de «${marca}»`,
      ...JOIN("categorias-lubricante", "lineas"),
      pagina: rutas.marcaLubricante(marca),
      zona: "main",
      elementos: g.map((c) => ({
        id: c.id,
        clave: s(c[k]),
        marca: barra(rutas.categoriaLubricante(marca, s(c.slug))),
      })),
    });
  }
  // Portada: por el texto visible.
  for (const [coleccion, campo, nombre] of [
    ["sedes", "nombre", "Portada: sedes"],
    ["testimonios", "empresa", "Portada: testimonios"],
    ["preguntas-frecuentes", "pregunta", "Portada: preguntas frecuentes"],
  ] as const) {
    const d = await docs(coleccion, "_order");
    lista.push({
      nombre,
      ...COLECCION(coleccion),
      pagina: "/",
      zona: "main",
      porTexto: true,
      elementos: d
        .filter((x) => s(x[campo]).trim().length > 3)
        .map((x) => ({ id: x.id, clave: s(x._order), marca: s(x[campo]).trim() })),
    });
  }
  return lista;
}

const escapar = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const paginas = new Map<string, string>();
async function html(ruta: string): Promise<string> {
  const r = barra(ruta);
  const enCache = paginas.get(r);
  if (enCache) return enCache;
  const res = await fetchAlPreview(`${origen}${r}`, origen!, bypass);
  const t = res.status === 200 ? (await res.text()).replace(/<script[\s\S]*?<\/script>/g, "") : "";
  paginas.set(r, t);
  return t;
}
function zona(t: string, z: Caso["zona"]): string {
  const [a, b] = z === "header" ? ["<header", "</header>"] : ["<main", "</main>"];
  const i = t.indexOf(a);
  return i < 0 ? "" : t.slice(i, t.indexOf(b, i) + b.length);
}
/** Dónde aparece el elemento: por su texto, o por su enlace con o sin barra final (repuestos). */
function posicion(texto: string, c: Caso, e: Elemento): number {
  if (c.porTexto) return texto.indexOf(escapar(e.marca));
  const encontradas = [`href="${e.marca}"`, `href="${e.marca.replace(/\/$/, "")}"`]
    .map((h) => texto.indexOf(h))
    .filter((i) => i >= 0);
  return encontradas.length ? Math.min(...encontradas) : -1;
}

/** ¿A va antes que B en la página? `null` si alguno no está. */
async function antes(c: Caso, a: Elemento, b: Elemento): Promise<boolean | null> {
  const t = zona(await html(c.pagina), c.zona);
  const [pa, pb] = [posicion(t, c, a), posicion(t, c, b)];
  return pa < 0 || pb < 0 ? null : pa < pb;
}

async function revalidar(): Promise<void> {
  const r = await fetchAlPreview(`${origen}/api/revalidar/`, origen!, bypass, {
    method: "POST",
    headers: { [CABECERA_REVALIDACION]: token },
  });
  if (r.status !== 200) throw new Error(`POST /api/revalidar/ respondió ${r.status}`);
}

/** Revalida y espera (hasta ~90 s) a que todas las páginas den lo esperado. */
async function esperar(
  pares: { c: Caso; a: Elemento; b: Elemento }[],
  aAntes: boolean,
): Promise<Map<Caso, boolean | null>> {
  await revalidar();
  let resultado = new Map<Caso, boolean | null>();
  for (let intento = 0; intento < 10; intento++) {
    await new Promise((r) => setTimeout(r, 9000));
    paginas.clear();
    resultado = new Map();
    for (const { c, a, b } of pares) resultado.set(c, await antes(c, a, b));
    if ([...resultado.values()].every((v) => v === aAntes)) break;
  }
  return resultado;
}

async function ponerClave(c: Caso, id: number, clave: string): Promise<void> {
  await payload.db.drizzle.execute(
    sql`UPDATE ${sql.raw(`"${c.tabla}"`)} SET ${sql.raw(`"${c.columna}"`)} = ${clave} WHERE id = ${id}`,
  );
}

const lista = await casos();
// Los dos primeros (en su orden) que se ven en su página, y que hoy salen en ese orden.
const pares: { c: Caso; a: Elemento; b: Elemento }[] = [];
const lineas = new Map<Caso, string>();
/** Los grupos de alternativas que ya tienen un caso elegido. */
const elegidos = new Set<string>();
for (const c of lista) {
  if (c.grupo && elegidos.has(c.grupo)) continue;
  const t = zona(await html(c.pagina), c.zona);
  const visibles = c.elementos.filter((e) => e.clave && posicion(t, c, e) >= 0);
  const [a, b] = visibles;
  const ultimoDelGrupo = !c.grupo || lista.filter((x) => x.grupo === c.grupo).at(-1) === c;
  if (!a || !b) {
    // De un grupo, solo se informa si ninguna alternativa se ve.
    if (ultimoDelGrupo)
      lineas.set(c, `—      ${c.nombre}: no se ve (menos de dos elementos en ${barra(c.pagina)})`);
    continue;
  }
  if (c.grupo) elegidos.add(c.grupo);
  if (!(await antes(c, a, b))) {
    lineas.set(c, `FALLO  ${c.nombre}: ya hoy no sale en el orden del panel`);
    continue;
  }
  pares.push({ c, a, b });
}

let fallos = [...lineas.values()].filter((l) => l.startsWith("FALLO")).length;
try {
  for (const { c, a, b } of pares) {
    await ponerClave(c, a.id, b.clave);
    await ponerClave(c, b.id, a.clave);
  }
  decir(`intercambiados ${pares.length} pares; revalidando…`);
  const cambiado = await esperar(pares, false);
  for (const { c } of pares) {
    if (cambiado.get(c) === false) lineas.set(c, `OK     ${c.nombre}: el cambio se ve`);
    else {
      lineas.set(c, `FALLO  ${c.nombre}: el cambio NO se ve (${String(cambiado.get(c))})`);
      fallos++;
    }
  }
} finally {
  for (const { c, a, b } of pares) {
    await ponerClave(c, a.id, a.clave);
    await ponerClave(c, b.id, b.clave);
  }
  decir("claves devueltas; revalidando…");
}
const vuelto = await esperar(pares, true);
for (const { c } of pares) {
  if (vuelto.get(c) !== true) {
    lineas.set(c, `${lineas.get(c)} · FALLO: no vuelve al orden de antes`);
    fallos++;
  } else lineas.set(c, `${lineas.get(c)} · vuelve`);
}
for (const c of lista) {
  const l = lineas.get(c);
  if (l) decir(l);
}
decir(`${pares.length} comprobados, ${fallos} fallos`);
if (fallos) throw new Error(`[orden-panel] ${fallos} fallos`);
