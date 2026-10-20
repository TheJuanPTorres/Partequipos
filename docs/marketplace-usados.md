# Marketplace de maquinaria usada y filtros de los listados

El mapa de alcance (sección 01) pide que la línea USADA funcione como un
«marketplace programático»: cada categoría o marca genera su página con
título, descripción, metadata y **filtros**. La propuesta y las decisiones de
dirección del 2026-10-13 (D1–D7) están en
`Desktop\partequipos-cierre\propuestas\2026-10-13-marketplace-usados.md`.

| Paso | Qué                                                                                           | Estado                                      |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| (a)  | Módulo común de filtros y su uso en las categorías de usados, sin esquema                     | Este documento                              |
| (b)  | Marcas de usados (colección, migración y página `/…/maquinaria-pesada-usada/marcas/<marca>/`) | Este documento, §6                          |
| —    | Maquinaria nueva con el mismo módulo y su adaptador (agente B), con el peso numérico (D6)     | Pendiente (B)                               |
| —    | Aditamentos (D2)                                                                              | Lo decide el cliente; sus 4 URL no se tocan |

## 1. El módulo común (`src/lib/filtros/`)

Puro: sin React, Payload ni Next. Todo tiene pruebas (`filtros.test.ts`).

| Fichero      | Qué hace                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `tipos.ts`   | `Catalogo<T>`: las facetas (`lista` o `tramos`) y los órdenes. El primer orden es el de por defecto                            |
| `leer.ts`    | La URL a `Seleccion` (`leerSeleccion`), `depurar` (quita valores que no tiene ningún registro) y la forma canónica de la query |
| `aplicar.ts` | `filtrar`, `facetasConCuenta`, `ordenar`, `paginar` y `compararNumeros`                                                        |
| `url.ts`     | Los enlaces: alternar o quitar un valor, el orden, limpiar, los chips y las opciones de «Ordenar»                              |
| `seo.ts`     | `metadataFiltrada` (noindex, follow y canónica sin filtros) y `metadataSinIndexar` (D4)                                        |
| `listado.ts` | `resolverListado`: todo lo anterior junto. Devuelve `redirigir`, `no-existe` o el listado                                      |

**Componentes:** desde el 2026-10-18 (petición del cliente), los listados de
usada y de nueva comparten la plantilla «Categoría secundaria» de ux-9
(`src/components/listado/`): `PlantillaListado` (cabecera, pestañas, recuento,
filtros elegidos, «Ordenar» y vista lista/rejilla), `PanelFiltrosListado` (el
lateral «Filtrar», formulario GET sin JavaScript) y `TarjetaListado`. La
paginación sigue en `src/components/catalog/filtros/Paginacion`. Los
componentes provisionales de antes (`PanelFiltros`, `SeleccionActual` y
`Ordenar`) se quitaron al quedarse sin uso.

### Reglas de la URL

- **Una clave repetida por valor:** `?marca=hitachi&marca=liugong&anio=2019`.
  Es lo que envía el formulario GET del panel, así que aplicar filtros no
  provoca ninguna redirección.
- **Forma canónica:**
  - facetas en el orden del catálogo;
  - valores en el orden en que los pinta el panel (tramos como se definen, años de mayor a menor, el resto alfabético);
  - `orden` solo si no es el de por defecto.
- **Cualquier otra forma, 308 a la canónica:** mayúsculas, otro orden, un valor que no existe o el orden por defecto escrito. Se conservan los parámetros desconocidos (`utm_…`).
- **Valores válidos:** `[a-z0-9-]`, como mucho 20 por faceta.
- **Cambiar un filtro o el orden vuelve a la página 1.**
- **Una página que no existe con esa selección:** 404.

### SEO

- **Con filtros u otro orden:** `noindex, follow` y canónica a la página 1 sin filtros. Los chips y «Ordenar» llevan `rel="nofollow"`. Nada de esto va en el sitemap.
- **Con el sitio cerrado a buscadores:** no se toca `robots`. Un `follow` de la página pisaría el `nofollow` del layout.

## 2. Cómo se usa en una línea: el adaptador

Ejemplo: `src/lib/usados/filtros.ts`. Una línea nueva (maquinaria nueva) hace
lo mismo:

