# Rendimiento del sitio publicado: arreglos

Arreglos que salen de la medición del sitio publicado del 2026-10-14
(`Desktop\partequipos-cierre\informes\2026-10-14-rendimiento-sitio-publicado.md`).
Cada uno se mide con el método de CLAUDE.md §10.3 p.14: Lighthouse 13.4.1
por línea de comandos, móvil (390, DPR 1,75), 9 corridas alternadas contra
un preview de `main` en la misma sesión, con calentamiento. **Las cifras del
preview no se comparan con las del sitio publicado** (otra base, otro
contenido): lo que vale es la diferencia entre las dos variantes.

## 1. Zod fuera del navegador (2026-10-15, PR #168)

**Qué pasaba:** `FormularioSolicitud.tsx` (`"use client"`) importaba las
listas de opciones (`TIPOS_SOLICITUD`, `INTERESES`, `PERFILES`, `MAX`) de
`src/lib/validation/solicitud.ts`, que importa `zod` y construye el esquema
al cargar el módulo. El empaquetador metía Zod entero en el navegador en las
cinco plantillas con formulario: unos 98 KiB comprimidos.

**Arreglo:**

- Las opciones y sus tipos pasan a `src/lib/validation/opcionesSolicitud.ts`,
  **sin Zod**. `solicitud.ts` las importa y las reexporta, así que el
  servidor no cambia.
- El formulario y `src/lib/actions/estadoFormulario.ts` importan del módulo
  nuevo.
- **Guardarraíl** `src/lib/validation/clienteSinZod.test.ts`: recorre los
  imports estáticos de valor desde cada fichero con `"use client"` de `src/`
  y falla si alguno alcanza `zod`. Se detiene en los `"use server"`, porque
  de una Server Action el cliente solo recibe una referencia. Demostrado que
  falla al devolver el import del formulario a `solicitud.ts`.

**Medido** (9 contra 9, A = `main`, B = el PR):

| Página      | JavaScript transferido | TBT simulado | LCP                      | Nota    |
| ----------- | ---------------------- | ------------ | ------------------------ | ------- |
| Contáctanos | 298 → 206 KiB          | 338 → 182 ms | 2,07 → 1,91 s (en ruido) | 91 → 97 |
| Ficha       | 295 → 201 KiB          | 235 → 114 ms | 2,36 → 2,34 s            | —       |

En el HTML, el JavaScript sin comprimir de Contáctanos baja de 982 a 624 KB y
ningún fragmento contiene Zod.

**La validación no cambia:** sigue en el servidor con el mismo esquema
(§5); la del navegador era y sigue siendo cortesía.

## 2. Miniaturas del blog a su tamaño (2026-10-15, PR #169)

**Qué pasaba:** las tarjetas de `/noticias/` y de los archivos de categoría
(`ListaArticulos.tsx`) pasaban a `next/image` el ancho ORIGINAL de la foto.
Sin `sizes`, el srcset de 1x/2x salía de ese ancho: hasta 1920 px en
escritorio y 3840 en móvil para una foto que se pinta a ~386 × 160 px.

**Arreglo:** `ANCHO_MINIATURA = 384` y el alto en proporción. El srcset sale
de 384 y 828 px.

**Prioridad de la primera tarjeta: probada y QUITADA.** Con `eager` y
`fetchPriority="high"` el LCP no mejoró y el TBT simulado subió. El LCP del
índice no es la foto.

**Medido** (9 contra 9, A = `main`, B = el PR):

| Ancho | Imágenes de la carga inicial | Peso total    | LCP                      | TBT simulado            |
| ----- | ---------------------------- | ------------- | ------------------------ | ----------------------- |
| 390   | 507 → 270 KiB                | 949 → 712 KiB | 2,59 → 2,50 s (en ruido) | 545 → 577 ms (en ruido) |
| 1440  | 1103 → 177 KiB               | —             | 0,68 → 0,65 s            | —                       |

A 1440 se midió la primera versión, con la prioridad en la primera tarjeta.
La prioridad no cambia los bytes; la versión final se midió a 390.
