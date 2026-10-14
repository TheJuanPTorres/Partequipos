# Marketplace de maquinaria usada y filtros de los listados

El mapa de alcance (sección 01) pide que la línea USADA funcione como un
«marketplace programático»: cada categoría o marca genera su página con
título, descripción, metadata y **filtros**. La propuesta y las decisiones de
dirección del 2026-10-13 (D1–D7) están en
`Desktop\partequipos-cierre\propuestas\2026-10-13-marketplace-usados.md`.

| Paso | Qué                                                                                           | Estado                                      |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| (a)  | Módulo común de filtros y su uso en las categorías de usados, sin esquema                     | Este documento                              |
| (b)  | Marcas de usados (colección, migración y página `/…/maquinaria-pesada-usada/marcas/<marca>/`) | Pendiente                                   |
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

**Componentes** (`src/components/catalog/filtros/`), de servidor y sin
JavaScript: `PanelFiltros`, `SeleccionActual`, `Ordenar` y `Paginacion`.

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

Una categoría de usada **creada en el panel** y sin unidades disponibles no
se indexa ni sale en el sitemap. Las 8 heredadas del sitio actual
(`src/lib/usados/heredadas.ts`) siguen indexables aunque se queden vacías. La
prueba compara esa lista con `docs/url-map.csv`.

## 5. Redirecciones del listado de WordPress (D7)

- `/excavadoras/` → categoría «Excavadoras» de usados.
- `/elementor-48399/` → índice de usados.

Son datos del panel, no código: las creó dirección en producción con
`Desktop\partequipos-cierre\runbook-redirects-usados.md`. En los preview no se
aplican (§10.22).

**EJECUTADO por dirección el 2026-10-13:** las dos 301 creadas desde el panel
de producción y comprobadas.
