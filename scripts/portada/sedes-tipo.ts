/**
 * «Tipo de sede» del mapa de sedes (2026-11-04) en el PREVIEW: pone principal/secundaria a las
 * sedes, renombra «Antioquia» a «Medellín», saca CAUCASIA como sede propia y crea Sincelejo,
 * Yopal, Cartagena y Villavicencio (secundarias, con el punto en el CENTRO de la ciudad y sin
 * líneas: ni direcciones ni teléfonos inventados).
 *
 *   npm run preview:ejecutar -- npx.cmd payload run scripts/portada/sedes-tipo.ts ver
 *   npm run preview:ejecutar -- npx.cmd payload run scripts/portada/sedes-tipo.ts aplicar
 *
 * Idempotente: se puede repetir. Requiere la migración del campo `tipo` ya aplicada en la base.
 * SOLO preview (el mismo guardián que el hero de prueba, antes de conectar). No toca el esquema.
 * NO REFRESCA el preview: tras aplicar, guardar una sede en el panel o redesplegar. En producción
 * el mismo cambio se hace por el panel (runbook-sedes-tipo.md), no con este script.
 */
import { getPayload } from "payload";

import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";

const modo = process.argv.slice(2).find((a) => ["ver", "aplicar"].includes(a));
if (!modo) {
  console.error("[sedes-tipo] indica el modo: «ver» o «aplicar».");
  process.exit(1);
}
const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[sedes-tipo] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}

// Un script de datos no toca el esquema (CLAUDE.md §9.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
const log = (m: string) => process.stdout.write(`[sedes-tipo] ${m}\n`);

type Tipo = "principal" | "secundaria";

/** Orden final del mapa: las 5 principales y después las 8 secundarias. */
const ORDEN: { nombre: string; tipo: Tipo }[] = [
  { nombre: "Bogotá", tipo: "principal" },
  { nombre: "Medellín", tipo: "principal" },
  { nombre: "Cali", tipo: "principal" },
  { nombre: "Barranquilla", tipo: "principal" },
  { nombre: "Bucaramanga", tipo: "principal" },
  { nombre: "Montería", tipo: "secundaria" },
  { nombre: "Istmina", tipo: "secundaria" },
  { nombre: "Ibagué", tipo: "secundaria" },
  { nombre: "Caucasia", tipo: "secundaria" },
  { nombre: "Sincelejo", tipo: "secundaria" },
  { nombre: "Yopal", tipo: "secundaria" },
  { nombre: "Cartagena", tipo: "secundaria" },
  { nombre: "Villavicencio", tipo: "secundaria" },
];

/** Centro de cada ciudad (WGS84). Sin direcciones: hay que pedirlas al cliente. */
const NUEVAS: Record<string, { ciudad: string; departamento: string; lat: number; lng: number }> = {
  Sincelejo: { ciudad: "Sincelejo", departamento: "Sucre", lat: 9.3047, lng: -75.3978 },
  Yopal: { ciudad: "Yopal", departamento: "Casanare", lat: 5.3378, lng: -72.3959 },
  Cartagena: { ciudad: "Cartagena", departamento: "Bolívar", lat: 10.391, lng: -75.4794 },
  Villavicencio: { ciudad: "Villavicencio", departamento: "Meta", lat: 4.142, lng: -73.6266 },
};
const CAUCASIA = { ciudad: "Caucasia", departamento: "Antioquia", lat: 7.9847, lng: -75.1983 };

const todas = async () =>
  (await payload.find({ collection: "sedes", depth: 0, limit: 50, sort: "orden" })).docs;
const porNombre = (docs: Awaited<ReturnType<typeof todas>>, n: string) =>
  docs.find((d) => d.nombre === n) ?? null;

if (modo === "ver") {
  for (const s of await todas()) {
    log(
      `${s.orden ?? "-"} · ${s.nombre} · ${s.ciudad} · tipo=${s.tipo ?? "(vacío)"} · líneas=${s.lineas?.length ?? 0}`,
    );
  }
} else {
  let docs = await todas();

  // 1. Caucasia como sede propia (primero la crea, después la quita de «Antioquia»/«Medellín»).
  const madre = porNombre(docs, "Medellín") ?? porNombre(docs, "Antioquia");
  if (!madre) {
    console.error("[sedes-tipo] no está la sede «Antioquia»/«Medellín».");
    process.exit(1);
  }
  const lineasMadre = madre.lineas ?? [];
  const lineaCaucasia = lineasMadre.find((l) => l.localidad?.trim() === "Caucasia");
  if (!porNombre(docs, "Caucasia")) {
    if (!lineaCaucasia) {
      console.error("[sedes-tipo] «Caucasia» no existe ni como sede ni como línea de Medellín.");
      process.exit(1);
    }
    await payload.create({
      collection: "sedes",
      data: {
        nombre: "Caucasia",
        ...CAUCASIA,
        latitud: CAUCASIA.lat,
        longitud: CAUCASIA.lng,
        tipo: "secundaria",
        lineas: [
          {
            linea: lineaCaucasia.linea,
            direccion: lineaCaucasia.direccion,
            telefono: lineaCaucasia.telefono ?? null,
          },
        ],
      },
    });
    log("creada la sede Caucasia con su línea.");
  }
  await payload.update({
    collection: "sedes",
    id: madre.id,
    data: {
      nombre: "Medellín",
      lineas: lineasMadre
        .filter((l) => l.localidad?.trim() !== "Caucasia")
        .map(({ linea, localidad, direccion, telefono }) => ({
          linea,
          localidad,
          direccion,
          telefono,
        })),
    },
  });
  log("sede «Antioquia» → «Medellín» (sin la línea de Caucasia).");

  // 2. Las cuatro nuevas, sin líneas.
  docs = await todas();
  for (const [nombre, d] of Object.entries(NUEVAS)) {
    if (porNombre(docs, nombre)) continue;
    await payload.create({
      collection: "sedes",
      data: {
        nombre,
        ciudad: d.ciudad,
        departamento: d.departamento,
        latitud: d.lat,
        longitud: d.lng,
        tipo: "secundaria",
        lineas: [],
      },
    });
    log(`creada la sede ${nombre} (centro de la ciudad, sin líneas).`);
  }

  // 3. Tipo y orden de las 13.
  docs = await todas();
  for (const [i, { nombre, tipo }] of ORDEN.entries()) {
    const s = porNombre(docs, nombre);
    if (!s) {
      console.error(`[sedes-tipo] falta la sede «${nombre}».`);
      process.exit(1);
    }
    await payload.update({ collection: "sedes", id: s.id, data: { tipo, orden: i + 1 } });
  }
  log("tipo y orden puestos en las 13 sedes.");
}
