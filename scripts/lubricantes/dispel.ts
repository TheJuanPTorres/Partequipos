/**
 * DISPEL Y EL SELECTOR DE MARCAS DE LUBRICANTES (2026-11-04, dirección):
 *
 * - Crea la marca de lubricante «Dispel» SIN página en este sitio («Destino: Otra web»), de
 *   Colombia, con su color (el azul de su logo, `#005684`), su logo del WordPress del cliente
 *   (recortado a su contenido) y la foto de su selector (un producto Dispel del mismo WordPress).
 *   Su «Enlace externo» queda VACÍO (no sale en el menú y su panel dice «Muy pronto») salvo que se
 *   pase `enlace=<https://…>`; `enlace=` (vacío) lo vacía. Solo preview y prueba: en el sitio
 *   publicado el enlace lo pone Juan Pablo en el panel.
 * - Eni: «País de origen» Italia.
 * - Categoría técnica «Lubricantes»: enciende el selector de marcas con Eni y Dispel, en ese orden.
 *
 *   npm run preview:dispel:simular   # no escribe nada
 *   npm run preview:dispel:aplicar   # (… -- enlace=https://example.com para probar el enlace)
 *   npm run preview:dispel:retirar   # deja cada campo como estaba y borra lo creado
 *
 * Ficheros, fuera del repositorio: `Desktop\partequipos-diseno\wordpress\lubricantes\dispel\`
 * (`kit=` para otra carpeta), bajados del WordPress del cliente.
 *
 * Como los demás importadores: MANIFIESTO fuera del repositorio (`manifiesto-dispel-<destino>.json`)
 * y RETIRADA EXACTA: un campo solo vuelve a su valor de antes si sigue con el que puso el script.
 * Volver a aplicar no duplica. La simulación, sin token del Blob y con las escrituras bloqueadas.
 * No revalida el sitio publicado: al terminar, `POST /api/revalidar/` (runbook).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";
import sharp from "sharp";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { DESTINO_EXTERNO } from "../../src/lib/lubricantes/destino";
import { normalizarEnlaceExterno } from "../../src/lib/nueva/enlaceExterno";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

// ---------- Argumentos y destino (antes de cargar Payload) ----------

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[dispel] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: simular, aplicar o retirar");
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
  if (v.valido) process.env.ALMACEN_BLOB_ESPERADO = v.almacen;
}

/** `enlace=<url>` lo pone; `enlace=` lo vacía; sin el argumento, no se toca. */
const ENLACE_ARG = valorDe("enlace");
const ENLACE: string | null | undefined =
  ENLACE_ARG === undefined ? undefined : ENLACE_ARG ? normalizarEnlaceExterno(ENLACE_ARG) : null;
if (ENLACE_ARG && !ENLACE) fallar(`«${ENLACE_ARG}» no es una dirección https de otro sitio`);
if (ENLACE_ARG !== undefined && destino !== "preview" && destino !== "prueba") {
  fallar("`enlace=` solo en el preview: en el sitio publicado el enlace se pone en el panel");
}

if (modo === "simular") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[dispel]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const KIT =
  valorDe("kit") ??
  path.join(os.homedir(), "Desktop", "partequipos-diseno", "wordpress", "lubricantes", "dispel");
const MANIFIESTO = valorDe("manifiesto") ?? path.join(CIERRE, `manifiesto-dispel-${destino}.json`);
const REVALIDAR = valorDe("revalidar");
if (REVALIDAR && (destino !== "preview" || !origenDePreview(REVALIDAR))) {
  fallar("`revalidar=` solo con el destino preview y la URL de un preview");
}

// ---------- Lo que se carga ----------

const SLUG_DISPEL = "dispel";
const SLUG_ENI = "lubricantes-eni";
const SLUG_CATEGORIA = "lubricantes-para-maquinaria-pesada";
/** El azul de su logo (media de sus píxeles azules): el texto va en blanco (8,1:1). */
const COLOR_DISPEL = "#005684";
const FICHEROS = {
  logo: {
    clave: "lubricante-dispel-logo",
    fichero: "dispel-PNG_Mesa-de-trabajo-1-copia.png",
    alt: "Logo de Dispel",
  },
  foto: {
    clave: "lubricante-dispel-selector",
    fichero: "Dispel-15W40-CK-4-Partequipos.jpg",
    alt: "Tambor y garrafa de lubricante Dispel 15W40 CK-4",
  },
} as const;

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
const log = (m: string) => process.stdout.write(`[dispel] ${m}\n`);

type Id = number;
const idDe = (x: unknown): Id | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;

// ---------- Manifiesto ----------

