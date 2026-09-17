# Tokens del sistema de diseño de Partequipos

> **Fuente única de verdad** de los valores del sistema de diseño del cliente.
> Extraídos el **2026-09-16** de `https://ui.partequipos.com`.
>
> Si un valor de este documento y uno del código discrepan, **manda este
> documento**; y si discrepa con el sitio del cliente, hay que volver a extraer
> y anotar la fecha.

---

## ⚠ Lo que el sistema NO define — para el brief del diseñador

Medido en el bundle de `ui.partequipos.com` el 2026-09-16. **Cualquier cosa de
esta lista que se atribuya al «sistema de Partequipos» sería nueva, no
existente.**

**1. No hay escala tipográfica propia.** Son exactamente los valores por defecto
de **Tailwind v4**: `--text-xs: .75rem`, `--text-sm: .875rem`,
`--text-7xl: 4.5rem` (con sus `--line-height`), `--font-weight-light: 300`.

**2. No hay espaciado propio.** `--spacing: .25rem`, el de Tailwind v4.

**3. No hay tokens de sombra propios.** Las sombras son las utilidades por
defecto de Tailwind v4 (`shadow-sm`…). Lo único propio es un efecto de vidrio
(`--glass-*`, §5). _Esta línea decía antes que `--shadow` aparece cero veces:
era falso, aparece como `--tw-shadow`._

**Y una corrección en sentido contrario: el sistema SÍ define escala de
radios propia** (§5). Estaba en esta lista por error.

**4. Las plantillas públicas usan colores fijos, no tokens.** Medido en
`src/app/(site)` y `src/components`, sin el panel: **188 ocurrencias en 31
ficheros**. Una versión anterior decía 182: aquel patrón dejaba fuera 4 `ring-*`
y 2 `text-white`.

| Por familia de color | Ocurrencias |
| -------------------- | ----------: |
| gris                 |     **175** |
| rojo                 |           7 |
| verde                |           4 |
| blanco               |           2 |

| Por clase          | Ocurrencias |
| ------------------ | ----------: |
| `text-gray-900`    |      **81** |
| `text-gray-600`    |      **37** |
| `border-gray-200`  |      **21** |
| `text-gray-700`    |          14 |
| `text-gray-500`    |           5 |
| `bg-gray-50`       |           5 |
| `border-gray-300`  |           4 |
| `text-white`       |           2 |
| `text-red-700`     |           2 |
| `ring-gray-900`    |           2 |
| `bg-gray-900`      |           2 |
| `text-red-900`     |           1 |
| `text-green-900`   |           1 |
| `ring-red-700`     |           1 |
| `ring-green-700`   |           1 |
| `border-red-700`   |           1 |
| `border-red-600`   |           1 |
| `border-green-700` |           1 |
| `border-gray-900`  |           1 |
| `bg-red-50`        |           1 |
| `bg-green-50`      |           1 |
| `bg-gray-700`      |           1 |
| `bg-gray-400`      |           1 |
| `bg-gray-100`      |           1 |

| Ficheros con más carga                                 | Ocurrencias |
| ------------------------------------------------------ | ----------: |
| `components/forms/FormularioSolicitud.tsx`             |      **23** |
| `maquinaria-pesada/…/[marca]/[tipo]/[modelo]/page.tsx` |      **16** |
| `components/layout/Footer.tsx`                         |          15 |
| `components/forms/Campo.tsx`                           |          12 |
| `repuestos-…/[marca]/[tipo]/[modelo]/page.tsx`         |          12 |
| `(site)/page.tsx` (portada)                            |          12 |
| los 25 ficheros restantes                              |  2 a 9 cada |

**Qué significa en la práctica:** pegar los tokens del sistema en `globals.css`
es trivial, pero **no cambiaría casi nada** hasta sustituir esas clases. Y el
reemplazo no es mecánico: `text-gray-900` puede ser `foreground` o
`card-foreground`, y `text-gray-600` puede ser `muted-foreground` o no, según
dónde esté. Decidirlo es diseño.

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

### Escala de radios — CORREGIDA el 2026-09-16

**El sistema SÍ tiene escala de radios, y es propia:** multiplicativa sobre
`--radius: .45rem` (7,2 px). Literal de la capa de tema del bundle:

