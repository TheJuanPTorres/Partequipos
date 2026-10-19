/**
 * CONTENIDO DE LAS PÁGINAS DE MODELO de repuestos desde WordPress (2026-10-19,
 * decisión del cliente: se migra TODO tal cual, erratas incluidas). Detalle en
 * docs/repuestos-importacion.md §13.
 *
 *   npm run preview:ejecutar -- payload run scripts/repuestos/importar-modelos-wp.ts simular preview
 *   npm run preview:ejecutar -- payload run scripts/repuestos/importar-modelos-wp.ts importar preview
 *   npm run preview:ejecutar -- payload run scripts/repuestos/importar-modelos-wp.ts retirar preview
 *
 * Para el sitio publicado, el runbook de dirección (destino `produccion`).
 *
 * Qué hace:
 * - En cada MODELO (se casa por su URL, la misma que en WordPress): antetítulo,
 *   título de la página, «repuestos disponibles para…», la lista de piezas y si
 *   se muestra. Solo rellena lo que está VACÍO (no pisa lo de un editor).
 * - La DESCRIPCIÓN solo se corrige cuando difiere del texto de WordPress
 *   únicamente en espacios: es el defecto del importador anterior, que cambiaba
 *   una etiqueta por un espacio («E xcavadora» donde WordPress pinta
 *   «Excavadora»). Cualquier otra diferencia se avisa y no se toca.
 * - En cada TIPO, «Categorías en las páginas de sus modelos»: las de la
 *   plantilla de WordPress de sus modelos (la más usada), solo si está vacío.
 * - En el global `repuestos-marca`, la FOTO de la tarjeta «Estamos aquí para
 *   ayudarlo» (la propia de WordPress, fuera del repositorio), solo si está
 *   vacía. Los textos de esa tarjeta los siembra la migración.
 *
 * Manifiesto fuera del repositorio con lo de ANTES de cada cambio; `retirar`
 * lo devuelve todo y borra la foto que subió. No revalida: al terminar, el
 * paso de revalidación del runbook (o redesplegar).
 *
 * FUENTE: el JSON de `scripts/repuestos/extraer-modelos-wp.py`
 * (`Desktop/partequipos-cierre/repuestos-modelos-wp.json`, o `fuente=<ruta>`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { segmentoDeTipo } from "../../src/lib/repuestos/anidado";
import {
  ALT_FOTO_AYUDA,
  categoriasDePlantillas,
  mismoTextoSalvoEspacios,
  type PaginaModeloWp,
} from "../../src/lib/repuestos/modelosWp";
import { rutas } from "../../src/lib/routes";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[modelos-wp] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, importar o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
exigirAlmacen("[modelos-wp]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "repuestos-modelos-wp.json");
const FOTO =
  valorDe("foto") ??
  path.join(
    os.homedir(),
    "Desktop",
    "partequipos-diseno",
    "repuestos-modelo",
    "ayuda-whatsapp.jpg",
  );
const MANIFIESTO = path.join(CIERRE, `manifiesto-modelos-wp-${destino}.json`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
if (modo === "simular") {
  for (const op of ["create", "update", "delete", "updateGlobal"] as const) {
    (payload as unknown as Record<string, unknown>)[op] = () =>
      fallar(`simulación: «${op}» no está permitido`);
  }
}
const log = (m: string) => process.stdout.write(`[modelos-wp] ${m}\n`);

// ---------- Manifiesto ----------

type CamposModelo = {
  descripcion?: string | null;
  antetitulo?: string | null;
  tituloPagina?: string | null;
  tituloDisponibles?: string | null;
  piezas?: { texto: string }[] | null;
  mostrarPiezas?: boolean | null;
};
type Manifiesto = {
  destino: string;
  modelos: { id: number; antes: CamposModelo }[];
  tipos: { id: number; antes: number[] }[];
  global: { fotoAntes: number | null; mediaCreada: number | null } | null;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : { destino: destino!, modelos: [], tipos: [], global: null };
if (manifiesto.destino !== destino) fallar(`el manifiesto es del destino «${manifiesto.destino}»`);
const guardar = () => {
  if (modo !== "simular") fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};
const idDe = (v: unknown): number | null =>
  typeof v === "number" ? v : v && typeof v === "object" && "id" in v ? idDe(v.id) : null;

// ---------- Retirar ----------

if (modo === "retirar") {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  for (const m of manifiesto.modelos) {
    await payload.update({
      collection: "modelos-repuesto",
      id: m.id,
      data: m.antes,
      overrideAccess: true,
    });
  }
  log(`modelos devueltos a como estaban: ${manifiesto.modelos.length}`);
  for (const t of manifiesto.tipos) {
    await payload.update({
      collection: "tipos-equipo",
      id: t.id,
      data: { categoriasModelo: t.antes },
      overrideAccess: true,
    });
  }
  log(`tipos devueltos a como estaban: ${manifiesto.tipos.length}`);
  if (manifiesto.global) {
    await payload.updateGlobal({
      slug: "repuestos-marca",
      data: { modeloAyudaFoto: manifiesto.global.fotoAntes },
      overrideAccess: true,
    });
    if (manifiesto.global.mediaCreada) {
      const media = await payload.findByID({
        collection: "media",
        id: manifiesto.global.mediaCreada,
        depth: 0,
        overrideAccess: true,
      });
      await payload.delete({
        collection: "media",
        id: manifiesto.global.mediaCreada,
        overrideAccess: true,
      });
      log(`foto de la tarjeta de ayuda borrada (media ${manifiesto.global.mediaCreada})`);
      if (media.url) {
        log("espero 70 s (propagación del Blob)");
        await new Promise((r) => setTimeout(r, 70_000));
        const r = await fetch(media.url, { method: "HEAD" });
        if (r.status !== 404) fallar(`la foto sigue en el Blob (HTTP ${r.status})`);
        log("✓ la foto da 404 en el Blob");
      }
    }
  }
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  log("RETIRADA COMPLETA. Revalidar (o redesplegar) para que el sitio lo muestre.");
} else {
  // ---------- Simular / importar ----------

  if (!fs.existsSync(FUENTE)) fallar(`no está la fuente: ${FUENTE}`);
  const paginas = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as PaginaModeloWp[];
  // Las rutas de WordPress llevan la barra final; las nuestras (`rutas.modelo`), no.
  const conBarra = (r: string) => r.replace(/\/?$/, "/");
  const porRuta = new Map(paginas.map((p) => [conBarra(p.ruta), p]));
  // Algunas direcciones de WordPress acaban en «_» (D6K, DX225LCA-CEBDX) y las
  // nuestras no lo llevan: se casan sin él, si no hay ya una página sin «_».
  for (const p of paginas) {
    const sinGuion = conBarra(p.ruta).replace(/_\/$/, "/");
    if (!porRuta.has(sinGuion)) porRuta.set(sinGuion, p);
  }

  const { docs: modelos } = await payload.find({
    collection: "modelos-repuesto",
    depth: 1,
    limit: 0,
    overrideAccess: true,
  });
  const vacio = (v: unknown) =>
    v === null || v === undefined || (typeof v === "string" && !v.trim());

  let cambiados = 0;
  let descripciones = 0;
  const sinPagina: string[] = [];
  const otrasDescripciones: string[] = [];
  const casadas = new Set<string>();
  const plantillasDeTipo = new Map<number, string[][]>();

  for (const m of modelos) {
    const marca = typeof m.marca === "object" ? m.marca : null;
    const tipo = typeof m.tipo === "object" ? m.tipo : null;
    if (!marca || !tipo) continue;
    const ruta = conBarra(rutas.modelo(marca.slug, segmentoDeTipo(tipo), m.slug));
    const wp = porRuta.get(ruta);
    if (!wp) {
      sinPagina.push(ruta);
      continue;
    }
    casadas.add(ruta);
    plantillasDeTipo.set(tipo.id, [...(plantillasDeTipo.get(tipo.id) ?? []), wp.plantillas]);

    const cambios: CamposModelo = {};
    const antes: CamposModelo = {};
    const poner = <K extends keyof CamposModelo>(k: K, valor: CamposModelo[K]) => {
      cambios[k] = valor;
      antes[k] = (m[k as keyof typeof m] ?? null) as CamposModelo[K];
    };
    if (vacio(m.antetitulo) && wp.antetitulo) poner("antetitulo", wp.antetitulo);
    if (vacio(m.tituloPagina) && wp.titulo) poner("tituloPagina", wp.titulo);
    if (vacio(m.tituloDisponibles) && wp.disponibles) poner("tituloDisponibles", wp.disponibles);
    if ((m.piezas ?? []).length === 0 && wp.piezas.length > 0) {
      poner(
        "piezas",
        wp.piezas.map((texto) => ({ texto })),
      );
      if (!m.mostrarPiezas && wp.piezasVisibles) poner("mostrarPiezas", true);
    }
    const actual = m.descripcion ?? "";
    if (wp.parrafo && actual !== wp.parrafo) {
      if (vacio(actual) || mismoTextoSalvoEspacios(actual, wp.parrafo)) {
        poner("descripcion", wp.parrafo);
        descripciones++;
      } else {
        otrasDescripciones.push(`${m.nombre} (id ${m.id})`);
      }
    }
    if (Object.keys(cambios).length === 0) continue;

    cambiados++;
    if (!manifiesto.modelos.some((x) => x.id === m.id)) {
      manifiesto.modelos.push({ id: m.id, antes });
      guardar();
    }
    if (modo === "importar") {
      await payload.update({
        collection: "modelos-repuesto",
        id: m.id,
        data: cambios,
        overrideAccess: true,
      });
    }
  }
  log(
    `modelos: ${modelos.length} en la base · ${casadas.size} casados con WordPress · ${cambiados} con cambios (${descripciones} descripciones corregidas)`,
  );
  if (sinPagina.length)
    log(`sin página en WordPress (${sinPagina.length}): ${sinPagina.join(", ")}`);
  const sueltas = paginas
    .filter((p) => ![...casadas].some((r) => porRuta.get(r) === p))
    .map((p) => p.ruta);
  if (sueltas.length)
    log(`páginas de WordPress sin modelo (${sueltas.length}): ${sueltas.join(", ")}`);
  if (otrasDescripciones.length) {
    log(
      `descripciones que difieren de WordPress en algo más que espacios, SIN tocar (${otrasDescripciones.length}): ${otrasDescripciones.join("; ")}`,
    );
  }

  // Categorías por tipo: las de la plantilla más usada por sus modelos.
  const { docs: categorias } = await payload.find({
    collection: "categorias-tecnicas",
    depth: 0,
    limit: 0,
    overrideAccess: true,
  });
  const idPorSlug = new Map(categorias.map((c) => [c.slug, c.id]));
  let tiposCambiados = 0;
  for (const [tipoId, listas] of plantillasDeTipo) {
    const tipo = await payload.findByID({
      collection: "tipos-equipo",
      id: tipoId,
      depth: 0,
      overrideAccess: true,
    });
    const { slugs, mezcla } = categoriasDePlantillas(listas);
    if (mezcla)
      log(`${tipo.slug}: sus modelos usan plantillas distintas (${mezcla}); va la más usada`);
    const ids = slugs.flatMap((s) => {
      const id = idPorSlug.get(s);
      return id === undefined ? [] : [id];
    });
    const actuales = (tipo.categoriasModelo ?? []).map(idDe).filter((x): x is number => x !== null);
    if (ids.length === 0 || actuales.length > 0) continue;
    tiposCambiados++;
    if (!manifiesto.tipos.some((t) => t.id === tipoId)) {
      manifiesto.tipos.push({ id: tipoId, antes: actuales });
      guardar();
    }
    if (modo === "importar") {
      await payload.update({
        collection: "tipos-equipo",
        id: tipoId,
        data: { categoriasModelo: ids },
        overrideAccess: true,
      });
    }
  }
  log(`tipos con sus categorías elegidas: ${tiposCambiados} (de ${plantillasDeTipo.size})`);

  // Foto de la tarjeta de ayuda.
  const global = await payload.findGlobal({
    slug: "repuestos-marca",
    depth: 0,
    overrideAccess: true,
  });
  if (idDe(global.modeloAyudaFoto) !== null) {
    log("tarjeta de ayuda: ya tiene foto, no se toca");
  } else if (!fs.existsSync(FOTO)) {
    log(`tarjeta de ayuda: no está la foto (${FOTO}); se queda sin foto`);
  } else {
    const [ya] = (
      await payload.find({
        collection: "media",
        where: { alt: { equals: ALT_FOTO_AYUDA } },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
    ).docs;
    if (modo === "importar") {
      const media =
        ya ??
        (await payload.create({
          collection: "media",
          data: { alt: ALT_FOTO_AYUDA, focalX: 50, focalY: 50 },
          filePath: FOTO,
          overrideAccess: true,
        }));
      manifiesto.global = { fotoAntes: null, mediaCreada: ya ? null : media.id };
      guardar();
      await payload.updateGlobal({
        slug: "repuestos-marca",
        data: { modeloAyudaFoto: media.id },
        overrideAccess: true,
      });
      log(`tarjeta de ayuda: foto ${ya ? "ya subida" : "subida"} y elegida (media ${media.id})`);
    } else {
      log(
        `tarjeta de ayuda: se ${ya ? "elegiría la foto ya subida" : "subiría y elegiría la foto"}`,
      );
    }
  }

  log(
    modo === "simular"
      ? "SIMULACIÓN: no se ha escrito nada."
      : "IMPORTADO. Revalidar (o redesplegar) para que el sitio lo muestre.",
  );
}
