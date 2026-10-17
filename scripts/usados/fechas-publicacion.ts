/**
 * Pone a las unidades usadas YA importadas la FECHA DE PUBLICACIÓN ORIGINAL de
 * WordPress (la del XML, `post_date_gmt`): las 128 de maquinaria y las 4 de
 * aditamentos. Es lo que ordena el carrusel de la portada y los listados
 * (2026-10-17). Las unidades que se importen de aquí en adelante la traen del
 * propio importador (`importar-usados.ts` e `importar.ts` de aditamentos).
 *
 *   npm run preview:usados:fechas -- simular     # no escribe nada
 *   npm run preview:usados:fechas -- aplicar     # pone la fecha original
 *   npm run preview:usados:fechas -- retirar     # devuelve la fecha de creación
 *
 * Con destino `produccion` (solo dirección, con runbook): el destino se valida
 * antes de cargar Payload, como en los importadores.
 *
 * FUENTES (fuera del repositorio, sin datos personales ni seriales):
 * - `usados=<json>`: la salida de `scripts/usados/extraer-xml.py` volviendo a
 *   leer la exportación (lleva `fechaGmt` por unidad).
 * - `aditamentos=<json>`: la de `scripts/aditamentos/extraer-xml.py` (lleva la
 *   fecha de la página que lista las 4 unidades; comparten esa fecha).
 * Cada unidad se localiza por el manifiesto de su importación (`idWp` → id).
 * Solo se toca la fecha; idempotente (lo que ya la lleva no se escribe).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import {
  planDeFechas,
  planDeRetirada,
  type Actual,
  type EntradaFecha,
} from "../../src/lib/usados/fechasPublicacion";

const args = process.argv.slice(2);
const modo = args.find((a) => a === "simular" || a === "aplicar" || a === "retirar");
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[fechas] ✗ ${m}`);
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
exigirAlmacen("[fechas]");

const CIERRE = path.join(os.homedir(), "Desktop", "partequipos-cierre");
const FUENTE_USADOS = valorDe("usados") ?? path.join(CIERRE, "usados-wordpress-fechas.json");
const FUENTE_ADIT =
  valorDe("aditamentos") ?? path.join(CIERRE, "aditamentos-wordpress-fechas.json");
const MANIFIESTO_USADOS =
  valorDe("manifiestoUsados") ?? path.join(CIERRE, `manifiesto-usados-${destino}.json`);
const MANIFIESTO_ADIT =
  valorDe("manifiestoAditamentos") ?? path.join(CIERRE, `manifiesto-aditamentos-${destino}.json`);

type Manifiesto = { destino: string; creado: { usados: { idWp: number; id: number }[] } };
function leerManifiesto(ruta: string): Manifiesto {
  if (!fs.existsSync(ruta)) fallar(`no está el manifiesto ${ruta}`);
  const m = JSON.parse(fs.readFileSync(ruta, "utf8")) as Manifiesto;
  if (m.destino !== destino)
    fallar(`el manifiesto ${ruta} es de «${m.destino}», no de «${destino}»`);
  return m;
}
function leerJson<T>(ruta: string): T {
  if (!fs.existsSync(ruta)) fallar(`no está la fuente ${ruta}`);
  return JSON.parse(fs.readFileSync(ruta, "utf8")) as T;
}

const manUsados = leerManifiesto(MANIFIESTO_USADOS);
const manAdit = leerManifiesto(MANIFIESTO_ADIT);
const usados = leerJson<{ unidades: { idWp: number; fechaGmt?: string | null }[] }>(FUENTE_USADOS);
const adit = leerJson<{ categoriaUsada: { fechaGmt?: string | null } }>(FUENTE_ADIT);

const fechaDeUsado = new Map(usados.unidades.map((u) => [u.idWp, u.fechaGmt]));
const entradas: EntradaFecha[] = [
  ...manUsados.creado.usados.map((u) => ({
    idWp: u.idWp,
    id: u.id,
    fechaGmt: fechaDeUsado.get(u.idWp),
  })),
  ...manAdit.creado.usados.map((u) => ({
    idWp: u.idWp,
    id: u.id,
    fechaGmt: adit.categoriaUsada.fechaGmt,
  })),
];

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[fechas] ${m}\n`);

const { docs } = await payload.find({
  collection: "equipos-usados",
  where: { id: { in: entradas.map((e) => e.id) } },
  depth: 0,
  limit: 0,
  pagination: false,
  select: { fechaPublicacion: true, createdAt: true, nombre: true },
  overrideAccess: true,
});
const actuales = new Map<number, Actual>(
  docs.map((d) => [d.id, { fechaPublicacion: d.fechaPublicacion, createdAt: d.createdAt }]),
);
const nombres = new Map(docs.map((d) => [d.id, d.nombre]));
log(`en los manifiestos: ${entradas.length} unidades · en la base: ${docs.length}`);

async function poner(id: number, fecha: string) {
  await payload.update({
    collection: "equipos-usados",
    id,
    data: { fechaPublicacion: fecha },
    depth: 0,
    overrideAccess: true,
  });
}

if (modo === "retirar") {
  const plan = planDeRetirada(
    entradas.map((e) => e.id),
    actuales,
  );
  for (const a of plan) {
    if (a.tipo === "cambiar") {
      log(`devuelve ${a.id} a su fecha de creación`);
      await poner(a.id, a.hacia!);
    }
  }
  log(
    `RETIRADA: ${plan.filter((a) => a.tipo === "cambiar").length} devueltas · ${plan.filter((a) => a.tipo === "igual").length} ya estaban · ${plan.filter((a) => a.tipo === "no-existe").length} ya no existen`,
  );
} else {
  const plan = planDeFechas(entradas, actuales);
  let cambios = 0;
  for (const a of plan) {
    if (a.tipo === "cambiar") {
      log(
        `${modo === "aplicar" ? "pone" : "pondría"} ${a.id} «${nombres.get(a.id)}» → ${a.hacia} (antes ${a.antes ?? "sin fecha"})`,
      );
      if (modo === "aplicar") await poner(a.id, a.hacia);
      cambios++;
    } else if (a.tipo === "sin-fecha") {
      log(`aviso ${a.id}: la exportación no trae fecha válida; no se toca`);
    } else if (a.tipo === "no-existe") {
      log(`aviso ${a.id}: está en el manifiesto y ya no existe en la base`);
    }
  }
  log(
    `${modo === "aplicar" ? "HECHO" : "SIMULACIÓN"}: ${cambios} con fecha nueva · ${plan.filter((a) => a.tipo === "igual").length} ya la llevaban · ${plan.filter((a) => a.tipo === "sin-fecha").length} sin fecha · ${plan.filter((a) => a.tipo === "no-existe").length} no existen`,
  );
  if (modo === "aplicar") log("el sitio desplegado no se refresca solo con un script: redesplegar");
}
process.exit(0);
