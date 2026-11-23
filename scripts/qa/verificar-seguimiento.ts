/**
 * Verificación POR EFECTO del seguimiento de solicitudes (CLAUDE.md §10.15):
 * se mira lo que queda en la base, no la respuesta.
 *
 *   npm run preview:ejecutar -- npm run qa:seguimiento
 *
 * SOLO contra la base del PREVIEW: usa la guarda que ya existe
 * (`puedeVaciarSolicitudes`, lista de permitidos de un elemento) y aborta con
 * cualquier otro host, antes de cargar Payload.
 *
 * Crea una solicitud de prueba con datos inventados, la pasa de «Nueva» a
 * «Contactada» con la sesión de un usuario y comprueba: la fecha de contacto
 * se apunta sola, no se pisa al cerrar, una fecha puesta a mano se respeta, el
 * responsable se guarda, sin sesión no se lee y el CSV sale con su contenido.
 * Al final borra la solicitud de prueba.
 */
import { puedeVaciarSolicitudes } from "../../src/lib/db/vaciadoSolicitudes";
import { solicitudesACsv, type FilaSolicitud } from "../../src/lib/solicitudes/seguimiento";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";

const veredicto = puedeVaciarSolicitudes(process.env.DATABASE_URI);
if (!veredicto.permitido) {
  throw new Error(`[seguimiento] Solo contra la base del preview. ${veredicto.motivo}`);
}

const { getPayload } = await import("payload");
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

let fallos = 0;
function comprobar(nombre: string, ok: boolean, detalle = ""): void {
  if (!ok) fallos++;
  process.stdout.write(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}\n`);
}

const { docs: usuarios } = await payload.find({ collection: "users", limit: 1, depth: 0 });
const usuario = usuarios[0];
if (!usuario) throw new Error("[seguimiento] No hay ningún usuario en esta base.");
const sesion = { ...usuario, collection: "users" as const };

const creada = await payload.create({
  collection: "solicitudes",
  data: {
    tipo: "contacto",
    estado: "nueva",
    nombre: "PRUEBA SEGUIMIENTO — borrar",
    correo: "prueba-seguimiento@ejemplo.test",
    mensaje: "=SUMA(1;1) prueba automática de qa:seguimiento.",
  },
});
const leer = async () =>
  (await payload.findByID({ collection: "solicitudes", id: creada.id, depth: 1 })) as unknown as {
    estado: string;
    fechaContacto?: string | null;
    notasInternas?: string | null;
    responsable?: { id: number | string } | null;
  };
try {
  let d = await leer();
  comprobar("nace «nueva» y sin fecha de contacto", d.estado === "nueva" && !d.fechaContacto);

  await payload.update({
    collection: "solicitudes",
    id: creada.id,
    overrideAccess: false,
    user: sesion,
    data: {
      estado: "contactada",
      responsable: usuario.id,
      notasInternas: "Llamé, vuelve el lunes.",
    },
  });
  d = await leer();
  const primera = d.fechaContacto;
  comprobar("pasa a «contactada»", d.estado === "contactada");
  comprobar("la fecha de contacto se apunta sola", !!primera);
  comprobar("guarda el responsable", String(d.responsable?.id) === String(usuario.id));
  comprobar("guarda las notas internas", d.notasInternas === "Llamé, vuelve el lunes.");

  await payload.update({
    collection: "solicitudes",
    id: creada.id,
    overrideAccess: false,
    user: sesion,
    data: { estado: "cerrada" },
  });
  d = await leer();
  comprobar("cerrar no pisa la fecha", d.estado === "cerrada" && d.fechaContacto === primera);

  await payload.update({
    collection: "solicitudes",
    id: creada.id,
    overrideAccess: false,
    user: sesion,
    data: { fechaContacto: "2026-01-02T10:00:00.000Z" },
  });
  d = await leer();
  comprobar(
    "una fecha puesta a mano se respeta",
    d.fechaContacto?.startsWith("2026-01-02") === true,
  );

  const sinSesion = await payload
    .find({ collection: "solicitudes", overrideAccess: false, user: null, limit: 1 })
    .then(() => false)
    .catch(() => true);
  comprobar("sin sesión no se pueden leer", sinSesion);

  const { docs } = await payload.find({
    collection: "solicitudes",
    where: { estado: { equals: "cerrada" } },
    depth: 1,
    overrideAccess: false,
    user: sesion,
  });
  const csv = solicitudesACsv(docs as unknown as FilaSolicitud[]);
  comprobar(
    "el CSV lleva la solicitud, «Cerrada» y neutraliza la fórmula",
    csv.includes("PRUEBA SEGUIMIENTO") && csv.includes(";Cerrada;") && csv.includes("'=SUMA"),
  );
} finally {
  await payload.delete({ collection: "solicitudes", id: creada.id });
  const queda = await payload.find({
    collection: "solicitudes",
    where: { id: { equals: creada.id } },
  });
  comprobar("la solicitud de prueba se borró", queda.totalDocs === 0);
}
process.stdout.write(fallos ? `\n${fallos} fallo(s)\n` : "\nTodo bien.\n");
if (fallos) throw new Error(`[seguimiento] ${fallos} comprobación(es) fallida(s)`);
