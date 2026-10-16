# Aditamentos importados de WordPress (2026-10-16)

Decisiones de dirección del 2026-10-16, tras el estudio de la exportación XML
(`partequipos.WordPress.2026-10-07.xml`):

| Decisión               | Qué                                                                                                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a) Catálogo            | El de **2025** (el más actual), que se confirma con el cliente                                                                                                                                                                         |
| b) Unidades usadas     | Las 4 de `…/aditamentos/aditamentos/` van a una categoría **nueva** de usados, «Aditamentos» (`/maquinaria-pesada/maquinaria-pesada-usada/aditamentos/`, **dirección aprobada**), marcadas para la pestaña «Aditamentos» de la portada |
| c) Fichas nuevas       | Cada aditamento nuevo, con **su ficha propia** (plantilla V2), aunque tenga poco texto                                                                                                                                                 |
| d) Fotos de fabricante | A la lista de licencias para el cliente (§5)                                                                                                                                                                                           |

## 1. Qué hay en WordPress

En WordPress los aditamentos **no son productos con ficha**: son tarjetas de
Elementor dentro de páginas, sin URL propia por producto.

| Página                                                                                     | Qué es                                                                                                               | Se importa                    |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Repuestos → «Aditamentos para maquinaria pesada» (id 36750, fotos de 2025)                 | 12 tarjetas: 4 de excavadoras y 8 de minicargadores. Foto y título                                                   | **Sí, como nuevos**           |
| `…/nueva/marcas/aditamentos/aditamentos/` (id 1099)                                        | 4 tarjetas con carrusel y peso o «para maquinaria de», horas, año y, en dos, serial. La página dice «Equipos usados» | **Sí, como usados**           |
| `…/nueva/marcas/aditamentos/excavadoras/` y `…/minicargadores/` (ids 1462 y 1483, de 2022) | 10 tarjetas con foto y nombre                                                                                        | No: manda el catálogo de 2025 |

**Lo oculto no existe:** cada tarjeta de 2025 lleva una lista de subtipos
(«Punta», «Buje»…) oculta en los tres tamaños, y no se importa. Si dirección
la quiere como «Puntos destacados», es un cambio del extractor.

## 2. Qué se importa y dónde

**Nuevos → `equipos-nuevos`,** marca «aditamentos», con su tipo
(«excavadoras» o «minicargadores»), una foto cada uno.

- **Nombre:** el título de WordPress sin «para maquinaria pesada» y con el tipo
  («MARTILLO PARA MAQUINARIA PESADA» → «Martillo para minicargadores»).
  - Así los dos martillos y los dos brazos se distinguen en el panel, el buscador y la pestaña del navegador.
  - **Errata corregida:** «ACOPLE RAPIDO» → «Acople rápido».
- **URL:** `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/<tipo>/<nombre>/`. Son nuevas: en WordPress los productos no tenían URL, así que no hay 301.
- **Indexación:** los tipos «excavadoras» y «minicargadores» de aditamentos estaban vacíos y fuera del sitemap. Con equipos dentro, entran solos (`tiposConEquipos`).

**Usados → `equipos-usados`,** categoría nueva «Aditamentos», con «Pestaña en
la portada = Aditamentos» y disponibles.

| WordPress (títulos)                          | Nombre                        | Datos                                        |
| -------------------------------------------- | ----------------------------- | -------------------------------------------- |
| OKADA / OKADA TOP 100                        | Okada TOP 100                 | 1,1 t                                        |
| MARTILLO / NPK                               | Martillo NPK 2015             | Año 2015; «Para maquinaria de 20 toneladas.» |
| CRUSHER / NPK G-17                           | Crusher NPK G-17 2012         | Año 2012                                     |
| AFTER MARKET / ACOPLE RÁPIDO PARA EXCAVADORA | Acople rápido para excavadora | «Para excavadoras de 7, 9 y 12 toneladas.»   |

