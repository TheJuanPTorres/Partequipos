/**
 * Asigna un rol a un usuario del panel, sin pasar por la interfaz.
 *
 * Uso:  npm run rol                          (lista los usuarios y sus roles)
 *       ROL_EMAIL=x@y.com npm run rol:admin  (lo pone administrador)
 *       ROL_EMAIL=x@y.com ROL=editor npm run rol:set
 *
 * PARA QUÉ SIRVE. El campo `rol` solo lo puede escribir un administrador, así
 * que si una base se queda sin ninguno **no hay forma de arreglarlo desde el
 * panel**. Este script usa la API local de Payload, que ignora el control de
 * acceso (`overrideAccess: true`), y es la vía de rescate.
 *
 * Pasó de verdad: la migración que añadió `rol` lo hizo con
 * `DEFAULT 'editor' NOT NULL`, así que todas las cuentas que ya existían
 * quedaron como editores — incluida la de producción.
 *
 * La trampa de arranque para bases NUEVAS ya está cerrada por el hook
 * `primerUsuarioEsAdministrador`; este script queda para los casos heredados y
 * para administrar roles en bloque.
 *
 * Se ejecuta contra la base que indique `DATABASE_URI`. Comprueba SIEMPRE el
 * host que imprime antes de confiar en lo que hizo.
 */
process.env.PAYLOAD_DISABLE_PUSH = "true";

const { default: config } = await import("../../src/payload.config");

import { getPayload } from "payload";

const EMAIL = process.env.ROL_EMAIL?.trim();
const ROL = (process.env.ROL?.trim() || "administrador") as "administrador" | "editor";

if (ROL !== "administrador" && ROL !== "editor") {
  console.error(`✗ ROL debe ser "administrador" o "editor", no "${ROL}".`);
  process.exit(1);
}

const payload = await getPayload({ config });

// Se enseña SIEMPRE contra qué base se está actuando: es la confusión que más
// caro sale (ver CLAUDE.md §10.9).
const uri = process.env.DATABASE_URI ?? "";
console.log(`\nBase de datos: ${uri ? new URL(uri).hostname : "(según .env)"}`);
console.log(`Nombre       : ${uri ? new URL(uri).pathname.slice(1) : "—"}\n`);

const { docs } = await payload.find({ collection: "users", limit: 0, depth: 0 });

if (!EMAIL) {
  console.log("USUARIOS ACTUALES (no se ha cambiado nada)");
  console.log("─".repeat(60));
  if (docs.length === 0) {
    console.log("  (ninguno: la base está vacía)");
  } else {
    for (const u of docs) console.log(`  ${String(u.rol).padEnd(14)} ${u.email}`);
  }
  const admins = docs.filter((u) => u.rol === "administrador").length;
  console.log("─".repeat(60));
  console.log(`Administradores: ${admins}`);
  if (docs.length > 0 && admins === 0) {
    console.log("\n⚠ NO HAY NINGÚN ADMINISTRADOR. Nadie puede crear usuarios,");
    console.log("  borrar registros ni gestionar redirects. Arréglalo con:");
    console.log(`     ROL_EMAIL="${docs[0]?.email}" npm run rol:admin`);
  }
  console.log("\nPara cambiar un rol: ROL_EMAIL=<correo> npm run rol:admin\n");
  process.exit(0);
}

const usuario = docs.find((u) => u.email === EMAIL);
if (!usuario) {
  console.error(`✗ No existe ningún usuario con el correo "${EMAIL}".`);
  console.error(`  Los que hay: ${docs.map((u) => u.email).join(", ") || "(ninguno)"}`);
  process.exit(1);
}

if (usuario.rol === ROL) {
  console.log(`Sin cambios: "${EMAIL}" ya es ${ROL}.`);
  process.exit(0);
}

await payload.update({ collection: "users", id: usuario.id, data: { rol: ROL } });

// Se vuelve a leer de la base: no basta con que la escritura no diera error.
const tras = await payload.findByID({ collection: "users", id: usuario.id });
const ok = tras.rol === ROL;

console.log(`${ok ? "✓" : "✗"} "${EMAIL}": ${usuario.rol} → ${tras.rol}`);
process.exit(ok ? 0 : 1);
