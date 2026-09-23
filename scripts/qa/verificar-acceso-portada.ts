/**
 * Verificación de ACCESO de las colecciones de la portada (fase B), POR EFECTO.
 *
 * Uso:  npm run qa:acceso-portada    (contra la base de .env.local: development)
 *
 * CLAUDE.md §10.15: en Payload un 200 no significa que algo funcionara. La
 * denegación de CAMPO descarta en silencio, y la lectura restringida por
 * CONSULTA devuelve 200 con menos filas. Así que aquí NO se mira ninguna
 * respuesta: cada operación se hace con un usuario concreto —anónimo, editor o
 * administrador— y se comprueba el ESTADO DE LA BASE después, leyéndola con
 * `overrideAccess: true`.
 *
 * Crea sus propios registros, marcados con un prefijo, y los borra al final
 * pase lo que pase. NO sube ficheros: en development el token de Blob es el de
 * producción (§10.4), y una subida de prueba escribiría en el Blob real.
 *
 * Se niega a correr contra el host de producción.
 */
import { getPayload, type Payload } from "payload";

process.env.PAYLOAD_DISABLE_PUSH = "true";
const HOST_PRODUCCION = "ep-tiny-fog-awnwc8ie";
if ((process.env.DATABASE_URI ?? "").includes(HOST_PRODUCCION)) {
  console.error("[acceso] NO se ejecuta contra producción.");
  process.exit(1);
}

const { default: config } = await import("../../src/payload.config");
const payload: Payload = await getPayload({ config });

const MARCA = "zz-prueba-acceso-";
const editor = { id: 999_001, rol: "editor", collection: "users" } as never;
const admin = { id: 999_002, rol: "administrador", collection: "users" } as never;

