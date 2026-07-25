# ADR 0003 — Estrategia de URLs de Media (Payload + Vercel Blob)

- **Estado:** Aceptada (con un punto PENDIENTE de verificar en la tarea 0.3)
- **Fecha:** 2026-07-25
- **Decisión tomada por:** Dirección técnica
- **Relacionado:** [[0001-version-nextjs]], colección `Media` y `payload.config.ts`

## Contexto

La colección `Media` almacena los archivos en **Vercel Blob** (store público),
no en disco local. Verificado end-to-end en la tarea 0.2: una imagen subida
aparece físicamente en el store (`https://<id>.public.blob.vercel-storage.com/...`)
y esa URL carga sin token.

Sin embargo, lo que Payload guarda y expone como **`doc.url`** NO es el dominio
del Blob, sino su **ruta interna**:

```
doc.url            = /api/media/file/<filename>          (ruta de Payload)
archivo físico     = https://<id>.public.blob.vercel-storage.com/<filename>
```

Esto se debe a que `@payloadcms/plugin-cloud-storage` mantiene
`disablePayloadAccessControl = false` por defecto: Payload sirve el archivo a
través de su propia ruta en lugar de exponer la URL directa del CDN.

## Decisión

**Mantener `doc.url` como ruta interna de Payload.** Es una capa de indirección
intencional: permite cambiar de proveedor de almacenamiento (Blob → R2 u otro) o
mover archivos **sin reescribir URLs en la base de datos**. Las URLs guardadas no
quedan acopladas al hostname de un proveedor concreto.

No se activa `disablePayloadAccessControl`.

## PENDIENTE — verificar en la tarea 0.3 (afecta rendimiento y SEO)

La decisión anterior es sobre **qué se guarda** (`doc.url`), no sobre **cómo llega
la imagen al visitante**. Falta confirmar el comportamiento de entrega de la ruta
`/api/media/file/<filename>`:

- **Opción buena (CDN):** la ruta responde un **redirect 3xx** hacia la URL del
  Blob, y el navegador descarga la imagen directamente del CDN de Vercel.
- **Opción costosa (proxy):** la ruta **hace streaming** del archivo a través de
  la función serverless en **cada request** de imagen. Peor latencia, más invocaciones,
  y peor para Core Web Vitals / SEO —que es la prioridad del negocio (CLAUDE.md §1).

**Observación del 2026-07-25 (tarea 0.2):** al pedir la ruta sin seguir redirects,
respondió **`HTTP 200` con los bytes de la imagen (5028 B)**, no un `3xx`. Es decir,
con la configuración actual **la imagen pasa por la serverless (proxy)**, no por
redirect al CDN.

Acciones para la 0.3:

1. Confirmar el comportamiento en el contexto real de renderizado (`next/image`
   apuntando a `doc.url`), incluida la caché.
2. Evaluar servir las imágenes de catálogo directamente desde el CDN de Blob
   (p. ej. redirect en la ruta, o usar la URL del Blob solo en la capa de
   presentación manteniendo `doc.url` interno en la BD), midiendo impacto en
   Core Web Vitals.
3. Documentar la resolución como un ADR de seguimiento si cambia el enfoque.

## Consecuencia

`doc.url` interno queda aceptado por diseño. La **forma de entrega al visitante**
queda explícitamente **abierta y marcada como riesgo de rendimiento/SEO** a
resolver en la tarea 0.3, antes de construir páginas públicas de catálogo con
imágenes.
