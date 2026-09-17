/**
 * Lista, por usuario, qué grupos del menú del panel tiene guardados como
 * abiertos o cerrados. SOLO LEE.
 *
 * Uso:  npm run prefs:menu
 *
 * Para qué sirve. Payload guarda el estado de cada grupo en
 * `payload-preferences` (clave `nav`) indexado por el NOMBRE del grupo. Al
 * renombrar o reagrupar, las entradas viejas quedan huérfanas y los grupos
 * nuevos no tienen estado. Este script enseña qué hay antes de decidir nada.
 *
 * Se ejecuta contra la base que indique `DATABASE_URI`. Comprueba SIEMPRE el
 * host que imprime.
 */
process.env.PAYLOAD_DISABLE_PUSH = "true";

const { default: config } = await import("../../src/payload.config");

import { getPayload } from "payload";

const GRUPOS_ACTUALES = new Set([
  "Comercial",
  "Repuestos",
  "Maquinaria",
  "Lubricantes",
  "Contenido",
  "Configuración",
]);

const payload = await getPayload({ config });

const host = (() => {
  try {
    return new URL(process.env.DATABASE_URI ?? "").hostname || "(sin DATABASE_URI)";
  } catch {
    return "(DATABASE_URI no parseable)";
  }
})();
console.log(`Base: ${host}\n`);

const usuarios = await payload.find({
  collection: "users",
  depth: 0,
  limit: 0,
  overrideAccess: true,
});

const prefs = await payload.find({
  collection: "payload-preferences",
  depth: 0,
  limit: 0,
  overrideAccess: true,
  where: { key: { equals: "nav" } },
});

console.log(`Usuarios: ${usuarios.totalDocs} · con preferencia de menú: ${prefs.totalDocs}\n`);

for (const usuario of usuarios.docs) {
  const pref = prefs.docs.find((p) => {
    const ref = p.user as { value?: unknown } | undefined;
    const id =
      typeof ref?.value === "object" && ref.value !== null
        ? (ref.value as { id?: unknown }).id
        : ref?.value;
    return String(id) === String(usuario.id);
  });
  const valor = (pref?.value ?? null) as {
    open?: boolean;
    groups?: Record<string, { open?: boolean }>;
  } | null;
  const grupos = Object.entries(valor?.groups ?? {}).map(
    ([nombre, estado]) =>
      `${nombre}=${estado?.open ? "abierto" : "cerrado"}${GRUPOS_ACTUALES.has(nombre) ? "" : " (HUÉRFANO)"}`,
  );
  console.log(
    `usuario ${usuario.id} (${(usuario as { rol?: string }).rol ?? "?"}): ` +
      (valor
        ? `menú ${valor.open === false ? "plegado" : "desplegado"} · grupos: ${grupos.join(", ") || "ninguno guardado"}`
        : "sin preferencia de menú"),
  );
}

process.exit(0);
