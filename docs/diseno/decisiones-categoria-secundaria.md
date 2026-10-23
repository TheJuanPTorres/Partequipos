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

## Maquinaria nueva sin marketplace (2026-10-22, dirección)

**En maquinaria nueva no hay marketplace ni catálogo con filtros en NINGUNA página** (el marketplace es solo para
usados). Lo de arriba (la «Categoría secundaria» en nueva) queda sustituido:

- **Índice** `/maquinaria-pesada/maquinaria-pesada-nueva/`: la plantilla de índices de Andrés, como `/maquinaria-pesada/`
  (`IndiceTarjetas`). Lleva la cabecera y **dos tarjetas** centradas, «Por marca» → `…/nueva/marcas/` y «Por tipo de
  máquina» → `…/nueva/tipos/`.
  - **Fotos, de las que ya había** (sin campo nuevo):
    - «Por marca»: la «Imagen de la tarjeta» de la primera marca que la tenga, por nombre y sin «Aditamentos»;
    - «Por tipo»: la de la primera tarjeta de tipos con foto.
  - Mismo título y descripción que antes: el SEO no cambia. La plantilla no lleva formulario.
- **Índice de tipos** `…/nueva/tipos/` (**URL NUEVA, fijada por dirección**; no existía ni aquí ni en WordPress, donde el
  índice de nueva hacía de índice de tipos): una tarjeta por tipo (`src/lib/nueva/indiceTipos.ts`).
  - Un tipo de **varias marcas** va a su **categoría** (Excavadoras, Cargadores, Compactadores).
  - Uno de **una sola marca** va a su página de tipo, si el tipo tiene marcada la casilla «Tarjeta en el índice de
    tipos de maquinaria nueva» (antes «Pestaña en el índice…»; mismo campo, sin esquema). Un «paraguas» (Pavimentadoras
    de Dynapac) cuenta los equipos de los tipos que agrupa.
  - **«Aditamentos»** va al final.
  - Foto: la «Imagen de la tarjeta» del tipo o, vacía, la del primer equipo con foto.
