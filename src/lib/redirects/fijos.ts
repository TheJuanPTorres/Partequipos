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
   * `/nosotros/trabaja-con-nosotros/` → el portal de empleo del cliente
   * (decisión de dirección, 2026-10-14). El mapa de alcance lo redirige con 301
   * a https://partequipos.buk.co/trabaja-con-nosotros en vez de ser una página
   * propia, así que NO se construye la plantilla «Trabaja con nosotros» de
   * Andrés: es una desviación del diseño anotada en
   * docs/diseno/decisiones-indices-contacto.md. Es una URL del sitio actual
   * (200 en el rastreo); el destino es externo y fijo. Si algún día es una
   * página, se quita esto.
   */
  {
    source: "/nosotros/trabaja-con-nosotros/",
    destination: "https://partequipos.buk.co/trabaja-con-nosotros",
  },
];
