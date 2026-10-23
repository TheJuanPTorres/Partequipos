/**
 * ESTADOS DE «TRABAJA CON NOSOTROS» EN EL PREVIEW (2026-10-23), para verlos y
 * medirlos sin esperar a que Buk falle de verdad:
 *
 *   npm run preview:ejecutar -- payload run scripts/vacantes/estado-preview.ts <modo> [origen del preview]
 *
 * Modos:
 * - `ver`: imprime lo guardado (fechas, número de vacantes y el error).
 * - `fallo-con-copia`: con la copia que haya, simula una lectura FALLIDA por
 *   el código real (`calcularVacantes`, con un lector que lanza): queda
 *   anotado el error y la página sigue con la copia.
 * - `fallo-sin-copia`: borra la copia y simula la lectura fallida: estado vacío.
 * - `restablecer`: borra el último intento; la siguiente visita lee Buk.
 *
 * Con el origen del preview (`https://partequipos-….vercel.app`), al terminar
 * llama a `POST /api/revalidar/` para que la página lo enseñe ya. El secreto
 * de derivación va solo con `fetchAlPreview` (§10.40).
 *
 * SOLO EN EL PREVIEW: se niega fuera de `preview:ejecutar` o si la base no es
 * la del preview (`veredictoEntornoPreview`).
 */
import { fetchAlPreview } from "../../src/lib/preview/derivacion.mjs";
import { veredictoEntornoPreview } from "../../src/lib/preview/entornoPreview";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";
import { calcularVacantes } from "../../src/lib/vacantes/calcular";
import { INTERVALO_LECTURA_MS } from "../../src/lib/vacantes/estado";
import { guardar, leerGuardado } from "../../src/lib/vacantes/guardado";

const MODOS = ["ver", "fallo-con-copia", "fallo-sin-copia", "restablecer"] as const;
type Modo = (typeof MODOS)[number];

const [modo, origen] = process.argv.slice(2) as [Modo | undefined, string | undefined];
if (!modo || !MODOS.includes(modo)) {
  throw new Error(`Modo: ${MODOS.join(" | ")}`);
}
if (process.env.ENTORNO_PREVIEW !== "1") {
  throw new Error("Solo con npm run preview:ejecutar (entorno del preview).");
}
const v = veredictoEntornoPreview({
  DATABASE_URI: process.env.DATABASE_URI,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  VERCEL_AUTOMATION_BYPASS_SECRET: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
});
if (!v.valido) throw new Error(`No es el preview: ${v.motivo}`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const { getPayload } = await import("payload");
const payload = await getPayload({ config });

const hace7h = () => new Date(Date.now() - INTERVALO_LECTURA_MS - 3_600_000).toISOString();
const simularFallo = () =>
  calcularVacantes({
    ahora: Date.now,
    leerGuardado: () => leerGuardado(payload),
    guardar: (datos) => guardar(payload, datos),
    leer: async () => {
      throw new Error("PRUEBA DEL PREVIEW: lectura fallida simulada");
    },
  });

if (modo === "fallo-con-copia") {
  const antes = await leerGuardado(payload);
  if (!antes.vacantes) throw new Error("No hay copia: visita antes la página para que lea Buk.");
  await guardar(payload, { ultimoIntento: hace7h() });
  const r = await simularFallo();
  console.log(`resultado: ${r.origen}, ${r.vacantes.length} vacantes (copia del ${r.leidoEl})`);
} else if (modo === "fallo-sin-copia") {
  await guardar(payload, { vacantes: null, copiaEl: null, ultimoIntento: hace7h() });
  const r = await simularFallo();
  console.log(`resultado: ${r.origen}, ${r.vacantes.length} vacantes`);
} else if (modo === "restablecer") {
  await guardar(payload, { ultimoIntento: null, ultimoError: "" });
}

const g = await leerGuardado(payload);
console.log(
  `guardado: leer=${g.leer} · vacantes=${g.vacantes?.length ?? "sin copia"} · copiaEl=${g.copiaEl} · ultimoIntento=${g.ultimoIntento} · ultimoError=${g.ultimoError || "—"}`,
);

if (origen && modo !== "ver") {
  const token = process.env.REVALIDACION_TOKEN ?? "";
  if (!token) throw new Error("Falta REVALIDACION_TOKEN del preview: no se revalida.");
  const respuesta = await fetchAlPreview(
    `${origen.replace(/\/$/, "")}/api/revalidar/`,
    origen,
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
    { method: "POST", headers: { [CABECERA_REVALIDACION]: token } },
  );
  console.log(`POST /api/revalidar/: HTTP ${respuesta.status}`);
  if (respuesta.status !== 200) throw new Error("La revalidación no respondió 200.");
}