let fallos = 0;
function comprobar(nombre: string, ok: boolean, detalle = ""): void {
  if (!ok) fallos++;
  process.stdout.write(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}\n`);
}

/** Intenta una operación; devuelve el error (o null si no lo hubo). */
async function intentar(fn: () => Promise<unknown>): Promise<Error | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e as Error;
  }
}

/** Estado real de la base, sin control de acceso. */
type Fila = {
  id: number;
  publicado?: boolean;
  autorizacionUso?: boolean;
  orden?: number;
  lineas?: unknown[];
};
const enBase = async (
  coleccion: "testimonios" | "preguntas-frecuentes" | "sedes",
  where: object,
) => {
  const r = await payload.find({
    collection: coleccion,
    where: where as never,
    overrideAccess: true,
    limit: 100,
  });
  return { totalDocs: r.totalDocs, docs: r.docs as unknown as Fila[] };
};

const creados: { coleccion: "testimonios" | "preguntas-frecuentes" | "sedes"; id: number }[] = [];

/**
 * Borra TODO lo que lleve el prefijo, no solo lo que este script sabe que creó:
 * una operación que debía fallar y no falló deja un registro que nadie apuntó.
 * Pasó en la primera corrida. Se llama antes y después.
 */
async function limpiarPorPrefijo(): Promise<void> {
  await payload.delete({
    collection: "testimonios",
    where: { nombre: { like: MARCA } },
    overrideAccess: true,
  });
  await payload.delete({
    collection: "preguntas-frecuentes",
    where: { pregunta: { like: MARCA } },
    overrideAccess: true,
  });
  await payload.delete({
    collection: "sedes",
    where: { nombre: { like: MARCA } },
    overrideAccess: true,
  });
}
await limpiarPorPrefijo();

try {
  // ----------------------------------------------------------------- testimonios
  const base = { cita: "Prueba de acceso.", orden: 1 };

  const e1 = await intentar(() =>
    payload.create({
      collection: "testimonios",
      data: {
        ...base,
        nombre: `${MARCA}sin-autorizacion`,
        publicado: true,
        autorizacionUso: false,
      },
      user: editor,
      overrideAccess: false,
    }),
  );
  const t1 = await enBase("testimonios", { nombre: { equals: `${MARCA}sin-autorizacion` } });
  comprobar(
    "editor NO puede crear un testimonio publicado sin autorización",
    e1 !== null && t1.totalDocs === 0,
    `error: ${e1?.message ?? "ninguno"} · filas: ${t1.totalDocs}`,
  );

  const autorizadoPublicado = await payload.create({
    collection: "testimonios",
    data: {
      ...base,
      nombre: `${MARCA}autorizado-publicado`,
      autorizacionUso: true,
      fechaAutorizacion: "2026-09-23",
      publicado: true,
    },
    user: editor,
    overrideAccess: false,
  });
  creados.push({ coleccion: "testimonios", id: autorizadoPublicado.id });
  const autorizadoSinPublicar = await payload.create({
    collection: "testimonios",
    data: {
      ...base,
      nombre: `${MARCA}autorizado-borrador`,
      autorizacionUso: true,
      fechaAutorizacion: "2026-09-23",
    },
    user: editor,
    overrideAccess: false,
  });
  creados.push({ coleccion: "testimonios", id: autorizadoSinPublicar.id });
  const sinAutorizar = await payload.create({
    collection: "testimonios",
    data: { ...base, nombre: `${MARCA}sin-autorizar` },
    user: editor,
    overrideAccess: false,
  });
  creados.push({ coleccion: "testimonios", id: sinAutorizar.id });

  const nuevo = await enBase("testimonios", { id: { equals: sinAutorizar.id } });
  comprobar("un testimonio nuevo nace SIN publicar", nuevo.docs[0]?.publicado === false);

  const publicoVe = await payload.find({
    collection: "testimonios",
    where: { nombre: { like: MARCA } },
    overrideAccess: false,
  });
  comprobar(
    "el público solo ve el publicado y autorizado",
    publicoVe.totalDocs === 1 && publicoVe.docs[0]?.id === autorizadoPublicado.id,
    `ve ${publicoVe.totalDocs} de 3`,
  );
  const editorVe = await payload.find({
    collection: "testimonios",
    where: { nombre: { like: MARCA } },
    user: editor,
    overrideAccess: false,
  });
  comprobar("el editor ve los tres", editorVe.totalDocs === 3, `ve ${editorVe.totalDocs}`);

  // Retirar la autorización de uno publicado lo despublica en la BASE.
  await payload.update({
    collection: "testimonios",
    id: autorizadoPublicado.id,
    data: { autorizacionUso: false },
    user: editor,
    overrideAccess: false,
  });
  const retirado = await enBase("testimonios", { id: { equals: autorizadoPublicado.id } });
  comprobar(
    "retirar la autorización DESPUBLICA el testimonio en la base",
    retirado.docs[0]?.publicado === false && retirado.docs[0]?.autorizacionUso === false,
  );

  // Una actualización parcial de otro campo NO despublica uno autorizado.
  await payload.update({
    collection: "testimonios",
    id: autorizadoSinPublicar.id,
    data: { publicado: true },
    user: editor,
    overrideAccess: false,
  });
  await payload.update({
    collection: "testimonios",
    id: autorizadoSinPublicar.id,
    data: { orden: 2 },
    user: editor,
    overrideAccess: false,
  });
  const parcial = await enBase("testimonios", { id: { equals: autorizadoSinPublicar.id } });
  comprobar(
    "cambiar otro campo de uno autorizado y publicado no lo despublica",
    parcial.docs[0]?.publicado === true && parcial.docs[0]?.orden === 2,
  );

  // Ni siquiera con la API local SIN control de acceso se guarda publicado sin autorización.
  await payload
    .update({
      collection: "testimonios",
      id: sinAutorizar.id,
      data: { publicado: true },
      overrideAccess: true,
    })
    .catch(() => undefined);
  const forzado = await enBase("testimonios", { id: { equals: sinAutorizar.id } });
  comprobar(
    "ni con overrideAccess se guarda publicado sin autorización",
    forzado.docs[0]?.publicado === false,
  );

  const e2 = await intentar(() =>
    payload.create({
      collection: "testimonios",
      data: { ...base, nombre: `${MARCA}anonimo` },
      overrideAccess: false,
    }),
  );
  const t2 = await enBase("testimonios", { nombre: { equals: `${MARCA}anonimo` } });
  comprobar("un anónimo NO crea testimonios", e2 !== null && t2.totalDocs === 0);

  const e3 = await intentar(() =>
    payload.delete({
      collection: "testimonios",
      id: sinAutorizar.id,
      user: editor,
      overrideAccess: false,
    }),
  );
  const t3 = await enBase("testimonios", { id: { equals: sinAutorizar.id } });
  comprobar("un editor NO borra (solo administrador)", e3 !== null && t3.totalDocs === 1);

  await payload.delete({
    collection: "testimonios",
    id: sinAutorizar.id,
    user: admin,
    overrideAccess: false,
  });
  const t4 = await enBase("testimonios", { id: { equals: sinAutorizar.id } });
  comprobar("un administrador sí borra", t4.totalDocs === 0);

  // ------------------------------------------------------ preguntas frecuentes
  const publicada = await payload.create({
    collection: "preguntas-frecuentes",
    data: { pregunta: `${MARCA}publicada`, respuesta: "Sí." },
    user: editor,
    overrideAccess: false,
  });
  creados.push({ coleccion: "preguntas-frecuentes", id: publicada.id });
  const oculta = await payload.create({
    collection: "preguntas-frecuentes",
    data: { pregunta: `${MARCA}oculta`, respuesta: "No.", publicada: false },
    user: editor,
    overrideAccess: false,
  });
  creados.push({ coleccion: "preguntas-frecuentes", id: oculta.id });
  const pv = await payload.find({
    collection: "preguntas-frecuentes",
    where: { pregunta: { like: MARCA } },
    overrideAccess: false,
  });
  comprobar(
    "el público solo ve las preguntas publicadas",
    pv.totalDocs === 1,
    `ve ${pv.totalDocs} de 2`,
  );

  // --------------------------------------------------------------------- sedes
  const e4 = await intentar(() =>
    payload.create({
      collection: "sedes",
      data: {
        nombre: `${MARCA}fuera`,
        latitud: 95,
        longitud: -74,
        lineas: [{ linea: "X", direccion: "Y" }],
      },
      user: editor,
      overrideAccess: false,
    }),
  );
  const s1 = await enBase("sedes", { nombre: { equals: `${MARCA}fuera` } });
  comprobar("una sede con latitud fuera de rango NO se guarda", e4 !== null && s1.totalDocs === 0);

  const e5 = await intentar(() =>
    payload.create({
      collection: "sedes",
      data: {
        nombre: `${MARCA}anonima`,
        latitud: 4.6,
        longitud: -74,
        lineas: [{ linea: "X", direccion: "Y" }],
      },
      overrideAccess: false,
    }),
  );
  const s2 = await enBase("sedes", { nombre: { equals: `${MARCA}anonima` } });
  comprobar("un anónimo NO crea sedes", e5 !== null && s2.totalDocs === 0);

  const sede = await payload.create({
    collection: "sedes",
    data: {
      nombre: `${MARCA}bogota`,
      latitud: 4.65,
      longitud: -74.1,
      lineas: [{ linea: "Maquinaria", direccion: "Diagonal 16" }],
    },
    user: editor,
    overrideAccess: false,
  });
  creados.push({ coleccion: "sedes", id: sede.id });
  const s3 = await enBase("sedes", { id: { equals: sede.id } });
  comprobar(
    "un editor crea una sede válida",
    s3.totalDocs === 1 && s3.docs[0]?.lineas?.length === 1,
  );
} finally {
  for (const { coleccion, id } of creados) {
    await payload
      .delete({ collection: coleccion, id, overrideAccess: true })
      .catch(() => undefined);
  }
  await limpiarPorPrefijo();
  const restos = await Promise.all(
    (["testimonios", "preguntas-frecuentes", "sedes"] as const).map((c) =>
      payload.count({
        collection: c,
        where: { [c === "preguntas-frecuentes" ? "pregunta" : "nombre"]: { like: MARCA } } as never,
        overrideAccess: true,
      }),
    ),
  );
  const quedan = restos.reduce((s, r) => s + r.totalDocs, 0);
  comprobar("limpieza: no queda ningún registro de prueba", quedan === 0, `quedan ${quedan}`);
}

process.stdout.write(fallos === 0 ? "\nACCESO VERIFICADO POR EFECTO\n" : `\n${fallos} FALLO(S)\n`);
process.exit(fallos === 0 ? 0 : 1);
