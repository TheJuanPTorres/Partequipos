/**
 * Importación del catálogo de REPUESTOS de WordPress (marcas, tipos y modelos)
 * a `marcas`, `tipos-equipo` y `modelos-repuesto`, como DATOS, con el logo de
 * cada marca en `Media`. Mismo método que los usados: simulación,
 * idempotencia, manifiesto y retirada exacta. Detalle y decisiones:
 * `docs/repuestos-importacion.md`.
 *
 *   npm run preview:repuestos:simular           # sin escribir en la base ni en el Blob
 *   npm run preview:repuestos:simular -- fotos  # además, comprueba en WordPress las fotos
 *                                               # de los modelos y convierte las AVIF en memoria
 *   npm run preview:repuestos:importar          # escribe en el preview
 *   npm run preview:repuestos:retirar           # deshace lo del manifiesto
 *
 * IMAGEN DE CADA TIPO Y FONDO DE LAS MARCAS (2026-10-14): cada tipo lleva la
 * foto real de su tarjeta en WordPress (`wp-tipo-<adjunto>-…`; AVIF a WebP por
 * el formato real del fichero). Solo se pone si el campo está vacío, es de
 * EJEMPLO de ux-9 o ya es suya: lo que eligió un editor no se pisa. El fondo
 * del encabezado de las marcas no existe en WordPress (solo una foto oculta en
 * los tres tamaños): el de EJEMPLO de ux-9 se quita. Lo de antes de cada campo
 * queda en el manifiesto (`imagenes`) y la retirada lo devuelve.
 *
 * TARJETAS «MAQUINARIA PESADA USADA» Y «ADITAMENTOS» (global `repuestos-marca`,
 * dirección, 2026-10-14): una foto real en lugar de la de ejemplo de ux-9
 * (`IMAGENES_TARJETAS`), con la misma regla: no se pisa la de un editor.
 *
 * FOTOS DE LOS MODELOS (decisión del cliente, 2026-10-17: se migra todo): la
 * foto propia de cada modelo en WordPress (la primera que no es la genérica de
 * relleno) va a su campo «Imágenes» (`wp-repuesto-<adjunto>-…`; una foto
 * compartida se sube una vez; AVIF a WebP por el formato real). Con la misma
 * regla que los tipos: solo si el campo está vacío o ya es suyo; lo de un
 * editor no se pisa. El valor de antes queda en `imagenes` del manifiesto.
 * Del 2026-10-13 al 2026-10-17 no se importaban (dirección).
 *
 * ANTES DE IMPORTAR se retiran de la demo del preview los tipos y modelos que
 * no existen en WordPress (2 tipos y 25 modelos, dirección, 2026-10-13): 21
 * de esos modelos tienen el slug de un modelo real y quedarían duplicados bajo
 * el tipo equivocado. Sus datos quedan en el manifiesto; la retirada de la
 * importación NO los vuelve a crear.
 *
 * Doble cierre en la simulación: tras validar el destino se vacía el token del
 * Blob (la guarda `almacenEsperado` de `Media` rechazaría cualquier subida) y
 * `create`, `update` y `delete` de Payload lanzan un error.
 *
 * FUENTE: el JSON que saca `scripts/repuestos/extraer-xml.py` de la
 * exportación XML, FUERA del repositorio
 * (`Desktop/partequipos-cierre/repuestos-wordpress.json`, o `fuente=<ruta>`).
 * El informe y el manifiesto se guardan en `Desktop/partequipos-cierre/`.
 *
 * DESTINO: `preview` o `produccion`, validado antes de cargar Payload: el
 * preview con sus guardas (`puedeTocarHeroDePrueba`); producción, solo con la
 * base Y el almacén de producción (`veredictoDestino`). La carga en producción
 * la ejecuta dirección con su runbook
 * (`Desktop/partequipos-cierre/runbook-importar-repuestos-produccion.md`).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { normalizarRuta } from "../../src/lib/redirects/normalizar";
import { formatSlug } from "../../src/lib/utils/formatSlug";
import {
  altDeRepuesto,
  altDeTipo,
  codigoDeModelo,
  descripcionSeo,
  esBorradorCopia,
  fotoDeRepuesto,
  ficheroDeLogo,
  ficheroDeTarjeta,
  ficheroDeTipo,
  formatoDeImagen,
  fotosGenericas,
  IMAGENES_TARJETAS,
  LOGOS_DE_MARCA,
  nivelDePagina,
  nombreDeModelo,
  nombreDeTipo,
  pareceDatoDeContacto,
  PREFIJO_EJEMPLO_MARCA,
  PREFIJO_IMAGEN_TARJETA,
  PREFIJO_IMAGEN_TIPO,
  puedeSustituirImagen,
  rutaMadre,
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
const destino = args.find((a) => a === "preview" || a === "produccion");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[repuestos] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, importar o retirar");
if (!destino) fallar("indica el destino: preview o produccion");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  // Producción: base Y almacén de producción, o no se hace nada (mismo guardián que usados y blog).
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}
if (modo === "simular") {
  // Simulación: sin token, nada puede llegar al Blob.
  process.env.BLOB_READ_WRITE_TOKEN = "";
} else {
  exigirAlmacen("[repuestos]");
}

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE = valorDe("fuente") ?? path.join(CIERRE, "repuestos-wordpress.json");
const INFORME = path.join(CIERRE, `${modo}-repuestos-${destino}.json`);
const MANIFIESTO =
  valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-repuestos-${destino}.json`);
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
if (modo === "simular") {
  for (const op of ["create", "update", "delete", "updateGlobal"] as const) {
    (payload as unknown as Record<string, unknown>)[op] = () =>
      fallar(`simulación: «${op}» no está permitido`);
  }
}

const log = (m: string) => process.stdout.write(`[repuestos] ${m}\n`);

// ---------- Manifiesto ----------

type Coleccion = "marcas" | "tipos-equipo" | "modelos-repuesto";
type Fichero = { id: number; filename: string; url: string };
type Manifiesto = {
  destino: string;
  creado: {
    marcas: { clave: string; id: number }[];
    tipos: { clave: string; id: number }[];
    modelos: { clave: string; id: number }[];
    redirects: { desde: string; id: number }[];
    media: Fichero[];
  };
  /** Lo que ya existía y la importación cambió: sus valores ANTES, para devolverlos al retirar. */
  actualizado: { coleccion: Coleccion; id: number; antes: Record<string, unknown> }[];
  /** La demo retirada antes de importar (no vuelve al retirar la importación). */
  retiradoDeLaDemo: { coleccion: Coleccion; id: number; datos: Record<string, unknown> }[];
  /**
   * Imágenes que cambió la importación (imagen del tipo, fondo de la marca): el
   * valor ANTES de la primera vez, para devolverlo al retirar. Opcional: los
   * manifiestos anteriores al 2026-10-14 no lo tienen.
   */
  imagenes?: CambioImagen[];
};
type CambioImagen =
  | {
      coleccion: "marcas" | "tipos-equipo";
      id: number;
      campo: "fondoHero" | "imagen";
      antes: number | null;
    }
  | {
      /** La galería de un modelo que ya existía (2026-10-17). */
      coleccion: "modelos-repuesto";
      id: number;
      campo: "imagenes";
      antes: number[] | null;
    }
  | {
      /** El global: `id` es siempre 0. */
      coleccion: "repuestos-marca";
      id: 0;
      campo: "tarjetaUsadas" | "tarjetaAditamentos";
      antes: number | null;
    };
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : {
      destino: destino!,
      creado: { marcas: [], tipos: [], modelos: [], redirects: [], media: [] },
      actualizado: [],
      retiradoDeLaDemo: [],
    };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