1. Un tipo con lo que necesitan los filtros de cada registro.
2. Un `Catalogo<ese tipo>`, con las facetas y los órdenes:
   - cada orden **desempata por id**: si no, la paginación repetiría registros;
   - los que no tienen el dato van al final (`compararNumeros`).
3. Una consulta que traiga **todos** los registros del listado, con lo justo para la tarjeta, en la caché de datos (§3).
4. En la página: `resolverListado(...)` y traducir el resultado: `permanentRedirect`, `notFound` o pintar (ver `src/lib/usados/listado.ts`).

Facetas de usados (tramos sacados del inventario del preview del 2026-10-13):

| Faceta         | Clave   | Tipo   | Valores                                                     |
| -------------- | ------- | ------ | ----------------------------------------------------------- |
| Marca          | `marca` | lista  | Slug del texto de la marca (hasta el paso b)                |
| Año            | `anio`  | lista  | El año                                                      |
| Horas de uso   | `horas` | tramos | `0-2000`, `2000-4000`, `4000-6000`, `6000-8000`, `8000-mas` |
| Peso operativo | `peso`  | tramos | `0-6`, `6-10`, `10-20`, `20-30`, `30-40`, `40-mas` (t)      |

Órdenes: `recientes` (por defecto: año descendente, como antes),
`menos-horas`, `menor-peso` y `mayor-peso`.

## 3. Listados dinámicos con caché de datos (D3)

