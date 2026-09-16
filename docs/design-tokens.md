# Tokens del sistema de diseño de Partequipos

> **Fuente única de verdad** de los valores del sistema de diseño del cliente.
> Extraídos el **2026-09-16** de `https://ui.partequipos.com`.
>
> Si un valor de este documento y uno del código discrepan, **manda este
> documento**; y si discrepa con el sitio del cliente, hay que volver a extraer
> y anotar la fecha.

---

## 1. Cómo se extrajeron (y por qué así)

Las páginas del sistema calculan los tokens en cliente, así que leer el HTML
renderizado no sirve. Se hizo en dos pasos independientes que se cruzaron entre
sí:

1. **Del CSS compilado.** `https://ui.partequipos.com` carga dos hojas:
   - `/_next/static/chunks/03kubnji1tptq.css` — solo `@font-face`.
   - `/_next/static/chunks/03phx9iox0a.f.css` — 302 propiedades personalizadas;
     los tokens semánticos están en un bloque `:root` (44 variables) y su
     contraparte en `.dark` (43).
2. **De `getComputedStyle`** sobre esa misma página, alternando la clase `dark`
   del elemento raíz. Esto confirma que lo extraído del CSS es lo que el
   navegador realmente resuelve, y permitió obtener los equivalentes en sRGB y
   en OKLCH con el motor de color del navegador en lugar de convirtiendo a mano.

### Advertencia sobre el espacio de color

**El bundle NO sirve `oklch()`: sirve `lab()`.** Es Lightning CSS (Next.js)
transformando el OKLCH original en la compilación. Consecuencia:

- **Las cadenas OKLCH tal como las escribió el cliente no son recuperables.**
  Las de este documento son **equivalentes calculados** por el navegador a
  partir del `lab()` servido; coinciden con el color renderizado, pero pueden
  diferir del original en los últimos decimales.
- Se nota en un caso concreto: `--primary` sale con croma **0,215** y
  `--destructive` con **0,245**, ambos con la misma claridad y tono. Eso indica
  que `--primary` está autorizado desde el hex heredado `#dc2626` y
  `--destructive` desde el valor OKLCH de gama amplia. **No es un error de la
  extracción: son dos rojos distintos.** Lo confirma que
  `--sidebar-primary` en modo claro es literalmente `#dc2626`.

**El hex es el dato duro** (es lo que se pinta). El OKLCH es la forma canónica.

---

## 2. Paleta — modo claro

| Token                          | OKLCH (calculado)             | sRGB (medido) |
| ------------------------------ | ----------------------------- | ------------- |
| `--background`                 | `oklch(0.9911 0 112.86)`      | `#fcfcfc`     |
| `--foreground`                 | `oklch(0 0 0)`                | `#000000`     |
| `--card`                       | `oklch(0.9911 0 112.86)`      | `#fcfcfc`     |
| `--card-foreground`            | `oklch(0 0 0)`                | `#000000`     |
| `--popover`                    | `oklch(0.9911 0 112.86)`      | `#fcfcfc`     |
| `--popover-foreground`         | `oklch(0 0 0)`                | `#000000`     |
| `--primary`                    | `oklch(0.577 0.215 27.33)`    | `#dc2626`     |
| `--primary-foreground`         | `oklch(0.971 0.013 17.49)`    | `#fef2f2`     |
| `--secondary`                  | `oklch(0.96 0 112.93)`        | `#f2f2f2`     |
| `--secondary-foreground`       | `oklch(0.2046 0 112.89)`      | `#171717`     |
| `--muted`                      | `oklch(0.9461 0 113.26)`      | `#ededed`     |
| `--muted-foreground`           | `oklch(0.556 0 112.25)`       | `#737373`     |
| `--accent`                     | `oklch(0.9461 0 113.26)`      | `#ededed`     |
| `--accent-foreground`          | `oklch(0.2435 0 112.79)`      | `#202020`     |
| `--destructive`                | `oklch(0.577 0.245 27.33)`    | `#e7000b`     |
| `--destructive-foreground`     | `oklch(0.704 0.191 22.22)`    | `#ff6467`     |
| `--info`                       | `oklch(0.623 0.214 259.81)`   | `#2b7fff`     |
| `--info-foreground`            | `oklch(0.488 0.243 264.37)`   | `#1447e6`     |
| `--success`                    | `oklch(0.696 0.17 162.48)`    | `#00bc7d`     |
| `--success-foreground`         | `oklch(0.508 0.118 165.61)`   | `#007a55`     |
| `--warning`                    | `oklch(0.769 0.188 70.08)`    | `#fe9a00`     |
| `--warning-foreground`         | `oklch(0.555 0.163 49.00)`    | `#bb4d00`     |
| `--border`                     | `oklch(0.9037 0 112.55)`      | `#dfdfdf`     |
| `--input`                      | `oklch(0.922 0 112.84)`       | `#e5e5e5`     |
| `--ring`                       | `oklch(0.708 0 113.19)`       | `#a1a1a1`     |
| `--sidebar`                    | `oklch(0.9911 0 112.86)`      | `#fcfcfc`     |
| `--sidebar-foreground`         | `oklch(0.5452 0 113.10)`      | `#707070`     |
| `--sidebar-primary`            | `oklch(0.5771 0.2152 27.326)` | `#dc2626`     |
| `--sidebar-primary-foreground` | `oklch(0.971 0.013 17.49)`    | `#fef2f2`     |
| `--sidebar-accent`             | `oklch(0.9461 0 113.26)`      | `#ededed`     |
| `--sidebar-accent-foreground`  | `oklch(0.2435 0 112.79)`      | `#202020`     |
| `--sidebar-border`             | `oklch(0.9037 0 112.55)`      | `#dfdfdf`     |
| `--sidebar-ring`               | `oklch(0.708 0 113.19)`       | `#a1a1a1`     |

