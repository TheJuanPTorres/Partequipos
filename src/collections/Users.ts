import type { CollectionConfig } from "payload";

/**
 * Colección de autenticación que protege el panel /admin (CLAUDE.md §8).
 * El primer usuario se crea desde /admin la primera vez que se levanta.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  fields: [
    // `email` y `password` los añade Payload automáticamente al ser `auth: true`.
    {
      name: "puedeEditarSlugs",
      type: "checkbox",
      defaultValue: false,
      label: "Puede editar slugs ya publicados",
      admin: {
        description:
          "Los slugs son de solo lectura tras crear el registro porque forman la URL indexada. Marca esta casilla solo para corregir erratas reales; el cambio generará un redirect 301 automático. Ver ADR 0005.",
      },
    },
  ],
};
