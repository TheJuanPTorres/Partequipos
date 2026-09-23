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

### Defectos de Payload corregidos por el camino

> **Versión: leídos y medidos en 3.88.0; hoy corremos 3.89.0** (el lock se
> regeneró el 2026-09-17 y `^3.86.0` resolvió a 3.89.0). Las correcciones se
> verificaron pintadas ya sobre 3.89, pero **las causas de la tabla no se han
> releído en 3.89**: al actualizar Payload hay que comprobar si siguen ahí.

Ninguno lo detectó una herramienta: todos salieron al medir la página pintada o
al recorrer el panel con el teclado. Se listan juntos porque **al actualizar
Payload hay que comprobar si siguen ahí**: si los arreglan arriba, nuestra
corrección pasa a ser código muerto; si cambian el marcado, deja de aplicar.

| Defecto de Payload                                                        | Qué se veía                                                    | Corrección nuestra                                  |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| Borde de los campos a **1,49 · 1,29** de fábrica (1.4.11 pide 3:1)        | El contorno del control casi no se distinguía del fondo        | Borde derivado, primer paso de la rampa con ≥ 3:1   |
| Texto secundario (paso 400) a **2,81** de fábrica                         | Etiquetas y textos de apoyo por debajo de AA                   | `--muted-foreground`: 4,62 · 10,0                   |
| Botón principal a **4,41**                                                | Texto sobre rojo por debajo de AA                              | Texto blanco: 4,83                                  |
| `.nav-group__toggle:focus-visible` con **`outline: none`**                | Con el teclado, el botón de grupo enfocado no tenía contorno   | Mismo indicador que los enlaces: 4,71 · 3,88        |
| El botón de grupo **no emite `aria-expanded`**                            | Un lector de pantalla no anuncia si el grupo está abierto      | `aria-expanded` y `aria-controls` en el menú propio |
| La barra del activo del menú se dibuja a **−20 px**, en el margen         | Recortada cuando el margen baja a 10 px (≤ 1024 px)            | Dentro del ítem, a 4 px del borde                   |
| `date-time-field--has-error` no coincidía con el selector que documentaba | Nuestra regla tapaba el borde rojo del campo de fecha inválido | Exclusión por el contenedor real                    |
| Objetivo táctil del menú en **25 px** (AA pide 24)                        | Cumplía por 1 px, pero con el dedo es poco                     | 36 px con puntero grueso                            |

Dos más, de Payload también, que **no** se corrigen y están documentados: el
campo de solo lectura en claro (3,66) y que el borde de fila de tabla use
`--border` (1,30), que es decorativo y no le aplica 1.4.11.

### Estado final — cierre del trabajo de diseño del panel (2026-09-17)

> Este apartado **manda** sobre los de abajo, que se conservan como registro de
> cada tanda. Donde un apartado antiguo diga que algo falla o no se verificó,
> comprobar aquí si se resolvió después.

**Método en las tres fases:** rama → preview → «antes» en producción y «después»
en el preview, **en claro y oscuro**, con cookie `payload-theme` y recarga
(§10.23 de CLAUDE.md) y **varias lecturas tras asentar** (§10.24). Producción no
se tocó hasta la aprobación de dirección; cada paso a producción, con contraste en
los dos modos, `qa` sin errores, español y logo.

#### Qué se aplicó (todo en producción)

| Tanda    | Qué                                                                                                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base     | Rampa neutra derivada, rampas de estado, fuentes autoalojadas, escala de radios, botón principal, foco, modo oscuro, interfaz en español                                                                 |
| 1        | Tarjetas (radio, anillo, sombra, 20 px), filas de array (`2xl`, cabecera `muted/50`), 24 px entre campos, 12 px bajo la etiqueta; radio base corregido a px (defecto en producción)                      |
| 2        | Campos: relleno `input/50`, radio `2xl`, borde derivado ≥ 3:1, foco primario + halo 3 px, 32 px en una línea; casilla; botones `2xl` y peso 500; `outline`, `secondary`, `subtle`; píldoras con contorno |
| 3        | Menú: esquinas `xl`, fondo del activo, barra del activo dentro del ítem, 25 px (36 px con puntero grueso); tablas sin franjas, línea por fila, cabecera 40 px · 500; migas atenuadas                     |
| Arreglos | Exclusiones de estado dentro de `:where()` (sin `!important`); fecha en error con su borde rojo; radio uniforme en todos los estados del campo                                                           |

#### Desviaciones deliberadas del sistema

Todas por accesibilidad o usabilidad, medidas y aprobadas por dirección:

| Sistema                                           | Panel                                            | Motivo                                      |
| ------------------------------------------------- | ------------------------------------------------ | ------------------------------------------- |
| Foco con `--ring` al 30 % (2,52:1)                | Borde primario + halo (4,71 · 3,88)              | WCAG 1.4.11                                 |
| Campo sin borde visible (1,49 · 1,29)             | Primer paso de la rampa con ≥ 3:1 sobre su fondo | El campo se identifica por su contorno      |
| Píldora `secondary` sin contorno                  | Contorno con el borde derivado                   | 1.4.11 aplica al límite del control         |
| Texto del primario `#fef2f2`                      | Blanco (4,83)                                    | AA en texto normal                          |
| Etiqueta de grupo `sidebar-foreground/70` (2,74)  | `muted-foreground` (4,62 · 10,0)                 | AA en texto                                 |
| Ítem de menú 32 px                                | 25 px; 36 px con puntero grueso                  | 19 colecciones: con 32 px desbordaba 127 px |
| Activo solo con fondo (1,14:1, igual al hover)    | Fondo + barra                                    | El estado no comunicaba                     |
| Casilla 16 px · píldora 20 px                     | 20 px · 24 px                                    | Objetivo táctil (2.5.8)                     |
| Selector, relación, área de texto, subida a 32 px | Alto de Payload                                  | Recortaban contenido o apilan valores       |

#### Qué quedó fuera, y por qué

| Fuera                                | Por qué                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| Iconos del menú                      | Exigen un componente `Nav` a medida; el ítem del sistema funciona sin ellos        |
| Grupos (`.group-field`) como tarjeta | Son secciones a ancho completo con márgenes negativos: estrecharían el formulario  |
| Escala tipográfica y espaciado       | El sistema no los define (Tailwind v4 por defecto)                                 |
| Logo en oscuro                       | Falta el recurso del cliente: SVG o PNG transparente ≥ 520 × 102 con letras claras |
| Favicon                              | Falta un icono cuadrado; no se fabrica recortando el logo                          |
| Sitio público                        | Fuera del alcance de este trabajo (§10)                                            |