| Token          | Fórmula                     | Valor       | Dónde la usa el sistema           |
| -------------- | --------------------------- | ----------- | --------------------------------- |
| `--radius-xs`  | `.125rem`                   | 2 px        | —                                 |
| `--radius-md`  | `calc(var(--radius) * .8)`  | 5,8 px      | —                                 |
| `--radius-lg`  | `var(--radius)`             | 7,2 px      | —                                 |
| `--radius-xl`  | `calc(var(--radius) * 1.4)` | 10,1 px     | ítems de menú, botón icono `xs`   |
| `--radius-2xl` | `calc(var(--radius) * 1.8)` | **13 px**   | campos, botones, insignias, ítems |
| `--radius-4xl` | `calc(var(--radius) * 2.6)` | **18,7 px** | tarjetas, con tope de 24 px       |

No es la escala por defecto de Tailwind v4 (`md` .375rem, `2xl` 1rem…): está
redefinida en función del `--radius` del cliente.

> **Por qué la primera extracción la perdió — para la próxima.** Esta sección
> decía «un solo valor, no hay `--radius-sm/md/lg` publicados», y el panel
> derivaba sus radios con una progresión inventada (`radius − 4px` / `− 2px`).
> El script buscaba el **primer** bloque `:root,:host{` del bundle y leía solo
> ese. Pero Tailwind v4 emite **varios**: el primero que aparece contenía una
> sola variable (`--shimmer-angle`), y la escala de radios, la escala de texto y
> el resto de tokens de tema estaban en **otro** bloque `:root,:host{` dentro de
> `@layer theme`. La regla para la próxima extracción: **recorrer TODOS los
> bloques de cada selector**, no quedarse con el primero; y desconfiar de un
> resultado que dice «el sistema no define X» sin haber buscado `--X-` por todo
> el fichero.

### Sombras

- **No hay tokens `--shadow-*` propios.** Las sombras son las **utilidades por
  defecto de Tailwind v4** con valores literales (`shadow-xs`, `shadow-sm`…),
  y `--drop-shadow-md` / `--drop-shadow-lg` también son los de Tailwind.
  _Corrección: una versión anterior decía que `--shadow` «no aparece ni una
  vez»; sí aparece, como `--tw-shadow` dentro de esas utilidades._
- Lo que sí es propio es un tratamiento de «vidrio»:

  | Token               | Claro   | Oscuro  |
  | ------------------- | ------- | ------- |
  | `--glass-tint`      | `82%`   | `58%`   |
  | `--glass-rim`       | `12%`   | `3%`    |
  | `--glass-rim-color` | `black` | `white` |
  | `--glass-specular`  | `62%`   | `22%`   |
  | `--glass-shadow`    | `.14`   | `.12`   |

  Es un efecto compuesto, no una rampa de sombras. **Al panel solo se lleva el
  reflejo** (`specular-edge`: línea interior blanca de 1 px arriba, con
  `--glass-specular`) en las tarjetas, desde la fase 1. El resto —tinte con
  desenfoque en ventanas y cajones— no: cuesta rendimiento y no aporta al uso.

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

**Mecanismo, verificado en la API instalada (Payload 3.88.0) y no de memoria:**
Payload declara su tema dentro de `@layer payload-default`
(`@payloadcms/ui/dist/scss/colors.scss` y `app.scss`). `custom.scss` se importa
después de `@payloadcms/next/css` en `(payload)/layout.tsx` y **va sin capa**, y
el CSS sin capa gana a cualquier capa con independencia de la especificidad. No
hacen falta `!important` ni selectores más específicos. **No existe una opción
`admin.css` en la configuración**; esta es la vía.

> **Corrección.** Una versión anterior de este documento decía «Payload 3.86».
> `package.json` declara `^3.86.0`, pero **lo instalado —y lo que corre en
> producción— es 3.88.0** en todo el ecosistema (`payload`, `@payloadcms/next`,
> `ui`, `db-postgres`, `email-resend`, `storage-vercel-blob`,
> `richtext-lexical`, `translations`). Coherente entre sí; solo estaba mal
> anotado.

