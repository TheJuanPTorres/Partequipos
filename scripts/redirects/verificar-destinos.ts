/**
 * Verifica que el destino de cada redirect lleve a algún sitio.
 *
 * Uso:   npm run redirects:check           (informa siempre; sale 0)
 *        npm run redirects:check:estricto  (sale 1 si algún destino no tiene ruta)
 *
 * El modo estricto se activa por VARIABLE DE ENTORNO, no por argumento:
 * `payload run` se traga los argumentos extra (comprobado: `process.argv` llega
 * vacío), así que un `-- --estricto` se perdería en silencio y el script
 * parecería pasar cuando en realidad no se activó nada.
 *
 * POR QUÉ ES UN SCRIPT Y NO UNA VALIDACIÓN AL GUARDAR
 *
 * Durante la migración es LEGÍTIMO crear un redirect hacia contenido que aún no
 * se ha cargado: preparar el mapa por adelantado es justo lo que hay que hacer.
 * Un hook bloqueante lo impediría y empujaría a la gente a saltárselo.
 *
 * Además, resolver un destino exige consultar la base —hasta tres colecciones
 * para validar la cadena marca/tipo/modelo—, y cargar eso en cada guardado del
 * panel penaliza una operación que hoy es instantánea.
 *
 * Así que: advertencia visible, no bloqueo. El script escribe el veredicto en
 * `estadoDestino`, que se ve en el listado del panel, y `--estricto` permite
 * convertirlo en bloqueante donde interese (por ejemplo antes de publicar).
 *
 * TRES VEREDICTOS, y solo uno es un error:
 *   resuelve       la ruta existe y su documento también
 *   sin-contenido  la ruta es válida pero el documento no está todavía  -> AVISO
 *   sin-ruta       no corresponde a NINGUNA ruta del sitio              -> ERROR
 *
 * LIMITACIÓN CONOCIDA. Un destino de un solo nivel (`/lo-que-sea/`) nunca puede
 * dar `sin-ruta`: en la raíz conviven páginas institucionales y artículos, y sus
 * slugs son arbitrarios, así que es indistinguible de una página todavía sin
 * cargar. Esos casos salen como AVISO, no como error. En las secciones con
 * estructura conocida (repuestos, maquinaria, lubricantes, blog) sí se detecta
 * la ruta imposible.
 */
process.env.PAYLOAD_DISABLE_PUSH = "true";

const { default: config } = await import("../../src/payload.config");

import { getPayload } from "payload";
import type { CollectionSlug, Where } from "payload";

import { clasificarDestino } from "../../src/lib/redirects/destino";

const ESTRICTO = process.env.REDIRECTS_ESTRICTO === "true";

const payload = await getPayload({ config });

/** ¿Existe un documento con ese slug en la colección? */
async function existe(collection: CollectionSlug, where: Where): Promise<boolean> {
  const { totalDocs } = await payload.count({ collection, where });
  return totalDocs > 0;
}

/*
 * Para las rutas anidadas no basta con que exista el documento hoja: la URL
 * `/…/marca-a/tipo-de-otra-marca/modelo/` tiene los tres documentos y aun así
 * da 404, porque el resolvedor valida la cadena. Se comprueba igual aquí.
 */