Gráficas: `--chart-1` … `--chart-5` son una escala cálida amarillo → marrón,
idéntica en los dos modos: `#…` no se transcribe aquí porque el panel no
dibuja gráficas; están en el bundle si se necesitan.

### Tokens que NO se pudieron resolver por sí solos

`--destructive-foreground`, `--info*`, `--success*` y `--warning*` se declaran
por referencia a la paleta de Tailwind (`var(--color-red-400)`,
`var(--color-blue-500)`…). Esas variables **sí** están en el bundle, así que el
valor final es el de la tabla, pero conviene saber que el sistema los define
indirectamente: si el cliente cambia de versión de Tailwind, cambian.

---

## 3. Paleta — modo oscuro

**El sistema define modo oscuro completo** (43 tokens) y **su propio sitio va en
oscuro por defecto**: el elemento raíz de `ui.partequipos.com` lleva la clase
`dark`. Valores que cambian respecto al claro:

| Token                | OKLCH                         | sRGB               |
| -------------------- | ----------------------------- | ------------------ |
| `--background`       | `oklch(0.1822 0 113.10)`      | `#121212`          |
| `--foreground`       | `oklch(0.9288 0.0126 255.44)` | `#e2e8f0`          |
| `--card`             | `oklch(0.2046 0 112.89)`      | `#171717`          |
| `--popover`          | `oklch(0.2603 0 113.34)`      | `#242424`          |
| `--secondary`        | `oklch(0.29 0 113.31)`        | `#2b2b2b`          |
| `--muted`            | `oklch(0.2393 0 113.10)`      | `#1f1f1f`          |
| `--muted-foreground` | `oklch(0.798 0.0028 158.70)`  | `#bcbebc`          |
| `--accent`           | `oklch(0.3132 0 113.02)`      | `#313131`          |
| `--destructive`      | `oklch(0.704 0.191 22.22)`    | `#ff6467`          |
| `--border`           | `oklch(1 0 112.71 / 0.1)`     | blanco al **10 %** |
| `--input`            | `oklch(1 0 112.71 / 0.15)`    | blanco al **15 %** |
| `--ring`             | `oklch(0.556 0 112.25)`       | `#737373`          |
| `--sidebar-border`   | `oklch(0.2809 0 113.20)`      | `#292929`          |

`--primary` y `--primary-foreground` **no cambian** entre modos.
Ojo: en oscuro `--border` y `--input` son **semitransparentes**, así que su
contraste depende de lo que tengan debajo.

---

## 4. Tipografía