#### Qué sigue fallando

- **Campo de solo lectura en claro: 3,66:1.** Sin salida limpia (ver abajo). Es
  el `slug`, un dato que el editor necesita leer: no se ampara en la exención de
  componentes inactivos.

#### Qué NO quedó verificado en producción, y por qué

| Sin verificar en producción                     | Por qué                                                                                                                                                                                          | Dónde sí                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Fecha con error (borde rojo) y error en general | Provocarlo exige pulsar Guardar: en producción solo se navega y se leen estilos. Se comprobó que el CSS servido lleva la regla nueva                                                             | Preview, claro y oscuro, pintado                                                                                  |
| Campos de contraseña                            | Abrirlos cambia el estado del formulario de la cuenta                                                                                                                                            | Preview, claro y oscuro                                                                                           |
| Fila de array plegada                           | Plegar escribe en las preferencias del usuario                                                                                                                                                   | Preview                                                                                                           |
| Hover de fila de tabla y de enlace del menú     | No se repitió; mismo CSS                                                                                                                                                                         | Preview                                                                                                           |
| Capturas de la fase 3                           | Fallaron las de producción: la pestaña no respondió a tiempo (`Page.captureScreenshot` y la inyección de script agotaron el tiempo). Las mediciones sí se tomaron, con dos lecturas coincidentes | Capturas de preview en la conversación, no guardadas como fichero                                                 |
| Menú a 36 px con puntero grueso                 | La extensión del navegador no emula `pointer: coarse`. Se verificó que la regla existe y no se activa con ratón, y su efecto aplicándola sin la media query                                      | Simulado inyectando la regla (sobre producción: la sesión del preview caducó); **ningún dispositivo táctil real** |
| Anchos estrechos (1000, 1024, 768, 390 px)      | La ventana estaba maximizada y no se pudo redimensionar: se midió en un `iframe` del mismo origen, donde las media queries se evalúan igual                                                      | Preview, `iframe`                                                                                                 |
| Selector y vista de redirects con administrador | En producción no se abrió; en preview la cuenta pasó a administrador tarde y la vista no se midió                                                                                                | Solo el selector de «Tipo» de páginas                                                                             |
| Logo en oscuro                                  | Se comprobó que carga (22 px); su aspecto sobre fondo oscuro depende del recurso pendiente del cliente                                                                                           | —                                                                                                                 |

**Mecanismo, verificado en la API instalada y no de memoria** (se leyó en
**3.88.0**; la instalada hoy es **3.89.0**, ver la nota de versión de abajo)**:**
Payload declara su tema dentro de `@layer payload-default`
(`@payloadcms/ui/dist/scss/colors.scss` y `app.scss`). `custom.scss` se importa
después de `@payloadcms/next/css` en `(payload)/layout.tsx` y **va sin capa**, y
el CSS sin capa gana a cualquier capa con independencia de la especificidad. No
hacen falta `!important` ni selectores más específicos. **No existe una opción
`admin.css` en la configuración**; esta es la vía.

> **Versión de Payload — corregido dos veces, y por eso conviene la regla.**
> `package.json` declara `^3.86.0`, un rango, así que la versión real **la fija
> el lock, no este documento**:
>
> | Cuándo     | Instalado  | Cómo se supo                                                                                                               |
> | ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
> | 2026-09-16 | **3.88.0** | Este documento decía «3.86»: era el rango, no lo instalado                                                                 |
> | 2026-09-17 | **3.89.0** | Al regenerar el lock (§10.5) para instalar los iconos, `^3.86.0` resolvió a 3.89.0 en los **ocho** paquetes del ecosistema |
>
> **La regla:** antes de afirmar algo sobre el código de Payload, leer la versión
> instalada (`node -p "require('payload/package.json').version"`), no estas notas.
> Todo lo que aquí diga «3.88» se leyó de 3.88 y **no se ha reverificado en
> 3.89**; lo que sí está verificado sobre 3.89 es el **resultado pintado** de las
> tres fases y del menú propio, medido en producción.

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

**Borde del input — 1,49:1 en claro, 1,29:1 en oscuro.** _Resuelto después, en
la fase 2 (3,11 · 3,35), con el borde derivado aprobado por dirección._ Lo que
sigue es el razonamiento de entonces. Sin salida limpia: el
`--border` del sistema es un gris muy suave en claro y **blanco al 10 %** en
oscuro. Llevarlo a 3:1 exigiría un borde bastante más marcado en todos los
campos, que es una decisión estética del sistema, no un ajuste de contraste.
**De fábrica ya fallaba** (1,36:1).

### Qué NO quedó verificado pintado, dicho claro

_Superado: las fases 1–3 midieron navegación, listados y edición en los dos
modos. Ver «Estado final»._

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

### Fase 2 — campos, botones y variantes (rama `feat/panel-fase2-campos`)

Mismo método que la fase 1: «antes» en producción, «después» en el preview, en
claro y oscuro, con cookie `payload-theme` y recarga (§10.23). El foco se midió
con un **clic real**, no con `focus()` desde script, que en una pestaña de fondo
no activa `:focus` de forma fiable.

**Decisiones de dirección aplicadas:** relleno y radio del sistema **más** un
borde derivado (no el campo sin borde); 32 px solo donde no recorta; hover, foco
y etiquetas de grupo, lo accesible.

#### Campos

| Medida (claro · oscuro)           | Antes (producción)            | Después (preview)                                 |
| --------------------------------- | ----------------------------- | ------------------------------------------------- |
| Radio                             | 5,76 px                       | **12,96 px** (`2xl`)                              |
| Borde contra el fondo             | 1,49 · 1,29                   | **3,11 · 3,35**                                   |
| Borde en la caja de acceso        | 1,33 · 1,21                   | **4,12 · 3,15**                                   |
| Relleno                           | `#fcfcfc` · `#1f1f20`         | **`#f0f0f0` · `#272727`** (`bg-input/50` · `/60`) |
| Texto sobre el relleno            | 18,26 · 8,55                  | **16,44 · 7,75**                                  |
| Foco                              | borde gris, sin halo          | **borde primario 4,71 · 3,88 + halo 3 px**        |
| Alto texto, correo, número, fecha | 40 px                         | **32 px**, sin desbordar                          |
| Casilla                           | radio 5,76, borde 1,49 · 1,29 | **radio 5 px, borde 3,11 · 3,35**                 |

#### Criterio del borde derivado — aprobado por dirección