function guardarManifiesto() {
  if (modo !== "importar") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
}

// ---------- Retirada ----------

/**
 * Deshace EXACTAMENTE lo que apunta el manifiesto: borra lo que creó la
 * importación y devuelve lo que actualizó a sus valores de antes. Comprueba
 * que los logos salen del Blob. La demo retirada antes de importar no se
 * vuelve a crear.
 */
async function retirar(): Promise<void> {
  if (!fs.existsSync(MANIFIESTO)) fallar(`no hay manifiesto (${MANIFIESTO}): nada que retirar`);
  const borrar = async (collection: Coleccion | "redirects" | "media", ids: number[]) => {
    let n = 0;
    for (const id of ids) {
      const hecho = await payload
        .delete({ collection, id, overrideAccess: true })
        .catch(() => null);
      if (hecho) n++;
    }
    log(`${collection}: creados y borrados ${n} de ${ids.length}`);
  };
  await borrar(
    "modelos-repuesto",
    manifiesto.creado.modelos.map((x) => x.id),
  );
  // Lo actualizado vuelve a su estado ANTES de borrar los tipos y las marcas
  // creados: un registro actualizado puede apuntar a uno de ellos.
  let devueltos = 0;
  for (const a of manifiesto.actualizado) {
    const hecho = await payload
      .update({ collection: a.coleccion, id: a.id, data: a.antes as never, overrideAccess: true })
      .catch((e: Error) => log(`no se pudo devolver ${a.coleccion} ${a.id}: ${e.message}`));
    if (hecho) devueltos++;
  }
  log(`actualizados devueltos a como estaban: ${devueltos} de ${manifiesto.actualizado.length}`);
  // Las imágenes cambiadas, a su valor de antes, ANTES de borrar las subidas.
  let imagenesDevueltas = 0;
  for (const c of manifiesto.imagenes ?? []) {
    const hecho = await (
      c.coleccion === "repuestos-marca"
        ? payload
            .findGlobal({ slug: "repuestos-marca", depth: 0, overrideAccess: true })
            .then((g) =>
              payload.updateGlobal({
                slug: "repuestos-marca",
                data: { [c.campo]: { ...g[c.campo], imagen: c.antes } } as never,
                overrideAccess: true,
              }),
            )
        : payload.update({
            collection: c.coleccion,
            id: c.id,
            data: { [c.campo]: c.antes } as never,
            overrideAccess: true,
          })
    ).catch((e: Error) =>
      log(`no se pudo devolver ${c.coleccion} ${c.id} ${c.campo}: ${e.message}`),
    );
    if (hecho) imagenesDevueltas++;
  }
  log(
    `imágenes devueltas a como estaban: ${imagenesDevueltas} de ${(manifiesto.imagenes ?? []).length}`,
  );
  await borrar(
    "tipos-equipo",
    manifiesto.creado.tipos.map((x) => x.id),
  );
  await borrar(
    "marcas",
    manifiesto.creado.marcas.map((x) => x.id),
  );
  await borrar(
    "redirects",
    manifiesto.creado.redirects.map((x) => x.id),
  );
  const urls = manifiesto.creado.media.map((m) => m.url).filter(Boolean);
  await borrar(
    "media",
    manifiesto.creado.media.map((m) => m.id),
  );
  fs.renameSync(MANIFIESTO, MANIFIESTO.replace(/\.json$/, `.retirado-${Date.now()}.json`));
  if (!urls.length) return;
  log("manifiesto retirado; espero 70 s (propagación del Blob)");
  await new Promise((r) => setTimeout(r, 70_000));
  let vivos = [...urls];
  for (let intento = 0; ; intento++) {
    const quedan: string[] = [];
    for (const u of vivos) if ((await fetch(u, { method: "HEAD" })).status !== 404) quedan.push(u);
    vivos = quedan;
    if (!vivos.length || intento === 3) break;
    log(`${vivos.length} ficheros aún responden; vuelvo a mirar en 30 s`);
    await new Promise((r) => setTimeout(r, 30_000));
  }
  if (vivos.length) fallar(`${vivos.length} ficheros siguen en el Blob: ${vivos.join(" ")}`);
  log(`✓ los ${urls.length} ficheros dan 404`);
}

if (modo === "retirar") {
  await retirar();
  process.exit(0);
}

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
  /** La foto de la primera tarjeta visible (no la de WhatsApp): en un tipo, la suya. */
  tarjeta?: FotoWp | null;
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

