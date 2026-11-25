/**
 * NORMALIZAR LOS VALORES DE «ATRIBUTOS DESTACADOS» YA COPIADOS (2026-11-24, tanda 22, punto 9).
 * «8,65m» → 8,65 + unidad m; «168HP» → 168 + hp; «5,800kg» → 5.800 + kg; «20,4000kg» → 20.400
 * (dudoso). Las reglas están en `src/lib/maquinaria/normalizarValor.ts`, con pruebas.
 *
 *   npm run preview:ejecutar -- npx payload run scripts/maquinaria/atributos-normalizar.ts simular
 *   npm run preview:ejecutar -- npx payload run scripts/maquinaria/atributos-normalizar.ts aplicar
 *   npm run preview:ejecutar -- npx payload run scripts/maquinaria/atributos-normalizar.ts revertir
 *   npm run preview:ejecutar -- npx payload run scripts/maquinaria/atributos-normalizar.ts volcar   (solo lee)
 *
 * - `simular` (por defecto) NO escribe nada: imprime la lista «antes → después» con los dudosos
 *   marcados y escribe el informe en `INFORME_SALIDA` si está puesto.
 * - `aplicar` cambia solo filas de «Atributos destacados» cuyo valor es TEXTO; apunta cada fila a un
 *   atributo numérico del catálogo (lo crea si falta) y guarda en `MANIFIESTO` lo que había antes y
 *   los atributos creados. `revertir` lo deja como estaba y borra los atributos creados.
 * - NO toca la «Ficha técnica» ni ninguna otra máquina o campo.
 * - SOLO contra la base del preview (el sitio publicado, por runbook de dirección).
 */
import { readFileSync, writeFileSync } from "node:fs";

import { puedeVaciarSolicitudes } from "../../src/lib/db/vaciadoSolicitudes";
import { normalizarValor } from "../../src/lib/maquinaria/normalizarValor";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";

const modo =
  process.argv.find(
    (a) => a === "simular" || a === "aplicar" || a === "revertir" || a === "volcar",
  ) ?? "simular";
const veredicto = puedeVaciarSolicitudes(process.env.DATABASE_URI);
if (!veredicto.permitido) {
  throw new Error(`[atributos-normalizar] Solo contra la base del preview. ${veredicto.motivo}`);
}
const MANIFIESTO = process.env.MANIFIESTO ?? "atributos-normalizar-manifiesto.json";
const salida = (t: string) => process.stdout.write(`${t}\n`);

const { getPayload } = await import("payload");
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

type Fila = { atributo: number; valor: string; id?: string | null };
type Antes = { equipo: number; filas: { atributo: number; valor: string }[] };
type Manifiesto = { equipos: Antes[]; atributosCreados: number[] };

if (modo === "revertir") {
  const m = JSON.parse(readFileSync(MANIFIESTO, "utf8")) as Manifiesto;
  for (const e of m.equipos) {
    await payload.update({
      collection: "equipos-nuevos",
      id: e.equipo,
      data: { atributosDestacados: e.filas },
      context: { sinAviso: true },
    });
  }
  for (const id of m.atributosCreados) {
    await payload.delete({ collection: "atributos-ficha", id });
  }
  salida(
    `Revertido: ${m.equipos.length} máquinas · ${m.atributosCreados.length} atributos borrados`,
  );
  process.exit(0);
}

if (modo === "volcar") {
  // Todas las filas de «Atributos destacados» tal cual, para comparar antes y después (`revertir`).
  const { docs: todos } = await payload.find({
    collection: "equipos-nuevos",
    limit: 0,
    pagination: false,
    depth: 0,
  });
  const filas = todos
    .filter((e) => (e.atributosDestacados?.length ?? 0) > 0)
    .map((e) => ({
      equipo: e.id,
      filas: (e.atributosDestacados ?? []).map((f) => ({ atributo: f.atributo, valor: f.valor })),
    }));
  const { totalDocs } = await payload.count({ collection: "atributos-ficha" });
  salida(`VOLCADO ${JSON.stringify({ catalogo: totalDocs, filas })}`);
  process.exit(0);
}