> **El criterio aprobado NO es «el paso 350». Es: el borde de un control usa
> el PRIMER paso de la rampa que cumple 3:1 (WCAG 1.4.11) sobre el fondo en el
> que está.** El número del paso sale de aplicar ese criterio, y cambia con el
> fondo. Cuando en el código aparecen pasos distintos según el contexto, **es el
> criterio funcionando, no un incumplimiento**.

| Fondo sobre el que va el control                                                 | Claro                 | Oscuro                |
| -------------------------------------------------------------------------------- | --------------------- | --------------------- |
| Fondo general (`--background`)                                                   | paso **350** · 3,11:1 | paso **450** · 3,35:1 |
| Superficie elevada (paso 50): caja de acceso, barra de búsqueda, filtros, subida | paso **400** · 4,12:1 | paso **450** · 3,15:1 |

Por qué salen números distintos: en oscuro el paso 350 da **2,39:1** sobre el
fondo general, y en claro da **2,78:1** sobre la superficie elevada. En los dos
casos el siguiente paso que llega a 3:1 es el que se usa. Implementado como una
sola variable, `--pq-campo-borde`, redefinida por contexto en `custom.scss`.

#### Botones y píldoras

| Medida (claro · oscuro)       | Antes                  | Después                       |
| ----------------------------- | ---------------------- | ----------------------------- |
| Radio de todos los botones    | 5,76 px                | **12,96 px**                  |
| Peso de texto                 | 400                    | **500** (`font-medium`)       |
| Primario (texto blanco)       | 4,83                   | **4,83**, alto 32 px (ya era) |
| Secundario → `outline`: borde | 16,29 (casi negro)     | **4,12 · 3,15** (derivado)    |
| Píldora «Crear» → `secondary` | 12,27 · **4,20 FALLA** | **16,01 · 13,57**             |
| Píldora en barra de búsqueda  | `#d1d1d1`, radio 3 px  | `#d1d1d1`, **radio 12,96 px** |

**Un fallo que ya estaba en producción queda resuelto:** el botón «Crear» del
campo de subida daba **4,20:1 en oscuro**; con la variante `secondary` del
sistema da **13,57:1**.

#### Qué se queda en 40 px (o más), y por qué

| Campo               | Alto          | Motivo                                                                                                                                               |
| ------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Selector (`select`) | 40 px o más   | `react-select` con altura automática: un valor largo **parte en dos líneas** (el rol mide 60 px en producción) y lleva iconos de limpiar y desplegar |
| Relación            | 40 px o más   | Mismo componente; con varios valores apila píldoras. Y su botón «+» tiene que igualar la altura del control                                          |
| Área de texto       | según filas   | Multilínea por naturaleza: crece con el contenido                                                                                                    |
| Subida              | ~61 px        | No es un campo: es una zona con botones («Crear», «Elegir de los existentes») y texto de arrastre                                                    |
| Texto enriquecido   | variable      | Superficie de edición de Lexical, no un campo de una línea                                                                                           |
| Casilla             | 20 px (no 16) | El sistema la dibuja a 16 px; bajarla reduciría el área pulsable                                                                                     |
| Píldoras            | 24 px (no 20) | A menudo son interactivas (filtros, columnas); 24 px es el mínimo táctil de WCAG 2.5.8                                                               |

Los campos a 32 px cumplen ese mínimo táctil con margen.

#### Defectos encontrados al medir, corregidos antes de enseñar el resultado

1. **La fecha no se estilaba**: su selector real es `.date-time-picker`, no
   `.field-type.date`.
2. **El icono del calendario habría quedado bajo el texto**: Payload reserva
   relleno derecho para él. Solo se toca el izquierdo.
3. **La relación y su botón «+» se separaban**: la regla de partición de esquinas
   perdía por especificidad (3 clases contra 4, ambas sin capa). Visible en la
   captura del preview.
4. **El foco no se veía**: la regla de reposo (6 clases y pseudoclases) ganaba a
   la de foco (4). Al enfocar un campo el borde seguía gris y sin halo. Un campo
   sin indicador de foco visible es un fallo de accesibilidad, no estético.
5. **La casilla no estaba estilada**: estaba en el plan y no se había escrito.
6. **El borde derivado no llegaba a 3:1 sobre la caja gris de acceso** (2,78:1):
   esa superficie usa el paso 50. Ahí el borde pasa al primer paso que cumple.
7. **Las píldoras de la barra de búsqueda dejaban de parecer botones**: con el
   `secondary` del sistema, 1,03:1 contra la barra. Recuperan el fondo que tenían.

Los defectos 3 y 4 son la misma trampa: **las reglas sin capa ganan a Payload,
pero entre ellas manda la especificidad**, y excluir estados (`:not(.error)`,
`:not([readonly])`) la dispara. Cualquier regla de estado nueva tiene que repetir
la cadena completa de su regla de reposo.

#### Píldoras con contorno — decisión de dirección (2026-09-17)

La píldora «Crear» junto al título del listado se veía muy tenue: es el
`secondary` exacto del sistema, `#f2f2f2` sobre `#fcfcfc`, ~1,07:1 de
separación, aunque su texto contrasta 16,01:1. **Decisión: darle contorno.** Un
control tiene que parecer un control, y WCAG 1.4.11 aplica al **límite** del
control, no solo a su texto. La fidelidad al sistema no compensa perder claridad
de uso en una herramienta de trabajo interna.

Aplicado a todas las píldoras que son controles (`.btn--style-pill` y `.pill`),
con el mismo borde derivado de los campos.

#### Verificado también

- **Esquinas de una fila de array PLEGADA** (pendiente de la fase 1): contenedor,
  cabecera y botón con las cuatro esquinas a 12,96 px. Medido en el preview
  plegando con «Contraer todo», que escribe en las preferencias del usuario; se
  restauró con «Mostrar todo».

#### No verificado en la fase 2 — cerrado en la fase 3

- **Campos de contraseña** y **estado de error**: medidos en el preview de la
  fase 3 (ver abajo). El error de la **fecha** estaba roto: se corrigió allí.
- **Selector y redirects con permisos de administrador**: en la base de preview
  la cuenta de pruebas era **editor**; ya es administrador en esa base.

### Fase 3 — navegación, tablas y migas (rama `feat/panel-fase3-navegacion-tablas`)

Mismo método: «antes» en producción, «después» en el preview, claro y oscuro con
cookie y recarga (§10.23), varias lecturas tras asentar. Ventana de 1528 × 828 px
CSS (DPR 1,25), salvo donde se indica.

#### Menú lateral

Primera versión con el `py-2` del sistema; versión final tras las dos decisiones
de dirección de abajo.

