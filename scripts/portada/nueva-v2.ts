/**
 * «MAQUINARIA PESADA NUEVA» V2 DE LA PORTADA (2026-11-08, diseño del cliente `portada-nueva-v2`):
 * sube las imágenes del kit (optimizadas en WebP, fuera del repositorio) y las pone en el panel:
 *
 * - la máquina de la «Tarjeta en la portada» de Hitachi, Case, Dynapac, Yanmar y LiuGong;
 * - «Distribuido por» Maquitecno con su logo, en LiuGong;
 * - el «Paisaje de las tarjetas de marca» de la sección, en la página «inicio».
 *
 * La máquina grande y la foto de obra de la sección ya están en el panel (#389): no se tocan.
 *
 *   npm run preview:nueva-v2 -- ver
 *   npm run preview:nueva-v2 -- aplicar [revalidar=<origen del preview>]
 *   npm run preview:nueva-v2 -- retirar   # devuelve cada campo a su valor de antes si sigue siendo el nuestro
 *
 * SOLO el preview (en producción, por el panel: runbook-portada-nueva-v2.md). Manifiesto fuera del
 * repositorio. No toca otros campos.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { fetchAlPreview, origenDePreview } from "../../src/lib/preview/derivacion.mjs";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "ver" || a === "aplicar" || a === "retirar");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[nueva-v2] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: ver, aplicar o retirar");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
if (modo === "ver") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[nueva-v2]");

const REVALIDAR = valorDe("revalidar");
if (REVALIDAR && !origenDePreview(REVALIDAR)) fallar("`revalidar=` solo con la URL de un preview");
const CARPETA = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-diseno",
  "portada-nueva-v2",
  "optimizadas",
);
const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-portada-nueva-v2-preview.json",
);

/** La máquina de cada tarjeta: slug de la marca, fichero y texto alternativo. */
const MAQUINAS = [
  ["hitachi", "nueva-tarjeta-hitachi.webp", "Excavadora Hitachi LANDCROS ZX210 recortada"],
  ["case-construction", "nueva-tarjeta-case.webp", "Retroexcavadora CASE 580N recortada"],
  ["dynapac", "nueva-tarjeta-dynapac.webp", "Vibrocompactador Dynapac CA1500D recortado"],
  ["yanmar", "nueva-tarjeta-yanmar.webp", "Miniexcavadora Yanmar ViO80 recortada"],
  ["liugong", "nueva-tarjeta-liugong.webp", "Excavadora LiuGong recortada"],
] as const;
const DISTRIBUIDOR = {
  marca: "liugong",
  nombre: "Maquitecno",
  fichero: "logo-maquitecno.webp",
  alt: "Logo de Maquitecno",
};
const PAISAJE = {
  fichero: "nueva-tarjetas-paisaje.webp",
  alt: "Terreno de obra con montañas al fondo, paisaje de las tarjetas de marca",
};

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[nueva-v2] ${m}\n`);
const idDe = (x: unknown): number | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;

type Tarjeta = {
  maquina: number | null;
  distribuidorNombre: string | null;
  distribuidorLogo: number | null;
};
type Manifiesto = {
  media: number[];
  marcas: { id: number; antes: Tarjeta; puesto: Tarjeta }[];
  pagina: { id: number; antes: number | null; puesto: number };
};
const guardado = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : null;

const marcas = (
  await payload.find({
    collection: "marcas-maquinaria",
    where: { slug: { in: MAQUINAS.map(([s]) => s) } },
    depth: 0,
    limit: 0,
    overrideAccess: true,
  })
).docs;
const inicio = (
  await payload.find({
    collection: "paginas",
    where: { slug: { equals: "inicio" } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
).docs[0];
if (!inicio) fallar("no hay página «inicio»");
const tarjetaDe = (m: (typeof marcas)[number]): Tarjeta => ({
  maquina: idDe(m.portada?.maquina),
  distribuidorNombre: m.portada?.distribuidorNombre ?? null,
  distribuidorLogo: idDe(m.portada?.distribuidorLogo),
});
for (const m of marcas) log(`marca ${m.id} ${m.slug}: ${JSON.stringify(tarjetaDe(m))}`);
log(`inicio ${inicio!.id}: paisaje = ${idDe(inicio!.seccionNueva?.fondoTarjetas) ?? "—"}`);
log(`manifiesto: ${guardado ? "sí" : "ninguno"}`);

if (modo === "aplicar") {
  if (guardado) {
    log("ya aplicado (hay manifiesto): nada que hacer");
  } else {
    for (const [, f] of [
      ...MAQUINAS.map((x) => [x[0], x[1]]),
      ["", DISTRIBUIDOR.fichero],
      ["", PAISAJE.fichero],
    ])
      if (!fs.existsSync(path.join(CARPETA, f!))) fallar(`no existe ${path.join(CARPETA, f!)}`);
    const subir = async (fichero: string, alt: string) =>
      (
        await payload.create({
          collection: "media",
          data: { alt },
          filePath: path.join(CARPETA, fichero),
          overrideAccess: true,
        })
      ).id;
    const manifiesto: Manifiesto = {
      media: [],
      marcas: [],
      pagina: { id: inicio!.id, antes: null, puesto: 0 },
    };
    const guardar = () => {
      fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
      fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
    };
    for (const [slug, fichero, alt] of MAQUINAS) {
      const m = marcas.find((x) => x.slug === slug);
      if (!m) {
        log(`sin marca «${slug}»: se salta`);
        continue;
      }
      const maquina = await subir(fichero, alt);
      manifiesto.media.push(maquina);
      const antes = tarjetaDe(m);
      const puesto: Tarjeta = { ...antes, maquina };
      if (slug === DISTRIBUIDOR.marca) {
        const logo = await subir(DISTRIBUIDOR.fichero, DISTRIBUIDOR.alt);
        manifiesto.media.push(logo);
        puesto.distribuidorNombre = DISTRIBUIDOR.nombre;
        puesto.distribuidorLogo = logo;
      }
      await payload.update({
        collection: "marcas-maquinaria",
        id: m.id,
        data: { portada: puesto },
        overrideAccess: true,
      });
      manifiesto.marcas.push({ id: m.id, antes, puesto });
      guardar();
      log(
        `${slug}: máquina media ${maquina}${puesto.distribuidorLogo ? `, distribuidor media ${puesto.distribuidorLogo}` : ""}`,
      );
    }
    const paisaje = await subir(PAISAJE.fichero, PAISAJE.alt);
    manifiesto.media.push(paisaje);
    manifiesto.pagina = {
      id: inicio!.id,
      antes: idDe(inicio!.seccionNueva?.fondoTarjetas),
      puesto: paisaje,
    };
    await payload.update({
      collection: "paginas",
      id: inicio!.id,
      data: { seccionNueva: { fondoTarjetas: paisaje } },
      overrideAccess: true,
    });
    guardar();
    log(`inicio: paisaje media ${paisaje}`);
  }
  if (REVALIDAR) {
    const token = process.env.REVALIDACION_TOKEN ?? "";
    if (!token) log("sin REVALIDACION_TOKEN: no se revalida (redesplegar el preview)");
    else {
      const r = await fetchAlPreview(
        `${REVALIDAR.replace(/\/$/, "")}/api/revalidar/`,
        REVALIDAR,
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
        { method: "POST", headers: { [CABECERA_REVALIDACION]: token } },
      );
      log(`POST /api/revalidar/: HTTP ${r.status}`);
      if (r.status !== 200) fallar("la revalidación no respondió 200");
    }
  }
}

if (modo === "retirar") {
  if (!guardado) fallar("no hay manifiesto: nada que retirar");
  for (const { id, antes, puesto } of guardado!.marcas) {
    const m = marcas.find((x) => x.id === id);
    if (m && JSON.stringify(tarjetaDe(m)) === JSON.stringify(puesto)) {
      await payload.update({
        collection: "marcas-maquinaria",
        id,
        data: { portada: antes },
        overrideAccess: true,
      });
      log(`marca ${id}: tarjeta devuelta a ${JSON.stringify(antes)}`);
    } else log(`marca ${id}: cambiada en el panel, no se toca`);
  }
  const p = guardado!.pagina;
  if (p.puesto && idDe(inicio!.seccionNueva?.fondoTarjetas) === p.puesto) {
    await payload.update({
      collection: "paginas",
      id: p.id,
      data: { seccionNueva: { fondoTarjetas: p.antes } },
      overrideAccess: true,
    });
    log(`inicio: paisaje devuelto a ${p.antes ?? "—"}`);
  }
  for (const id of guardado!.media) {
    await payload.delete({ collection: "media", id, overrideAccess: true });
    log(`media ${id} borrada`);
  }
  fs.rmSync(MANIFIESTO);
}
