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
| Índice de categorías   | `…/categoria-repuestos-para-maquinaria-pesada/`             | Encabezado, las categorías técnicas (tarjetas con foto desde el 2026-10-20, §9), las marcas con las que trabajamos, contacto y testimonios                                                |
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
>
> **CAMBIADO otra vez el mismo día (dirección):**
>
> - **Logo dos veces un 15 % más grande (×1,3225) y la baldosa igual:** hasta el 92,6 % del ancho y el 66,1 % del
>   alto. En móvil no cabía con el relleno de 12 px (habría ocupado el 105,8 % del contenido), así que el relleno de
>   la baldosa baja a 4 px y el logo queda al 94,4 % y al 66,2 %, a 9 px del borde a 390. Es `baldosaLogo`, que solo
>   usan los dos índices de marcas (este y el de maquinaria nueva).
> - **Sin el hero grande** en los dos índices de marcas: ni la foto, ni la descripción, ni el icono del ratón. La
>   cabecera es la caja oscura y baja de las baldosas, pegada a la cabecera del sitio. Lleva el `<h1>` de siempre
>   (antetítulo «Maquinaria pesada nueva» o el título del global de repuestos, y «Marcas») en lugar de
>   «Partequipos / Nuestras marcas» (`BaldosasMarcas` con `h1`). Título, descripción y canónica de la página, sin
>   cambios.
> - **El índice de marcas de maquinaria nueva ya no lleva la baldosa de «Aditamentos»** (`placasDeMarcasNueva`). No
>   es una marca. Su página sigue publicada y la enlaza el megamenú. No hay casilla en el panel solo para el índice, y
>   «Mostrar en la web» ocultaría también la página.
> - **Índice de marcas de nueva: con exactamente 4 marcas, una sola fila en escritorio** (dirección, 2026-10-21;
>   `cuatroEnUnaFila` de `BaldosasMarcas`), en lugar del 2 + 2. Excepción solo de ese índice: la baldosa mide lo
>   mismo (2 de 8 columnas), así que los logos siguen en ×1,3225. Con 5 o más, la colocación de siempre de las
>   baldosas (4 por fila, la última centrada); tablet y móvil, 2 por fila, como siempre. Repuestos, sin cambios.

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

## 9. Índice de categorías técnicas con tarjetas, y cabeceras propias (2026-10-20, dirección)

En `…/categoria-repuestos-para-maquinaria-pesada/` las 10 píldoras con icono dejan paso a **las tarjetas de las
páginas índice** (`TarjetasMarca`, variante `indice`: foto arriba, recuadro blanco que sube sobre ella con el título y
«Ver todo»), las mismas de «Repuestos por marca» y «Categorías técnicas» del índice de repuestos. Es el componente de
siempre, sin uno nuevo, y las tarjetas salen de `tarjetasDeCategorias` (el de las páginas de tipo): el mismo orden
(`ordenMarca`, luego el nombre) y cada una a su categoría. Con 10, la colocación de §11 de
`decisiones-indices-contacto.md`: 3 + 3 + 3 + 1, con la última centrada; 2 en tablet y 1 en móvil. El título «Nuestras
categorías de repuestos» del global se conserva como `<h2>` y las tarjetas cuelgan de él (`<h3>`). El encabezado,
las marcas, el contacto y los testimonios no cambian.

- **Foto de cada tarjeta:** la «Imagen de la tarjeta» de la categoría (antes «Imagen de la tarjeta en la portada»; solo
  cambia la etiqueta). **Ya tenía las fotos de la página de categorías de WordPress:** comparadas con las de la
  referencia, 9 son idénticas byte a byte y la de motor diésel es la misma foto, a las mismas medidas, recomprimida al
  importarla. Están en el sitio publicado desde el contenido real de la portada, así que no hay que subir ninguna.
- **Cabeceras propias** (migración `20261020_192253_categorias_cabeceras`, solo esquema, campos vacíos):
  - «Fondo del encabezado» en cada categoría técnica (`fondoHero`). Vacío, como hasta ahora: la imagen de la tarjeta
    y, sin ella, la de respaldo (`fondoDeRespaldo`, la primera marca de repuestos con foto).
  - «Foto de fondo del encabezado» del índice, en el grupo nuevo «Página «Categorías técnicas» de repuestos» de
    «Páginas índice y contacto» (`categoriasRepuestos.fondo`). Vacía, la de respaldo de siempre. Guardar el global
    revalida también esta página.
  - El índice de marcas de repuestos y el de marcas de nueva siguen sin campo propio (dirección: más adelante).

## 10. «Ver todo» abre el panel, y los modelos del tipo en tarjetas (2026-10-21, dirección)