| Medida (claro · oscuro)      | Antes (producción)        | Primera versión       | **Final**                                    |
| ---------------------------- | ------------------------- | --------------------- | -------------------------------------------- |
| Alto de enlace               | 25 px                     | 36 px                 | **25 px**                                    |
| Relleno                      | 2,5 px 0                  | 8 px 12 px            | **2,5 px 12 px**                             |
| Radio                        | 0                         | 10,08 px              | **10,08 px** (`xl`)                          |
| Texto de enlace              | 18,26 · 15,2              | 18,26 · 15,2          | 18,26 · 15,2                                 |
| Activo: marca                | barra + peso 600          | solo fondo + peso 500 | **barra + fondo + peso 500**                 |
| Activo: fondo contra el menú | —                         | 1,14 · 1,44           | 1,14 · 1,44                                  |
| Barra del activo             | a −20 px, fuera del ítem  | oculta                | **3 × 16 px dentro del ítem · 16,0 · 10,55** |
| Etiqueta de grupo            | 13 px · 400 · 4,62 · 10,0 | 12 px · 500           | 12 px · 500 · 4,62 · 10,0                    |
| Contenido del menú           | 822 px                    | 1031 px               | **822 px**                                   |

**Con las 19 colecciones, el menú del sistema NO cabe.** Exceso medido según el
relleno vertical del enlace (ventana de 828 px):

| Relleno | Alto de enlace | Exceso |
| ------- | -------------: | -----: |
| 8 px    |          36 px | 203 px |
| 6 px    |          32 px | 127 px |
| 5 px    |          30 px |  89 px |
| 4 px    |          28 px |  51 px |
| 3 px    |          26 px |  13 px |
| 2,5 px  |          25 px |   0 px |

32 px es el alto real del sistema (`h-8`).

**Decisión de dirección 1 (2026-09-17) — relleno a 2,5 px.** Usabilidad sobre
fidelidad: un menú con scroll en un panel de uso diario es peor que uno menos
vistoso. Se conservan esquinas, fondo del activo y peso 500. El contenido vuelve
a los **822 px de producción**: el menú cabe sin scroll en ventanas de 822 px o
más; por debajo desborda **lo mismo que producción** (42 px a 780 px), no más.

**Decisión de dirección 2 — la barra del activo vuelve.** Con fondo de 1,14:1
idéntico al del hover, la página actual no se distinguía de la señalada. No es un
problema de contraste sino de que el estado no comunicaba. Payload la dibuja a
−20 px, en el margen del menú: fuera del ítem redondeado y, a ≤1024 px, donde el
margen baja a 10 px, recortada. Se movió **dentro del ítem** (4 px desde el
borde, 5 px hasta el texto). Verificado que hover y activo ya se distinguen.

#### Logotipo del panel con el wordmark del sistema (2026-09-20)

Rama `feat/panel-wordmark`, **sin fusionar** mientras falte la verificación
pintada de abajo.

El PNG institucional (`seoConfig.logoPath`) **lleva fondo blanco**: en el panel
en modo oscuro se veía como una tarjeta blanca pegada al fondo — el pendiente
#12 del cliente. Lo sustituye `partequipos-wordmark`, copiado con el CLI del
cliente (§10.27 de CLAUDE.md): **un fichero, cero dependencias, cero imports,
solo un `<svg viewBox="0 0 718 173">` con 18 `path`**.

**Colores: los del panel, no los del sistema.** El componente trae por defecto
`var(--foreground)` y `var(--sidebar)`, que no existen en el panel de Payload. Se
le pasan `textColor="var(--theme-elevation-1000)"` y `holeColor="var(--theme-bg)"`;
la «P» se queda en el rojo de marca (`#d92035`), idéntico en los dos modos.

**Medido sobre la pantalla de acceso pintada, en el preview:**

| Medida (claro · oscuro)            | Antes (PNG)                        | Después (wordmark)                         |
| ---------------------------------- | ---------------------------------- | ------------------------------------------ |
| Texto del logotipo contra su fondo | —, era una imagen con fondo propio | **20,47 · 15,2**                           |
| Ojales de las letras               | —                                  | `#fcfcfc` · `#121212`: **el fondo exacto** |
| «P» de marca                       | —                                  | 4,86 · 3,75 (mismo rojo)                   |
| Tamaño                             | 260 px de ancho                    | 46 × 191 px (proporción 4,15)              |
| Elementos `<img>` en la pantalla   | 1, con fondo blanco                | **0**                                      |

Dos lecturas coincidentes por modo. **El contraste de un logotipo no es un
requisito WCAG** —1.4.11 exime los logotipos—, pero se mide igual porque lo que
falla en oscuro no es el contraste: es el recuadro blanco, y eso sí se ve.

**Un defecto que introdujo el cambio, corregido:** el `<svg>` del sistema trae
`aria-hidden="true"`, así que al cambiar de pieza **se perdió el `alt`** que el
PNG sí tenía. Va envuelto en `role="img"` con `aria-label="Partequipos"`.

**El fichero copiado se excluye de Prettier** a propósito
(`.prettierignore`): así sigue comparable **byte a byte** con
`https://ui.partequipos.com/r/partequipos-wordmark.json`, que es la comprobación
de cadena de suministro al añadir o actualizar un componente del cliente. Al
copiarlo coincidía exacto: 16.708 bytes.

**QUÉ CIERRA Y QUÉ NO:**

| Pendiente                                                                    | Estado                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| #12 · logo en oscuro **del panel**                                           | **CERRADO Y VERIFICADO** pintado (acceso y migas), en los dos modos |
| #9 · **favicon**                                                             | **SIGUE ABIERTO.** Hace falta un icono cuadrado; esto no lo da      |
| Logo del **sitio público** (cabecera, JSON-LD `Organization`, imagen social) | **SIN TOCAR**: sigue el PNG cableado de §10.8                       |

#### Verificación pintada: completada, y encontró un defecto

El **nombre accesible** se comprobó en el **árbol de accesibilidad**, no en el
marcado: sale `img "Partequipos"`. Lo raro fue cómo: el commit del arreglo
**nunca disparó despliegue** (CLAUDE.md §10.30), y se verificó desde el preview
de otra rama que lo lleva dentro, tras confirmar la ascendencia con
`git merge-base --is-ancestor` y no por suposición.

**EL DEFECTO: en las migas de pan iba el logotipo, y no cabe.** El hueco que
Payload reserva para el icono mide **18 × 22 px con `overflow: hidden`**, y el
wordmark a 22 px de alto ocupa **91 px**: se veía «PA» recortado. El componente
compilaba, tipaba y renderizaba sin una queja; el recorte **solo existía en la
página pintada**.