| Rol      | Familia                            | Pesos   | Fichero                            |
| -------- | ---------------------------------- | ------- | ---------------------------------- |
| Texto    | `"Rubik", "Rubik Fallback"`        | 300–900 | variable, `woff2`, `display: swap` |
| Monoespa | `"Geist Mono", "Geist Mono Fallb"` | 100–900 | variable, `woff2`, `display: swap` |

Las expone `next/font` mediante clases en `<html>`
(`.rubik_…__variable { --font-sans: … }`), no un `:root` del CSS: por eso no
aparecen en el bloque de tokens. Ambas traen una cara de respaldo con métricas
ajustadas sobre Arial (`size-adjust`, `ascent-override`), lo que reduce el salto
de maquetación al cargar.

### Escala tipográfica y espaciado: NO están personalizados

Medido: el bundle contiene `--text-xs: .75rem`, `--text-sm: .875rem`,
`--text-7xl: 4.5rem`, `--font-weight-light: 300`, `--spacing: .25rem`. **Son
exactamente los valores por defecto de Tailwind v4.** El sistema no redefine ni
la escala ni el espaciado.

Consecuencia práctica: **no hay una escala propia que aplicar**. Cualquier
«escala de Partequipos» que alguien reclame más adelante sería nueva, no
existente.

---

## 5. Radio y elevación

- **`--radius: .45rem`** (7,2 px). **Un solo valor**, como es convención en
  shadcn. No hay `--radius-sm/md/lg` publicados.
- **No hay tokens de sombra.** `--shadow*` no aparece ni una vez en el bundle.
  Lo que sí existe es un tratamiento propio de «vidrio»:

  | Token               | Claro   | Oscuro  |
  | ------------------- | ------- | ------- |
  | `--glass-tint`      | `82%`   | `58%`   |
  | `--glass-rim`       | `12%`   | `3%`    |
  | `--glass-rim-color` | `black` | `white` |
  | `--glass-specular`  | `62%`   | `22%`   |
  | `--glass-shadow`    | `.14`   | `.12`   |

  Es la única «elevación» del sistema, y es un efecto compuesto, no una rampa de
  sombras. **No se aplicó al panel**: Payload no tiene un punto de extensión
  donde encaje sin reescribir componentes.

---

## 6. Variantes de estilo (hallazgo)

El sistema define **dos variantes**, `.style-rhea` y `.style-mira`, usadas como
variantes de Tailwind (`:is(.style-rhea *)`). No cambian la paleta: alteran
**geometría de componentes** — relleno, redondeo y tamaños. El sitio vivo usa
`style-rhea`.

**No se replicó en el panel:** es maquinaria de variantes de Tailwind aplicada a
componentes propios, no un conjunto de tokens. Replicarla exigiría reimplementar
los componentes de Payload.

---

## 7. Contraste medido

Medido con el motor del navegador sobre la página del sistema (fórmula WCAG 2.x
de luminancia relativa).

### Pares que pasan holgadamente (modo claro)

| Par                                  | Ratio     |
| ------------------------------------ | --------- |
| `background` / `foreground`          | **20,47** |
| `secondary` / `secondary-foreground` | **16,01** |
| `accent` / `accent-foreground`       | **13,92** |
| `sidebar` / `sidebar-foreground`     | **4,83**  |

### Dos pares que NO llegan a AA para texto normal

| Par                              | Ratio    | Necesita |
| -------------------------------- | -------- | -------- |
| `primary` / `primary-foreground` | **4,41** | 4,5      |
| `muted` / `muted-foreground`     | **4,05** | 4,5      |

### Los pares de estado NO significan «texto sobre ese fondo»

Medir `success` contra `success-foreground` da **2,17**, que parece un fallo
grave. No lo es: en este sistema el `-foreground` de los estados es una
**variante oscura para poner sobre fondo claro**, no texto para poner encima del
color de estado. Leído bien, todos pasan:

| Uso correcto                        | Ratio    |
| ----------------------------------- | -------- |
| `background` / `info-foreground`    | **6,66** |
| `background` / `success-foreground` | **5,23** |
| `background` / `warning-foreground` | **4,90** |
| `background` / `destructive`        | **4,65** |

**Regla de uso:** para texto de estado sobre el fondo del panel, usar
`--X-foreground`; **nunca** `--X` como fondo con `--X-foreground` como texto.