async function cadenaCoherente(colecciones: string[], slug: string, padres: string[]) {
  const [coleccion] = colecciones;

  // Casos de un solo nivel: basta el slug.
  if (padres.length === 0) {
    for (const c of colecciones) {
      if (await existe(c as CollectionSlug, { slug: { equals: slug } })) return true;
    }
    return false;
  }

  // Repuestos y maquinaria comparten la forma marca -> tipo -> hoja.
  const esRepuestos = coleccion === "tipos-equipo" || coleccion === "modelos-repuesto";
  const marcaCol = (esRepuestos ? "marcas" : "marcas-maquinaria") as CollectionSlug;
  const tipoCol = (esRepuestos ? "tipos-equipo" : "tipos-maquinaria") as CollectionSlug;

  if (coleccion === "categorias-lubricante") {
    const { docs } = await payload.find({
      collection: "marcas-lubricante",
      where: { slug: { equals: padres[0] } },
      limit: 1,
      depth: 0,
    });
    const marca = docs[0];
    if (!marca) return false;
    return existe("categorias-lubricante", {
      and: [{ marca: { equals: marca.id } }, { slug: { equals: slug } }],
    });
  }

  const { docs: marcas } = await payload.find({
    collection: marcaCol,
    where: { slug: { equals: padres[0] } },
    limit: 1,
    depth: 0,
  });
  const marca = marcas[0];
  if (!marca) return false;

  if (padres.length === 1) {
    return existe(tipoCol, {
      and: [{ marca: { equals: marca.id } }, { slug: { equals: slug } }],
    });
  }

  const { docs: tipos } = await payload.find({
    collection: tipoCol,
    where: { and: [{ marca: { equals: marca.id } }, { slug: { equals: padres[1] } }] },
    limit: 1,
    depth: 0,
  });
  const tipo = tipos[0];
  if (!tipo) return false;

  return existe(coleccion as CollectionSlug, {
    and: [{ tipo: { equals: tipo.id } }, { slug: { equals: slug } }],
  });
}

type Veredicto = "resuelve" | "sin-contenido" | "sin-ruta" | "externa";

async function verificar(hacia: string): Promise<Veredicto> {
  const d = clasificarDestino(hacia);
  if (d.clase === "externa") return "externa";
  if (d.clase === "sin-ruta") return "sin-ruta";
  if (d.clase === "estatica") return "resuelve";
  return (await cadenaCoherente(d.colecciones, d.slug, d.padres)) ? "resuelve" : "sin-contenido";
}

const { docs } = await payload.find({ collection: "redirects", limit: 0, depth: 0 });

const conteo: Record<Veredicto, number> = {
  resuelve: 0,
  "sin-contenido": 0,
  "sin-ruta": 0,
  externa: 0,
};
const avisos: string[] = [];
const errores: string[] = [];

for (const r of docs) {
  const veredicto = await verificar(r.hacia);
  conteo[veredicto]++;

  if (veredicto === "sin-contenido") avisos.push(`${r.desde}  ->  ${r.hacia}`);
  if (veredicto === "sin-ruta") errores.push(`${r.desde}  ->  ${r.hacia}`);

  await payload.update({
    collection: "redirects",
    id: r.id,
    data: { estadoDestino: veredicto, destinoVerificadoEn: new Date().toISOString() },
  });
}

console.log("\n===== DESTINOS DE REDIRECT =====");
console.log(`Total                 : ${docs.length}`);
console.log(`✓ Resuelven           : ${conteo.resuelve}`);
console.log(`⚠ Sin contenido aún   : ${conteo["sin-contenido"]}`);
console.log(`✗ Sin ruta            : ${conteo["sin-ruta"]}`);
console.log(`  Externas            : ${conteo.externa}`);

if (avisos.length > 0) {
  console.log("\n--- AVISO: la ruta es válida pero el documento no está cargado ---");
  console.log("    (normal durante la migración; deja de serlo el día del lanzamiento)");
  avisos.forEach((a) => console.log(`  ⚠ ${a}`));
}

if (errores.length > 0) {
  console.log("\n--- ERROR: el destino no corresponde a NINGUNA ruta del sitio ---");
  console.log("    Un 301 hacia un 404 es peor que el 404: corrígelos antes de publicar.");
  errores.forEach((e) => console.error(`  ✗ ${e}`));
}

console.log("================================\n");

/*
 * Sale 0 por defecto AUNQUE haya destinos rotos: este script informa, no manda.
 *
 * El modo estricto corta SOLO con `sin-ruta`, nunca con avisos: un redirect
 * hacia contenido todavía sin cargar es legítimo mientras dura la migración, y
 * hacerlo bloqueante empujaría a saltarse la comprobación entera. Lo que no es
 * legítimo nunca es apuntar a una ruta que el sitio no puede servir.
 */
if (ESTRICTO && errores.length > 0) {
  console.error(`Modo estricto: ${errores.length} destino(s) sin ruta. Saliendo con código 1.`);
  process.exit(1);
}
process.exit(0);