| Qué              | Cómo                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Rampa neutra     | `--theme-elevation-0..1000` derivada por `color-mix` entre los extremos del sistema, conservando las **posiciones** de la rampa gris de Payload |
| Texto secundario | `--theme-elevation-400` sustituido por `--pq-muted-foreground` (remedio de contraste)                                                           |
| Rampas de estado | `--theme-{error,success,warning}-*` ancladas al token en el paso 500 y derivadas hacia fondo/texto                                              |
| Borde            | `--theme-border-color: var(--pq-border)`                                                                                                        |
| Tipografía       | `--font-body` / `--font-mono`, con `@font-face` autoalojado                                                                                     |
| Radio            | `--style-radius-s/m/l` asignados por papel a la escala real (md / lg / xl)                                                                      |
| Acción principal | `.btn--style-primary`, acotado, con texto `--pq-on-primary` (blanco)                                                                            |
| Foco             | `--accessibility-outline` con `--pq-primary`                                                                                                    |
| Modo oscuro      | `html[data-theme="dark"]` redefine los `--pq-*` que cambian; las rampas se invierten solas                                                      |
| Idioma           | `i18n` en `payload.config.ts`, solo español                                                                                                     |

**Cinco desviaciones del sistema, todas medidas y aprobadas:**

1. **El foco usa `--pq-primary`, no `--pq-ring`.** El anillo del sistema da
   2,52:1 y WCAG 1.4.11 exige 3:1. `--pq-primary` da **4,71:1** en claro y
   **3,88:1** en oscuro: en los dos cumple el 3:1 no textual.
2. **La rampa de 21 pasos se deriva, no se copia.** El sistema publica ~10
   neutros, el panel necesita 21. Inventarlos sería inventar colores; se
   derivan por fórmula escrita desde `--background` y `--foreground`.
3. **Las fuentes se alojan en `public/fonts/`** (subconjuntos latinos copiados
   del propio sistema) en vez de usar `next/font`: `next/font` exige tocar
   `(payload)/layout.tsx`, que Payload marca como **generado automáticamente y
   advierte que puede reescribir**; y enlazar a `ui.partequipos.com` chocaría con
   la CSP.
4. **El texto del botón principal es blanco puro**, no el
   `--primary-foreground` del sistema (`#fef2f2`). Se declara como token propio
   `--pq-on-primary` **sin sobrescribir** el del cliente, para que su valor siga
   siendo trazable.
5. **El paso 400 de la rampa es `--muted-foreground`**, no la fórmula. En oscuro
   eso rompe la monotonía de la rampa en ese paso (el 400 queda más claro que el
   500); se prioriza la legibilidad del texto sobre la pureza de la rampa.

### Contraste del panel, medido sobre la página PINTADA (§10.14)

Inicio de sesión, **en los dos modos**. Todos los valores salen de elementos
reales pintados o de variables resueltas por el navegador, no del CSS.

| Elemento                             | Claro     | Oscuro    | AA                         |
| ------------------------------------ | --------- | --------- | -------------------------- |
| Fondo                                | `#fcfcfc` | `#121212` | —                          |
| Texto del cuerpo                     | **18,26** | **15,2**  | pasa                       |
| Etiqueta de campo                    | **18,26** | **9,72**  | pasa                       |
| Texto del input                      | **18,26** | **9,72**  | pasa                       |
| Enlace («¿Olvidaste tu contraseña?») | **18,26** | **15,2**  | pasa                       |
| **Botón principal** (blanco / rojo)  | **4,83**  | **4,83**  | **pasa** — antes 4,41      |
| **Texto secundario** (paso 400)      | **4,62**  | **10,0**  | **pasa** — antes 3,85/2,84 |
| Foco (`--pq-primary`)                | **4,71**  | **3,88**  | pasa (3:1 no textual)      |
| **Campo de solo lectura**            | **3,66**  | **8,79**  | **falla en claro**         |
| **Borde del input en reposo**        | **1,49**  | **1,29**  | **falla** (1.4.11, 3:1)    |

### Corrección de lo que este documento afirmaba antes

La versión anterior decía que los tres grises que fallaban «se pintan con
`--theme-elevation-500`, que cae en `#808080` — exactamente el `base-500` de
Payload de fábrica; fallaban igual antes». **Era falso en las dos partes**, y se
detectó al ir a aplicar el remedio:

- **El paso es el 400, no el 500.** Resolviendo la rampa en el navegador:
  `400 → #808080`, `500 → #626262`. La coincidencia con `base-500` de fábrica
  (`rgb(128,128,128)`) era casual y no se había comprobado.
- **No era «igual que de fábrica»: era mejor.** El paso 400 de fábrica es
  `rgb(154,154,154)` = `#9a9a9a`. Calculado sobre los valores de
  `colors.scss`: **2,81:1** sobre blanco y **2,36:1** en el campo de solo
  lectura. La rampa derivada ya lo había subido a 3,85 y 3,05; el remedio lo
  lleva a 4,62 y 3,66.

