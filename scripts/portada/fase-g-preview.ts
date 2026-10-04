/**
 * Siembra o retira las SEDES de prueba de la sección 9 de la portada (fase G),
 * SOLO EN EL PREVIEW.
 *
 *   npm run preview:fase-g:sembrar
 *   npm run preview:fase-g:retirar
 *
 * - SOLO preview: el guardián de base y almacén (`puedeTocarHeroDePrueba`) y la
 *   guarda del almacén (§10.37), antes de cargar Payload.
 * - Las 7 sedes de ux-9 (widget `b9b46e6`), con sus datos de MAQUETA: las
 *   direcciones y teléfonos se confirman con el cliente antes de producción
 *   (docs/diseno/analisis-home-ux9.md §1). Fotos de ciudad de ux-9 desde
 *   `Desktop/partequipos-diseno/assets/09/`: §10.38 NO las cubre, así que no
 *   salen del preview.
 * - Idempotente. `retirar` borra las sedes y sus fotos (las fotos llevan la
 *   marca en el `alt`) y comprueba que los ficheros salen del Blob.
 *
 * NO REFRESCA EL PREVIEW: sembrar ANTES del último push (o redesplegar).
 */
import os from "node:os";
import path from "node:path";

import { getPayload } from "payload";

import { exigirAlmacen } from "../blob/exigirAlmacen";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { buscarPorMarca } from "../../src/lib/portada/porMarca";

const modo = process.argv.slice(2).find((a) => a === "sembrar" || a === "retirar");
if (!modo) {
  console.error("[fase-g] indica el modo: «sembrar» o «retirar».");
  process.exit(1);
}

const veredicto = puedeTocarHeroDePrueba(
  process.env.DATABASE_URI,
  process.env.BLOB_READ_WRITE_TOKEN,
);
if (!veredicto.permitido) {
  console.error(`[fase-g] NO se hace nada: ${veredicto.motivo}`);
  process.exit(1);
}
exigirAlmacen("[fase-g]");

// Un script de datos no toca el esquema (CLAUDE.md §10.9, §10.34).
process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const log = (m: string) => process.stdout.write(`[fase-g] ${m}\n`);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ASSETS = path.join(os.homedir(), "Desktop", "partequipos-diseno", "assets", "09");
/** Marca: en el `alt` de las fotos. */
const MARCA = "PRUEBA FASE G —";

