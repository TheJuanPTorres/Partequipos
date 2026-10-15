/**
 * REDIRECCIONES DE LAS URL HUÉRFANAS DEL RASTREO.
 *
 * La comprobación URL por URL del sitio publicado (2026-10-14) encontró 18 URL
 * del rastreo (`docs/url-map.csv`) que hoy dan 200 en WordPress y 404 en el
 * sitio nuevo; `docs/redirects-map.csv` las tenía como «HUÉRFANA: requiere
 * decisión humana». Decisión de dirección del mismo día: 17 van con 301 a su
 * equivalente y `/maquinaria-pesada/test` se queda en 404 (página de prueba).
 *
 * ESTA LISTA ES LA FUENTE DE LA MIGRACIÓN `…_huerfanas_y_textos_demo`, que por
 * regla (CLAUDE.md §3.5) no puede importar nada de `src/`: lleva una copia
 * literal, y `huerfanas.test.ts` exige que las dos coincidan.
 *
 * Rutas como las guarda la colección `redirects`: sin barra final.
 */
export const REDIRECTS_HUERFANAS = [
  [
    "/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras-propuesta2025",
    "/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras",
  ],
  [
    "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras4",
    "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras",
  ],
  [
    "/maquinaria-pesada/maquinaria-pesada-usada-otros",
    "/maquinaria-pesada/maquinaria-pesada-usada",
  ],
  ["/blog-partequipos", "/noticias"],
  ["/lubricantes-eni", "/lubricantes/lubricantes-eni"],
  ["/inicio2025", "/"],
  ["/repuestos-para-maquinaria-pesada", "/repuestos-maquinaria-pesada-colombia"],
  ["/repuestos-para-maquinaria-pesada-2", "/repuestos-maquinaria-pesada-colombia"],
  ["/landing-dynapac", "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac"],
  ["/lanzamiento_excavadoras", "/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras"],
  ["/pe-partsshop", "/repuestos-maquinaria-pesada-colombia"],
  ["/openhouse", "/noticias"],
  ["/participa-openhouse", "/noticias"],
  ["/premios-open-house", "/noticias"],
  ["/referenciacion-openhouse-2025", "/noticias"],
  ["/congreso-de-alcaldes", "/noticias"],
  ["/competencia_nacional_de_operadores", "/noticias"],
] as const;

/** La única huérfana que se queda en 404, por decisión de dirección. */
export const HUERFANAS_EN_404 = ["/maquinaria-pesada/test"] as const;