### Lo que sigue fallando, y por qué no se corrige ahora

**Campo de solo lectura en claro — 3,66:1.** Mejoró de 3,05, pero su fondo es el
paso 100 (`#e2e2e2`), más oscuro que el fondo general, y `--muted-foreground` no
llega. Dos matices:

- WCAG 1.4.3 **exime** el texto de componentes inactivos. Un campo deshabilitado
  lo es sin discusión; uno de **solo lectura** es discutible. Aquí es `slug`,
  que es **la URL indexada**: un dato que el editor necesita leer. Por eso **no
  se ampara en la exención**.
- No hay salida limpia sin tocar su fondo o elegir un gris que el sistema no
  publica. Queda documentado, **no corregido**.

**Borde del input — 1,49:1 en claro, 1,29:1 en oscuro.** Sin salida limpia: el
`--border` del sistema es un gris muy suave en claro y **blanco al 10 %** en
oscuro. Llevarlo a 3:1 exigiría un borde bastante más marcado en todos los
campos, que es una decisión estética del sistema, no un ajuste de contraste.
**De fábrica ya fallaba** (1,36:1).

### Qué NO quedó verificado pintado, dicho claro

- **En modo oscuro, solo el inicio de sesión.** Navegación, listados y edición
  no se midieron en oscuro: no hay sesión en el entorno local y la de producción
  caducó durante la tanda. El paso 400 que usan esas vistas **sí** se midió
  resuelto en los dos modos, pero eso no es medir la vista pintada.
- **Los remedios en navegación, listados y edición** tampoco se re-midieron
  pintados, por el mismo motivo. Que esas vistas pintan el gris secundario con el
  paso 400 se identificó **en producción**, resolviendo la rampa sobre la vista
  de edición antes de que caducara la sesión.
- **Cómo se detectó una medición falsa**, que conviene no repetir: alternar
  `data-theme` a mano **no reproduce** el cambio de tema real de Payload. Los
  elementos que ya existían conservaron su valor anterior (el borde salía
  `#29292a`, el paso 150 **oscuro**, estando en «claro»). La medición válida
  exige el mecanismo real: la cookie `payload-theme` y recargar.

### Fase 1 — superficies y densidad (rama `feat/panel-fase1-superficies`)

Patrones tomados de `ui.partequipos.com/components` leyendo las clases de cada
pieza por su `data-slot`. Medido sobre la página pintada, en claro y oscuro, con
cookie `payload-theme` y recarga (§10.23), en producción («antes») y en el
preview («después»).

| Medida                    | Antes (producción) | Después (preview)                 | Fuente del sistema                        |
| ------------------------- | ------------------ | --------------------------------- | ----------------------------------------- |
| Radio de tarjeta          | 3,85 px            | **18,72 px**                      | `rounded-[min(var(--radius-4xl),24px)]`   |
| Borde de tarjeta          | 1 px               | **ninguno**                       | `ring-1 ring-foreground/5` + `shadow-sm`  |
| Sombra de tarjeta         | ninguna            | **anillo 5 % / 10 % + shadow-sm** | ídem                                      |
| Relleno de tarjeta        | 16 px              | **20 px**                         | `--card-spacing: --spacing(5)`            |
| Título de tarjeta         | 13 px · 600        | **16 px · 500**                   | `text-base font-medium`                   |
| Fondo de tarjeta (oscuro) | `#181919`          | **`#171717`**                     | `--card` oscuro                           |
| Radio de fila de array    | 4 px               | **12,96 px**                      | `item`: `rounded-2xl`                     |
| Cabecera de fila (claro)  | `#efefef`          | **`#f4f4f4`**                     | `item muted`: `bg-muted/50`               |
| Radio del botón primario  | 1,65 px            | 5,76 px                           | escala corregida (`md`); la forma, fase 2 |
| Entre campos              | 20 px              | **24 px**                         | `field-group gap-6`                       |
| Bajo la etiqueta          | 5 px               | **12 px**                         | `field gap-3`                             |
| Etiqueta de casilla       | 0 px · desfase 0   | **0 px · desfase 0**              | (se conserva; ver defectos)               |