- **Marca de repuestos, las 13:** el «Ver todo» de cada tarjeta de tipo o serie abre el
  panel que sube desde abajo de la marca de nueva (`VerTodosEquipos`, de D, #290), con los
  modelos de la tarjeta (los de su serie, o todos los del tipo, con las «otras entradas» de
  WordPress) y, al pie, un enlace discreto a la página del tipo. Sin JavaScript, o con
  Ctrl/⌘/Mayús, lleva a la página del tipo, como antes. Misma animación, foco al título,
  Escape y vuelta del foco; la barra, en el color de la marca. Un tipo sin modelos sigue
  con el enlace. Los modelos salen de una sola consulta por marca (`getModelosDeMarca`).
- **Página de tipo:** los botones de modelo pasan a TARJETAS con el estilo «difuminado»
  (`RejillaTarjetas`, la de `TarjetasMarca` con `indice`), agrupadas por serie con su
  título y su ancla (`#serie-ex`). Mismo nombre, mismo código (debajo del título) y mismo
  destino; botón «Ver repuestos»; una entrada sin ficha va sin botón. Foto: la del modelo
  (328 de 349 la tienen); sin ella, la de su serie y, si no, la del tipo. La sección es
  blanca y se une con la de categorías que la sigue: la franja del color de la marca bajo
  el encabezado ya no lleva los botones.
- **Largo de la página de tipo (decisión de dirección, el mismo día):** de cada serie (o de
  la lista entera, en un tipo sin series) solo se ven las 2 PRIMERAS FILAS (6 tarjetas en
  escritorio, 4 en tablet, 2 en móvil) y debajo «Ver todos (N)», que abre el mismo panel con
  la serie completa. Si cabe en 2 filas, no hay botón. Es solo CSS con
  `@media (scripting: enabled)`: sin JavaScript se ven todas y el botón no sale. Las anclas
  (`#serie-ex`) no cambian.

## 12. Categorías técnicas con la plantilla 4007 de la marca (2026-10-22, dirección)

Las 10 páginas de categoría técnica (`…/categoria-repuestos-para-maquinaria-pesada/<categoria>/`)
dejan la página provisional del §7 y usan la **misma plantilla que la marca de repuestos** (4007,
la de Bobcat), adaptada. URL, SEO, JSON-LD y migas no cambian.

| Sección                                             | Qué lleva                                                                                                                                                             |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cabecera                                            | `HeroMarca` como antes (sin logo), con el ratón que baja a las categorías                                                                                             |
| «Nuestras categorías de repuestos»                  | Las píldoras de la marca **sobre el gris** (`fondo="gris"`): sin franja de color, porque no es una marca. **Sin la categoría de la propia página** (9 píldoras)       |
| «Qué incluye …»                                     | **Tarjetas difuminadas** (las de los índices) una por grupo, con su foto de WordPress, el nombre tal cual, **«Cotizar»** y **«Ver productos (N)»** (`TarjetasGrupos`) |
| Contacto, testimonios, «¿Por qué elegirnos?», sedes | Como la marca. «¿Por qué elegirnos?» no sale sin foto; sin marca, un cierre con `{marca}` tampoco                                                                     |

**Sin «Marcas con las que trabajamos»** (`PlacasMarcas`, sigue en los índices).

**«Cotizar»:** los productos no tienen página propia (en WordPress, «VER MÁS» solo despliega la
lista), así que abre la ventana del formulario con el grupo escrito en «¿Qué necesitas?»:
«Quiero cotizar: Cadena para maquinaria pesada (tren de rodaje). Marca y modelo de la máquina: »
(`mensajeCotizar`; el nombre pasa a tipo frase solo en el mensaje). Sin JavaScript baja al
formulario de la página.

**«Ver productos (N)»:** `<details>` nativo, como el «VER MÁS» de WordPress. La lista está en el
HTML aunque esté plegada (lo lee Google). Las tarjetas no se estiran: al desplegar una, las de su
fila no cambian.

**Interruptor «Qué incluye: diseño propio»** (global `repuestos-marca`): sin uso y **oculto en el
panel** (`admin.hidden`, sin migración). La columna se quita con una migración cuando haya
VENTANA. `QueIncluye.tsx` (las dos versiones, sencilla y propia) se borra.

**Fotos:** las 70 de los grupos ya están en el preview y en el sitio publicado (importación del
2026-10-18, `docs/repuestos-importacion.md` §9). No hay que subir nada.

**Medido en el preview** (2026-10-22, 1440 / 1010 / 390) en Componentes hidráulicos, Tren de
rodaje y Misceláneos (la de más productos, 61): 3 / 2 / 1 por fila con la última centrada
(regla #281), CLS ≤ 0,0013, sin desbordamiento ni errores; las 10 responden 200 con todas sus
fotos.

## 5. Pendiente

- ~~Imágenes reales de fondo (por marca) y de cada tipo~~ **HECHO el 2026-10-14 (agente C):** la imagen de cada tipo es la
  de su tarjeta en WordPress, importada (`docs/repuestos-importacion.md` §7). **El fondo por marca no existe en
  WordPress** (el encabezado visible no tiene foto): queda vacío y se quitó el de ejemplo de Caterpillar. Si se quiere
  uno, desde el panel.
- `ordenMarca` y `enlace` de las categorías técnicas: en el panel (el ejemplo del preview pone el orden de ux-9).
- La copia de demostración a producción (`copia-demo.ts`, agente A) debe llevar `marcas.fondoHero`,
  `tipos-equipo.imagen`, `categorias-tecnicas.ordenMarca`/`icono` y el global `repuestos-marca`.