type Selector = { activo: boolean; marcas: Id[] };
type Manifiesto = {
  destino: string;
  inicio: string;
  creado: { clave: string; id: Id; url: string }[];
  /** La marca Dispel, si la creó este script. */
  dispel: { id: Id; enlace: string | null } | null;
  eni: { id: Id; antes: string | null; ahora: string } | null;
  categoria: { id: Id; antes: Selector; ahora: Selector } | null;
};
const manifiesto: Manifiesto = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : {
      destino: destino!,
      inicio: new Date().toISOString(),
      creado: [],
      dispel: null,
      eni: null,
      categoria: null,
    };
if (manifiesto.destino !== destino) {
  fallar(`el manifiesto ${MANIFIESTO} es del destino «${manifiesto.destino}», no de «${destino}»`);
}
const guardar = () => {
  if (modo === "simular") return;
  fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
};

async function revalidar() {
  if (!REVALIDAR) return;
  const token = process.env.REVALIDACION_TOKEN ?? "";
  if (!token) {
    log("sin REVALIDACION_TOKEN del preview: no se revalida (redesplegar el preview)");
    return;
  }
  const r = await fetchAlPreview(
    `${REVALIDAR.replace(/\/$/, "")}/api/revalidar/`,
    REVALIDAR,
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
    { method: "POST", headers: { [CABECERA_REVALIDACION]: token } },
  );
  log(`POST /api/revalidar/: HTTP ${r.status}`);
  if (r.status !== 200) fallar("la revalidación del preview no respondió 200");
}

// ---------- Lectura ----------

type MarcaLub = { id: Id; slug: string; paisOrigen?: string | null; enlaceExterno?: string | null };
type Categoria = {
  id: Id;
  selectorMarcas?: { activo?: boolean | null; marcas?: unknown[] | null } | null;
};