- **Sin dato:** «N/A», «-» y «0 toneladas» quedan vacíos.
- **Serial:** nunca sale del extractor.
- **«After market»:** no es una marca. El acople va sin marca.
- **Marcas de usada:** «Okada» y «NPK» las crea el importador (no el gancho de la unidad), para que la retirada las conozca.
- **Fotos repetidas del carrusel:** WordPress repite una foto en varios tamaños o con dos nombres. Se agrupan por su huella visual (miniatura de 8 × 8) y de cada grupo queda la de más píxeles. Okada: de 6 a 2.
- **Dirección web:** de `direccionesDeUnidades`, como el resto de usados. Por ejemplo, `/maquinaria-pesada/maquinaria-pesada-usada/aditamentos/martillo-npk-2015/`.
  - No llevan 301: en WordPress no tenían página propia.
- **La pestaña «Aditamentos» de la portada** las muestra **sin cambiar código:** `getEquiposUsadosDePortada` ya lee las unidades disponibles con esa pestaña.

**Qué queda igual:** el tipo «aditamentos» de la marca aditamentos de nueva
(`…/nueva/marcas/aditamentos/aditamentos/`, la página antigua de las 4 unidades)
queda vacío. Así no se indexa ni sale en el sitemap, pero responde 200. Si se
quiere un 301 a la categoría de usados, es una fila de `redirects` (lo decide
dirección).

## 3. Cómo se importa

```
python -I scripts/aditamentos/extraer-xml.py <exportacion.xml> Desktop\partequipos-cierre\aditamentos-wordpress.json
npm run preview:aditamentos:simular -- fotos   # sin escribir; descarga las fotos y mide las repetidas
npm run preview:aditamentos:importar
npm run preview:aditamentos:retirar            # deshace EXACTAMENTE lo del manifiesto
```

- **Manifiesto:** `Desktop\partequipos-cierre\manifiesto-aditamentos-<destino>.json`. Fuera del repositorio, como la fuente.
- **Idempotente:** una segunda pasada actualiza y no crea nada.
- **No pisa lo ajeno:** una ficha que ya exista con la misma dirección y que no creara la importación se salta, con aviso.
- **Retirada exacta:** borra unidades, fichas, fotos, marcas de usada y la categoría que creó, y comprueba que los ficheros dan 404.
- **Coste:** 26 fotos y unos 7 MB. Ninguna pasa de 4,5 MB.
- **Después de importar:** redesplegar. Un script no refresca el sitio desplegado.

**En el preview, el 2026-10-16:** 12 fichas nuevas, 4 unidades, 26 fotos,
2 marcas de usada y la categoría.

**Sitio publicado:** con `runbook-importar-aditamentos-lanzamiento.md` (en
`Desktop\partequipos-cierre\`), destino `produccion` con su base y su almacén.
El mismo runbook crea los **301 de las 128 unidades usadas** con
`redirects-usados.ts` (§4), que faltaban en el sitio publicado.

## 4. Dirección de las unidades usadas en el importador de usados

`scripts/usados/importar-usados.ts` crea cada unidad con el `slug` de
`direccionesDeUnidades`, calculado sobre todas las unidades (el desempate por id
de WordPress depende de las demás).

- **Una unidad ya importada conserva su dirección al actualizarla,** porque puede tener enlaces. Si no coincide con el cálculo, el importador avisa.
- **Las 128 ya estaban importadas** en el preview (2026-10-07) y en el sitio publicado (2026-10-14). En los dos, las direcciones las puso por SQL la migración del #193, y las repetidas llevan el **id de la base** (`…-2016-35`), no el de WordPress. El importador solo decide la dirección de las unidades que se creen a partir de ahora.
- **Los 301** (`redirects-usados.ts`) leen la dirección de la base, así que apuntan a lo que de verdad se sirve.

## 5. Licencias (para el cliente)

Las fotos vienen de la web del cliente, pero varias parecen de **catálogo de
fabricante**: «Martillo-para-maquinaria-pesada» (alt «martillo okada»), las de
NPK (martillo y crusher), y las de 2022 con CASE y Link Belt en el nombre (no
importadas). Están en la lista de licencias del lanzamiento
(`docs/runbook-lanzamiento.md`, paso c).
