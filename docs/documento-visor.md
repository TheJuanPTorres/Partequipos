# «Documento en visor»: los PDF como libro (2026-10-20)

Petición del cliente: los PDF que WordPress mostraba con DearFlip se leen en un
visor propio y ligero. Muestra aprobada por dirección el 2026-10-20, con el
visor al ancho de la página. La dependencia `page-flip` 2.0.7 también está
aprobada.

## Qué hay

| Pieza                                                | Dónde                                              |
| ---------------------------------------------------- | -------------------------------------------------- |
| Bloque «Documento en visor» (el mismo en dos sitios) | `src/collections/bloques/documentoVisor.ts`        |
| En «Bloques» de una página                           | `BLOQUES_PAGINA`, `PaginaConBloques`               |
| Dentro del texto enriquecido                         | `BlocksFeature` en `payload.config.ts`, `RichText` |
| «Páginas como imágenes» de cada documento            | `documentos.paginas` (→ `media`)                   |
| Componente de servidor (pide el documento)           | `src/components/documentos/DocumentoVisor.tsx`     |
| Visor (cliente)                                      | `src/components/documentos/VisorLibro.tsx`         |
| Lógica pura, con pruebas                             | `src/lib/documentos/visor.ts`, `enPagina.ts`       |
| Convertir un PDF en imágenes                         | `scripts/documentos/rasterizar-pdf.mjs`            |
| Subir las páginas, poner visores, retirar            | `scripts/documentos/visor.ts`                      |

Migración `20261020_183648_documento_visor`, solo esquema
(`paginas_blocks_documento_visor` y `documentos_rels`). El bloque dentro del
texto no necesita tablas: va en el JSON de Lexical.

## Cómo es ligero

- Con la página llegan el componente y la **portada**: las dos primeras páginas
  (una en móvil) como imágenes, con carga diferida y en una caja con la
  proporción de la página. El libro se monta encima en la misma caja: **CLS 0**.
- `page-flip` (~43 kB sin comprimir) se descarga con un `import()` **al
  interactuar**: un botón, una tecla o tocar el libro. Medido: un único chunk
  nuevo en ese momento.
- **Nunca pdf.js en el navegador:** las páginas son imágenes (WebP de 1600 px),
  servidas por el optimizador al ancho que se pintan.

## Comportamiento

- **Dos páginas** (libro abierto) si el visor mide 640 px o más; **una**
  por debajo, y se pasa deslizando. Es la misma regla con la que page-flip
  cambia de modo (`minWidth` 320 × 2) y la del CSS (`@container`).
- **Controles:**
  - anterior y siguiente;
  - contador («1–2 / 5»; «1 / 5» con una página), anunciado a lectores de pantalla;
  - miniaturas (botones «Ir a la página N»);
  - zoom al doble, con desplazamiento;
  - pantalla completa;
  - «Descargar PDF (tamaño)», siempre visible.
- **Teclado:** con el foco en el libro (es enfocable), ← → Inicio Fin.
- **Reducir movimiento:** el paso de página no se anima.
- **Dentro del texto:**
  - sale de la columna de lectura al ancho del contenido de la página, hasta
    1120 px (`data-ancho-pagina`; el `max-w-2xl` de `RichText` va en cada hijo);
  - sin título visible: lo nombra el encabezado de su sección, y el visor lleva
    `aria-label`.
- **Sin «Páginas como imágenes»:** solo el enlace de descarga, nunca un hueco.
- El botón flotante de WhatsApp no tapa sus controles. Por debajo de 1024 px (teléfono y tablet), la fila de controles y las miniaturas le reservan su columna (72 px a la derecha, dirección, 2026-10-20): el botón se queda quieto, sin saltar encima de la página. A 360, las herramientas bajan a una segunda fila. Desde 1024 px ya hay aire (medido) y, si alguna vez los pisa, sube (`data-evita-flotante`). En pantalla completa no se ve.
- **Revalidación:** guardar o borrar un documento revalida las páginas de la
  ruta comodín (`revalidarPaginasDelComodin`). Las páginas que genera el script
  no revalidan: el runbook termina vaciando la caché.

## Añadir un PDF nuevo al visor

1. **Convertirlo**, en una máquina con Node, fuera del repositorio:

   ```
   npx -y -p pdfjs-dist@6.4.299 -p @napi-rs/canvas@1.0.10 node scripts/documentos/rasterizar-pdf.mjs <PDF o URL> <carpeta>
   ```

2. **Subir sus páginas al documento** (en el preview, con `npm run preview:ejecutar --`):

   ```
   payload run scripts/documentos/visor.ts paginas <destino> fichero=<parte del nombre> carpeta=<carpeta>
   ```

3. **Elegir el bloque en el panel**, o cambiar con el script los párrafos que solo enlazan al PDF:

   ```
   payload run scripts/documentos/visor.ts pagina <destino> slug=<página>
   ```

Todo admite `simular`. La retirada es exacta, por el manifiesto (fuera del
repositorio). En el sitio publicado, por runbook de dirección.

## Inventario de la Política de garantía (2026-10-20)

Los dos PDF de la página de WordPress están en su **versión más reciente** en
«Documentos», idénticos byte a byte a WordPress:

| Documento              | Versión                           | Páginas |
| ---------------------- | --------------------------------- | ------- |
| Política de garantía   | `DA_MVL_09-…-v8-1.pdf` (2026/03)  | 5       |
| Política de devolución | `DA_MVL_12-…-v03-2.pdf` (2025/06) | 2       |

El XML tiene además las versiones anteriores (v0–v8 y v03–v03-1), que no se
publican.
