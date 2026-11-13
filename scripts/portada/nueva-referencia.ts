/**
 * «MAQUINARIA PESADA NUEVA» 1:1 CON LA REFERENCIA DEL CLIENTE (dirección, 2026-11-13): sube del
 * kit del cliente (`partequipos-diseno\portada-nueva-v2\public\partequipos`, fuera del
 * repositorio) los dos ficheros ORIGINALES de la sección y los pone en la página «inicio»:
 *
 * - la foto de obra casi toda en blanco y negro, con una franja pequeña a color y sin cielo azul
 *   (`texturas/fondo-nueva-2.jpg`), en «Foto de obra» (`seccionNueva.fondo`);
 * - el render de la retroexcavadora CASE Utility Plus (`maq-case-utility-plus.webp`, 1920 × 1344)
 *   en «Máquina» (`seccionNueva.maquina`).
 *
 *   npm run preview:nueva-referencia -- ver
 *   npm run preview:nueva-referencia -- aplicar [revalidar=<origen del preview>]
 *   npm run preview:nueva-referencia -- retirar   # devuelve cada campo si sigue siendo el nuestro
 *
 * SOLO el preview (en el sitio publicado, por el panel: runbook-portada-nueva-referencia.md).
 * Manifiesto fuera del repositorio. No toca otros campos.
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
  const e = new Error(`[nueva-referencia] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!modo) fallar("indica el modo: ver, aplicar o retirar");
const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
if (modo === "ver") process.env.BLOB_READ_WRITE_TOKEN = "";
else exigirAlmacen("[nueva-referencia]");

const REVALIDAR = valorDe("revalidar");
if (REVALIDAR && !origenDePreview(REVALIDAR)) fallar("`revalidar=` solo con la URL de un preview");
const KIT = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-diseno",
  "portada-nueva-v2",
  "public",
  "partequipos",
);
const MANIFIESTO = path.join(
  os.homedir(),
  "Desktop",
  "partequipos-cierre",
  "manifiesto-portada-nueva-referencia-preview.json",
);

/** Campo de `seccionNueva`, fichero del kit y texto alternativo (decorativas, pero con su alt). */
const FICHEROS = [
  [
    "fondo",
    path.join("texturas", "fondo-nueva-2.jpg"),
    "Obra con maquinaria en blanco y negro y una franja a color, fondo de «Maquinaria pesada nueva»",
  ],
  ["maquina", "maq-case-utility-plus.webp", "Retroexcavadora CASE Utility Plus, render recortado"],
] as const;
type Campo = (typeof FICHEROS)[number][0];

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[nueva-referencia] ${m}\n`);
const idDe = (x: unknown): number | null =>
  typeof x === "number" ? x : x && typeof x === "object" && "id" in x ? Number(x.id) : null;

type Manifiesto = {
  pagina: number;
  campos: { campo: Campo; antes: number | null; puesto: number }[];
};
const guardado = fs.existsSync(MANIFIESTO)
  ? (JSON.parse(fs.readFileSync(MANIFIESTO, "utf8")) as Manifiesto)
  : null;

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
const actual = (campo: Campo) => idDe(inicio!.seccionNueva?.[campo]);
for (const [campo] of FICHEROS) log(`inicio ${inicio!.id}: ${campo} = ${actual(campo) ?? "—"}`);
log(`manifiesto: ${guardado ? "sí" : "ninguno"}`);

if (modo === "aplicar") {
  if (guardado) {
    log("ya aplicado (hay manifiesto): nada que hacer");
  } else {
    for (const [, f] of FICHEROS)
      if (!fs.existsSync(path.join(KIT, f))) fallar(`no existe ${path.join(KIT, f)}`);
    const manifiesto: Manifiesto = { pagina: inicio!.id, campos: [] };
    const guardar = () => {
      fs.mkdirSync(path.dirname(MANIFIESTO), { recursive: true });
      fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
    };
    const datos: Partial<Record<Campo, number>> = {};
    for (const [campo, fichero, alt] of FICHEROS) {
      const id = (
        await payload.create({
          collection: "media",
          data: { alt },
          filePath: path.join(KIT, fichero),
          overrideAccess: true,
        })
      ).id;
      manifiesto.campos.push({ campo, antes: actual(campo), puesto: id });
      datos[campo] = id;
      guardar();
      log(`${campo}: media ${id} (${fichero})`);
    }
    await payload.update({
      collection: "paginas",
      id: inicio!.id,
      data: { seccionNueva: datos },
      overrideAccess: true,
    });
    log("inicio: puestos");
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
  const devolver: Partial<Record<Campo, number | null>> = {};
  for (const { campo, antes, puesto } of guardado!.campos) {
    if (actual(campo) === puesto) devolver[campo] = antes;
    else log(`${campo}: cambiado en el panel, no se toca`);
  }
  if (Object.keys(devolver).length > 0) {
    await payload.update({
      collection: "paginas",
      id: guardado!.pagina,
      data: { seccionNueva: devolver },
      overrideAccess: true,
    });
    log(`inicio: devuelto ${JSON.stringify(devolver)}`);
  }
  for (const { campo, puesto } of guardado!.campos) {
    if (devolver[campo] === undefined) continue;
    await payload.delete({ collection: "media", id: puesto, overrideAccess: true });
    log(`media ${puesto} borrada`);
  }
  fs.rmSync(MANIFIESTO);
}
