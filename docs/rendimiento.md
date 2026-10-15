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
