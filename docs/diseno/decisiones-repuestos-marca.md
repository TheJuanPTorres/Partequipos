# Página de marca de repuestos (ux-9) — inventario, decisiones y desviaciones

Agente D, 2026-10-13. Plantilla 3373 del kit de ux-9 (`wordpress/repuestos-marca/elementor-3373-2026-10-13.json`);
referencia pintada: `partequipos.uxdesign.website/repuestos-para-maquinaria-pesada-caterpillar/`.

Sirve a las 13 marcas, en `…/repuestos-maquinaria-pesada-marcas/<marca>/` (los slugs de `url-map.csv`, sin
cambiar). Código: `src/app/(site)/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/[marca]/page.tsx`,
`src/components/repuestos/` y la lógica pura en `src/lib/repuestos/marca.ts` (con pruebas).

## 1. Secciones y de dónde sale cada dato

| #   | Sección                          | Qué se pinta                                                                                                                                                                    | De dónde sale                                                                                                                                      |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Encabezado                       | Tarjeta redondeada con foto de fondo y velo, **logo de la marca** en una placa oscura (D10), `<h1>` en dos líneas, presentación e icono de ratón (`animated_mouse_scroll_icon`) | `Marca.fondoHero` (nuevo), `Marca.logo`, `Marca.descripcion`; textos del global `repuestos-marca` (`tituloHero`, `subtituloHero`)                  |
| 2   | Nuestras categorías de repuestos | Franja amarilla con una píldora por categoría técnica y su icono                                                                                                                | `categorias-tecnicas` (comunes a las 13 marcas), orden por `ordenMarca` (nuevo), `icono` (3 valores nuevos), `enlace` si lo hay; título del global |
| 3   | Repuestos según tipo de máquina  | Una tarjeta por tipo de la marca con «Ver todo» a la página del tipo; al final, usadas y aditamentos (marketplace)                                                              | `tipos-equipo` de la marca + `TipoEquipo.imagen` (nuevo); las dos tarjetas del marketplace, en el global                                           |
| 4   | Contacto                         | Antetítulo, título revelado y formulario con «Estoy interesado en» y «Quién soy»                                                                                                | `FormularioSolicitud` (Zod, Turnstile y aviso por SMTP); `Solicitud.interes` y `Solicitud.perfil` (nuevos, opcionales)                             |
| 5   | Testimonios                      | El acordeón de vídeos de la portada                                                                                                                                             | Colección `testimonios` (los mismos que la portada), componente `SeccionTestimonios`                                                               |

Cabecera y pie son los globales del sitio.

**El «Mesa-de-trabajo-7-copia-2.png» del diseño es el logo de Caterpillar**, no una máquina (se confundió en el
inventario inicial): por eso no hay campo de «máquina recortada» y se usa el `logo` que la marca ya tenía.

## 2. Esquema (una sola migración, `20261014_004138_repuestos_marca`, solo opcionales)

- `marcas.fondo_hero_id`, `tipos_equipo.imagen_id`: imágenes opcionales. **No rompen el importador de marcas y tipos (agente B).**
- `categorias_tecnicas`: `orden_marca` y tres iconos más (`miscelaneos`, `componentes`, `diesel`; iconos de Tabler).
- `solicitudes.interes` y `solicitudes.perfil`: listas cerradas, sin texto libre; los demás formularios no los envían.
- Global `repuestos-marca`: títulos de las secciones y las dos tarjetas del marketplace. La migración **siembra los
  textos de ux-9 con SQL explícito** (§3.5), sin imágenes (L3).

## 3. Decisiones de dirección (2026-10-13)

1. Las categorías son **comunes a las 13 marcas**; sin página, la píldora va **sin enlace** y se enlaza sola cuando se
   rellena su «Enlace».
2. Se construye con lo que haya y contenido de ejemplo marcado «EJEMPLO UX-9 —» (`npm run preview:repuestos-marca:sembrar`
   / `:retirar`, solo preview, con manifiesto para restaurar lo previo).
3. Imágenes de ux-9 solo al preview, a `Media` por script (§10.38). A producción irán con la copia de demostración.
4. `interes` y `perfil` opcionales en `Solicitud`.
5. Usadas y aditamentos ocultas en móvil, como en el diseño.

## 4. Desviaciones del diseño (para Andrés)

