import type { CollectionConfig } from "payload";
import { ValidationError } from "payload";

import {
  actualizarUsuarios,
  campoSoloAdmin,
  leerUsuarios,
  soloAdmin,
} from "../lib/seguridad/acceso";
import { validarPassword } from "../lib/seguridad/password";

/**
 * Colección de autenticación que protege el panel `/admin` (CLAUDE.md §8).
 *
 * El primer usuario se crea desde `/admin` la primera vez que se levanta; a
 * partir de ahí solo un administrador puede crear más.
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Usuario", plural: "Usuarios" },

  /*
   * PARÁMETROS DE SESIÓN Y BLOQUEO.
   *
   * Los valores por defecto de Payload 3.86 —comprobados en
   * `collections/config/defaults.js`— son 7200 s de sesión, 5 intentos y 10 min
   * de bloqueo. Se endurecen los dos primeros; ver README §10 para el porqué.
   */
  auth: {
    // 8 h: cubre una jornada sin obligar a reautenticarse a media tarde, y
    // caduca sola al final del día. Por defecto eran 2 h.
    tokenExpiration: 60 * 60 * 8,
    // 5 intentos es razonable, pero el bloqueo por defecto (10 min) es corto
    // frente a un ataque automatizado. Se sube a 30 min.
    maxLoginAttempts: 5,
    lockTime: 30 * 60 * 1000,
  },

  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "rol", "updatedAt"],
    group: "Configuración",
    description:
      "Cuentas con acceso al panel. Solo un administrador puede crear usuarios o cambiar roles.",
  },

  /*
   * CONTROL DE ACCESO. Antes esta colección NO declaraba `access`, así que
   * cualquier usuario del panel podía crear y borrar cuentas.
   */
  access: {
    read: leerUsuarios, // admin ve a todos; el resto, solo a sí mismo
    create: soloAdmin,
    update: actualizarUsuarios, // admin a todos; el resto, su propio perfil
    delete: soloAdmin,
    admin: () => true, // entrar al panel: cualquier usuario autenticado
  },

  hooks: {
    /*
     * Política de contraseñas. Payload no trae longitud mínima configurable
     * (revisado `IncomingAuthType` en la versión instalada), así que se valida
     * al guardar — también desde la API y desde los scripts.
     */
    beforeValidate: [
      ({ data, operation }) => {
        if (!data) return data;
        // `password` solo viene cuando se establece o se cambia.
        if (operation === "create" || typeof data.password === "string") {
          const error = validarPassword(data.password, data.email);
          if (error) throw new ValidationError({ errors: [{ path: "password", message: error }] });
        }
        return data;
      },
    ],
  },

  fields: [
    // `email` y `password` los añade Payload automáticamente al ser `auth`.
    {
      name: "rol",
      type: "select",
      required: true,
      defaultValue: "editor",
      label: "Rol",
      options: [
        { label: "Administrador — control total, incluidos usuarios", value: "administrador" },
        { label: "Editor — crea y edita contenido", value: "editor" },
      ],
      admin: {
        position: "sidebar",
        description:
          "El editor no puede crear usuarios, cambiar roles ni borrar registros. Solo un administrador cambia este campo.",
      },
      /*
       * Sin este control de campo, un editor entraría a su propio perfil —que sí
       * puede editar— y se ascendería a administrador. Es el agujero clásico al
       * añadir roles.
       */
      access: { create: campoSoloAdmin, update: campoSoloAdmin },
    },
    {
      name: "puedeEditarSlugs",
      type: "checkbox",
      defaultValue: false,
      label: "Puede editar slugs ya publicados",
      admin: {
        position: "sidebar",
        description:
          "Los slugs son de solo lectura tras crear el registro porque forman la URL indexada. Marca esta casilla solo para corregir erratas reales; el cambio generará un redirect 301 automático. Ver ADR 0005.",
      },
      // Mismo motivo que `rol`: es un permiso, no una preferencia.
      access: { create: campoSoloAdmin, update: campoSoloAdmin },
    },
  ],
};