**Contraste: ningún valor empeoró.** Los textos tocados mejoran: título de
tarjeta de 16,29 a **18,26** en claro (ahora sobre `#fcfcfc`) y 14,29 a
**14,54** en oscuro; cabecera de fila 17,03 claro y 14,26 oscuro. Siguen sin
cambios —y sin arreglar, como estaba decidido— el borde de los campos (1,49 /
1,29) y el campo de solo lectura en claro (3,66).

**Tres defectos encontrados al medir, corregidos antes de enseñar el resultado:**

1. **El radio base iba en `rem` y la raíz del panel es de 13 px.** Con
   `.45rem`, `--pq-radius` resolvía a **5,85 px** en vez de 7,2 px, y toda la
   escala multiplicativa quedaba un 19 % más pequeña. **Este defecto también
   está en producción** desde que se aplicaron los tokens; lo corrige esta fase.
   Ahora `--pq-radius: 7.2px`.
2. **La etiqueta de las casillas quedaba 6 px por debajo del control**, porque
   la regla general de 12 px (sin capa) pisaba la anulación que Payload ya tenía
   para etiquetas en línea.
3. **El primer arreglo de lo anterior también era falso**: restauraba
   `base(0.25)` suponiendo que era el valor original. Medido en producción era
   **0**. Se detectó midiendo producción antes de dar el arreglo por bueno.

**No verificado:** las esquinas inferiores de una fila de array **plegada**.
Plegarla escribe en las preferencias del usuario (una escritura en la base), y la
verificación se limitó a navegar y leer. El CSS cubre ese estado
(`.collapsible--collapsed`), pero no está medido pintado.

**Dejado fuera a propósito en esta fase:**

- **Grupos** (`.group-field`): son secciones a ancho completo con márgenes
  negativos; convertirlos en tarjeta estrecharía el formulario (regla 10).
- **Listados**: sin cambios. Franjas, cabecera y filas de tabla son la fase 3.
- **Campos y botones**: solo heredan la escala de radios corregida; su forma del
  sistema es la fase 2.

---

## 9. Modo oscuro del panel — IMPLEMENTADO

**Decisión de dirección (2026-09-16): se soporta**, con los tokens del sistema.
Motivos: existen completos, el cliente eligió oscuro por defecto en su propia
vitrina, y contrasta mejor. Además el estado previo era el peor posible: el panel
anunciaba `data-theme="dark"` y pintaba en claro.

**Cómo:** `html[data-theme="dark"]` redefine solo los `--pq-*` que cambian entre
modos (fondo, texto, secundario, atenuado, bordes, destructivo). Las rampas están
escritas en función de `--pq-background` y `--pq-foreground`, así que **se
invierten solas** sin duplicar fórmulas. El selector es `data-theme` y no la
clase `.dark` del sistema porque es lo que emite Payload.

**Quién elige el tema:** Payload, con `admin.theme` en su valor por defecto
(`all`): sigue la preferencia del sistema operativo o la que el usuario fije en
su cuenta, que se guarda en la cookie `payload-theme`.

**Un detalle que importa:** el hover del botón principal se oscurece mezclando
con **negro**, no con `--pq-foreground`. En oscuro `--pq-foreground` es casi
blanco, y mezclar con él **aclararía** el rojo y bajaría el contraste con el
texto blanco justo al pasar el ratón.

---

## 10. ¿Y el sitio público? — sí, sería trivial

**Fuera de alcance, pero el dato cambia la conversación con el diseñador.** Ver
el recuadro «Lo que el sistema NO define» al principio de este documento.

Verificado en `src/app/(site)/globals.css`: el sitio usa **la misma
arquitectura** que el sistema: `@import "tailwindcss"`, tokens en `:root` y
`@theme inline` mapeándolos (`--color-background: var(--background)`,
`--font-sans: var(--font-geist-sans)`). Aplicar la paleta sería **pegar el
bloque de tokens de §2 y §3 en ese fichero**, sin tocar un solo componente.

**Pero no cambiaría casi nada**, porque las plantillas llevan colores fijos de
Tailwind (desglose en el recuadro inicial). Y la tipografía tiene el mismo
desajuste: el sitio declara hoy `--font-sans: var(--font-geist-sans)` —
**Geist, no Rubik**.

**En una frase para el diseñador:** el color, la tipografía y el radio **ya
existen y están medidos**; lo que falta es decidir la retícula, la escala y los
componentes, y sustituir los colores fijos de las plantillas por tokens.
