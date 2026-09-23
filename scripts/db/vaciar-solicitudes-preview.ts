/**
 * Vacía `solicitudes` en la rama `preview` de Neon. SOLO en esa rama.
 *
 * Uso, tras cada refresco del preview desde production (CLAUDE.md §10.21):
 *
 *   DATABASE_URI="<cadena pooled de la rama preview>" npm run db:vaciar-solicitudes-preview
 *
 * `solicitudes` es la única colección con datos personales de terceros. Un
 * refresco los clona al preview; este script los quita (Ley 1581 de 2012).
 *
 * El guardián (`src/lib/db/vaciadoSolicitudes.ts`) va ANTES de cargar Payload:
 * si el host no es el del preview —producción, development o uno desconocido—
 * el script sale con código 1 sin abrir ninguna conexión. `payload run` carga
 * `.env.local`, que apunta a development: sin la variable explícita, se rechaza.
 */
import { getPayload } from "payload";

import { hostDeConexion, puedeVaciarSolicitudes } from "../../src/lib/db/vaciadoSolicitudes";

const veredicto = puedeVaciarSolicitudes(process.env.DATABASE_URI);
if (!veredicto.permitido) {
  console.error(`[vaciado] NO se vacía nada: ${veredicto.motivo}`);
  process.exit(1);
}

// Un script de datos no toca el esquema (CLAUDE.md §10.9).
process.env.PAYLOAD_DISABLE_PUSH = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

const host = hostDeConexion(process.env.DATABASE_URI ?? "");
const antes = await payload.count({ collection: "solicitudes", overrideAccess: true });
await payload.delete({
  collection: "solicitudes",
  where: { id: { exists: true } },
  overrideAccess: true,
});
// Se comprueba el EFECTO en la base, no la respuesta (CLAUDE.md §10.15).
const despues = await payload.count({ collection: "solicitudes", overrideAccess: true });

process.stdout.write(`[vaciado] ${host}: solicitudes ${antes.totalDocs} → ${despues.totalDocs}\n`);
process.exit(despues.totalDocs === 0 ? 0 : 1);
