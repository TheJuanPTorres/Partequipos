/**
 * Importación del catálogo de REPUESTOS de WordPress (marcas, tipos y modelos)
 * a `marcas`, `tipos-equipo` y `modelos-repuesto`, con la foto de cada modelo
 * en `Media`. Detalle y decisiones: `docs/repuestos-importacion.md`.
 *
 *   npm run preview:repuestos:simular           # sin escribir en la base ni en el Blob
 *   npm run preview:repuestos:simular -- fotos  # además, comprueba las fotos en WordPress
 *                                               # y convierte las AVIF en memoria
 *
 * SOLO SIMULACIÓN (dirección, 2026-10-13): los almacenes del Blob están
 * bloqueados por el límite de operaciones del plan Hobby. Este script no
 * escribe en la base ni en el Blob: lee la base del preview para saber qué
 * crearía y qué actualizaría, y cuenta las subidas que supondría. La
 * importación real se añade cuando dirección confirme el plan Pro y el
 * almacén desbloqueado.
 *
 * Doble cierre en la simulación: tras validar el destino se vacía el token del
 * Blob (la guarda `almacenEsperado` de `Media` rechazaría cualquier subida) y
 * `create`, `update` y `delete` de Payload lanzan un error.
 *
 * FUENTE: el JSON que saca `scripts/repuestos/extraer-xml.py` de la
 * exportación XML, FUERA del repositorio
 * (`Desktop/partequipos-cierre/repuestos-wordpress.json`, o `fuente=<ruta>`).
 * El informe de la simulación se guarda junto a ella
 * (`simulacion-repuestos.json`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import {
  altDeRepuesto,
  codigoDeModelo,
  descripcionSeo,
  esBorradorCopia,
  fotoDeRepuesto,
  fotosGenericas,
  nivelDePagina,
  nombreDeModelo,
  nombreDeTipo,
  pareceDatoDeContacto,
  textoDePagina,
  tituloPorDefectoModelo,
  tituloSeo,
  type FotoPlan,
} from "../../src/lib/repuestos/wordpress";
import { tituloPorDefecto } from "../../src/lib/seo/porDefecto";
import { leerCsv } from "../../src/lib/utils/csv";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "importar" || a === "retirar");
const destino = args.find((a) => a === "preview");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[repuestos] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (modo !== "simular") {
  fallar(
    "solo existe el modo «simular»: el Blob está bloqueado por el límite del plan y la importación real espera la confirmación de dirección",
  );
}
if (!destino) fallar("indica el destino: preview");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
// Simulación: sin token, nada puede llegar al Blob.
process.env.BLOB_READ_WRITE_TOKEN = "";

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "repuestos-wordpress.json");
const INFORME = path.join(path.dirname(FUENTE), "simulacion-repuestos.json");
const COMPROBAR_FOTOS = args.includes("fotos");
/** Marcas sin modelos que van por 301 al índice de marcas (dirección, 2026-10-13; pendiente del cliente). */
const MARCAS_A_REDIRIGIR = [
  "repuestos-para-maquinaria-pesada-ammann",
  "pes-parts-equipment-solutions",
];
const INDICE_MARCAS = "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
for (const op of ["create", "update", "delete", "updateGlobal"] as const) {
  (payload as unknown as Record<string, unknown>)[op] = () =>
    fallar(`simulación: «${op}» no está permitido`);
}

const log = (m: string) => process.stdout.write(`[repuestos] ${m}\n`);

// ---------- Fuentes ----------