| #   | Qué                                                                                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Las dos líneas del título van en un solo `<h1>` (en ux-9, dos `<h2>`).                                                                                                                                                                                         |
| D2  | Las tarjetas salen de los tipos de la marca (en ux-9, seis fijas). ux-9 oculta por posición la 4.ª a la 6.ª en móvil y la 3.ª y la 6.ª en tablet; aquí **ningún tipo se oculta** (sus enlaces siguen visibles). Solo usadas y aditamentos se ocultan en móvil. |
| D3  | El panel de la tarjeta crece con el título; en ux-9 tiene alto fijo y, con tres líneas, el botón asoma por debajo del panel (errata). Los paneles de una fila miden lo mismo.                                                                                  |
| D4  | En móvil ux-9 deja ver solo la 2.ª y la 3.ª categoría (`hide_mobile` por posición). Se replica por posición: como no llevan enlace, no se pierde ningún enlace rastreable.                                                                                     |
| D5  | Iconos de Tabler en vez de los SVG del kit (Flaticon, L2).                                                                                                                                                                                                     |
| D6  | La rueda del icono de ratón se mueve 2 veces (4,4 s) y se queda quieta; el widget la repite sin fin (WCAG 2.2.2). Con `prefers-reduced-motion`, quieta.                                                                                                        |
| D7  | El formulario no tiene «Empresa» (en el diseño es una opción de «Quién soy»), muestra los errores campo a campo y conserva lo escrito. Las etiquetas quedan para lectores de pantalla (el diseño usa placeholders).                                            |
| D8  | El logo lleva `alt` con el nombre de la marca (en ux-9, vacío); la foto de las tarjetas es decorativa y «Ver todo» describe su tarjeta con `aria-describedby`.                                                                                                 |
| D9  | Migas solo para lectores de pantalla (ux-9 no las pinta); el `BreadcrumbList` sigue.                                                                                                                                                                           |
| D10 | El logo va sobre una **placa oscura**, no blanca: los logos que entrega el cliente son blancos y no se ven sobre fondo claro (decisión de dirección, 2026-10-13). Con las versiones en color se vuelve a la placa blanca de ux-9.                              |

## 6. Página de TIPO (PROVISIONAL hasta el diseño de Andrés)

Decisión de dirección (2026-10-13): la página de tipo (p. ej. «Excavadora Caterpillar») usa el **mismo lenguaje
visual que la de marca**, mientras Andrés no entregue su diseño. **Es una desviación provisional**: se reemplaza
cuando llegue la plantilla.

- Ruta: `…/repuestos-maquinaria-pesada-marcas/<marca>/<tipo>/` (sin cambiar slugs). Código en
  `[marca]/[tipo]/page.tsx`, `src/components/repuestos/ModelosTipo.tsx` y `src/lib/repuestos/tipo.ts` (con pruebas).
- Encabezado: el de la marca (`HeroMarca`) con «Repuestos para <tipo>» y «<MARCA> En Colombia», la descripción del
  tipo, el logo de la marca en placa oscura y, de fondo, el `fondoHero` de la marca (si no lo tiene, la imagen del tipo).
- Franja amarilla «Modelos de <tipo> <MARCA>» con **una píldora-enlace por modelo** (nombre y código) a su ficha;
  sin modelos, un aviso.
- Después, el contacto y los testimonios de la página de marca (el formulario guarda como origen la página del tipo).
- Sin esquema ni migración. Los datos son los que importó B (32 tipos, 344 modelos).
- Los textos «Repuestos para <tipo>» y «Modelos de <tipo> <MARCA>» se componen en el código (no hay campo de panel
  para ellos): por eso es provisional.

## 7. Índices, categorías técnicas y principal de repuestos (PROVISIONAL hasta el diseño de Andrés)

Decisión de dirección (2026-10-13): completar la sección de repuestos del mapa de alcance con el **mismo lenguaje
visual** que marca y tipo. **Provisional**: se reemplaza cuando llegue la plantilla.

| Página                 | Ruta                                                        | Qué lleva                                                                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Principal de repuestos | `/repuestos-maquinaria-pesada-colombia/`                    | Encabezado, **cada marca** (placa oscura con su logo y enlace) con «Ver todas las marcas», **cada categoría** (píldora con enlace) con «Ver todas las categorías», contacto y testimonios |
| Índice de marcas       | `…/repuestos-maquinaria-pesada-marcas/`                     | Encabezado, las 13 marcas en placa oscura con enlace a su página, contacto y testimonios                                                                                                  |
| Índice de categorías   | `…/categoria-repuestos-para-maquinaria-pesada/`             | Encabezado, las categorías técnicas (píldoras con enlace), las marcas con las que trabajamos, contacto y testimonios                                                                      |
| Categoría técnica      | `…/categoria-repuestos-para-maquinaria-pesada/<categoría>/` | Encabezado con nombre, descripción e imagen de `CategoriaTecnica`, las marcas con las que trabajamos, contacto y testimonios                                                              |

- Las 10 categorías y sus URL salen de `docs/url-map.csv`. **Sin esquema**: una migración de DATOS
  (`20261014_023900_categorias_url_exacta`, SQL explícito) renombra los slugs sembrados a la URL exacta
  (`tren-de-rodaje` → `tren-de-rodaje-para-maquinaria-pesada`…) y siembra el campo «Enlace» de cada una. Esas URL
  daban 404, así que no hay redirección que crear.