**Arreglo: ahí va el ISOTIPO**, `partequipos-logo`, cuyo `viewBox` es más alto
que ancho (188 × 272). Copiado con el CLI de uno en uno, cero dependencias,
verificado byte a byte (5.668 bytes) y también excluido de Prettier.

| Migas de pan (claro · oscuro) | Antes (wordmark) | Después (isotipo)                      |
| ----------------------------- | ---------------- | -------------------------------------- |
| Tamaño                        | 91 × 22 px       | **14 × 20 px**                         |
| ¿Cabe en el hueco de 18 px?   | **No: «PA»**     | **Sí**                                 |
| Rojo de marca contra el fondo | —                | 4,28 · 4,27                            |
| Ojal de la P                  | —                | `#fcfcfc` · `#121212`: el fondo exacto |
| Nombre accesible              | —                | `Partequipos`                          |

El único `<img>` que queda en el panel es el **gravatar de la cuenta**, de
Payload: ningún logotipo nuestro es ya una imagen con fondo propio.

**La lección es la de §10.18 en pequeño:** aquel despliegue pasó CI, compiló y
prerenderizó 118 páginas, y dejó `/admin`, la API, el sitemap y los redirects en 500. Aquí el componente pasó todas las puertas y salía recortado. **Verde en CI
no es verde en pantalla.**

#### Iconos del menú y menú propio — fase B (2026-09-17)

El sistema del cliente usa **`@tabler/icons-react`** (`size-4`, trazo regular) y
prohíbe **mezclar familias de iconos**
(`ui.partequipos.com/foundations/icons`). Dependencia **aprobada por dirección**
(CLAUDE.md §2) frente a la alternativa de máscaras CSS, que dependían del nombre
del grupo y habrían dejado el icono en blanco sin avisar al renombrarlo.

**Los iconos van solo en los grupos** (primer nivel). Las entradas no llevan: son
19, y distinguir «Categorías de usada» de «Categorías de maquinaria nueva» con
iconos obligaría a inventar metáforas.

| Grupo         | Icono       |
| ------------- | ----------- |
| Comercial     | `inbox`     |
| Repuestos     | `tool`      |
| Maquinaria    | `bulldozer` |
| Lubricantes   | `droplet`   |
| Contenido     | `article`   |
| Configuración | `settings`  |

El **chevron** de los grupos y el **botón de cerrar sesión** pasan también a
Tabler (`chevron-down` girando 180°, que no gira con
`prefers-reduced-motion`, y `logout`): eran los dos únicos iconos de la familia
de Payload que quedaban en el menú.

**Esto obliga a reemplazar el menú completo** (`admin.components.Nav`): Payload
no permite sustituir solo el grupo, y su `NavGroup` no tiene sitio para un icono.
El detalle de qué se replica, qué piezas `@internal` se usan y qué no se puede
replicar está en `src/components/admin/Nav/index.tsx`.

**Medido en el preview, en claro y oscuro:**

| Medida (claro · oscuro)           | Resultado                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| Icono de grupo                    | 16 px, al color de la etiqueta (4,62 · 10,0)                                        |
| Etiqueta de grupo                 | 4,62 · 10,0                                                                         |
| `aria-expanded` / `aria-controls` | presentes y correctos en los 6 grupos; el `id` que referencian existe               |
| Grupo plegado                     | `display: none` en su contenido                                                     |
| Teclado con un grupo plegado      | el tabulador **salta** sus enlaces y va al grupo siguiente                          |
| Foco del botón de grupo           | contorno 1,6 px, **4,71 · 3,88**                                                    |
| Cerrar sesión                     | icono 16 px, 18,26 · 15,2, `aria-label` «Cerrar sesión» de la traducción de Payload |
| Página activa                     | barra indicadora presente, texto 13,92 · 12,46                                      |
| Pie                               | sigue `sticky` y a la vista                                                         |
| Entradas                          | 19, en los 6 grupos                                                                 |

**Un defecto de accesibilidad de Payload, corregido aquí:** su
`.nav-group__toggle:focus-visible` lleva `outline: none` y solo aclara el color
del texto. Medido con el teclado en el preview: el botón enfocado no tenía
contorno mientras los enlaces sí. Ahora usa el mismo indicador que los enlaces
(WCAG 2.4.7).

**Lo que NO cambia respecto a Payload, a propósito:** con `trailingSlash: true`,
la entrada de la página actual sigue siendo un enlace y no un `div`, porque la
ruta lleva barra final y el `href` no. Es el comportamiento de Payload, no una
regresión de este menú.

**Colapsar por defecto sigue descartado** (el problema que lo motivaba lo resolvió
la fase A), pero la puerta queda abierta: `ABIERTO_POR_DEFECTO` en
`src/components/admin/Nav/index.tsx` es el único sitio donde se decide.

#### Agrupación del menú y pie fijo — fase A (2026-09-17)

Aprobado por dirección tras el estudio del menú. **El problema de fondo no era el
scroll, era la agrupación:** «Colecciones» es el grupo por defecto de Payload y
recogía 7 colecciones de naturaleza distinta (catálogo de repuestos, Media,
páginas, redirecciones), y los nombres no decían de qué sección eran («Marcas»
junto a «Marcas de maquinaria»).

| Antes                            | Después                                        |
| -------------------------------- | ---------------------------------------------- |
| Colecciones (7, cajón de sastre) | **Comercial** (1): Solicitudes, primero        |
| Configuración (1)                | **Repuestos** (4)                              |
| Maquinaria (6)                   | **Maquinaria** (6)                             |
| Lubricantes (2)                  | **Lubricantes** (2)                            |
| Blog (2)                         | **Contenido** (4): páginas, blog y Media       |
| Comercial (1), último            | **Configuración** (2): Usuarios, Redirecciones |

Solicitudes va primera porque son los leads y hoy solo se ven entrando al panel
(CLAUDE.md §10.11). **El orden del menú es el orden del array `collections` de
`payload.config.ts`**: `groupNavItems` crea cada grupo cuando aparece por primera
vez. No toca el esquema —las tablas se generan por slug— ni los slugs del panel.

`src/collections/grupos.test.ts` falla si una colección se queda sin grupo
aprobado: sin `admin.group` Payload la mete en «Colecciones» sin avisar.

**Preferencias guardadas.** Payload guarda el estado de cada grupo en
`payload-preferences` (clave `nav`) **por nombre de grupo**. Maquinaria,
Lubricantes, Comercial y Configuración conservan nombre y estado; Repuestos y
Contenido son nuevos y salen abiertos (el valor por defecto); «Colecciones» y
«Blog» quedan como entradas huérfanas que Payload no lee. Las preferencias de
listado (columnas, orden, paginación) van por slug y no se tocan.
`npm run prefs:menu` lista el estado por usuario e imprime el host de la base.