const buscarMarca = async (slug: string) =>
  (
    await payload.find({
      collection: "marcas-lubricante",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0] as unknown as MarcaLub | undefined;

const eni = await buscarMarca(SLUG_ENI);
if (!eni) fallar(`no existe la marca de lubricante «${SLUG_ENI}»`);
const categoria = (
  await payload.find({
    collection: "categorias-tecnicas",
    where: { slug: { equals: SLUG_CATEGORIA } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
).docs[0] as unknown as Categoria | undefined;
if (!categoria) fallar(`no existe la categoría técnica «${SLUG_CATEGORIA}»`);

const selectorDe = (c: Categoria): Selector => ({
  activo: c.selectorMarcas?.activo === true,
  marcas: (c.selectorMarcas?.marcas ?? []).map(idDe).filter((x): x is Id => x !== null),
});
const iguales = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ---------- Retirar ----------

if (modo === "retirar") {
  if (manifiesto.categoria) {
    if (iguales(selectorDe(categoria!), manifiesto.categoria.ahora)) {
      await payload.update({
        collection: "categorias-tecnicas",
        id: categoria!.id,
        data: { selectorMarcas: manifiesto.categoria.antes },
        depth: 0,
        overrideAccess: true,
      });
      log("categoría «Lubricantes»: selector devuelto a como estaba");
    } else log("categoría «Lubricantes»: cambiada después en el panel, se respeta");
  }
  if (manifiesto.eni) {
    if ((eni!.paisOrigen ?? null) === manifiesto.eni.ahora) {
      await payload.update({
        collection: "marcas-lubricante",
        id: eni!.id,
        data: { paisOrigen: manifiesto.eni.antes as never },
        depth: 0,
        overrideAccess: true,
      });
      log(`Eni: país devuelto (${manifiesto.eni.antes ?? "vacío"})`);
    } else log("Eni: país cambiado después en el panel, se respeta");
  }
  if (manifiesto.dispel) {
    await payload
      .delete({ collection: "marcas-lubricante", id: manifiesto.dispel.id, overrideAccess: true })
      .then(() => log(`marca Dispel (${manifiesto.dispel!.id}) borrada`))
      .catch((e: unknown) => log(`no se pudo borrar la marca Dispel: ${String(e)}`));
  }
  for (const c of manifiesto.creado) {
    await payload
      .delete({ collection: "media", id: c.id, overrideAccess: true })
      .catch((e: unknown) => log(`no se pudo borrar ${c.clave} (${c.id}): ${String(e)}`));
  }
  log(`borradas ${manifiesto.creado.length} imágenes subidas`);
  manifiesto.creado = [];
  manifiesto.dispel = null;
  manifiesto.eni = null;
  manifiesto.categoria = null;
  guardar();
  await revalidar();
  log("RETIRADA COMPLETA");
} else {
  // ---------- Simular / aplicar ----------

  const subir = async (f: (typeof FICHEROS)[keyof typeof FICHEROS]): Promise<Id | null> => {
    const previo = manifiesto.creado.find((c) => c.clave === f.clave);
    if (previo) return previo.id;
    const ruta = path.join(KIT, f.fichero);
    if (!fs.existsSync(ruta)) fallar(`no existe ${ruta}`);
    const original = fs.readFileSync(ruta);
    const meta = await sharp(original).metadata();
    // El logo trae mucho margen transparente (500 × 500): se recorta a su contenido.
    const datos = meta.format === "png" ? await sharp(original).trim().png().toBuffer() : original;
    const final = await sharp(datos).metadata();
    const tipo = final.format === "png" ? "image/png" : "image/jpeg";
    if (final.format !== "png" && final.format !== "jpeg") {
      fallar(`${ruta} no es PNG ni JPEG (${final.format})`);
    }
    log(`subir ${f.clave}: ${f.fichero} ${final.width}×${final.height}, ${datos.length} B`);
    if (modo === "simular") return null;
    const doc = await payload.create({
      collection: "media",
      data: { alt: f.alt },
      file: {
        data: datos,
        mimetype: tipo,
        name: `${f.clave}.${final.format === "png" ? "png" : "jpg"}`,
        size: datos.length,
      },
      overrideAccess: true,
    });
    manifiesto.creado.push({ clave: f.clave, id: doc.id, url: doc.url ?? "" });
    guardar();
    return doc.id;
  };

  const logo = await subir(FICHEROS.logo);
  const foto = await subir(FICHEROS.foto);

  // Dispel.
  const existente = await buscarMarca(SLUG_DISPEL);
  if (existente && manifiesto.dispel?.id !== existente.id) {
    fallar("ya existe una marca «dispel» que no creó este script: no se toca (PARA y avisa)");
  }
  const datosDispel: Record<string, unknown> = {
    nombre: "Dispel",
    slug: SLUG_DISPEL,
    destino: DESTINO_EXTERNO,
    paisOrigen: "co",
    colorPrincipal: COLOR_DISPEL,
    ...(logo !== null ? { logo } : {}),
    ...(foto !== null ? { fotoSelector: foto } : {}),
    ...(ENLACE !== undefined ? { enlaceExterno: ENLACE } : {}),
  };
  const enlaceFinal = ENLACE !== undefined ? ENLACE : (existente?.enlaceExterno ?? null);
  log(
    `${existente ? "actualizar" : "crear"} marca Dispel: Otra web, Colombia, ${COLOR_DISPEL}, enlace ${enlaceFinal ?? "VACÍO (no sale en el menú; «Muy pronto»)"}`,
  );
  let idDispel: Id | null = existente?.id ?? null;
  if (modo === "aplicar") {
    if (existente) {
      await payload.update({
        collection: "marcas-lubricante",
        id: existente.id,
        data: datosDispel,
        depth: 0,
        overrideAccess: true,
      });
    } else {
      const doc = await payload.create({
        collection: "marcas-lubricante",
        data: datosDispel as never,
        depth: 0,
        overrideAccess: true,
      });
      idDispel = doc.id;
    }
    manifiesto.dispel = { id: idDispel!, enlace: enlaceFinal };
    guardar();
  }

  // Eni: Italia.
  log(`Eni: país ${eni!.paisOrigen ?? "—"} → it`);
  if (modo === "aplicar" && eni!.paisOrigen !== "it") {
    if (!manifiesto.eni)
      manifiesto.eni = { id: eni!.id, antes: eni!.paisOrigen ?? null, ahora: "it" };
    guardar();
    await payload.update({
      collection: "marcas-lubricante",
      id: eni!.id,
      data: { paisOrigen: "it" },
      depth: 0,
      overrideAccess: true,
    });
  }

  // La categoría «Lubricantes».
  const antes = selectorDe(categoria!);
  const ahora: Selector = { activo: true, marcas: [eni!.id, ...(idDispel ? [idDispel] : [])] };
  log(
    `categoría «Lubricantes»: selector ${antes.activo ? "encendido" : "apagado"} → encendido (Eni, Dispel)`,
  );
  if (modo === "aplicar") {
    if (!manifiesto.categoria) manifiesto.categoria = { id: categoria!.id, antes, ahora };
    else manifiesto.categoria.ahora = ahora;
    guardar();
    await payload.update({
      collection: "categorias-tecnicas",
      id: categoria!.id,
      data: { selectorMarcas: ahora },
      depth: 0,
      overrideAccess: true,
    });
  }

  if (modo === "aplicar") await revalidar();
  log(modo === "simular" ? "SIMULACIÓN: no se escribió nada" : "APLICADO");
}