const { docs: equipos } = await payload.find({
  collection: "equipos-nuevos",
  limit: 0,
  pagination: false,
  depth: 1,
});
const { docs: catalogo } = await payload.find({
  collection: "atributos-ficha",
  limit: 0,
  pagination: false,
  depth: 0,
});
const porClave = new Map<string, number>();
for (const a of catalogo) {
  porClave.set(JSON.stringify([a.nombre, a.unidad ?? "", a.tipoValor, a.icono]), a.id);
}
const creados: number[] = [];
const manifiesto: Manifiesto = { equipos: [], atributosCreados: creados };
const lista: {
  equipo: string;
  etiqueta: string;
  antes: string;
  despues: string;
  dudoso: boolean;
  motivo: string;
}[] = [];

for (const e of equipos) {
  const filas = (e.atributosDestacados ?? []) as unknown as {
    atributo:
      | { id: number; nombre: string; icono: string; unidad?: string | null; tipoValor: string }
      | number;
    valor: string;
  }[];
  const nuevas: { atributo: number; valor: string }[] = [];
  let cambia = false;
  for (const f of filas) {
    if (typeof f.atributo !== "object") {
      nuevas.push({ atributo: f.atributo, valor: f.valor });
      continue;
    }
    const a = f.atributo;
    const r = a.tipoValor === "texto" && !a.unidad ? normalizarValor(f.valor) : null;
    if (!r) {
      nuevas.push({ atributo: a.id, valor: f.valor });
      continue;
    }
    lista.push({
      equipo: e.nombre,
      etiqueta: a.nombre,
      antes: f.valor,
      despues: r.despues,
      dudoso: r.dudoso,
      motivo: r.motivo,
    });
    cambia = true;
    const k = JSON.stringify([a.nombre, r.unidad, "numero", a.icono]);
    let id = porClave.get(k);
    if (id === undefined && modo === "aplicar") {
      const c = await payload.create({
        collection: "atributos-ficha",
        data: { nombre: a.nombre, icono: a.icono as never, unidad: r.unidad, tipoValor: "numero" },
      });
      id = c.id;
      creados.push(c.id);
      porClave.set(k, id);
    }
    nuevas.push({ atributo: id ?? -1, valor: r.valor });
  }
  if (cambia && modo === "aplicar") {
    manifiesto.equipos.push({
      equipo: e.id,
      filas: filas.map((f) => ({
        atributo: typeof f.atributo === "object" ? f.atributo.id : f.atributo,
        valor: f.valor,
      })),
    });
    await payload.update({
      collection: "equipos-nuevos",
      id: e.id,
      data: { atributosDestacados: nuevas as unknown as Fila[] },
      context: { sinAviso: true },
    });
  }
}

if (modo === "aplicar") writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2));
const dudosos = lista.filter((x) => x.dudoso);
salida(`Modo: ${modo} · valores a normalizar: ${lista.length} · dudosos: ${dudosos.length}`);
const informe = [
  `# Normalizar valores de los atributos (${modo}, preview)`,
  "",
  `${lista.length} valores cambian; ${dudosos.length} dudosos (revisar antes de aplicar).`,
  "",
  "## Dudosos",
  ...dudosos.map(
    (x) => `- ${x.equipo} — ${x.etiqueta}: «${x.antes}» → «${x.despues}» (${x.motivo})`,
  ),
  "",
  "## Seguros",
  ...lista
    .filter((x) => !x.dudoso)
    .map((x) => `- ${x.equipo} — ${x.etiqueta}: «${x.antes}» → «${x.despues}»`),
];
if (process.env.INFORME_SALIDA) writeFileSync(process.env.INFORME_SALIDA, informe.join("\n"));
else for (const l of informe) salida(l);