- **Categorías que mezclan marcas** `…/nueva/<categoria>/`: como la página de tipo de nueva (#310). Llevan la cabecera,
  las tarjetas de equipo (`TarjetaEquipo`, sin tocarlo) **agrupadas por marca y tipo** con su subtítulo («Excavadoras
  Hitachi», `src/lib/nueva/paginaCategoria.ts`), la regla de tarjetas y el formulario al final. Mismo `<h1>`, título,
  descripción y canónica que antes.
- **Megamenú «Maquinaria pesada nueva → Por tipo de máquina»**: TODOS los tipos, cada uno a su página (de tipo o de
  categoría). «Aditamentos» sigue con su entrada propia.
  - **Orden de la web antigua** (`src/lib/nueva/ordenTipos.ts`): Bulldozer, Excavadoras, Motoniveladoras,
    Miniexcavadoras, Minicargadores, Retrocargadoras, Compactadores, Pavimentadoras y Cargadores. Un tipo nuevo que no
    esté en la lista va detrás, por nombre. El mismo orden en el índice de tipos.
  - **Una entrada por tipo** (`unaEntradaPorTipo`): si una categoría y un tipo se llaman igual, gana la categoría solo
    si mezcla marcas.

**Las URL de antes no dan 404:**

- `…/nueva/pagina/<n>/` y `…/nueva/<categoria>/pagina/<n>/` → **301** al índice o a la categoría, con o sin filtros
  (manejadores de ruta, fuera del sitemap);
- con filtros en la query (`?marca=…`, `?orden=…`), la misma página, con la canónica sin query.

`marcas`, `tipos` y `pagina` quedan **reservadas** como dirección de una categoría de nueva
(`src/lib/nueva/slugsReservados.ts`). Las páginas son estáticas: las revalidan los cambios de marca, tipo, equipo y
categoría (las categorías, por el patrón de su ruta). Desaparecen `ListadoNueva` y `src/lib/nueva/listado.ts`. Las
fichas y sus URL no cambian.

**Datos del sitio publicado (hallazgo, 2026-10-22):** alguien montó el «Por tipo» del menú creando categorías a mano.

- **Excavadoras** tiene por dirección una URL pegada, y por eso **`/…/nueva/excavadoras/` (de WordPress) da 404**.
- Hay más direcciones pegadas (Bulldozer, Motoniveladoras, Pavimentadoras) y categorías vacías o con erratas
  (`compactadoras`, `minicargasoras`, `miniexcavadoras`, `retrocargadores`).
- «Cargadores» incluye los minicargadores.

Se limpia desde el panel con `runbook-nueva-tipos-y-categorias.md`, que deja las tres de WordPress, borra el resto con
sus 301, y marca las casillas de Minicargadores (CASE) y Pavimentadoras (Dynapac), que el índice de WordPress tenía.
En el preview ya están marcadas.

## Sin página intermedia y una página general por tipo (2026-10-23, cliente y dirección)

**`/tipos/` es la página principal de maquinaria nueva.**

- `/maquinaria-pesada/maquinaria-pesada-nueva/` (las dos tarjetas «Por marca» / «Por tipo de máquina») da **301** a
  `/maquinaria-pesada/maquinaria-pesada-nueva/tipos/`:
  - el 301 está en `REDIRECTS_FIJOS` (`src/lib/redirects/fijos.ts`);
  - la paginación antigua (`pagina/<n>/`) va directa a `/tipos/`, en un salto;
  - sale del sitemap y deja de ser un destino válido de una redirección (serían dos saltos).
- `/tipos/` lleva el título y la descripción del antiguo índice («Maquinaria pesada nueva»), con canónica propia. En
  las migas de todas las páginas de nueva, «Nueva» lleva aquí.
- Megamenú:
  - «Ver toda la maquinaria nueva» lleva a `/tipos/`;
  - «Por tipo de máquina» empieza con «Ver todos los tipos de máquina», igual que «Ver todas las categorías» de
    repuestos.
- Los enlaces que son datos del panel (pie, tarjeta «Maquinaria nueva» de `/maquinaria-pesada/` y Nosotros) se
  cambian con `runbook-nueva-paginas-generales.md`.

**«Por tipo de máquina» y el índice de tipos llevan SIEMPRE a la página general del tipo.**

- La página general es una **categoría de nueva**, con la plantilla de las que mezclan marcas (tarjetas agrupadas por
  marca y formulario al final), aunque hoy solo tenga equipos de una marca.
- `unaEntradaPorTipo` (`ordenTipos.ts`):
  - la categoría gana siempre al tipo de una marca;
  - un tipo SIN categoría sigue yendo a su página en la marca (casilla «Tarjeta en el índice de tipos»), para no
    perder la entrada mientras se crea la categoría.
- Las páginas de marca + tipo se quedan: se llega a ellas desde la marca.
- **Las 9 páginas generales:**
  - ya existían (WordPress) Excavadoras, Cargadores y Compactadores;
  - nuevas: Bulldozers, Motoniveladoras, Miniexcavadoras, Minicargadores, Retrocargadoras y Pavimentadoras, en
    `/maquinaria-pesada/maquinaria-pesada-nueva/<tipo>/`, porque WordPress no tenía ninguna de ellas.
- En el preview, con `scripts/nueva/tipos-generales.ts aplicar`, con manifiesto y retirada exacta.
- **Guarda:** una categoría de nueva no se guarda si una redirección sale de su URL (`slugCategoriaNuevaValido`). El
  proxy aplica las redirecciones antes que las páginas, así que la categoría quedaría tapada sin ningún error (pasaba
  con `/…/nueva/miniexcavadoras/`, el 301 a Yanmar de la limpieza del panel).
