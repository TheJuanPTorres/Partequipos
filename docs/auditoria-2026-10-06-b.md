# Auditoría de accesibilidad y SEO del 2026-10-06: lo que toca a B

Informe de la auditoría (agente C): `Desktop\partequipos-cierre\informes\2026-10-06-auditoria-a11y-seo.md`. Decisiones de dirección del 2026-10-07.

## I2 · La marca en el `<title>`

**Antes:** 98 de 198 URL sin «Partequipos» en el título. `buildMetadata` usaba el título de la página tal cual.

**Ahora** (`tituloConMarca`, en `src/lib/seo/porDefecto.ts`, con pruebas): el `<title>` lleva « | Partequipos» al final, salvo en estos casos:

- en la portada;
- si ya lleva la marca, para no dejar «… - Partequipos | Partequipos» (el SEO de Yoast importado del WordPress la trae a menudo);
- si con ella pasaría de **60 caracteres**: entonces va entero, sin marca.

El título de Open Graph y de Twitter va **sin** la marca, que ya está en `og:site_name`.

`porDefecto.ts` es puro y lo comparte el panel: la vista de Google de «Buscadores y redes sociales» (agente C) tiene que usar la misma función para enseñar el título que saldrá publicado. Aviso a C en `ESTADO.md`.

## I4 · Foco visible en las tarjetas expandibles de Nosotros

**Lo que pasaba:** la tarjeta ya tenía su contorno de foco (`.tarjeta:has(.disparador:focus-visible)`, desde el 2026-10-02), pero la tarjeta anima `all` sus propiedades en 0,8 s, **el contorno incluido**. Justo al pulsar TAB el contorno estaba empezando a aparecer y no se veía, que es lo que captó la auditoría.

**Arreglo:** el contorno y su separación, sin transición (`outline 0s, outline-offset 0s` al final de la lista). El resto de la animación no cambia.

## I7 · `Product` sin `offers`: ACEPTADO

**Decisión de dirección:** no se publican precios. El sitio es de catálogo y consulta, y declarar una oferta sin precio real sería incorrecto. El código ya lo decía (`buildProductJsonLd`).

**Consecuencia:** Google exige `offers`, `review` o `aggregateRating` para el resultado enriquecido de producto. **Las fichas no tendrán ficha enriquecida en Google**, solo el fragmento normal. El `Product` no da error.

**La `image` sí se emite:** las fichas de maquinaria pasan sus fotos y las de repuestos sus imágenes. La auditoría no la vio porque los datos de demostración de producción no tienen fotos; llegará con las imágenes reales del catálogo, sin tocar código.

## M2 · `Article` sin `image`

Igual que la `image` del producto: `buildArticleJsonLd` usa la imagen destacada del artículo. Los 8 artículos de demostración de producción no tienen; los 53 importados del WordPress sí, y en el preview el `Article` ya la lleva. Llegará con la migración del blog (runbook del blog), sin tocar código.
