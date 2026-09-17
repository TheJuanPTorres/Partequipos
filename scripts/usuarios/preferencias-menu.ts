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

console.log(`Usuarios: ${usuarios.totalDocs} · filas de preferencia «nav»: ${prefs.totalDocs}\n`);

const idsUsuarios = new Set(usuarios.docs.map((u) => String(u.id)));

/**
 * Se listan las FILAS, no los usuarios: puede haber más de una por usuario y
 * filas huérfanas de cuentas ya borradas. Agrupar por usuario y quedarse con la
 * primera coincidencia esconde justo lo que se quiere ver.
 */
function refUsuario(pref: { user?: unknown }): { coleccion: string; id: string } {
  const ref = pref.user as { relationTo?: unknown; value?: unknown } | undefined;
  const valor = ref?.value;
  const id = typeof valor === "object" && valor !== null ? (valor as { id?: unknown }).id : valor;
  return { coleccion: String(ref?.relationTo ?? "?"), id: String(id ?? "?") };
}

for (const pref of prefs.docs) {
  const { coleccion, id } = refUsuario(pref);
  const usuario = usuarios.docs.find((u) => String(u.id) === id);
  const valor = (pref.value ?? null) as {
    open?: boolean;
    groups?: Record<string, { open?: boolean }>;
  } | null;
  const grupos = Object.entries(valor?.groups ?? {}).map(
    ([nombre, estado]) =>
      `${nombre}=${estado?.open ? "abierto" : "cerrado"}${GRUPOS_ACTUALES.has(nombre) ? "" : " (NOMBRE YA NO EXISTE)"}`,
  );
  const quien = usuario
    ? `usuario ${id} (${(usuario as { rol?: string }).rol ?? "?"})`
    : `usuario ${id} de «${coleccion}» — NO EXISTE, fila HUÉRFANA`;
  console.log(
    `fila ${pref.id} · ${quien}: menú ${valor?.open === false ? "plegado" : "desplegado"} · ` +
      `grupos: ${grupos.join(", ") || "ninguno guardado"}`,
  );
}

const sinFila = usuarios.docs.filter(
  (u) => !prefs.docs.some((p) => refUsuario(p).id === String(u.id)),
);
for (const usuario of sinFila) {
  console.log(`usuario ${usuario.id}: sin preferencia de menú`);
}

const huerfanas = prefs.docs.filter((p) => !idsUsuarios.has(refUsuario(p).id));
if (huerfanas.length > 0) {
  console.log(
    `\n⚠ ${huerfanas.length} fila(s) huérfana(s): pertenecen a cuentas que ya no existen. ` +
      "No afectan al panel, pero explican que haya más filas que usuarios.",
  );
}

process.exit(0);
