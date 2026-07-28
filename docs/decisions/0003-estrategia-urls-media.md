# ADR 0003 — Estrategia de URLs de Media (Payload + Vercel Blob)

- **Estado:** **Sustituida por la decisión final de la sección "Resolución"**
  (Sprint 2, tarea 2.1). Decidido e **implementado**: las imágenes se sirven
  desde el CDN del Blob.
- **Fecha:** 2026-07-25 · **Resuelta:** 2026-07-27
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

## Decisión inicial (2026-07-25) — REVERTIDA, ver "Resolución"

**Mantener `doc.url` como ruta interna de Payload.** Es una capa de indirección
intencional: permite cambiar de proveedor de almacenamiento (Blob → R2 u otro) o
mover archivos **sin reescribir URLs en la base de datos**. Las URLs guardadas no
quedan acopladas al hostname de un proveedor concreto.

No se activa `disablePayloadAccessControl`.

> Esta decisión quedó **revertida** en la tarea 2.1 al medirse el coste real de
> entrega. El argumento de indirección resultó menos relevante de lo previsto:
> la URL **no** está congelada en la base de datos, el plugin la recalcula en
> lectura (ver "Resolución"), así que cambiar de proveedor tampoco exigiría
> reescribir registros.

## ~~PENDIENTE~~ — RESUELTO en la tarea 2.1 (histórico del análisis)

> Este bloque se conserva como registro del análisis que llevó a la decisión
> final. Ya no hay nada pendiente: ver "Resolución" al final del documento.

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

## Hallazgo de la tarea 0.3 (2026-07-25) — cómo se entrega hoy la imagen

Renderizada la ruta de prueba `/probe/marcas` con `next/image src={doc.url}`
(donde `doc.url = /api/media/file/<filename>`), se observó en el HTML de origen:

```
src="/_next/image?url=%2Fapi%2Fmedia%2Ffile%2F_tmp-cat.png&w=640&q=75"
```

Cadena de entrega real al visitante (medida con curl, sin seguir redirects):

1. El navegador pide **`/_next/image?url=/api/media/file/...`** → optimizador de
   Next (serverless) → `HTTP 200 image/png`.
2. Ese optimizador busca internamente **`/api/media/file/<filename>`** (ruta de
   Payload, serverless) → `HTTP 200 image/png`, **sin `3xx`** (`redirect_url`
   vacío): hace **proxy/streaming desde Blob**, no redirect al CDN.

**Conclusión:** la imagen **NO** llega desde el dominio del Blob
(`*.public.blob.vercel-storage.com`). Pasa por la serverless **dos veces**
(optimizador de `next/image` + ruta `/api/media/file`), y el parámetro `url`
interno de `next/image` apunta a la ruta de Payload, no al CDN.

`remotePatterns` para `**.public.blob.vercel-storage.com` ya quedó configurado en
`next.config.ts`, de modo que `next/image` **aceptaría** una URL del dominio del
Blob el día que decidamos servir desde el CDN.

### Recomendación (a decidir al construir la página real de marcas)

El doble salto por serverless es aceptable para una ruta de prueba, pero **no**
para el catálogo público con prioridad SEO. Opciones para servir desde el CDN
manteniendo `doc.url` interno en la BD:

- Que `/api/media/file/<filename>` responda **redirect 3xx** al CDN del Blob, o
- Resolver la URL del Blob **solo en la capa de presentación** (construir la URL
  del CDN a partir del `filename` al renderizar), o
- Activar `disablePayloadAccessControl` **solo** para `Media` (es de lectura
  pública) para que `next/image` consuma directamente el CDN.

Cualquiera de las tres se evaluará midiendo Core Web Vitals. Queda como
**pendiente para la página definitiva** (no para este esqueleto).

## Resolución (2026-07-27, tarea 2.1) — decidido e implementado

**Decisión final: las imágenes se sirven directo desde el CDN del Blob.** Son
imágenes públicas de catálogo (`Media` ya tiene `read: () => true`), la velocidad
pesa en el SEO —prioridad del negocio (CLAUDE.md §1)— y en un sitio con cientos de
fichas no tiene sentido pagar dos saltos de serverless por foto.

### Implementación

Una línea en `src/payload.config.ts`, en el plugin `vercelBlobStorage`:

```ts
collections: {
  [Media.slug]: { disablePayloadAccessControl: true },
},
```

Opción verificada contra la documentación oficial vigente del adaptador y contra
los tipos instalados (`collections` acepta `Omit<CollectionOptions, 'adapter'>`).
No hizo falta `generateFileURL` personalizado: el plugin ya genera la URL del CDN.

### Medición ANTES / DESPUÉS

|                                        | **ANTES**                                                                                                    | **DESPUÉS**                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `doc.url`                              | `/api/media/file/_tmp-cat.png`                                                                               | `https://sr2s4ngkjzfzpxhi.public.blob.vercel-storage.com/_tmp-cat.png`                     |
| `<img>` en `/probe/marcas`             | `/_next/image?url=%2Fapi%2Fmedia%2Ffile%2F_tmp-cat.png&w=640&q=75`                                           | `/_next/image?url=https%3A%2F%2F…public.blob.vercel-storage.com%2F_tmp-cat.png&w=640&q=75` |
| Saltos por serverless                  | **2** (optimizador → ruta `/api/media/file`, que hacía proxy/streaming desde Blob con `HTTP 200`, sin `3xx`) | **1** (solo el optimizador de `next/image`)                                                |
| Referencias a `/api/media/` en el HTML | 2                                                                                                            | **0**                                                                                      |
| Origen real de los bytes               | función serverless                                                                                           | **CDN de Vercel** (`X-Vercel-Cache: HIT`, `Cache-Control: public, max-age=31536000`)       |

`next/image` sigue optimizando correctamente: `remotePatterns` para
`**.public.blob.vercel-storage.com` ya estaba configurado desde la tarea 0.3
(`HTTP 200 image/png`, `X-Nextjs-Cache: HIT`).

### Sobre las imágenes ya existentes

Los logos de Caterpillar y Komatsu **siguen funcionando sin ninguna migración**.
La URL **no** estaba persistida de forma rígida: el plugin la recalcula al leer el
documento, por lo que el cambio aplicó de inmediato a los archivos ya subidos. **No
hace falta regenerar ni volver a subir nada.**

## Consecuencia

- Las imágenes de catálogo llegan al visitante **desde el CDN**, con caché de 1 año,
  eliminando un salto de serverless por imagen. Mejor Core Web Vitals y menos
  invocaciones.
- Se **bypassa el control de acceso de Payload para `Media`**, lo cual es correcto
  aquí porque la colección es de lectura pública. Si en el futuro se necesitara
  media privada, deberá ir en **otra colección** que conserve el control de acceso.
- Las plantillas del Sprint 2 se construyen asumiendo que `doc.url` es una URL
  absoluta del CDN.