type PlanLogo = { idWp: number; url: string; fichero: string; alt: string };
type PlanMarca = { slug: string; nombre: string; descripcion: string | null; logo: PlanLogo };
type PlanImagen = { idWp: number; url: string; fichero: string; alt: string };
type PlanTipo = {
  marca: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  seo: { metaTitle: string | null; metaDescription: string | null };
  imagen: PlanImagen | null;
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
  const logo = LOGOS_DE_MARCA[slug] ?? fallar(`marca ${slug}: no tiene logo en LOGOS_DE_MARCA`);
  marcas.push({
    slug,
    nombre,
    descripcion: textoDePagina(p.texto),
    logo: {
      idWp: logo.idWp,
      url: `https://partequipos.com/wp-content/uploads/${logo.archivo}`,
      fichero: ficheroDeLogo(logo.idWp, nombre),
      alt: `Logo de ${nombre}`,
    },
  });
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
  if (p.tarjeta === undefined) {
    fallar(
      "la fuente no trae «tarjeta» (es anterior al 2026-10-14): vuelve a ejecutar extraer-xml.py",
    );
  }
  const t = p.tarjeta;
  if (!t?.url) avisos.push(`tipo ${slug}: sin foto de tarjeta en WordPress`);
  tipos.push({
    marca: mSlug,
    slug,
    nombre,
    descripcion: textoDePagina(p.texto),
    seo: {
      metaTitle: tituloSeo(viva?.titulo, tituloPorDefecto.tipoRepuesto(nombre, marca.nombre)),
      metaDescription: descripcionSeo(viva?.descripcion),
    },
    imagen: t?.url
      ? {
          idWp: t.idWp,
          url: t.url,
          fichero: ficheroDeTipo(t.idWp, nombre, marca.nombre),
          alt: altDeTipo(nombre, marca.nombre),
        }
      : null,
  });
}
const tipoPorClave = new Map(tipos.map((t) => [`${t.marca}/${t.slug}`, t]));

const modelos: PlanModelo[] = [];
const borradores: string[] = [];
/**
 * Slugs que el sitio no admite tal cual («…-d6k_»): el `_` no se permite en
 * los slugs (dirección, 2026-10-13). Se guardan como los deja `formatSlug`, con
 * un 301 desde la URL de WordPress; si con eso coinciden con otro modelo del
 * mismo tipo («…-dx340lca_» y «…-dx340lca», la misma página), no se crean: solo
 * el 301 a ese modelo.
 */
const slugsCambiados: { ruta: string; slug: string; duplicado: boolean }[] = [];
const slugsDelTipo = new Set(
  modelosWp.map((x) => (x.segmentos ?? []).join("/")).filter((k) => k.split("/").length === 3),
);
/*
 * TIPO ANIDADO (2026-10-17, dirección): la «Excavadora» de CASE, colgada en
 * WordPress de «Cargador frontal», es un TIPO con sus 4 modelos un nivel más
 * abajo (src/lib/repuestos/anidado.ts). Ni esa página va como modelo ni sus 4
 * modelos llevan 301: los pone `scripts/repuestos/tipo-anidado.ts`, que se
 * ejecuta DESPUÉS de esta importación (docs/repuestos-importacion.md §11).
 */
