/**
 * Verificación POR EFECTO del «último editor» (decisiones-panel.md §25,
 * CLAUDE.md §10.15): se mira lo que queda en la base, no la respuesta.
 *
 *   npm run qa:ultimo-editor   (contra `development`; se niega con la base real)
 *
 * Con la sesión de un usuario (acceso real, `overrideAccess: false`), crea una
 * pregunta frecuente de prueba MANDANDO un editor falso y comprueba que se
 * guarda el usuario de la sesión; que un cliente no lo puede borrar; que un
 * cambio sin sesión (un script) no lo borra; y que Solicitudes y Usuarios no
 * tienen el campo. Al final borra la pregunta de prueba.
 */
import { getPayload, type Payload } from "payload";

import { HOST_PRODUCCION } from "../../src/lib/portada/heroPrueba";
import { CAMPO_ULTIMO_EDITOR } from "../../src/lib/fields/ultimoEditor";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const ENDPOINT_REAL = HOST_PRODUCCION.split(".")[0]!.replace(/-pooler$/, "");
if ((process.env.DATABASE_URI ?? "").includes(ENDPOINT_REAL)) {
  throw new Error("[ultimo-editor] NO se ejecuta contra la base real.");
}

const { default: config } = await import("../../src/payload.config");
const payload: Payload = await getPayload({ config });

let fallos = 0;
function comprobar(nombre: string, ok: boolean, detalle = ""): void {
  if (!ok) fallos++;
  process.stdout.write(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}\n`);
}
const editorDe = (doc: unknown) => {
  const v = (doc as Record<string, unknown>)[CAMPO_ULTIMO_EDITOR];
  return v && typeof v === "object" ? (v as { id: unknown }).id : v;
};

const { docs: usuarios } = await payload.find({ collection: "users", limit: 1, depth: 0 });
const usuario = usuarios[0];
if (!usuario) throw new Error("[ultimo-editor] No hay ningún usuario en esta base.");
const sesion = { ...usuario, collection: "users" as const };

const creada = await payload.create({
  collection: "preguntas-frecuentes",
  overrideAccess: false,
  user: sesion,
  data: {
    pregunta: "PRUEBA ÚLTIMO EDITOR — borrar",
    respuesta: "Prueba automática de qa:ultimo-editor.",
    publicada: false,
    // Lo que mandaría un cliente: tiene que descartarse.
    [CAMPO_ULTIMO_EDITOR]: 999999,
  } as never,
});
try {
  const leida = await payload.findByID({
    collection: "preguntas-frecuentes",
    id: creada.id,
    depth: 0,
  });
  comprobar(
    "al crear, se guarda el usuario de la sesión (y no el que manda el cliente)",
    editorDe(leida) === usuario.id,
    `guardado: ${String(editorDe(leida))}`,
  );

  await payload.update({
    collection: "preguntas-frecuentes",
    id: creada.id,
    overrideAccess: false,
    user: sesion,
    data: { [CAMPO_ULTIMO_EDITOR]: null } as never,
  });
  const tras = await payload.findByID({
    collection: "preguntas-frecuentes",
    id: creada.id,
    depth: 0,
  });
  comprobar(
    "un cliente no puede borrarlo",
    editorDe(tras) === usuario.id,
    `guardado: ${String(editorDe(tras))}`,
  );

  // Un script: sin sesión.
  await payload.update({ collection: "preguntas-frecuentes", id: creada.id, data: { orden: 99 } });
  const script = await payload.findByID({
    collection: "preguntas-frecuentes",
    id: creada.id,
    depth: 0,
  });
  comprobar(
    "un cambio sin sesión (script) conserva el último editor",
    editorDe(script) === usuario.id,
    `guardado: ${String(editorDe(script))}`,
  );

  const tieneCampo = (slug: "solicitudes" | "users") =>
    payload.collections[slug].config.fields.some(
      (f) => "name" in f && f.name === CAMPO_ULTIMO_EDITOR,
    );
  comprobar("Solicitudes no tiene el campo", !tieneCampo("solicitudes"));
  comprobar("Usuarios no tiene el campo", !tieneCampo("users"));
} finally {
  await payload.delete({ collection: "preguntas-frecuentes", id: creada.id });
  process.stdout.write(`(pregunta de prueba #${creada.id} borrada)\n`);
}

if (fallos) {
  const e = new Error(`[ultimo-editor] ✗ ${fallos} comprobación(es) fallida(s)`);
  e.stack = e.message;
  throw e;
}
process.stdout.write("✓ Último editor correcto.\n");
