import type { Access, FieldAccess } from "payload";

/**
 * Roles del panel y control de acceso derivado.
 *
 * ANTES: `Users` no declaraba `access` en absoluto y todos los usuarios eran
 * equivalentes. Cualquiera que entrara al panel podía crear usuarios, borrarlos
 * y —una vez existieran roles— cambiárselos. Con una sola cuenta compartida no
 * se nota; con el cliente editando contenido, sí.
 *
 * DOS ROLES, deliberadamente pocos:
 *
 *   administrador  control total, incluida la gestión de usuarios.
 *   editor         crea y edita contenido. No toca usuarios, ni redirects, ni
 *                  borra nada.
 *
 * POR QUÉ EL EDITOR NO BORRA. Borrar es irreversible y no hay papelera: un
 * modelo borrado se lleva por delante una URL indexada. Crear y editar cubre el
 * trabajo diario; borrar es excepcional y puede pedirse.
 */

export type Rol = "administrador" | "editor";

/** Forma mínima del usuario que hace falta aquí. */
type UsuarioConRol = { id: number | string; rol?: Rol | null };

const usuario = (req: { user?: unknown }): UsuarioConRol | null =>
  (req.user as UsuarioConRol | undefined) ?? null;

export function esAdministrador(user: unknown): boolean {
  return (user as UsuarioConRol | null)?.rol === "administrador";
}

export function esEditor(user: unknown): boolean {
  return (user as UsuarioConRol | null)?.rol === "editor";
}

/** Cualquier usuario autenticado con rol reconocido. */
export function esPersonal(user: unknown): boolean {
  return esAdministrador(user) || esEditor(user);
}

// --- Access de colección -----------------------------------------------------

/** Lectura pública: catálogo y contenido que el sitio publica igualmente. */
export const publico: Access = () => true;

/** Solo personal autenticado. */
export const soloPersonal: Access = ({ req }) => esPersonal(usuario(req));

/** Solo administradores. */
export const soloAdmin: Access = ({ req }) => esAdministrador(usuario(req));

/**
 * Escritura de contenido: editor y administrador.
 *
 * OJO: la API local ignora el control de acceso por defecto
 * (`overrideAccess: true`), así que los scripts de importación y los hooks
 * internos siguen funcionando sin ser «usuarios».
 */
export const escrituraContenido: Access = ({ req }) => esPersonal(usuario(req));

/** Borrado: solo administradores. Ver la nota de arriba. */
export const borradoAdmin: Access = ({ req }) => esAdministrador(usuario(req));

// --- Access de usuarios ------------------------------------------------------

/**
 * Un administrador ve a todo el mundo; cualquier otro se ve **solo a sí mismo**.
 *
 * Devolver una consulta en vez de `false` es lo que permite que un editor entre
 * a `/admin/account` y edite su propio perfil sin poder listar a los demás ni
 * ver sus correos.
 */
export const leerUsuarios: Access = ({ req }) => {
  const u = usuario(req);
  if (!u) return false;
  if (esAdministrador(u)) return true;
  return { id: { equals: u.id } };
};

/** Igual que la lectura: te puedes editar a ti, no a los demás. */
export const actualizarUsuarios: Access = ({ req }) => {
  const u = usuario(req);
  if (!u) return false;
  if (esAdministrador(u)) return true;
  return { id: { equals: u.id } };
};

// --- Access de campo ---------------------------------------------------------

/**
 * Campos que solo un administrador puede modificar (`rol`, `puedeEditarSlugs`).
 *
 * Es control de acceso de CAMPO, no de colección: sin esto un editor podría
 * entrar a su propio perfil —que sí puede editar— y ascenderse a administrador.
 * Ese es exactamente el agujero que hay que cerrar al implementar roles.
 */
export const campoSoloAdmin: FieldAccess = ({ req }) => esAdministrador(usuario(req));