**Pie fijo del menú, medido en el preview:**

| Medida (claro · oscuro)             | Antes                        | Después                        |
| ----------------------------------- | ---------------------------- | ------------------------------ |
| Cerrar sesión con ventana de 600 px | fuera de la vista (a 782 px) | **pegado abajo**               |
| Posición                            | al final de la lista         | `sticky`                       |
| Fondo                               | transparente                 | opaco (`#fcfcfc` · `#121212`)  |
| Separador superior                  | ninguno                      | 1 px (1,30 · 1,29, decorativo) |
| Icono de cerrar sesión              | 18,26 · 15,2                 | 18,26 · 15,2                   |
| Alto del contenido del menú         | 822 px                       | 828 px                         |

El relleno inferior del contenedor con scroll pasa al propio pie: `sticky` se
ancla al borde **interior** del relleno, así que con los 40 px de Payload el pie
se despegaba justo al terminar el scroll. Medido antes de escribir la regla.

#### Objetivo táctil del menú

| Ventana (px) | Menú                            | Enlace       | Exceso del menú |
| ------------ | ------------------------------- | ------------ | --------------: |
| 1528 × 828   | lateral fijo                    | 25 × 234     |               0 |
| 1528 × 780   | lateral fijo                    | 25 × 234     |              42 |
| 1000 × 780   | desplegable (cerrado de inicio) | 25 × 256     |              26 |
| 1024 × 600   | desplegable                     | 25 × 256     |             206 |
| 768 × 1024   | pantalla completa               | **35** × 735 |               0 |
| 390 × 844    | pantalla completa               | **35** × 358 |             152 |

Anchos por debajo de 1528 medidos en un `iframe` del mismo origen: la ventana del
navegador estaba maximizada y no se pudo redimensionar.

- **WCAG 2.5.8 (AA, 24 × 24 px): cumple en todos los anchos**, por 1 px en
  escritorio. Los enlaces son contiguos (0 px entre ellos), así que no aplica la
  excepción por espaciado: cumple por tamaño.
- **WCAG 2.5.5 (AAA, 44 px): no cumple en ningún ancho**, tampoco en producción.
- **En móvil (≤768 px) Payload ya sube el enlace a 35 px** (17,5 px / 30 px de
  interlineado), y el menú a pantalla completa hace scroll con naturalidad.
- **El hueco es la franja 769–1024 px con pantalla táctil** (tabletas en
  horizontal): 25 px con el dedo.

**Reparto vertical del menú (822 px):** relleno superior 56 (cabecera) · 6 grupos
× 35 (etiqueta 20 + 5 + margen 10) = 210 · 19 enlaces × 25 = 475 · controles 41
(con 20 de margen) · relleno inferior 40.

**APLICADA (decisión de dirección, 2026-09-17):** `@media (pointer: coarse)`
con `min-height: 36px` en el enlace. `min-height` y no relleno: en móvil el
interlineado de Payload ya da 35 px y el relleno lo inflaría.

| Ventana (px) | Ratón (sin cambio) | Puntero grueso (simulado) | Exceso del menú |
| ------------ | -----------------: | ------------------------: | --------------: |
| 1528 × 828   |              25 px |                     36 px |         0 → 203 |
| 1000 × 780   |              25 px |                     36 px |        26 → 235 |
| 1024 × 768   |              25 px |                     36 px |        38 → 247 |
| 768 × 1024   |              35 px |                     36 px |           0 → 0 |
| 390 × 844    |              35 px |                     36 px |       152 → 171 |

Texto y barra del activo siguen centrados en todos los anchos. **Cómo se midió,
dicho claro:** la extensión del navegador no emula `pointer: coarse`, así que el
efecto se midió **inyectando la regla sin la media query**, en la ventana y en
`iframe` del mismo origen; y por separado se comprobó que el despliegue **sirve**
`@media (pointer:coarse){.nav__link{min-height:36px}}` y que con ratón el enlace
sigue en 25 px. **No se probó en un dispositivo táctil real.** La simulación se
hizo sobre producción (solo estilos, sin escribir nada) porque la sesión del
preview había caducado; el HTML del menú es el mismo.

**Propuesta original:** subir el alto solo con puntero grueso,
`@media (pointer: coarse)`, a 32–36 px. En ratón no cambia nada; en táctil el
menú haría scroll, que en una tableta es el gesto normal. Recortar márgenes
(relleno inferior 40 → 16, margen de grupo 10 → 4, margen de controles 20 → 8)
libera 72 px, que dan 29 px por enlace a 828 px de ventana, pero **reintroduce
el scroll en cualquier ventana menor** y comprime la separación entre grupos.

#### Tabla de listado

| Medida (claro · oscuro) | Antes (producción)            | Después (preview)                      |
| ----------------------- | ----------------------------- | -------------------------------------- |
| Franjas                 | impares `#efefef` · `#181919` | **ninguna**                            |
| Línea bajo fila         | ninguna                       | **1 px `--border`** (1,30 · 1,30)      |
| Cabecera: alto          | 54 px                         | **40 px** (`h-10`)                     |
| Cabecera: peso · texto  | 400 · 4,62 · 10,0             | **500 · 20,47 · 15,2**                 |
| Celda: relleno · fila   | 12 px · 44 px                 | **8 px · 37 px** (16 px en los bordes) |
| Hover de fila           | —                             | `muted/50`                             |

La línea de fila es separador decorativo: 1.4.11 no le pide 3:1.

#### Migas de pan

| Medida (claro · oscuro) | Antes              | Después                          |
| ----------------------- | ------------------ | -------------------------------- |
| Enlace                  | 600 · 18,26 · 15,2 | **400 · 4,62 · 10,0** (atenuado) |
| Página actual           | 400 · 18,26 · 15,2 | 400 · **20,47** · 15,2           |

#### Estados pendientes de la fase 2, medidos

| Estado (claro · oscuro)        | Resultado                                                               |
| ------------------------------ | ----------------------------------------------------------------------- |
| Contraseña y confirmación      | 32 px · 12,96 px · borde 4,12 · 3,15 (superficie elevada, paso 400/450) |
| Texto en error, reposo         | borde rojo de Payload 4,65 · 4,41 · aviso 8,64 · 4,90                   |
| Texto en error, con foco       | borde 6,49 (oscuro); Payload conserva su estilo, no el halo primario    |
| Foco normal (regresión fase 2) | borde primario 3,88 + halo 3 px (oscuro), igual que en la fase 2        |
| Partición relación / «+»       | `12.96px 0 0 12.96px` / `0 12.96px 12.96px 0`, igual que en la fase 2   |