type Linea = { linea: string; localidad?: string; direccion: string; telefono?: string };
/** En el orden de ux-9. */
const SEDES: {
  nombre: string;
  ciudad: string;
  departamento: string;
  latitud: number;
  longitud: number;
  foto: string;
  lineas: Linea[];
}[] = [
  {
    nombre: "Bogotá",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    latitud: 4.711,
    longitud: -74.0721,
    foto: "Bogota.jpg",
    lineas: [
      { linea: "Maquinaria", direccion: "Diagonal 16 # 96 G – 85", telefono: "(601) 492 62 60" },
      { linea: "Repuestos", direccion: "Carrera 68d # 17a – 84", telefono: "(601) 492 62 60" },
      { linea: "Almacén", direccion: "Calle 6 Nro 26-73", telefono: "(601) 492 62 60" },
    ],
  },
  {
    nombre: "Ibagué",
    ciudad: "Ibagué",
    departamento: "Tolima",
    latitud: 4.4389,
    longitud: -75.2322,
    foto: "Ibague.jpeg",
    lineas: [
      {
        linea: "Maquinaria y repuestos",
        direccion: "Carrera 48 Sur # 88 – 45, Av. Mirolindo. Ibagué, Tolima",
      },
    ],
  },
  {
    nombre: "Cali",
    ciudad: "Cali",
    departamento: "Valle del Cauca",
    latitud: 3.4516,
    longitud: -76.532,
    foto: "Cali.jpeg",
    lineas: [
      {
        linea: "Maquinaria y repuestos",
        direccion: "Calle 15 # 38 – 21, Acopi – Yumbo",
        telefono: "(602) 384 40 02",
      },
    ],
  },
  {
    nombre: "Istmina",
    ciudad: "Istmina",
    departamento: "Chocó",
    latitud: 5.1592,
    longitud: -76.6844,
    foto: "Istmina.jpg",
    lineas: [{ linea: "Maquinaria y repuestos", direccion: "Bomba Zeuz la 70. Istmina, Chocó" }],
  },
  {
    nombre: "Montería",
    ciudad: "Montería",
    departamento: "Córdoba",
    latitud: 8.7479,
    longitud: -75.8814,
    foto: "Monteria.jpeg",
    lineas: [
      { linea: "Maquinaria y repuestos", direccion: "Calle 78, Sevilla 1. Montería, Córdoba" },
    ],
  },
  {
    nombre: "Antioquia",
    ciudad: "Medellín",
    departamento: "Antioquia",
    latitud: 6.2442,
    longitud: -75.5812,
    foto: "Antioquia.jpeg",
    lineas: [
      {
        linea: "Maquinaria",
        localidad: "Guarne",
        direccion: "Autopista Medellín – Bogotá Km 26+800, Guarne",
        telefono: "(604) 448 58 78",
      },
      {
        linea: "Almacén y repuestos",
        localidad: "Medellín",
        direccion: "Calle 16 # 45-104, El Poblado",
        telefono: "(604) 444 96 69",
      },
    ],
  },
  {
    nombre: "Bucaramanga",
    ciudad: "Bucaramanga",
    departamento: "Santander",
    latitud: 7.1193,
    longitud: -73.1227,
    foto: "Bucaramanga.jpeg",
    lineas: [
      {
        linea: "Maquinaria y repuestos",
        direccion: "KM 7 vía Bucaramanga – Girón 4 – 80",
        telefono: "(607) 691 79 95",
      },
    ],
  },
];

const fotos = () => buscarPorMarca(payload, "media", "alt", MARCA);

const sedesDePrueba = async () => {
  const ids = new Set((await fotos()).map((f) => f.id));
  const { docs } = await payload.find({
    collection: "sedes",
    depth: 0,
    limit: 50,
    overrideAccess: true,
  });
  return docs.filter((s) => typeof s.foto === "number" && ids.has(s.foto));
};

if (modo === "sembrar") {
  const ya = await sedesDePrueba();
  if (ya.length > 0) {
    log(`sedes: ya estaban (${ya.length})`);
  } else {
    for (const [i, s] of SEDES.entries()) {
      const foto = await payload.create({
        collection: "media",
        data: { alt: `${MARCA} foto de la sede ${s.nombre}`, focalX: 50, focalY: 50 },
        filePath: path.join(ASSETS, s.foto),
        overrideAccess: true,
      });
      await payload.create({
        collection: "sedes",
        data: {
          nombre: s.nombre,
          ciudad: s.ciudad,
          departamento: s.departamento,
          latitud: s.latitud,
          longitud: s.longitud,
          lineas: s.lineas,
          foto: foto.id,
          orden: i + 1,
        },
        overrideAccess: true,
      });
      log(`sede ${i + 1}: ${s.nombre} (foto ${foto.id})`);
    }
  }
} else {
  for (const s of await sedesDePrueba()) {
    await payload.delete({ collection: "sedes", id: s.id, overrideAccess: true });
    log(`sede borrada: ${s.nombre}`);
  }
  const urls: string[] = [];
  for (const f of await fotos()) {
    if (f.url) urls.push(f.url);
    await payload.delete({ collection: "media", id: f.id, overrideAccess: true });
  }
  log(`${urls.length} fotos borradas; espero 70 s (propagación del Blob)`);
  await esperar(70_000);
  const vivas: string[] = [];
  for (const u of urls) if ((await fetch(u, { method: "HEAD" })).status !== 404) vivas.push(u);
  if (vivas.length > 0) {
    const e = new Error(`[fase-g] ✗ ${vivas.length} ficheros siguen en el Blob`);
    e.stack = e.message;
    throw e;
  }
  log("✓ todos los ficheros dan 404");
}
