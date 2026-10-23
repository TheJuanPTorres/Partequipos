/**
 * Redirects 301 fijos, en `next.config.ts` y no en la colección `Redirects`.
 * Valen en todos los entornos sin escribir en ninguna base. Los comparte
 * `npm run lanzamiento:urls` (`scripts/lanzamiento/comprobar-urls.ts`), que
 * los da por esperados igual que los de la base.
 *
 * Sin dependencias: lo importa `next.config.ts`.
 */
export const REDIRECTS_FIJOS: { destination: string; source: string }[] = [
  /*
   * `/maquinaria/` → `/maquinaria-pesada/` (decisión de dirección, 2026-10-13).
   * El mapa de navegación del cliente pide `/maquinaria/` como página, pero no
   * existe ni en el WordPress ni aquí. Hasta que Andrés aclare qué es, un 301
   * a la sección que sí existe. No es una URL del sitio viejo. Si llega a ser
   * una página, se quita esto.
   */
  { source: "/maquinaria/", destination: "/maquinaria-pesada/" },
  /*
   * `/nosotros/trabaja-con-nosotros/` ya NO redirige (2026-10-23, Juan Pablo):
   * del 2026-10-14 al 22 iba con 301 al portal de empleo de Buk; hoy es una
   * página propia con las vacantes leídas de ese portal (`src/lib/vacantes/`).
   */
];
