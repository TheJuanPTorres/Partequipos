/**
 * ¿A qué almacén de Blob escribiría este entorno? SIN ESCRIBIR NADA.
 *
 *   npm run blob:almacen
 *
 * Carga las variables igual que `payload run` y `next dev` (`@next/env`, modo
 * desarrollo: `.env.development.local`, `.env.local`, `.env.development`,
 * `.env`), lee el id del almacén del token y lo compara con el esperado
 * (`src/lib/blob/almacen.ts`). Imprime SOLO el id del almacén, nunca el token.
 * Sale con 1 si no coincide.
 */
import nextEnv from "@next/env";

import { veredictoAlmacen } from "../../src/lib/blob/almacen";

nextEnv.loadEnvConfig(process.cwd(), true, { info: () => {}, error: () => {} });

const v = veredictoAlmacen(process.env);
if (v.valido) {
  process.stdout.write(`almacén: ${v.almacen} (esperado: ${v.esperado}) ✓\n`);
} else {
  console.error(`almacén: ${v.almacen ?? "ninguno"} (esperado: ${v.esperado}) ✗ ${v.motivo}`);
  process.exitCode = 1;
}