type FotoWp = { idWp: number; url: string | null; alt: string };
type PaginaWp = {
  idWp: number;
  ruta: string;
  titulo: string;
  segmentos: string[] | null;
  titulos: string[];
  texto: string;
  fotos: FotoWp[];
};
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE} (ver extraer-xml.py)`);
const { paginas } = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as { paginas: PaginaWp[] };

// El <title> y la meta descripción que hoy publica WordPress (rastreo, CLAUDE.md §10.1).
const vivo = new Map(
  leerCsv(fs.readFileSync("docs/url-map.csv", "utf8")).map((f) => [
    (f.url ?? "").replace(/^https?:\/\/[^/]+/, ""),
    { titulo: f.title ?? "", descripcion: f.meta_description ?? "" },
  ]),
);
// Nombre de cada marca como lo escribe el inventario («Case Construction», no «CASE CONSTRUCTION»).
const nombreMarca = new Map(
  leerCsv(fs.readFileSync("docs/inventario-repuestos.csv", "utf8")).map((f) => [
    f.marca_slug ?? "",
    f.marca ?? "",
  ]),
);

// ---------- Plan (sin red ni escrituras) ----------

const avisos: string[] = [];
const conNivel = paginas.map((p) => ({ ...p, nivel: nivelDePagina(p.segmentos) }));
const modelosWp = conNivel.filter((p) => p.nivel === "modelo");
const genericas = fotosGenericas(modelosWp);

type PlanMarca = { slug: string; nombre: string; descripcion: string | null; fotosWp: number };
type PlanTipo = {
  marca: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  seo: { metaTitle: string | null; metaDescription: string | null };
};
type PlanFoto = FotoPlan & { idWp: number; url: string; alt: string };
type PlanModelo = {
  marca: string;
  tipo: string;
  slug: string;
  nombre: string;
  codigo: string | null;
  origenCodigo: string;
  descripcion: string | null;
  seo: { metaTitle: string | null; metaDescription: string | null };
  foto: PlanFoto | null;
  motivoSinFoto: string | null;
};

const marcas: PlanMarca[] = [];
const redirecciones: { origen: string; destino: string }[] = [];
for (const p of conNivel.filter((x) => x.nivel === "marca")) {
  const slug = p.segmentos?.[0] ?? "";
  if (MARCAS_A_REDIRIGIR.includes(slug)) continue;
  const nombre = nombreMarca.get(slug);
  if (!nombre) {
    avisos.push(`marca ${slug}: no está en el inventario; se omite`);
    continue;
  }
  marcas.push({ slug, nombre, descripcion: textoDePagina(p.texto), fotosWp: p.fotos.length });
}
// Todo lo que cuelga de una marca redirigida (su página, sus tipos) va al índice de marcas.
for (const p of conNivel) {
  if (MARCAS_A_REDIRIGIR.includes(p.segmentos?.[0] ?? ""))
    redirecciones.push({ origen: p.ruta, destino: INDICE_MARCAS });
}
const marcaPorSlug = new Map(marcas.map((m) => [m.slug, m]));

const tipos: PlanTipo[] = [];
for (const p of conNivel.filter((x) => x.nivel === "tipo")) {
  const [mSlug = "", slug = ""] = p.segmentos ?? [];
  const marca = marcaPorSlug.get(mSlug);
  if (!marca) continue; // de una marca redirigida
  const nombre = nombreDeTipo(p.titulo, marca.nombre);
  if (!nombre) {
    avisos.push(`tipo ${slug}: sin nombre en el título; se omite`);
    continue;
  }
  const viva = vivo.get(p.ruta);
  tipos.push({
    marca: mSlug,
    slug,
    nombre,
    descripcion: textoDePagina(p.texto),
    seo: {
      metaTitle: tituloSeo(viva?.titulo, tituloPorDefecto.tipoRepuesto(nombre, marca.nombre)),
      metaDescription: descripcionSeo(viva?.descripcion),
    },
  });
}
const tipoPorClave = new Map(tipos.map((t) => [`${t.marca}/${t.slug}`, t]));

const modelos: PlanModelo[] = [];
const borradores: string[] = [];
for (const p of modelosWp) {
  const [mSlug = "", tSlug = "", slug = ""] = p.segmentos ?? [];
  if (esBorradorCopia(slug)) {
    borradores.push(p.ruta);
    continue;
  }
  const marca = marcaPorSlug.get(mSlug);
  if (!marca || !tipoPorClave.has(`${mSlug}/${tSlug}`)) {
    avisos.push(`modelo ${slug}: su marca o su tipo no se importan; se omite`);
    continue;
  }
  const nombre = nombreDeModelo(p.titulo);
  if (/^repuestos\s+para\s+maquinaria\s+pesada/i.test(p.titulo))
    avisos.push(
      `modelo ${slug}: es una página de TIPO colocada como modelo (anomalía de la URL, ADR 0004); va como modelo «${nombre}» para conservar la URL`,
    );
  const codigo = codigoDeModelo(nombre, marca.nombre, slug);
  if (codigo.origen !== "titulo")
    avisos.push(`modelo ${slug}: código ${codigo.valor ?? "—"} (de ${codigo.origen})`);
  const descripcion = textoDePagina(p.texto);
  if (descripcion && pareceDatoDeContacto(descripcion))
    avisos.push(`modelo ${slug}: el texto parece llevar un dato de contacto; revisar`);
  // La foto del equipo: la primera de la sección principal que no sea genérica.
  const propia = p.fotos.find((f) => !genericas.has(f.idWp) && f.url);
  let foto: PlanFoto | null = null;
  let motivoSinFoto: string | null = null;
  if (!p.fotos.length) motivoSinFoto = "la página no tiene foto";
  else if (!propia) motivoSinFoto = "solo la imagen genérica de relleno";
  else {
    const plan = fotoDeRepuesto(propia.url!, propia.idWp, nombre);
    if (!plan) motivoSinFoto = `formato que Media no admite (${propia.url!.split(".").pop()})`;
    else {
      const ficheroWp = propia.url!.split("/").pop();
      foto = {
        ...plan,
        idWp: propia.idWp,
        url: propia.url!,
        alt: altDeRepuesto(propia.alt, nombre, ficheroWp),
      };
    }
  }
  const viva = vivo.get(p.ruta);
  if (!viva) avisos.push(`modelo ${slug}: su ruta no está en url-map.csv`);
  modelos.push({
    marca: mSlug,
    tipo: tSlug,
    slug,
    nombre,
    codigo: codigo.valor,
    origenCodigo: codigo.origen,
    descripcion,
    seo: {
      metaTitle: tituloSeo(viva?.titulo, tituloPorDefectoModelo(nombre)),
      metaDescription: descripcionSeo(viva?.descripcion),
    },
    foto,
    motivoSinFoto,
  });
}
const sinRuta = conNivel.filter((p) => p.nivel === "sinRuta").map((p) => p.ruta);

// ---------- Lo que ya hay en el preview (solo lectura) ----------

const todo = async <T>(collection: "marcas" | "tipos-equipo" | "modelos-repuesto" | "media") =>
  (await payload.find({ collection, depth: 0, pagination: false, overrideAccess: true }))
    .docs as unknown as T[];
const enMarcas = await todo<{ id: number; slug: string; logo?: number | null }>("marcas");
const enTipos = await todo<{ id: number; slug: string; marca: number }>("tipos-equipo");
const enModelos = await todo<{
  id: number;
  slug: string;
  tipo: number;
  imagenes?: number[] | null;
}>("modelos-repuesto");
const enMedia = await todo<{ id: number; filename?: string | null }>("media");

const idMarca = new Map(enMarcas.map((m) => [m.slug, m.id]));
const claveTipo = new Map(enTipos.map((t) => [`${t.marca}/${t.slug}`, t.id]));
const claveModelo = new Set(enModelos.map((m) => `${m.tipo}/${m.slug}`));
const yaSubidas = new Set(
  enMedia
    .map((m) => m.filename?.match(/^wp-repuesto-(\d+)-/)?.[1])
    .filter(Boolean)
    .map(Number),
);

const marcasNuevas = marcas.filter((m) => !idMarca.has(m.slug));
const tiposNuevos = tipos.filter((t) => {
  const id = idMarca.get(t.marca);
  return !id || !claveTipo.has(`${id}/${t.slug}`);
});
const modelosNuevos = modelos.filter((m) => {
  const idM = idMarca.get(m.marca);
  const idT = idM ? claveTipo.get(`${idM}/${m.tipo}`) : undefined;
  return !idT || !claveModelo.has(`${idT}/${m.slug}`);
});
// Lo que hay en el preview y no está en WordPress (la demo de §10.6): la importación no lo toca.
const slugsWp = {
  marcas: new Set(marcas.map((m) => m.slug)),
  modelos: new Set(modelos.map((m) => m.slug)),
};
const demoMarcas = enMarcas.filter((m) => !slugsWp.marcas.has(m.slug)).map((m) => m.slug);
const demoModelos = enModelos.filter((m) => !slugsWp.modelos.has(m.slug)).length;

// ---------- Subidas al Blob que supondría ----------

// Una foto compartida por dos modelos se sube una vez (nombre por id de adjunto).
const fotosUnicas = new Map<number, PlanFoto>();
for (const m of modelos) if (m.foto) fotosUnicas.set(m.foto.idWp, m.foto);
const aSubir = [...fotosUnicas.values()].filter((f) => !yaSubidas.has(f.idWp));
const porFormato = (fs_: PlanFoto[]) =>
  fs_.reduce<Record<string, number>>(
    (a, f) => ({ ...a, [f.formatoWp]: (a[f.formatoWp] ?? 0) + 1 }),
    {},
  );

// ---------- Fotos en WordPress (opcional: red, sin escribir nada) ----------

type Comprobacion = { fallos: { idWp: number; error: string }[]; avif: Record<string, unknown>[] };
const comprobacion: Comprobacion = { fallos: [], avif: [] };
if (COMPROBAR_FOTOS) {
  const { default: sharp } = await import("sharp");
  const AGENTE = "Partequipos-migracion/1.0 (simulación de repuestos; solo lectura)";
  let ultima = 0;
  const turno = async () => {
    const espera = ultima + 700 - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultima = Date.now();
  };
  for (const f of aSubir) {
    await turno();
    try {
      if (!f.convertir) {
        const r = await fetch(f.url, { method: "HEAD", headers: { "User-Agent": AGENTE } });
        if (!r.ok) comprobacion.fallos.push({ idWp: f.idWp, error: `HTTP ${r.status}` });
        continue;
      }
      // AVIF: se descarga y se convierte EN MEMORIA, como lo haría la importación (no se guarda nada).
      const r = await fetch(f.url, { headers: { "User-Agent": AGENTE } });
      if (!r.ok) {
        comprobacion.fallos.push({ idWp: f.idWp, error: `HTTP ${r.status}` });
        continue;
      }
      const origen = Buffer.from(await r.arrayBuffer());
      const webp = await sharp(origen).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
      comprobacion.avif.push({
        idWp: f.idWp,
        fichero: f.fichero,
        kBAvif: Math.round(origen.length / 1024),
        kBWebp: Math.round(webp.data.length / 1024),
        medidas: `${webp.info.width}×${webp.info.height}`,
      });
    } catch (e) {
      comprobacion.fallos.push({ idWp: f.idWp, error: (e as Error).message });
    }
  }
}

// ---------- Informe ----------

const cuenta = <T>(xs: T[], f: (x: T) => string) =>
  xs.reduce<Record<string, number>>((a, x) => ({ ...a, [f(x)]: (a[f(x)] ?? 0) + 1 }), {});
const resumen = {
  fuente: path.basename(FUENTE),
  marcas: {
    total: marcas.length,
    nuevas: marcasNuevas.length,
    actualizadas: marcas.length - marcasNuevas.length,
  },
  tipos: {
    total: tipos.length,
    nuevos: tiposNuevos.length,
    actualizados: tipos.length - tiposNuevos.length,
    conTituloSeoPropio: tipos.filter((t) => t.seo.metaTitle).length,
  },
  modelos: {
    total: modelos.length,
    nuevos: modelosNuevos.length,
    actualizados: modelos.length - modelosNuevos.length,
    conFoto: modelos.filter((m) => m.foto).length,
    sinFoto: cuenta(
      modelos.filter((m) => !m.foto),
      (m) => m.motivoSinFoto ?? "",
    ),
    conTexto: modelos.filter((m) => m.descripcion).length,
    codigo: cuenta(modelos, (m) => m.origenCodigo),
    conTituloSeoPropio: modelos.filter((m) => m.seo.metaTitle).length,
    conDescripcionSeo: modelos.filter((m) => m.seo.metaDescription).length,
  },
  noSeImportan: {
    borradoresCopia: borradores.length,
    sinRutaEnElSitioNuevo: sinRuta.length,
    redirecciones301: redirecciones.length,
    fotosGenericas: [...genericas],
  },
  enElPreviewSinEquivalente: { marcas: demoMarcas, modelos: demoModelos },
  blob: {
    subidas: aSubir.length,
    porFormatoDeOrigen: porFormato(aSubir),
    aConvertirAWebp: aSubir.filter((f) => f.convertir).length,
    yaSubidas: fotosUnicas.size - aSubir.length,
    otrasOperaciones: 0,
  },
  comprobacionFotos: COMPROBAR_FOTOS
    ? { comprobadas: aSubir.length, fallos: comprobacion.fallos.length }
    : "sin comprobar (añade «fotos»)",
};
fs.writeFileSync(
  INFORME,
  JSON.stringify(
    { resumen, avisos, redirecciones, sinRuta, borradores, comprobacion, marcas, tipos, modelos },
    null,
    1,
  ),
);

log(`fuente: ${resumen.fuente} · ${paginas.length} páginas`);
log(`marcas: ${JSON.stringify(resumen.marcas)}`);
log(`tipos: ${JSON.stringify(resumen.tipos)}`);
log(`modelos: ${JSON.stringify(resumen.modelos)}`);
log(`no se importan: ${JSON.stringify({ ...resumen.noSeImportan })}`);
log(
  `en el preview sin equivalente en WordPress: ${JSON.stringify(resumen.enElPreviewSinEquivalente)}`,
);
log(`BLOB: ${JSON.stringify(resumen.blob)}`);
log(`fotos: ${JSON.stringify(resumen.comprobacionFotos)}`);
for (const f of comprobacion.fallos) log(`foto ${f.idWp}: ${f.error}`);
log(`avisos: ${avisos.length} (en el informe)`);
for (const m of modelos.slice(0, 3)) {
  log(`ejemplo: «${m.nombre}» · código ${m.codigo ?? "—"} · ${m.foto?.fichero ?? m.motivoSinFoto}`);
}
log(`informe: ${INFORME}`);
log("simulación terminada: no se ha escrito nada en la base ni en el Blob");
process.exit(0);