### El anillo de foco del sistema no cumple

| Par                     | Ratio    | WCAG 1.4.11 exige |
| ----------------------- | -------- | ----------------- |
| `background` / `ring`   | **2,52** | 3:1               |
| `background` / `border` | **1,30** | 3:1 si identifica |
| `background` / `input`  | **1,23** | 3:1 si identifica |

Por eso el panel **no** usa `--ring` para el foco (ver §8).

### Modo oscuro contrasta MEJOR que el claro

| Par                          | Claro | Oscuro   |
| ---------------------------- | ----- | -------- |
| `muted` / `muted-foreground` | 4,05  | **8,81** |
| `background` / `success`     | 2,41  | **7,57** |
| `background` / `warning`     | 2,08  | **8,77** |
| `background` / `info`        | 3,67  | **4,98** |

Dato relevante para la decisión sobre modo oscuro en el panel (§9).

---

## 8. Cómo se aplicó al panel

Ver `src/app/(payload)/custom.scss`, que lleva el porqué de cada decisión.

**Mecanismo, verificado en la API instalada (Payload 3.86) y no de memoria:**
Payload declara su tema dentro de `@layer payload-default`
(`@payloadcms/ui/dist/scss/colors.scss` y `app.scss`). `custom.scss` se importa
después de `@payloadcms/next/css` en `(payload)/layout.tsx` y **va sin capa**, y
el CSS sin capa gana a cualquier capa con independencia de la especificidad. No
hacen falta `!important` ni selectores más específicos. **No existe una opción
`admin.css` en la configuración**; esta es la vía.

| Qué              | Cómo                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Rampa neutra     | `--theme-elevation-0..1000` derivada por `color-mix` entre los extremos del sistema, conservando las **posiciones** de la rampa gris de Payload |
| Rampas de estado | `--theme-{error,success,warning}-*` ancladas al token en el paso 500 y derivadas hacia fondo/texto                                              |
| Borde            | `--theme-border-color: var(--pq-border)`                                                                                                        |
| Tipografía       | `--font-body` / `--font-mono`, con `@font-face` autoalojado                                                                                     |
| Radio            | `--style-radius-s/m/l` derivados del único `--radius`                                                                                           |
| Acción principal | `.btn--style-primary`, acotado                                                                                                                  |
| Foco             | `--accessibility-outline` con `--pq-primary`                                                                                                    |

**Tres desviaciones deliberadas, todas medidas:**

1. **El foco usa `--pq-primary`, no `--pq-ring`.** El anillo del sistema da
   2,52:1 y WCAG 1.4.11 exige 3:1. `--pq-primary` da **4,71:1**.
2. **La rampa de 21 pasos se deriva, no se copia.** El sistema publica ~10
   neutros, el panel necesita 21. Inventarlos sería inventar colores; se
   derivan por fórmula escrita desde `--background` y `--foreground`.
3. **Las fuentes se alojan en `public/fonts/`** (subconjuntos latinos copiados
   del propio sistema) en vez de usar `next/font`. Dos motivos: `next/font`
   exige tocar `(payload)/layout.tsx`, que Payload marca como **generado
   automáticamente y advierte que puede reescribir**; y enlazar a
   `ui.partequipos.com` chocaría con la CSP (`font-src 'self' data:`), cuya
   apertura es una decisión de seguridad aparte.

### Contraste del panel, medido sobre la página PINTADA (§10.14)

| Elemento            | Frente    | Fondo     | Ratio     | AA                     |
| ------------------- | --------- | --------- | --------- | ---------------------- |
| Texto del cuerpo    | `#000000` | `#fcfcfc` | **20,47** | pasa                   |
| Etiqueta de campo   | `#121212` | `#fcfcfc` | **18,26** | pasa                   |
| Texto del input     | `#121212` | `#fcfcfc` | **18,26** | pasa                   |
| Enlace              | `#000000` | `#fcfcfc` | **20,47** | pasa                   |
| **Botón principal** | `#fef2f2` | `#dc2626` | **4,41**  | **falla** (13 px)      |
| **Borde del input** | `#d1d1d1` | `#fcfcfc` | **1,49**  | **falla** (1.4.11 3:1) |

