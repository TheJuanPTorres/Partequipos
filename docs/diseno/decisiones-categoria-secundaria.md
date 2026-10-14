# «Categoría secundaria» de ux-9 — decisiones de la réplica

Listado de maquinaria NUEVA con la plantilla «Categoría secundaria» de ux-9: el **índice de nueva** (`/maquinaria-pesada/maquinaria-pesada-nueva/`) y **cada categoría** (`…/excavadoras/`, `cargadores/`, `compactadores/`), con su paginación (`…/pagina/<n>/`).

**Fuentes:**

- la página pintada `https://partequipos.uxdesign.website/ux-9/ux-categoria-principal/categoria-secundaria/`, medida a 390, 1010 y 1440 con Playwright (2026-10-13 y 2026-10-14, turno de `MEDICION.md`);
- el export `elementor-3370-2026-10-13.json`.

Análisis previo: `Desktop\partequipos-cierre\propuestas\2026-10-14-categoria-secundaria-analisis.md`.

## 1. Decisiones de dirección (2026-10-14)

1. La plantilla va en el índice de nueva y en cada categoría. **Las páginas filtradas no se indexan** (`noindex, follow` y canónica a la página 1 sin filtros).
2. **Pestañas:** una por categoría, más «Aditamentos» (la marca `aditamentos` de nueva).
3. **Sin filtro «Año»:** los equipos nuevos no tienen año.
4. **«Ordenar»:** recomendados (el orden de alta), peso de menor a mayor, de mayor a menor y nombre A–Z.
5. **Tramos de peso seguidos:** los mismos que usados (`TRAMOS_PESO`: menos de 6 t, 6–10, 10–20, 20–30, 30–40 y 40 o más), calculados desde `pesoOperativoKg` (#136, en kg).
6. **Lista paginada** (12 por página), con el icono de cuadrícula alternando **lista** (por defecto) y **rejilla**.

## 2. Cómo está hecho

| Pieza                                                                                               | Dónde                                                                                                         |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Adaptador al módulo común de filtros de C (#120): facetas marca, peso, tipo y modelo, y los órdenes | `src/lib/nueva/filtros.ts` (+ pruebas)                                                                        |
| Ámbito (índice o categoría), carga con redirección canónica y 404, metadata                         | `src/lib/nueva/listado.ts`                                                                                    |
| Datos: todos los equipos con lo que pinta su tarjeta, en la caché de datos (`datos:nueva`)          | `getListadoNueva` en `src/lib/queries/getMaquinaria.ts`                                                       |
| Invalidación: ganchos de equipos nuevos, marcas, tipos, categorías y documentos                     | `src/collections/hooks/maquinariaHooks.ts`                                                                    |
| Plantilla                                                                                           | `src/components/nueva/ListadoNueva.tsx` y `listado.module.css`                                                |
| Único componente de cliente: el conmutador lista/rejilla                                            | `src/components/nueva/CambioDeVista.tsx`                                                                      |
| Páginas                                                                                             | `maquinaria-pesada-nueva/page.tsx`, `pagina/[pagina]`, `[categoria]/page.tsx` y `[categoria]/pagina/[pagina]` |

**No hay mecanismo de filtros propio:** leer la URL, la forma canónica, los recuentos, el orden, la paginación y el SEO de las filtradas son del módulo de C. Aquí solo están el adaptador y la apariencia.

**Los datos de la tarjeta:**

- la primera foto del equipo y el logo de su marca;
- el tipo y la marca como título, y el código en rojo;
- peso operativo, potencia y motor, sacados de las filas de la ficha técnica (`datoDeFicha`);
- «Ver producto», y «Cotizar» al formulario de la ficha (`#cotizar`);
- en la rejilla, «Ver más» y el PDF de «Ficha técnica».

**Las páginas son dinámicas** (leen la query), como los listados de usados. La paginación queda fuera del sitemap, como en usados.

## 3. Erratas corregidas y errores de la maqueta (para Andrés)

| En ux-9                                                                                                                | En el sitio                                                                                                    | Por qué                                                                  |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| «Excabadoras», «Aditamientos», «Caterpilla»                                                                            | «Excavadoras», «Aditamentos», «Caterpillar»                                                                    | Erratas                                                                  |
| El segundo bloque del lateral se titula «Marcas»                                                                       | «Peso operativo (t)»                                                                                           | Son tramos de peso                                                       |
| «10 - 15(15)», «7.0 - 8.5(15)»                                                                                         | El mismo formato en todos, con su recuento                                                                     | Errata de formato                                                        |
| **A 1010 la página se rompe:** salen a la vez la lista y la rejilla, apretadas, con los botones montados y sin lateral | Hasta 1024 px, la composición de móvil (una columna, «Filtrar» plegado); desde 1025, el lateral a la izquierda | Lo pintado a 1010 no es un diseño                                        |
| «Ordenar» sin opciones (imágenes de galería de relleno)                                                                | Las 4 opciones aprobadas                                                                                       | No estaba definido                                                       |
| Acordeones «Tipo de equipo», «Año» y «Modelo» con lorem ipsum                                                          | «Tipo de equipo» y «Modelo», con sus casillas y recuentos; sin «Año»                                           | No estaba definido; nueva no tiene año                                   |
| Resultados en un carrusel de 2 «páginas»                                                                               | Lista paginada                                                                                                 | Un carrusel esconde resultados a buscadores y a quien navega con teclado |

## 4. Desviaciones que quedan (pendientes)

- **Cabecera sin foto:** ux-9 lleva una foto de fondo, y las categorías de nueva no tienen campo de imagen (sería cambio de esquema). Va con un degradado oscuro de la marca.
- **Orden de las pestañas:** por nombre (Cargadores, Compactadores, Excavadoras), porque las categorías no tienen campo de orden. ux-9 empieza por Excavadoras.
- **Logos de marca:** salen los que tenga cada marca en el panel. En el preview, 3 de 5 (Hitachi, CASE y Yanmar); faltan Dynapac y «aditamentos».
- **Migas:** con los cuatro niveles de la ruta («Inicio / Maquinaria pesada / Maquinaria pesada nueva / Excavadoras»). ux-9 pinta dos, pero así coinciden con el `BreadcrumbList`.
- **Título de la tarjeta en plural** («EXCAVADORAS HITACHI»): sale del nombre del tipo, que en los datos está en plural. ux-9 escribe «EXCAVADORA HITACHI».
- **El peso de la tarjeta** es el texto de la ficha técnica tal cual (p. ej. «12,800kg»). El filtro y el orden usan el número (`pesoOperativoKg`), que se rellena con la importación de A.

## 5. Medido en el preview (2026-10-14)

- **Índice:** 80 equipos, 12 tarjetas por página. **Excavadoras:** 30.
- **Paginación:** la página 2, con «página 2» en el título y su canónica. `/pagina/1/` redirige (308) a la página 1; una página que no existe da 404.
- **Filtros:** con el de Hitachi, «18 de 80» y la canónica a la página sin filtros. Una query mal escrita (`?marca=HITACHI&orden=recomendados`) redirige (308) a `?marca=hitachi`.
- **Pintado a 390, 1010 y 1440:** composición de ux-9 en escritorio y en móvil; a 1010, la de móvil.
- **Fallo encontrado al medir:** las tarjetas salían sin foto. Con `select`, Payload devuelve `url: null` si no se pide `filename`. Arreglado aquí, y en el listado de usados con su propio PR (#141, con un guardarraíl).