- **Discrepancia a decidir por dirección:** el mapa de alcance da el motor diésel como
  `repuestos-motor-diesel-para-maquinaria-pesada`, pero esa URL no existe en el sitio vivo; la viva (200 en el
  rastreo) es `motor-diesel-para-maquinaria-pesada`. Se usó la VIVA (§3.3, y «manda la medición»). Cambiarla es una
  sola fila de la migración y un 301.
- Las 15 URL de categoría que el rastreo tiene además de las 10 (duplicadas con otro slug —`filtros-maquinaria-pesada`,
  `llantas`, `herramientas-de-corte`, `tren-de-rodaje`…— y los niveles inferiores como `tren-de-rodaje-itr`) siguen
  **sin decidir** (`docs/redirects-map.csv`, «HUÉRFANA»): no se tocan.
- Las páginas entran en el sitemap (índice y una URL por categoría) y las categorías de la página de marca y de la
  portada se enlazan solas (antes iban sin enlace). Se revalidan al guardar una categoría.
- Los textos «Marcas con las que trabajamos» y «Repuestos por marca» se componen en el código (no hay campo de panel):
  una razón más de que sea provisional.

## 8. Índice de marcas con «Mostrar marcas» de Andrés (2026-10-20, dirección)

> **CAMBIADO el mismo día (dirección):** las baldosas son BLANCAS con el logo de la marca, el de todo el sitio
> (`LogoMarca`, `docs/diseno/logo-marca.md`); ya no van del color de la marca.

Plantilla 4017 (`Desktop\partequipos-diseno\wordpress\indice-marcas-repuestos\elementor-4017-2026-10-20.json`).
**Solo cambia la parte de las marcas** de `…/repuestos-maquinaria-pesada-marcas/` (`BaldosasMarcas`); el encabezado,
el contacto y los testimonios se quedan como estaban. Las placas oscuras siguen en el índice de categorías y en cada categoría técnica.

- **Encabezado del bloque** como el export: «Partequipos» (M BOLD, 20/20/18 px) y «Nuestras marcas» como `<h2>`
  revelado por palabras (Principal, 55/40 px y 10vw), en blanco, en una caja de radio 30, relleno 50 y 35vh de alto.
- **Recuadro blanco** de radio 30 y relleno 50 con una **baldosa** por marca (radio 20, relleno 20), **rectangular en
  horizontal, 3:2** (dirección, 2026-10-20; el export la pinta cuadrada), con el logo centrado al 70 % del ancho como
  mucho y la mitad del alto. 4 por fila, 2 en tablet y en móvil, con **la regla del #281**: la última fila incompleta
  centrada y, con exactamente 4, 2 + 2 centradas (rejilla de 8 columnas donde cada baldosa ocupa 2; 4 en tablet y
  móvil). En móvil, menos relleno que el export (24 en el recuadro, 12 en la baldosa, 12 entre baldosas) y el logo al 80 %:
  con el del export se quedaba en unos 60 px de ancho. El logo encoge al pasar el ratón («shrink» de Elementor), salvo con «reducir movimiento».
- **Baldosa BLANCA con el logo de la marca** (dirección, 2026-10-20; antes, del color de la marca): el logo de todo
  el sitio (`LogoMarca`, `docs/diseno/logo-marca.md`), en sus colores o en tinta oscura con «Pintar el logo en
  oscuro». Un borde gris la separa del recuadro. Sin logo, su nombre. Mismas marcas que antes (`placasDeMarcas`: con
  nombre y dirección).
- **Sin franja amarilla** (dirección): ni el `#F2BC2E` del export tras los recuadros ni la mitad inferior de la del
  encabezado de la página. Es un índice general, no el de una marca.

**Desviaciones, para Andrés:**

- La caja del encabezado lleva en el export una foto del kit (`3425625-1-scaled.jpg`) con gris `#919191` en
  «multiply». **Licencia sin confirmar (L3):** sin ella, el tono oscuro de los encabezados sin foto (`#1f1d1b`).
- El export usa una fila sin salto con cuatro marcas; con las 13 reales, la fila salta y la última se centra.

## 5. Pendiente

- ~~Imágenes reales de fondo (por marca) y de cada tipo~~ **HECHO el 2026-10-14 (agente C):** la imagen de cada tipo es la
  de su tarjeta en WordPress, importada (`docs/repuestos-importacion.md` §7). **El fondo por marca no existe en
  WordPress** (el encabezado visible no tiene foto): queda vacío y se quitó el de ejemplo de Caterpillar. Si se quiere
  uno, desde el panel.
- `ordenMarca` y `enlace` de las categorías técnicas: en el panel (el ejemplo del preview pone el orden de ux-9).
- La copia de demostración a producción (`copia-demo.ts`, agente A) debe llevar `marcas.fondoHero`,
  `tipos-equipo.imagen`, `categorias-tecnicas.ordenMarca`/`icono` y el global `repuestos-marca`.