**Ninguno de los dos fallos lo introduce este cambio:**

- El botón hereda `--primary-foreground` del sistema del cliente. Corregirlo es
  decisión suya: con **blanco puro sería 4,83:1**, una línea.
- El borde ya fallaba en Payload de fábrica (**1,36:1** con su gris por
  defecto); con los tokens del sistema queda en 1,49 — marginalmente mejor y
  sigue sin cumplir. Remedio medido: `--muted-foreground` da **4,62:1**, pero
  oscurece bastante el aspecto de todos los campos.

**Verificado pintado solo el inicio de sesión.** Navegación, listados y
formularios de edición **no** se pudieron verificar pintados: exigen sesión, y
no introduzco contraseñas en formularios. Las variables viven en `:root`, así
que esas vistas heredan lo mismo — pero eso es un razonamiento, no una medición,
y §10.20 dice exactamente que no se confundan.

---

## 9. Modo oscuro del panel — criterio (NO implementado)

**Hechos medidos:**

- El sistema define modo oscuro **completo** y su propio sitio va en oscuro por
  defecto.
- Payload admite `admin.theme: 'all' | 'dark' | 'light'` (verificado en los
  tipos instalados) y por defecto es `'all'`: sigue la preferencia del sistema
  operativo.
- **Estado actual, y es incoherente:** el panel sirve `data-theme="dark"`
  —porque así lo pide el sistema operativo— pero **pinta en claro**, ya que
  `custom.scss` solo define `:root` sin capa y eso gana al bloque oscuro de
  Payload. Visualmente es correcto y el contraste pasa, pero el panel anuncia un
  tema que no está usando.
- En este sistema el **modo oscuro contrasta mejor** que el claro (§7).

**Mi criterio: el panel SÍ debería soportar modo oscuro**, con los tokens
oscuros del sistema. Tres razones: el sistema ya los publica —no hay que
inventar nada—; el cliente eligió oscuro como estado por defecto de su propia
vitrina; y contrasta mejor. A diferencia de §10.14, aquí **no** estaríamos
soportando un tema a medias: existen los 43 tokens.

**Hasta que se decida, hay que elegir una de dos**, porque el estado actual es
mixto:

- **(a)** Implementar oscuro con los tokens del sistema. _Recomendado._
- **(b)** Fijar `admin: { theme: 'light' }` en `payload.config.ts` — una línea —
  para que el panel deje de anunciar oscuro mientras pinta claro.

---

## 10. ¿Y el sitio público? — sí, sería trivial

**Fuera de alcance, pero el dato cambia la conversación con el diseñador.**

Verificado en `src/app/(site)/globals.css`: el sitio usa **la misma
arquitectura** que el sistema — `@import "tailwindcss"`, tokens en `:root` y
`@theme inline` mapeándolos (`--color-background: var(--background)`,
`--font-sans: var(--font-geist-sans)`). Aplicar la paleta sería **pegar el
bloque de tokens de §2 y §3 en ese fichero**, sin tocar un solo componente.

Dos advertencias que hay que decir en la misma frase:

1. Las plantillas actuales **no usan tokens semánticos**: llevan colores fijos
   de Tailwind. Medido — **182 ocurrencias en 31 ficheros**, encabezadas por
   `text-gray-900` (81), `text-gray-600` (37) y `border-gray-200` (21). Así que
   pegar los tokens **no cambiaría casi nada** hasta reemplazar esas clases. Eso
   es trabajo real, y es el mismo motivo por el que el modo oscuro del andamiaje
   pasó inadvertido (§10.14).

   La tipografía tiene el mismo desajuste: el sitio declara hoy
   `--font-sans: var(--font-geist-sans)` — **Geist, no Rubik**.

2. El sistema **no aporta escala tipográfica ni espaciado** (§4), ni catálogo de
   componentes reutilizable desde nuestro proyecto. Cubre color, tipografía y
   radio; el resto del bloque G de `RUTA-DESARROLLO.md` sigue abierto.

**En una frase para el diseñador:** el color, la tipografía y el radio **ya
existen y están medidos**; lo que falta es decidir la retícula, la escala y los
componentes, y sustituir los colores fijos de las plantillas por tokens.