Leer la query pasa la página a render dinámico. Las categorías de usada y su
paginación (`/pagina/N/`, del #117) son **dinámicas**. Sus datos no salen de
una consulta por visita: van en `unstable_cache` (`src/lib/cacheDatos.ts`).

- **Una entrada para todo el inventario disponible**, con la primera foto ya resuelta (dos consultas por entrada, no por petición). Filtrar, contar, ordenar y paginar se hace en memoria.
- **Etiqueta `datos:usados`.** La invalidan los ganchos de `equipos-usados` y `categorias-usada` (`revalidarDatos`, con `expire: 0`, para que el editor vea su cambio ya).
- **El id del despliegue va en la clave:** esa caché persiste entre despliegues. Así, redesplegar tras una importación (los scripts no invalidan nada) sigue refrescando los datos.
- **Sin vigencia por tiempo, a propósito:** la portada y el índice de usada son estáticos y leen los mismos datos. Con una vigencia, Next les pasaría su `revalidate`.

## 4. Páginas vacías (D4)

Una categoría o marca de usada **sin unidades disponibles** no se indexa
(`noindex, follow`) ni sale en el sitemap. La URL sigue respondiendo 200, con
el estado vacío («Por ahora no hay unidades disponibles…» y el enlace a
contactar). En cuanto entra una unidad disponible vuelve a indexarse y al
sitemap **sola**: los ganchos de `equipos-usados` invalidan `datos:usados`, la
página es dinámica y, desde el 2026-10-15, esa misma invalidación regenera el
sitemap (que ya no es dinámico: se cachea, con vigencia de 1 h como red;
`revalidarIndices` en `src/lib/cacheDatos.ts`).

**Vale también para las 8 categorías heredadas del sitio actual**
(decisión de dirección del 2026-10-14). Hasta esa fecha seguían indexables
aunque estuvieran vacías (lista en `src/lib/usados/heredadas.ts`, ya
retirada).

## 5. Redirecciones del listado de WordPress (D7)

- `/excavadoras/` → categoría «Excavadoras» de usados.
- `/elementor-48399/` → índice de usados.

Son datos del panel, no código: las creó dirección en producción con
`Desktop\partequipos-cierre\runbook-redirects-usados.md`. En los preview no se
aplican (§10.22).

**EJECUTADO por dirección el 2026-10-13:** las dos 301 creadas desde el panel
de producción y comprobadas.

**Cambio del 2026-10-19 (§7):** `/elementor-48399/` era la página «Otros» de
WordPress y pasa a llevar a la página «Otros» nueva
(`/maquinaria-pesada/maquinaria-pesada-usada/otros/`). Se cambia el destino en
el panel de producción con
`Desktop\partequipos-cierre
unbook-elementor-48399-otros.md`, después de
desplegar la página.

## 6. Marcas de usados (paso b, D1)

**Colección «Marcas de maquinaria usada»** (`marcas-usada`, menú
Maquinaria):

- nombre, dirección web, descripción y logo;
- enlaces opcionales a la misma marca en maquinaria nueva y en repuestos (su página los enlaza);
- SEO, con el título por defecto «Maquinaria Hitachi usada».

**Crear una marca crea su página:**
`/maquinaria-pesada/maquinaria-pesada-usada/marcas/<marca>/`. Pagina como
las categorías y filtra por tipo de máquina, año, horas y peso
(`CATALOGO_USADOS_MARCA`). Sin unidades disponibles, no se indexa ni sale en
el sitemap (D4). El índice de usados enlaza las marcas que tienen unidades.

**La marca de una unidad** es la relación «Marca»
(`equipos-usados.marcaUsada`). El texto de antes (`marca`) sigue, oculto. El
gancho `marcaUsadaSincronizada` los mantiene de acuerdo:

- **con relación**, el texto pasa a ser su nombre;
- **solo con texto** (el importador de WordPress o un editor), busca la marca por el slug del texto y, si no existe, **la crea**.

Por eso el importador no cambia. En los filtros de las categorías, la marca
sale de la relación o, sin ella, del slug del texto, que es el mismo.

**Migración** `20261014_020810_marcas_usada`:

- el esquema generado;
- un **relleno con SQL explícito** (§3.5): una marca por cada valor distinto del texto, con el slug de `formatSlug`, y cada unidad apuntando a la suya.

El slug del SQL se comprobó contra `formatSlug` con las 7 marcas del preview
y 3 casos inventados (tildes, eñe y barra).

**«marcas» queda reservada** como dirección web de una categoría de usada
(`src/lib/usados/slugsReservados.ts`). La página de marca la tendría tapada:
el panel lo dice en español al guardar.

**Pendiente:** retirar el texto `marca` y `pestanaPortada` con su migración (M3 de la propuesta), cuando producción esté migrada y sin unidades sin marca.

## 7. Primer nivel y «Otros», como en WordPress (2026-10-19, cliente)

En el **megamenú** («Maquinaria pesada usada») y en el **índice de usados**
solo hay tres entradas: **Excavadoras, Aditamentos y «Otros»**. «Otros» lleva
a una página nueva, `/maquinaria-pesada/maquinaria-pesada-usada/otros/`, con la
misma «Plantilla 1» del índice: una tarjeta por cada categoría agrupada, con su
número de unidades, y las vacías detrás con «Sin unidades por ahora».

- **Qué va en «Otros»:** la casilla **«Agrupar en «Otros»»** de cada categoría
  de usada (marcada por defecto: una categoría nueva va a «Otros»).
  Desmarcada, la categoría sale sola en el primer nivel, por su **«Orden en el
  primer nivel»**; «Otros» siempre detrás. La migración
  `20261020_040506_usados_otros` deja desmarcadas Excavadoras (1) y
  Aditamentos (2).
- **Textos de la página:** grupo «Página «Otros» de maquinaria usada» del
  global «Páginas índice» (antetítulo, título —vacío, «Otra maquinaria pesada
  usada»—, texto, foto de fondo y foto de la tarjeta «Otros» del índice; vacía,
  la de la unidad más reciente de las agrupadas).
- **«otros» queda reservada** como dirección de categoría, igual que «marcas».
- **SEO:** migas y `BreadcrumbList`; sin unidades en ninguna agrupada, como D4,
  no se indexa ni va al sitemap. Sin ninguna categoría agrupada, 404 y sin
  entrada en el menú ni en el índice.
- **En el menú,** «Otros» lleva «Sin unidades por ahora» solo si ninguna de sus
  categorías tiene unidades; las de primer nivel, como antes (#257).
- **No cambian** las páginas de cada categoría, sus fichas ni sus pestañas.
- **Sin el bloque «Marcas» en el índice desde el 2026-10-20** (dirección: en
  usados interesa la categoría, no la marca). Las páginas de cada marca de
  usados siguen existiendo, con su sitemap.
- Lógica en `src/lib/usados/otros.ts`, con pruebas.
