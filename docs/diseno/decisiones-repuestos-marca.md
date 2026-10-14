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

## 5. Pendiente

- Imágenes reales de fondo (por marca) y de cada tipo: el cliente o el editor, desde el panel.
- `ordenMarca` y `enlace` de las categorías técnicas: en el panel (el ejemplo del preview pone el orden de ux-9).
- La copia de demostración a producción (`copia-demo.ts`, agente A) debe llevar `marcas.fondoHero`,
  `tipos-equipo.imagen`, `categorias-tecnicas.ordenMarca`/`icono` y el global `repuestos-marca`.
