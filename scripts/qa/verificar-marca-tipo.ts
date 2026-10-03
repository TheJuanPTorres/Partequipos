/**
 * Verificación POR EFECTO del guardarraíl «marca = marca del tipo»
 * (`src/collections/hooks/marcaDelTipo.ts`), contra `development` o el preview.
 *
 * Por qué así y no solo con las pruebas unitarias (CLAUDE.md §10.15): en
 * Payload, la lógica de un gancho se prueba ejecutando la operación y leyendo
 * la base. Aquí se intenta guardar un modelo y un equipo nuevo con un tipo de
 * otra marca —al crear y al cambiar solo un campo— y se comprueba que la base
 * no cambia. Lo único que se escribe es un registro de prueba coherente
 * (prefijo `zz-prueba-marca-tipo-`), que se borra al terminar.
 *
 *   npm run qa:marca-tipo
 */
import { getPayload, type CollectionSlug, type Payload } from "payload";

import { HOST_PRODUCCION } from "../../src/lib/portada/heroPrueba";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
// El endpoint sin «-pooler»: vale para la cadena directa y para la pooled.
const ENDPOINT_PRODUCCION = HOST_PRODUCCION.split(".")[0]!.replace(/-pooler$/, "");
if ((process.env.DATABASE_URI ?? "").includes(ENDPOINT_PRODUCCION)) {
  throw new Error("[marca-tipo] NO se ejecuta contra producción.");
}

const { default: config } = await import("../../src/payload.config");
const payload: Payload = await getPayload({ config });

const PREFIJO = "zz-prueba-marca-tipo-";
let fallos = 0;
function comprobar(nombre: string, ok: boolean, detalle = ""): void {
  if (!ok) fallos++;
  process.stdout.write(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}\n`);
}

/** El mensaje del campo, que es el que ve el editor; el de arriba es genérico. */
function mensaje(e: Error | null): string {
  const datos = (e as { data?: { errors?: { message?: string }[] } } | null)?.data;
  return datos?.errors?.[0]?.message ?? e?.message ?? "";
}

async function intentar(fn: () => Promise<unknown>): Promise<Error | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e as Error;
  }
}

type Tipo = { id: number; marca: number | { id: number } };
const idMarca = (t: Tipo) => (typeof t.marca === "object" ? t.marca.id : t.marca);

async function verificar(
  coleccion: CollectionSlug,
  coleccionDeTipos: CollectionSlug,
  etiqueta: string,
): Promise<void> {
  const { docs } = await payload.find({
    collection: coleccionDeTipos,
    depth: 0,
    limit: 500,
    pagination: false,
  });
  const tipos = docs as unknown as Tipo[];
  const t1 = tipos[0];
  const t2 = tipos.find((t) => t1 && idMarca(t) !== idMarca(t1));
  if (!t1 || !t2) {
    comprobar(`${etiqueta}: hacen falta tipos de dos marcas`, false, "no hay datos");
    return;
  }
  const marcaA = idMarca(t1);
  const marcaB = idMarca(t2);
  const slug = `${PREFIJO}${Date.now()}`;
  const contar = async () =>
    (await payload.count({ collection: coleccion, where: { slug: { like: PREFIJO } } })).totalDocs;

  // 1. Crear con un tipo de otra marca.
  const antes = await contar();
  const e1 = await intentar(() =>
    payload.create({
      collection: coleccion,
      data: { nombre: slug, slug, marca: marcaA, tipo: t2.id } as never,
    }),
  );
  comprobar(
    `${etiqueta}: crear con tipo de otra marca se rechaza`,
    Boolean(e1) && (await contar()) === antes,
    e1 ? mensaje(e1) : "se guardó",
  );

  // 2. Crear coherente: debe guardarse.
  const creado = (await payload.create({
    collection: coleccion,
    data: { nombre: slug, slug, marca: marcaA, tipo: t1.id } as never,
  })) as unknown as { id: number };
  comprobar(`${etiqueta}: crear coherente se guarda`, Boolean(creado?.id));

  try {
    // 3. Cambiar SOLO el tipo a uno de otra marca.
    const e3 = await intentar(() =>
      payload.update({ collection: coleccion, id: creado.id, data: { tipo: t2.id } as never }),
    );
    // 4. Cambiar SOLO la marca.
    const e4 = await intentar(() =>
      payload.update({ collection: coleccion, id: creado.id, data: { marca: marcaB } as never }),
    );
    const fila = (await payload.findByID({
      collection: coleccion,
      id: creado.id,
      depth: 0,
    })) as unknown as { marca: number; tipo: number };
    comprobar(`${etiqueta}: cambiar solo el tipo se rechaza`, Boolean(e3), mensaje(e3));
    comprobar(`${etiqueta}: cambiar solo la marca se rechaza`, Boolean(e4), mensaje(e4));
    comprobar(
      `${etiqueta}: la base no cambió`,
      fila.marca === marcaA && fila.tipo === t1.id,
      `marca ${fila.marca}, tipo ${fila.tipo}`,
    );
  } finally {
    await payload.delete({ collection: coleccion, id: creado.id });
  }
  comprobar(`${etiqueta}: sin restos de la prueba`, (await contar()) === 0);
}

await verificar("modelos-repuesto", "tipos-equipo", "Modelos");
await verificar("equipos-nuevos", "tipos-maquinaria", "Equipos nuevos");

process.stdout.write(`\n${fallos === 0 ? "TODO EN VERDE" : `${fallos} FALLO(S)`}\n`);
// `payload run` sale siempre con 0 (CLAUDE.md §10.25): para fallar hay que lanzar.
if (fallos > 0) throw new Error(`[marca-tipo] ${fallos} comprobación(es) en rojo`);