#### Defectos encontrados al medir, corregidos antes de enseñar el resultado

1. **La fecha en error perdía el borde rojo.** La exclusión apuntaba a
   `.date-time-picker--has-error`, clase que **no existe** en Payload 3.88 (leído
   de 3.88, sin reverificar en 3.89): el
   error se marca en el contenedor (`.date-time-field--has-error`). El borde gris
   del campo tapaba el rojo; solo quedaba el aviso de texto. Tras el arreglo:
   `#e7000b` 4,65 en claro, 4,94 en oscuro.
2. **Un campo en error quedaba a 5,76 px** junto a campos a 12,96 px, porque el
   radio iba en la regla de reposo, que excluye el error. El radio va ahora en
   regla aparte para todos los estados; los colores de estado siguen siendo los
   de Payload.
3. **La cabecera de tabla medía 46,8 px, no 40.** El botón de ordenar (30 px) más
   el `p-2` común. El sistema no da relleno vertical al `th`.

El defecto 1 es de la familia de §10.15: la regla «excluía el error» en el
código, y el error seguía tapado en la página pintada.

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

## 9.b Sitio público — fase 0: los tokens, medidos (2026-09-17)

El cliente entregó su sistema como **CLI** (`partequipos@0.3.5`, 77 componentes;
riesgos y reglas de uso en CLAUDE.md §10.27). La fase 0 es solo el bloque de
tokens en `src/app/(site)/globals.css`, **pegado a mano**: para Next el CLI
escribe en `app/globals.css` relativo a la raíz y crearía un fichero huérfano.

**Antes y después, medido ruta a ruta** (producción contra el preview de la
rama; `npm run qa` contra un preview mide producción, §10.21, así que aquí no
sirve):

| Medida                        | Antes                              | Después          |
| ----------------------------- | ---------------------------------- | ---------------- |
| Fondo del cuerpo              | `#ffffff`                          | **`#fcfcfc`**    |
| Color del cuerpo              | `#171717`                          | **`#000000`**    |
| `--radius`                    | sin definir                        | **0,45 rem**     |
| `--primary`                   | sin definir                        | rojo del sistema |
| H1 de la portada (36 px)      | 17,75                              | 17,30            |
| Párrafo de la portada (18 px) | 7,56                               | 7,37             |
| H1 de ficha de modelo (30 px) | 17,75                              | 17,30            |
| Párrafo de ficha (16 px)      | 10,30                              | 10,04            |
| Campo del formulario          | borde `#d1d5dc`, radio 4 px, 42 px | **sin cambio**   |
| Botón de enviar               | fondo `#101828`, radio 4 px        | **sin cambio**   |

**Por qué cambia tan poco, y por qué es lo esperado:** el sitio no usa **ninguna**
clase basada en tokens (`bg-background`, `text-foreground`, `text-muted-foreground`:
cero ocurrencias) ni `font-sans`/`font-mono`. Lo único que los consume es la regla
`body` de nuestro CSS. Los 188 colores fijos son utilidades de paleta y no
dependen de estas variables: por eso el formulario sale idéntico.

Los contrastes bajan unas centésimas porque el fondo es un punto más oscuro.
Todos siguen muy por encima de AA.

**MODO OSCURO: no se reactiva, verificado.** El sistema lo declara **por clase**
(`@custom-variant dark (&:is(.dark *))` más un bloque `.dark`), no por
`prefers-color-scheme`. La comprobación salió redonda porque el sistema operativo
de la máquina de pruebas **estaba en oscuro**: las tres rutas siguieron claras y
sin clase `.dark`, antes y después. El fallo de CLAUDE.md §10.14 no puede
repetirse por esta vía.

**Un defecto del bloque, corregido al pegarlo:** su `@theme inline` declara
`--font-sans: var(--font-sans)`, que es circular, y su `:root` no define
`--font-sans`. Eso dejaría la utilidad `font-sans` sin valor. Hoy no se usa en
ninguna plantilla, así que no rompía nada, pero se repone nuestra fuente después
del bloque para que no sea una trampa futura.

**Fases 1 y 2 (formularios y catálogo con componentes reales): EN ESPERA** del
diseño, por decisión de dirección — reconstruir los formularios dos veces no
tiene sentido.

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

---

## 11. Hero «Potencia Hitachi» de Andrés — prototipo medido (2026-09-22)

> Construido en la rama **`proto/hero-andres`**, con preview y **sin fusionar a
> `main`**. Es un prototipo para validar el diseño, no una entrega.
>
> Fuente del diseño: `https://partequipos.uxdesign.website/ux-9/` — **no** está
> en la home de ese sitio.

### 11.1 Lo extraído, y una corrección de alcance

Todo medido con `getComputedStyle` y recorriendo las reglas de Elementor, no
copiado de una captura.

| Recurso      | Dimensiones     | Peso original                      |
| ------------ | --------------- | ---------------------------------- |
| `Fondo.jpg`  | **2048 × 1360** | **593,4 kB** JPEG                  |
| `Hero-1.png` | **1476 × 1057** | **908,2 kB** PNG con transparencia |

**Su diseño tiene TRES cortes, y los valores que circulaban como «escritorio»
son los del corte de en medio:**

| Valor              | ≥1025 px                   | ≤1024 px                               | ≤767 px            |
| ------------------ | -------------------------- | -------------------------------------- | ------------------ |
| Título             | **120 px** / 168           | **70 px** / 98                         | **12vw**           |
| Imagen frontal     | **809 px**                 | **631 px**                             | 631 px, tope 100 % |
| Relleno de tarjeta | **10 px**                  | **50/30/30**                           | 50/30/30           |
| Alto mínimo        | 86vh                       | 86vh                                   | **85vh**           |
| Margen sup. imagen | 100 px                     | 100 px                                 | **200 px**         |
| Icono de flecha    | 21 px                      | 21 px                                  | **15 px**          |
| Vidrio             | **dentro** (`right: 21px`) | **sobresale** 73 px (`bottom: -113px`) | **oculto**         |

**Tres piezas que no se ven a simple vista:**

1. **El solape es un margen inferior de `-250px`** en la fila del título: es lo
   que hace que la máquina se le monte encima. Con él, el modelo reproduce la
   altura exacta de su tarjeta (745 px en escritorio, 628 px a 1018 px).
