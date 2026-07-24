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
  ],
};