const rutasSinRuta = conNivel.filter((p) => p.nivel === "sinRuta").map((p) => p.ruta);
const madresDeAnidados = new Set(rutasSinRuta.map(rutaMadre));
for (const p of modelosWp) {
  const [mSlug = "", tSlug = "", slugWp = ""] = p.segmentos ?? [];
  if (madresDeAnidados.has(p.ruta)) {
    avisos.push(`${slugWp}: es un TIPO anidado; no va como modelo (lo pone tipo-anidado.ts)`);
    continue;
  }
  if (esBorradorCopia(slugWp)) {
    borradores.push(p.ruta);
    continue;
  }
  const slug = formatSlug(slugWp);
  if (slug !== slugWp) {
    const destino = `${rutaMadre(p.ruta)}${slug}/`;
    redirecciones.push({ origen: p.ruta, destino });
    const duplicado = slugsDelTipo.has(`${mSlug}/${tSlug}/${slug}`);
    slugsCambiados.push({ ruta: p.ruta, slug, duplicado });
    avisos.push(
      `modelo ${slugWp}: va como «${slug}» con 301 desde su URL${duplicado ? " (ya existe: solo el 301)" : ""}`,
    );
    if (duplicado) continue;
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
const sinRuta = rutasSinRuta;
// Las 4 de CASE con un nivel de más: hasta el 2026-10-17 iban por 301 a su página madre; ahora
// son los modelos del tipo anidado, con su URL (los pone tipo-anidado.ts). Sin 301.
for (const ruta of sinRuta)
  avisos.push(`${ruta}: modelo del tipo anidado (lo pone tipo-anidado.ts)`);

// ---------- Lo que ya hay en el preview (solo lectura) ----------

const todo = async <T>(collection: "marcas" | "tipos-equipo" | "modelos-repuesto" | "media") =>
  (await payload.find({ collection, depth: 0, pagination: false, overrideAccess: true }))
    .docs as unknown as T[];
type Seo = { metaTitle?: string | null; metaDescription?: string | null; ogImage?: unknown };
type DocMarca = {
  id: number;
  slug: string;
  nombre: string;
  descripcion?: string | null;
  logo?: number | null;
  fondoHero?: number | null;
};
type DocTipo = {
  id: number;
  slug: string;
  marca: number;
  nombre: string;
  descripcion?: string | null;
  seo?: Seo | null;
  imagen?: number | null;
};
type DocModelo = {
  id: number;
  slug: string;
  marca: number;
  tipo: number;
  nombre: string;
  codigo?: string | null;
  descripcion?: string | null;
  seo?: Seo | null;
  imagenes?: number[] | null;
};
const enMarcas = await todo<DocMarca>("marcas");
const enTipos = await todo<DocTipo>("tipos-equipo");
const enModelos = await todo<DocModelo>("modelos-repuesto");
const enMedia = await todo<{ id: number; filename?: string | null }>("media");

const idMarca = new Map(enMarcas.map((m) => [m.slug, m.id]));
const claveTipo = new Map(enTipos.map((t) => [`${t.marca}/${t.slug}`, t.id]));
const claveModelo = new Set(enModelos.map((m) => `${m.tipo}/${m.slug}`));
const PREFIJO_FOTO_MODELO = "wp-repuesto-";
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
// Se compara por la misma clave que la importación (marca/tipo/slug), no solo por el slug: un
// modelo de la demo con el slug de WordPress pero bajo otro tipo quedaría duplicado.
const slugMarca = new Map(enMarcas.map((m) => [m.id, m.slug]));
const claveWpTipo = (t: { marca: number; slug: string }) => `${slugMarca.get(t.marca)}/${t.slug}`;
const tipoDe = new Map(enTipos.map((t) => [t.id, claveWpTipo(t)]));
// El tipo anidado de CASE y sus 4 modelos (los pone tipo-anidado.ts) también son de WordPress:
// no son demo, y una segunda importación no se para por ellos.
const anidadosWp = conNivel
  .filter((p) => p.nivel === "sinRuta" && p.segmentos)
  .map((p) => {
    const [m = "", , t = "", slug = ""] = p.segmentos!;
    return { marca: m, tipo: t, slug: formatSlug(slug) };
  });
const wp = {
  marcas: new Set(marcas.map((m) => m.slug)),
  tipos: new Set([
    ...tipos.map((t) => `${t.marca}/${t.slug}`),
    ...anidadosWp.map((x) => `${x.marca}/${x.tipo}`),
  ]),
  modelos: new Set([
    ...modelos.map((m) => `${m.marca}/${m.tipo}/${m.slug}`),
    ...anidadosWp.map((x) => `${x.marca}/${x.tipo}/${x.slug}`),
  ]),
};
const demoMarcas = enMarcas.filter((m) => !wp.marcas.has(m.slug)).map((m) => m.slug);
const demoTipos = enTipos.filter((t) => !wp.tipos.has(claveWpTipo(t))).map(claveWpTipo);
// Lo que creó esta importación nunca es demo (p. ej. un modelo de slug pendiente que se quita aparte).
const creadosAqui = new Set(manifiesto.creado.modelos.map((x) => x.id));
const demoModelos = enModelos.filter(
  (m) => !creadosAqui.has(m.id) && !wp.modelos.has(`${tipoDe.get(m.tipo)}/${m.slug}`),
);
const demoModelosConSlugDeWp = demoModelos.filter((m) =>
  modelos.some((x) => x.slug === m.slug),
).length;

// ---------- Subidas al Blob ----------

// Logos: uno por marca, por id de adjunto. LO DE UN EDITOR NO SE PISA (2026-10-18): si la
// marca ya tiene un logo que no es de esta importación (`wp-logo-…`), se queda, y el de
// WordPress ni se sube. En el sitio publicado, 12 de las 13 marcas llevaban ya un logo
// elegido en el panel.
const nombreDeMedia = new Map(enMedia.map((m) => [m.id, m.filename ?? ""]));
const marcasConLogoDeEditor = new Set(
  enMarcas
    .filter((d) => {
      const id = typeof d.logo === "number" ? d.logo : null;
      return id !== null && !(nombreDeMedia.get(id) ?? "").startsWith("wp-logo-");
    })
    .map((d) => d.slug),
);
const logosYa = new Set(
  enMedia
    .map((m) => m.filename?.match(/^wp-logo-(\d+)-/)?.[1])
    .filter(Boolean)
    .map(Number),
);
const logosASubir = marcas.filter(
  (m) => !marcasConLogoDeEditor.has(m.slug) && !logosYa.has(m.logo.idWp),
);

// Imagen de cada tipo (una por adjunto) y fondo de EJEMPLO de las marcas.
const ficheroDeMedia = new Map(enMedia.map((m) => [m.id, m.filename ?? ""]));
const imagenTipoYa = new Set(
  enMedia
    .map((m) => m.filename?.match(new RegExp(`^${PREFIJO_IMAGEN_TIPO}(\\d+)-`))?.[1])
    .filter(Boolean)
    .map(Number),
);
const imagenesTipo = new Map<number, PlanImagen>();
for (const t of tipos) if (t.imagen) imagenesTipo.set(t.imagen.idWp, t.imagen);
const imagenesTipoASubir = [...imagenesTipo.values()].filter((i) => !imagenTipoYa.has(i.idWp));
// Las dos tarjetas del global (usadas y aditamentos).
type CampoTarjeta = "tarjetaUsadas" | "tarjetaAditamentos";
const globalAntes = await payload.findGlobal({
  slug: "repuestos-marca",
  depth: 0,
  overrideAccess: true,
});
const tarjetas = (
  [
    ["tarjetaUsadas", IMAGENES_TARJETAS.usadas],
    ["tarjetaAditamentos", IMAGENES_TARJETAS.aditamentos],
  ] as const
).map(([campo, t]) => {
  const actual = (globalAntes[campo]?.imagen as number | null | undefined) ?? null;
  return {
    campo: campo as CampoTarjeta,
    actual,
    sustituir: puedeSustituirImagen(
      actual ? ficheroDeMedia.get(actual) : null,
      PREFIJO_IMAGEN_TARJETA,
    ),
    imagen: {
      idWp: t.idWp,
      url: `https://partequipos.com/wp-content/uploads/${t.archivo}`,
      fichero: ficheroDeTarjeta(t.idWp, t.nombre),
      alt: t.alt,
    } satisfies PlanImagen,
  };
});
const tarjetasASubir = tarjetas
  .filter((t) => t.sustituir)
  .map((t) => t.imagen)
  .filter(
    (i) => !enMedia.some((m) => m.filename?.startsWith(`${PREFIJO_IMAGEN_TARJETA}${i.idWp}-`)),
  );
/** Tipos que hoy tienen una imagen que eligió un editor: la importación no la toca. */
const tiposConImagenDeEditor = tipos
  .filter((t) => {
    const doc = enTipos.find((x) => x.marca === idMarca.get(t.marca) && x.slug === t.slug);
    return (
      t.imagen &&
      doc?.imagen &&
      !puedeSustituirImagen(ficheroDeMedia.get(doc.imagen), PREFIJO_IMAGEN_TIPO)
    );
  })
  .map((t) => t.slug);
const fondosDeEjemplo = enMarcas
  .filter((m) => m.fondoHero && ficheroDeMedia.get(m.fondoHero)?.startsWith(PREFIJO_EJEMPLO_MARCA))
  .map((m) => m.slug);

// Fotos de los modelos (decisión del cliente, 2026-10-17).

// Una foto compartida por dos modelos se sube una vez (nombre por id de adjunto).
const fotosUnicas = new Map<number, PlanFoto>();
for (const m of modelos) if (m.foto) fotosUnicas.set(m.foto.idWp, m.foto);
const aSubir = [...fotosUnicas.values()].filter((f) => !yaSubidas.has(f.idWp));
/** La galería de un modelo se puede poner si está vacía o solo tiene fotos de esta importación. */
const galeriaSustituible = (ids: number[] | null | undefined) =>
  (ids ?? []).every((id) => (ficheroDeMedia.get(id) ?? "").startsWith(PREFIJO_FOTO_MODELO));
const modelosConFotoDeEditor = modelos
  .filter((m) => {
    if (!m.foto) return false;
    const idT = claveTipo.get(`${idMarca.get(m.marca)}/${m.tipo}`);
    const doc = enModelos.find((x) => x.tipo === idT && x.slug === m.slug);
    return !!doc && !galeriaSustituible(doc.imagenes);
  })
  .map((m) => `${m.marca}/${m.tipo}/${m.slug}`);
const porFormato = (fs_: PlanFoto[]) =>
  fs_.reduce<Record<string, number>>(
    (a, f) => ({ ...a, [f.formatoWp]: (a[f.formatoWp] ?? 0) + 1 }),
    {},
  );

// ---------- Fotos en WordPress (opcional: red, sin escribir nada) ----------

type Comprobacion = {
  fallos: { idWp: number; error: string }[];
  avif: Record<string, unknown>[];
  imagenesTipo: Record<string, unknown>[];
};
const comprobacion: Comprobacion = { fallos: [], avif: [], imagenesTipo: [] };
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
  // Imágenes de los tipos y de las tarjetas: se descargan y se mira su formato REAL (los bytes); no se guarda nada.
  for (const i of [...imagenesTipoASubir, ...tarjetasASubir]) {
    await turno();
    try {
      const r = await fetch(i.url, { headers: { "User-Agent": AGENTE } });
      if (!r.ok) {
        comprobacion.fallos.push({ idWp: i.idWp, error: `HTTP ${r.status}` });
        continue;
      }
      const datos = Buffer.from(await r.arrayBuffer());
      const meta = await sharp(datos).metadata();
      const f = formatoDeImagen(meta.format);
      if (!f) comprobacion.fallos.push({ idWp: i.idWp, error: `formato ${meta.format}` });
      comprobacion.imagenesTipo.push({
        idWp: i.idWp,
        fichero: f ? `${i.fichero}.${f.ext}` : null,
        formatoReal: meta.format,
        aWebp: f?.convertir ?? false,
        kB: Math.round(datos.length / 1024),
        medidas: `${meta.width}×${meta.height}`,
      });
    } catch (e) {
      comprobacion.fallos.push({ idWp: i.idWp, error: (e as Error).message });
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
    conImagen: tipos.filter((t) => t.imagen).length,
    conImagenDeEditor: tiposConImagenDeEditor,
  },
  marcasConFondoDeEjemploQueSeQuita: fondosDeEjemplo,
  tarjetasDelGlobal: tarjetas.map((t) => ({
    campo: t.campo,
    hoy: t.actual ? (ficheroDeMedia.get(t.actual) ?? t.actual) : null,
    seSustituye: t.sustituir,
  })),
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
    slugsSinGuionBajo: slugsCambiados.length,
    fotosGenericas: [...genericas],
  },
  enElPreview: {
    marcas: enMarcas.length,
    tipos: enTipos.length,
    modelos: enModelos.length,
    sinEquivalente: {
      marcas: demoMarcas,
      tipos: demoTipos,
      modelos: demoModelos.length,
      modelosConSlugDeWpEnOtroTipo: demoModelosConSlugDeWp,
    },
  },
  retiradaDeLaDemo: { tipos: demoTipos.length, modelos: demoModelos.length },
  blob: {
    subidasDeLogos: logosASubir.length,
    logosYaSubidos:
      marcas.filter((m) => !marcasConLogoDeEditor.has(m.slug)).length - logosASubir.length,
    conLogoDeEditorSinTocar: [...marcasConLogoDeEditor],
    subidasDeImagenesDeTipo: imagenesTipoASubir.length,
    subidasDeImagenesDeTarjeta: tarjetasASubir.length,
    imagenesDeTipoYaSubidas: imagenesTipo.size - imagenesTipoASubir.length,
    otrasOperaciones: 0,
  },
  fotosDeModelos: {
    modelosConFoto: modelos.filter((m) => m.foto).length,
    subidas: aSubir.length,
    yaSubidas: fotosUnicas.size - aSubir.length,
    conFotoDeEditorSinTocar: modelosConFotoDeEditor,
    porFormatoDeOrigen: porFormato(aSubir),
    aConvertirAWebp: aSubir.filter((f) => f.convertir).length,
  },
  comprobacionFotos: COMPROBAR_FOTOS
    ? {
        comprobadas: aSubir.length + imagenesTipoASubir.length + tarjetasASubir.length,
        fallos: comprobacion.fallos.length,
        imagenesDeTipoAWebp: comprobacion.imagenesTipo.filter((i) => i.aWebp).length,
      }
    : "sin comprobar (añade «fotos»)",
};
fs.writeFileSync(
  INFORME,
  JSON.stringify(
    {
      resumen,
      avisos,
      redirecciones,
      sinRuta,
      borradores,
      slugsCambiados,
      comprobacion,
      marcas,
      tipos,
      modelos,
    },
    null,
    1,
  ),
);

log(`fuente: ${resumen.fuente} · ${paginas.length} páginas`);
log(`marcas: ${JSON.stringify(resumen.marcas)}`);
log(`tipos: ${JSON.stringify(resumen.tipos)}`);
log(`marcas con fondo de ejemplo (se quita): ${JSON.stringify(fondosDeEjemplo)}`);
log(`tarjetas del global: ${JSON.stringify(resumen.tarjetasDelGlobal)}`);
log(`modelos: ${JSON.stringify(resumen.modelos)}`);
log(`no se importan: ${JSON.stringify({ ...resumen.noSeImportan })}`);
log(`en el preview: ${JSON.stringify(resumen.enElPreview)}`);
log(`retirada de la demo: ${JSON.stringify(resumen.retiradaDeLaDemo)}`);
log(`BLOB: ${JSON.stringify(resumen.blob)}`);
log(`fotos de modelos: ${JSON.stringify(resumen.fotosDeModelos)}`);
log(`fotos: ${JSON.stringify(resumen.comprobacionFotos)}`);
for (const f of comprobacion.fallos) log(`foto ${f.idWp}: ${f.error}`);
log(`avisos: ${avisos.length} (en el informe)`);
for (const m of modelos.slice(0, 3)) {
  log(`ejemplo: «${m.nombre}» · código ${m.codigo ?? "—"} · ${m.foto?.fichero ?? m.motivoSinFoto}`);
}
log(`informe: ${INFORME}`);
if (modo === "simular") {
  log("simulación terminada: no se ha escrito nada en la base ni en el Blob");
  process.exit(0);
}

// ---------- Importación ----------

const AGENTE = "Partequipos-migracion/1.0 (importador de repuestos; solo lectura)";
const recordarAntes = (coleccion: Coleccion, id: number, antes: Record<string, unknown>) => {
  // Solo la PRIMERA vez: una segunda ejecución no pisa el estado original.
  if (manifiesto.actualizado.some((a) => a.coleccion === coleccion && a.id === id)) return;
  if (manifiesto.creado.marcas.some((x) => x.id === id) && coleccion === "marcas") return;
  if (manifiesto.creado.tipos.some((x) => x.id === id) && coleccion === "tipos-equipo") return;
  if (manifiesto.creado.modelos.some((x) => x.id === id) && coleccion === "modelos-repuesto")
    return;
  manifiesto.actualizado.push({ coleccion, id, antes });
  guardarManifiesto();
};
/** Guarda el valor de antes de un campo de imagen, SOLO la primera vez que se cambia. */
const recordarImagen = (c: CambioImagen) => {
  manifiesto.imagenes ??= [];
  const ya = manifiesto.imagenes.some(
    (x) => x.coleccion === c.coleccion && x.id === c.id && x.campo === c.campo,
  );
  if (ya) return;
  manifiesto.imagenes.push(c);
  guardarManifiesto();
};
const seoDe = (doc: { seo?: Seo | null } | undefined) => ({
  metaTitle: doc?.seo?.metaTitle ?? null,
  metaDescription: doc?.seo?.metaDescription ?? null,
});

// 1. La demo que no existe en WordPress, fuera (dirección, 2026-10-13).
// Dirección aprobó retirar 2 tipos y 25 modelos (simulación del 2026-10-13). Si el preview ha
// cambiado y salen otros números, se para: hay que volver a simular y a preguntar.
const aprobado = (tiposN: number, modelosN: number) =>
  (tiposN === 2 && modelosN === 25) || (tiposN === 0 && modelosN === 0);
if (!aprobado(demoTipos.length, demoModelos.length)) {
  fallar(
    `la demo a retirar no es la aprobada (2 tipos y 25 modelos): salen ${demoTipos.length} y ${demoModelos.length}`,
  );
}
const idsDemoModelos = demoModelos.map((m) => m.id);
if (idsDemoModelos.length) {
  const conSolicitud = await payload.find({
    collection: "solicitudes",
    where: {
      and: [
        { "referencia.relationTo": { equals: "modelos-repuesto" } },
        { "referencia.value": { in: idsDemoModelos } },
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  if (conSolicitud.totalDocs) {
    fallar(`hay solicitudes que apuntan a modelos de la demo a retirar: no se hace nada`);
  }
}
for (const m of demoModelos) {
  await payload.delete({ collection: "modelos-repuesto", id: m.id, overrideAccess: true });
  manifiesto.retiradoDeLaDemo.push({ coleccion: "modelos-repuesto", id: m.id, datos: m });
  guardarManifiesto();
}
const tiposDemo = enTipos.filter((t) => !wp.tipos.has(claveWpTipo(t)));
for (const t of tiposDemo) {
  const quedan = await payload.count({
    collection: "modelos-repuesto",
    where: { tipo: { equals: t.id } },
    overrideAccess: true,
  });
  if (quedan.totalDocs) fallar(`el tipo de la demo ${t.slug} aún tiene modelos: no se borra`);
  await payload.delete({ collection: "tipos-equipo", id: t.id, overrideAccess: true });
  manifiesto.retiradoDeLaDemo.push({ coleccion: "tipos-equipo", id: t.id, datos: t });
  guardarManifiesto();
}
log(`demo retirada: ${tiposDemo.length} tipos y ${demoModelos.length} modelos`);

// 2. Logos (lo único que va al Blob).
let ultima = 0;
async function descargar(url: string): Promise<Buffer> {
  const espera = ultima + 700 - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultima = Date.now();
  const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!r.ok) fallar(`no se puede descargar ${url}: HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
async function logoEnMedia(l: PlanLogo): Promise<number> {
  const prefijo = `wp-logo-${l.idWp}-`;
  const ya = await payload.find({
    collection: "media",
    where: { filename: { contains: prefijo } },
    sort: "createdAt",
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const existente = ya.docs.find((d) => d.filename?.toLowerCase().startsWith(prefijo));
  if (existente) return existente.id;
  const datos = await descargar(l.url);
  const doc = await payload.create({
    collection: "media",
    data: { alt: l.alt, focalX: 50, focalY: 50 },
    file: { data: datos, mimetype: "image/png", name: l.fichero, size: datos.length },
    overrideAccess: true,
  });
  const guardado = await payload.findByID({
    collection: "media",
    id: doc.id,
    depth: 0,
    overrideAccess: true,
  });
  manifiesto.creado.media.push({
    id: doc.id,
    filename: guardado.filename ?? l.fichero,
    url: guardado.url ?? "",
  });
  guardarManifiesto();
  return doc.id;
}

/**
 * Una imagen de WordPress en `Media` (la de un tipo o la de una tarjeta): por
 * su nombre, que lleva el id de adjunto (una segunda ejecución no la vuelve a
 * subir). El formato sale de los BYTES, no de la extensión: AVIF y HEIF se
 * convierten a WebP en esta máquina (`Media` no admite AVIF).
 */
async function imagenEnMedia(i: PlanImagen): Promise<number> {
  const prefijo = i.fichero.slice(0, i.fichero.indexOf(`${i.idWp}-`) + `${i.idWp}-`.length);
  const ya = await payload.find({
    collection: "media",
    where: { filename: { contains: prefijo } },
    sort: "createdAt",
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const existente = ya.docs.find((d) => d.filename?.toLowerCase().startsWith(prefijo));
  if (existente) return existente.id;
  const { default: sharp } = await import("sharp");
  let datos = await descargar(i.url);
  const f =
    formatoDeImagen((await sharp(datos).metadata()).format) ??
    fallar(`imagen (adjunto ${i.idWp}): formato que Media no admite`);
  if (f.convertir) datos = await sharp(datos).webp({ quality: 82 }).toBuffer();
  const nombre = `${i.fichero}.${f.ext}`;
  const doc = await payload.create({
    collection: "media",
    data: { alt: i.alt, focalX: 50, focalY: 50 },
    file: { data: datos, mimetype: f.mimetype, name: nombre, size: datos.length },
    overrideAccess: true,
  });
  const guardado = await payload.findByID({
    collection: "media",
    id: doc.id,
    depth: 0,
    overrideAccess: true,
  });
  manifiesto.creado.media.push({
    id: doc.id,
    filename: guardado.filename ?? nombre,
    url: guardado.url ?? "",
  });
  guardarManifiesto();
  return doc.id;
}

// 3. Marcas. El fondo de EJEMPLO de ux-9 se quita: WordPress no tiene fondo visible.
const idMarcaFinal = new Map<string, number>();
for (const m of marcas) {
  const doc = enMarcas.find((x) => x.slug === m.slug);
  // Con logo elegido en el panel, ni se sube el de WordPress ni se toca el campo.
  const logoDeEditor = marcasConLogoDeEditor.has(m.slug);
  const logo = logoDeEditor ? null : await logoEnMedia(m.logo);
  const quitarFondo = !!doc && fondosDeEjemplo.includes(m.slug);
  if (doc && quitarFondo) {
    recordarImagen({
      coleccion: "marcas",
      id: doc.id,
      campo: "fondoHero",
      antes: doc.fondoHero ?? null,
    });
  }
  const data = {
    nombre: m.nombre,
    slug: m.slug,
    descripcion: m.descripcion,
    ...(logoDeEditor ? {} : { logo }),
    ...(quitarFondo ? { fondoHero: null } : {}),
  };
  if (doc) {
    recordarAntes("marcas", doc.id, {
      nombre: doc.nombre,
      descripcion: doc.descripcion ?? null,
      logo: doc.logo ?? null,
    });
    await payload.update({ collection: "marcas", id: doc.id, data, overrideAccess: true });
    idMarcaFinal.set(m.slug, doc.id);
  } else {
    const creado = await payload.create({ collection: "marcas", data, overrideAccess: true });
    manifiesto.creado.marcas.push({ clave: m.slug, id: creado.id });
    guardarManifiesto();
    idMarcaFinal.set(m.slug, creado.id);
  }
}
log(
  `marcas: ${marcas.length} (logos subidos: ${manifiesto.creado.media.filter((x) => x.filename.startsWith("wp-logo-")).length}; fondo de ejemplo quitado: ${fondosDeEjemplo.length})`,
);

// 4. Tipos (por marca + slug, el índice único).
const idTipoFinal = new Map<string, number>();
const tiposAhora = (
  await payload.find({
    collection: "tipos-equipo",
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
).docs as unknown as DocTipo[];
for (const t of tipos) {
  const marca = idMarcaFinal.get(t.marca)!;
  const doc = tiposAhora.find((x) => x.marca === marca && x.slug === t.slug);
  // La imagen: la real, salvo que la haya elegido un editor (`puedeSustituirImagen`).
  let imagen: number | undefined;
  const actual = doc?.imagen ?? null;
  if (
    t.imagen &&
    puedeSustituirImagen(actual ? ficheroDeMedia.get(actual) : null, PREFIJO_IMAGEN_TIPO)
  ) {
    imagen = await imagenEnMedia(t.imagen);
    if (doc && actual !== imagen) {
      recordarImagen({ coleccion: "tipos-equipo", id: doc.id, campo: "imagen", antes: actual });
    }
  }
  const data = {
    nombre: t.nombre,
    slug: t.slug,
    marca,
    descripcion: t.descripcion,
    seo: { ...(doc?.seo ?? {}), ...t.seo },
    ...(imagen ? { imagen } : {}),
  };
  if (doc) {
    recordarAntes("tipos-equipo", doc.id, {
      nombre: doc.nombre,
      descripcion: doc.descripcion ?? null,
      seo: { ...(doc.seo ?? {}), ...seoDe(doc) },
    });
    await payload.update({
      collection: "tipos-equipo",
      id: doc.id,
      data: data as never,
      overrideAccess: true,
    });
    idTipoFinal.set(`${t.marca}/${t.slug}`, doc.id);
  } else {
    const creado = await payload.create({
      collection: "tipos-equipo",
      data: data as never,
      overrideAccess: true,
    });
    manifiesto.creado.tipos.push({ clave: `${t.marca}/${t.slug}`, id: creado.id });
    guardarManifiesto();
    idTipoFinal.set(`${t.marca}/${t.slug}`, creado.id);
  }
}
log(
  `tipos: ${tipos.length} (imágenes subidas: ${manifiesto.creado.media.filter((x) => x.filename.startsWith(PREFIJO_IMAGEN_TIPO)).length}; con imagen de editor, sin tocar: ${tiposConImagenDeEditor.length})`,
);

// 5. Modelos (por tipo + slug, el índice único), con su foto si la tienen.
const modelosAhora = (
  await payload.find({
    collection: "modelos-repuesto",
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
).docs as unknown as DocModelo[];
let hechos = 0;
let fotosPuestas = 0;
for (const m of modelos) {
  const marca = idMarcaFinal.get(m.marca)!;
  const tipo = idTipoFinal.get(`${m.marca}/${m.tipo}`)!;
  const doc = modelosAhora.find((x) => x.tipo === tipo && x.slug === m.slug);
  // La foto: en la galería, salvo que un editor haya puesto otras (`galeriaSustituible`).
  let imagenes: number[] | undefined;
  if (m.foto && galeriaSustituible(doc?.imagenes)) {
    const { fichero } = m.foto;
    const id = await imagenEnMedia({
      idWp: m.foto.idWp,
      url: m.foto.url,
      fichero: fichero.slice(0, fichero.lastIndexOf(".")),
      alt: m.foto.alt,
    });
    imagenes = [id];
    const antes = doc?.imagenes ?? [];
    // Un modelo que creó esta importación se borra al retirar: su galería no hace falta apuntarla.
    const creadoAqui = !!doc && manifiesto.creado.modelos.some((x) => x.id === doc.id);
    if (doc && !creadoAqui && (antes.length !== 1 || antes[0] !== id)) {
      recordarImagen({
        coleccion: "modelos-repuesto",
        id: doc.id,
        campo: "imagenes",
        antes: antes.length ? antes : null,
      });
    }
    fotosPuestas++;
  }
  const data = {
    nombre: m.nombre,
    slug: m.slug,
    marca,
    tipo,
    codigo: m.codigo,
    descripcion: m.descripcion,
    seo: { ...(doc?.seo ?? {}), ...m.seo },
    ...(imagenes ? { imagenes } : {}),
  };
  const clave = `${m.marca}/${m.tipo}/${m.slug}`;
  if (doc) {
    recordarAntes("modelos-repuesto", doc.id, {
      nombre: doc.nombre,
      codigo: doc.codigo ?? null,
      descripcion: doc.descripcion ?? null,
      seo: { ...(doc.seo ?? {}), ...seoDe(doc) },
    });
    await payload.update({
      collection: "modelos-repuesto",
      id: doc.id,
      data: data as never,
      overrideAccess: true,
    });
  } else {
    const creado = await payload.create({
      collection: "modelos-repuesto",
      data: data as never,
      overrideAccess: true,
    });
    manifiesto.creado.modelos.push({ clave, id: creado.id });
    guardarManifiesto();
  }
  if (++hechos % 50 === 0) log(`modelos: ${hechos} de ${modelos.length}`);
}
log(
  `modelos: ${modelos.length} (con foto: ${fotosPuestas}; fotos subidas: ${manifiesto.creado.media.filter((x) => x.filename.startsWith(PREFIJO_FOTO_MODELO)).length}; con fotos de editor, sin tocar: ${modelosConFotoDeEditor.length})`,
);

// 5b. Tarjetas «Maquinaria pesada usada» y «Aditamentos» del global (salvo la de un editor).
const globalAhora = await payload.findGlobal({
  slug: "repuestos-marca",
  depth: 0,
  overrideAccess: true,
});
const datosGlobal: Record<string, unknown> = {};
for (const t of tarjetas.filter((x) => x.sustituir)) {
  const id = await imagenEnMedia(t.imagen);
  if (t.actual === id) continue;
  recordarImagen({ coleccion: "repuestos-marca", id: 0, campo: t.campo, antes: t.actual });
  datosGlobal[t.campo] = { ...globalAhora[t.campo], imagen: id };
}
if (Object.keys(datosGlobal).length) {
  await payload.updateGlobal({
    slug: "repuestos-marca",
    data: datosGlobal as never,
    overrideAccess: true,
  });
}
log(
  `tarjetas del global: ${Object.keys(datosGlobal).length} cambiadas (imágenes subidas: ${manifiesto.creado.media.filter((x) => x.filename.startsWith(PREFIJO_IMAGEN_TARJETA)).length}; de editor, sin tocar: ${tarjetas.filter((x) => !x.sustituir).length})`,
);

// 6. Redirecciones 301 (Ammann y PES al índice de marcas; las 4 de CASE a su página madre).
for (const r of redirecciones) {
  const desde = normalizarRuta(r.origen);
  const ya = await payload.find({
    collection: "redirects",
    where: { desde: { equals: desde } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  if (ya.docs[0]) {
    log(`redirección ya existente, no se toca: ${desde}`);
    continue;
  }
  const creado = await payload.create({
    collection: "redirects",
    data: {
      desde,
      hacia: r.destino,
      tipo: "301",
      origen: "migracion",
      notas: "Importación de repuestos de WordPress (2026-10-13).",
    },
    overrideAccess: true,
  });
  manifiesto.creado.redirects.push({ desde, id: creado.id });
  guardarManifiesto();
}
log(`redirecciones: ${manifiesto.creado.redirects.length} creadas`);
log(
  `importación terminada · creados: ${manifiesto.creado.marcas.length} marcas, ${manifiesto.creado.tipos.length} tipos, ${manifiesto.creado.modelos.length} modelos, ${manifiesto.creado.media.length} imágenes (logos, tipos, tarjetas y modelos) · actualizados: ${manifiesto.actualizado.length} · imágenes cambiadas: ${(manifiesto.imagenes ?? []).length} · demo retirada: ${manifiesto.retiradoDeLaDemo.length}`,
);
log(`manifiesto: ${MANIFIESTO}`);
process.exit(0);