2. **El vidrio declara el borde en `1px`**, no en 0,8: los 0,8 que salen al
   medir son el redondeo de Chrome a DPR 1,25.
3. **`backdrop-filter: blur(18px)`**, que no estaba en la lista de valores.

**No hay carrusel.** En la tarjeta: 0 enlaces, 0 botones y ningún slider. Las
flechas y el «+» son `div` decorativos, sin nombre accesible y sin
comportamiento. Y **la página no tiene ningún `<h1>`**: el título es un `<h2>`.

### 11.2 Diferencias con el sistema del cliente — SIN resolver

Es decisión de Andrés y del cliente; el prototipo mantiene los valores de él,
aislados en variables (`src/components/hero/hero.module.css`).

|                 | Andrés             | Sistema del cliente                    | Sitio hoy |
| --------------- | ------------------ | -------------------------------------- | --------- |
| Fuente          | **Inter** 300/600  | **Rubik**                              | **Geist** |
| Rojo            | **#E5242D**        | `--primary` **#dc2626**                | —         |
| Radio           | **30 px**          | tope `--radius-4xl` **18,7 px**        | —         |
| Escala de texto | 120/70/12vw, 1,4em | **no define escala** (usa Tailwind v4) | Tailwind  |

Y sumando el CLI, el rojo tiene **tres** versiones vivas: `partequipos-wordmark`
usa **#D92035**.

**El vidrio NO es el `--glass-*` del sistema**, y el 12 % es una trampa de las
de §10.23 de CLAUDE.md —mismo número, papel distinto—:

| Capa       | Andrés          | Sistema                                          |
| ---------- | --------------- | ------------------------------------------------ |
| Fondo      | blanco **12 %** | `--glass-tint` **82 % / 58 %**                   |
| Borde      | blanco **25 %** | `--glass-rim` **12 % / 3 %**, **negro** en claro |
| Sombra     | negro **8 %**   | `--glass-shadow` **,14 / ,12**                   |
| Desenfoque | **18 px**       | sin token publicado                              |

### 11.3 Contraste medido — TRES FALLOS, sin corregir

**El método, que es lo que permite decidir con datos.** El texto va sobre una
foto, así que no hay «un color de fondo»: se muestrean los **píxeles reales** de
`Fondo.jpg` en la zona que ocupa cada elemento —reproduciendo el recorte
`object-fit: cover`—, y encima se componen las capas translúcidas: el vidrio
(blanco al 12 %) y la píldora de la flecha (blanco al 58 %). De ahí sale la
luminancia, y con ella el contraste.

| Elemento                      | Medido                               | Exige WCAG                    | Resultado               |
| ----------------------------- | ------------------------------------ | ----------------------------- | ----------------------- |
| Título blanco sobre el cielo  | **2,40** media · **1,16** peor píxel | **3:1** (texto grande, 1.4.3) | **FALLA**               |
| Rojo #E5242D sobre su píldora | **2,17** media · 2,98 mejor caso     | **3:1** (no textual, 1.4.11)  | **FALLA**               |
| Blanco sobre el vidrio        | **7,59** donde cae hoy               | 4,5:1                         | pasa, pero condicionado |

El vidrio pasa **por dónde está**: sobre las rocas oscuras. Con el desenfoque de
18 px lo que manda es la media local, y el parche más claro de esa zona daba
**1,81** — si la foto cambia o el recorte se estira y le toca cielo, se cae.

> **Y el aviso que importa para no fiarse de lo automático:** Lighthouse da
> **accesibilidad 100** y su auditoría `color-contrast` **en verde** en esta
> misma página. axe **no evalúa texto sobre imágenes**: no puede resolver el
> fondo, así que lo omite. Es el patrón de §10.14 de CLAUDE.md — la herramienta
> fácil mira un paso antes de donde está el problema.

### 11.4 Rendimiento — comparación controlada

Lighthouse móvil, **misma máquina, build de producción local, incógnito, 3
corridas por lado, única variable el hero**. Se descartó medir el preview: está
detrás de la protección de despliegue y el token de derivación no sale de GitHub
Secrets (decisión de dirección).

|              | Sin hero       | Con hero            |
| ------------ | -------------- | ------------------- |
| Puntuación   | **96** (91–99) | **87** (84–94)      |
| LCP          | **2,2 s**      | **3,75 s**          |
| Elemento LCP | `<h1>` (texto) | **imagen de fondo** |
| CLS          | 0              | 0                   |
| Peso total   | 283 kB         | **446 kB**          |

**−9 puntos y +1,5 s de LCP.** Qué lo determina, del desglose del LCP: TTFB
112 ms · descubrimiento 27 ms · **descarga de la imagen 1112 ms** · render
121 ms. Es la descarga del fondo bajo la red simulada, no el JavaScript.

**Peso añadido: +163 kB.**

| Concepto         | Añade                                                  |
| ---------------- | ------------------------------------------------------ |
| Fuente **Inter** | **+49 kB** (un woff2; el sitio pasa de 2 familias a 3) |
| Imágenes         | **+98 kB** — fondo 37 kB y frontal 62 kB, **en WebP**  |
| JavaScript       | **+3 kB** (154 → 157): React ya estaba en el paquete   |
| CSS              | +4 kB                                                  |

### 11.5 Decisiones pendientes — NO son nuestras

1. **Los tres fallos de contraste** (§11.3). Salidas posibles: velo sobre la
   foto, una foto más oscura, u oscurecer el rojo. **No se tocó ninguno**:
   cambiar sus valores sin decirlo falsearía la validación.
2. **El `<h1>`.** Su diseño no tiene ninguno. En el prototipo el título del hero
   es el único `<h1>` de la portada, y eso **sustituye** al actual —«Partequipos
   — Repuestos y maquinaria pesada en Colombia»—, que cubre las palabras clave
   del negocio. Con el tráfico orgánico como objetivo (CLAUDE.md §1) es decisión
   de negocio, no de maquetación. **Queda como está en el prototipo.**
3. **Las cuatro diferencias con el sistema** (§11.2): fuente, rojo, radio y
   vidrio.

### 11.6 Modelo de datos aprobado (2026-09-22)

**Grupo `hero` en la colección `Paginas`, condicionado al slug `inicio`.** No se
crea una colección de slides: el diseño **no tiene carrusel**, y modelar uno
sería inventar una estructura que nadie pidió. Ver ADR 0009.

En el prototipo el contenido son **datos de prueba** en
`src/components/hero/datosPrototipo.ts`, y las imágenes están en `public/` con
sus URL aisladas en `imagenesPrototipo.ts`: el componente las recibe por props,
así que pasar a Payload no le cambia una línea.
