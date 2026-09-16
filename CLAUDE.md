# Partequipos.com — Contexto del proyecto

> Este archivo es la fuente de verdad para cualquier sesión de trabajo.
> Léelo completo antes de escribir código. Si una decisión contradice este archivo,
> detente y consúltalo antes de continuar.

---

## 1. Qué es este proyecto

Migración completa de **partequipos.com**: sitio de catálogo de maquinaria pesada,
repuestos y servicios para el mercado colombiano.

**El objetivo del negocio es el tráfico orgánico.** Todo lo demás es secundario.
Cualquier decisión técnica que comprometa el SEO es una decisión incorrecta.

Volumen: **648 URLs públicas**, generadas desde ~22 componentes de ruta.

> Las 648 son **medidas** por rastreo propio del sitio en producción, no
> estimadas (ver §10.1). Este número decía «~470» hasta el 2026-09-13: era la
> cifra de los documentos de alcance del cliente, que subcontaban. Donde un
> documento del cliente y una medición discrepen, **manda la medición**.

---

## 2. Stack (no cambiar sin aprobación)

| Capa          | Tecnología                                                          |
| ------------- | ------------------------------------------------------------------- |
| Framework     | Next.js 16 · App Router · React 19                                  |
| Lenguaje      | TypeScript (modo estricto)                                          |
| CMS           | Payload 3 (integrado en el mismo proyecto, no como servicio aparte) |
| Base de datos | PostgreSQL (Neon)                                                   |
| Estilos       | Tailwind CSS + shadcn/ui                                            |
| Hosting       | Vercel                                                              |
| Archivos      | Vercel Blob (o Cloudflare R2)                                       |
| Errores       | Sentry                                                              |

**Prohibido sin aprobación previa:** agregar dependencias pesadas, cambiar de ORM,
introducir otro gestor de estado, o mover contenido fuera de Payload.

---

## 3. Reglas de arquitectura

### 3.1 Renderizado

- **Todo es Server Component por defecto.** `"use client"` solo cuando hay estado,
  eventos o APIs del navegador. Justificar en el PR cuando se use.
- Páginas de catálogo: estáticas con `generateStaticParams`.
- Contenido que cambia: **ISR** vía `revalidateTag` / `revalidatePath` disparado
  por hooks de Payload. Nunca reconstruir todo el sitio para un cambio puntual.
- **Nunca** hacer fetch de datos de catálogo desde el cliente. Rompe el SEO.

### 3.2 Acceso a datos

- Usar la **API local de Payload** (`payload.find`) en Server Components y en build.
  No llamar la API REST/HTTP del propio proyecto.
- Toda consulta va en `src/lib/queries/` — no consultas sueltas dentro de componentes.
- Tipos generados por Payload (`payload-types.ts`). No escribir tipos a mano
  para entidades del CMS.

### 3.3 URLs

- **La jerarquía de URLs existente es intocable.** Está documentada en
  `docs/url-map.csv`. Cambiar un slug requiere aprobación explícita.
- Todo cambio de URL exige su redirect 301 correspondiente en el mismo PR.
- Slugs en minúscula, sin tildes, separados por guiones.

### 3.4 SEO (obligatorio en cada página)

Ninguna ruta se considera terminada sin:

- `generateMetadata` con title, description y canonical.
- Open Graph e imagen social.
- JSON-LD correspondiente (`Product`, `BreadcrumbList`, `Organization`, `Article`).
- Entrada en el sitemap dinámico.
- Un solo `<h1>` por página.

---

## 4. Estructura de carpetas

```
src/
  app/
    (site)/            # sitio público
    (payload)/admin/   # panel del CMS
    api/
  collections/         # colecciones de Payload
  components/
    ui/                # shadcn
    layout/
    catalog/
  lib/
    queries/           # acceso a datos
    seo/               # metadata y JSON-LD
    utils/
scripts/
  import/              # importación masiva CSV → Payload
docs/
  url-map.csv          # mapa de URLs (fuente de verdad)
  decisions/           # ADR: una decisión por archivo
```

---

## 5. Convenciones de código

- Componentes en `PascalCase`; funciones y variables en `camelCase`;
  archivos de rutas según convención de Next.
- Nada de `any`. Si el tipo es difícil, `unknown` + validación.
- Textos de interfaz en **español**; nombres de código en **inglés**.
- Formularios: Server Actions + validación con Zod en el servidor.
  Validar en cliente es cortesía, no seguridad.
- Imágenes siempre con `next/image` y dimensiones explícitas.
- Sin `console.log` en el código entregado. Errores a Sentry.

---

## 6. Git

- Ramas: `feat/…`, `fix/…`, `chore/…`
- Commits en formato convencional: `feat(catalogo): agrega ficha de modelo`
- PRs pequeños y enfocados. Un PR que toca 30 archivos no se revisa bien.
- `main` siempre desplegable.

---

## 7. Definición de "terminado"

Una tarea no está terminada hasta que cumple **todo** esto:

1. Compila sin errores ni warnings de TypeScript.
2. Lint y formato pasan.
3. Renderiza correctamente en móvil y escritorio.
4. Cumple el bloque de SEO de la sección 3.4.
5. Sin datos quemados: todo viene de Payload.
6. Accesible: navegable por teclado, contraste suficiente, imágenes con `alt`.
7. Desplegada en preview y verificada.

---

## 8. Seguridad

- Secretos solo en variables de entorno. Nunca en el repositorio.
- El panel `/admin` protegido por la autenticación de Payload; sin usuarios de prueba en producción.
- Formularios públicos con Cloudflare Turnstile.
- Validar y sanear toda entrada del usuario en el servidor.
- No exponer IDs internos ni trazas de error al usuario final.

---

## 9. Cómo trabajamos

- **Dirección técnica:** define alcance, prioridad, criterios de aceptación y revisa.
- **Claude Code:** implementa dentro de los límites de este archivo.
- Ante ambigüedad o una decisión de arquitectura no cubierta aquí:
  **detenerse y preguntar**, no improvisar.
- Toda decisión relevante se documenta como ADR en `docs/decisions/`.

---

## 10. Estado actual

> **CIERRE DE FASE — 2026-08-14.** Está construido **todo lo que no depende de
> terceros**. Los seis bloques de código de `docs/RUTA-DESARROLLO.md` (A–F)
> quedaron completos; el único abierto de esa ruta es el G, que es una
> conversación con el diseñador, no código.

- **Base del repo:** Next.js 16.2.11 (App Router, TS strict, Tailwind v4,
  ESLint + Prettier). Ver ADR `docs/decisions/0001-version-nextjs.md`.
- **Plan de referencia:** `docs/PLAN-MVP.md` y `docs/RUTA-DESARROLLO.md`.

### 10.0 Qué está construido y qué falta

**Construido y verificado en producción:**

| Área            | Estado                                                              |
| --------------- | ------------------------------------------------------------------- |
| Infraestructura | Payload 3 + Neon + Vercel Blob, desplegado, migraciones versionadas |
| Repuestos       | 3 niveles · 433 URLs cubiertas                                      |
| Maquinaria      | Nueva y usada · 118 URLs (ADR 0007)                                 |
| Lubricantes     | 2 niveles · 5 URLs                                                  |
| Corporativo     | Ruta comodín · 9 páginas sembradas                                  |
| Blog            | Plantillas + guardarraíl de slug entre colecciones (ADR 0008)       |
| Formularios     | 3 formularios · Turnstile · Zod · Resend con degradación controlada |
| SEO             | Metadata, JSON-LD, sitemap con guardián, robots, canonical          |
| Redirects       | 10 cargados + validación de destino                                 |
| Respaldos       | Volcado, restauración **probada** y política de retención           |
| QA              | `npm run qa`: 0 errores en local (198 URLs) y producción (112)      |
| CI              | typecheck · lint · formato · 184 pruebas, verde en cada push        |

**Cobertura del sitio actual:** de las 648 URLs del rastreo, **565 tienen ruta
propia**; las 83 restantes también tienen ruta (`[...slug]`) pero les falta el
**contenido**: 51 artículos de blog y 24 páginas corporativas. Ver §10.0.1.

**Lo que falta, en una línea:** contenido real (bloqueado por WordPress y por
los CSV del cliente), diseño (bloqueado por el diseñador) e infraestructura
definitiva de base de datos (bloqueado por el cliente).

### 10.0.1 Pendientes agrupados por responsable

**DEL CLIENTE** — nada de esto lo podemos resolver nosotros:

| #   | Pendiente                                                            | Bloquea                                                            |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Claves de Turnstile y Resend (§10.11)                                | **Lanzamiento.** Formularios abiertos a bots y leads sin avisar    |
| 2   | Infraestructura de base de datos, con pooler (§10.7)                 | **Migración.** Requisito duro                                      |
| 3   | Acceso a WordPress                                                   | 51 artículos + ~55 páginas editoriales                             |
| 4   | CSV e imágenes reales                                                | 351 modelos + 80 fichas de maquinaria                              |
| 5   | Razón social, NIT, LinkedIn, Facebook, teléfono (§10.3 1–4)          | JSON-LD `Organization` completo                                    |
| 6   | Decisiones de URLs: lubricantes, blog, Case, basura viva (§10.3 5–8) | Redirects y 404 del día del cambio                                 |
| 7   | Destino, cifrado y periodicidad de respaldos (§10.3 9–12)            | Cumplir el SLA de Gestión de Incidencias                           |
| 8   | Clave de PageSpeed Insights (§10.3 13)                               | Umbrales de rendimiento contractuales                              |
| 9   | Icono cuadrado de marca para el favicon (§10.3 15)                   | El logo es 1614×317 y no sirve; lo primero que se ve en la pestaña |
| 10  | Vercel Pro antes de volver el repositorio a privado                  | Despliegue automático                                              |
| 11  | Textos legales definitivos                                           | Sustituir los marcadores de posición                               |

**DEL DISEÑADOR:**

| Pendiente                                     | Nota                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| Color, tipografía y radio: **YA EXISTEN**     | Extraídos y medidos: `docs/design-tokens.md`                                  |
| Escala tipográfica y espaciado                | **No los define el sistema**: usa los de Tailwind v4                          |
| Catálogo de componentes                       | Ver bloque G de `RUTA-DESARROLLO.md`                                          |
| Restricciones de peso y dimensiones de imagen | Sostiene los umbrales de rendimiento                                          |
| Decisión sobre modo oscuro                    | El sitio NO lo soporta (§10.14). El sistema del cliente SÍ lo define completo |
| Icono cuadrado para el favicon                | Alternativa al cliente si él no lo tiene (§10.3 15)                           |
| Menú plegable en móvil                        | Hoy no hay; si lo mete, revisar teclado y `aria-expanded`                     |

**NUESTRO** — se puede hacer sin esperar a nadie, pero no es urgente:

| Pendiente                                            | Referencia |
| ---------------------------------------------------- | ---------- |
| Logo institucional fuera de `Media` (URL cableada)   | §10.8      |
| Separar los stores de Vercel Blob por entorno        | §10.4      |
| Mitigaciones 2–4 de consultas en el build            | §10.10     |
| Repetir la auditoría de rendimiento con el diseño    | §10.3 p.14 |
| Revisar el modo oscuro con el diseño puesto          | §10.14     |
| Pasar la CSP a fase 2 y evaluar los nonces           | §10.16     |
| Desacoplar `sharp` del arranque de Payload           | §10.19     |
| Prueba de humo automática post-despliegue            | §10.20     |
| Verificar el store de Blob de preview con una subida | §10.21     |
| Redirects no validables en preview (proteccion)      | §10.22     |

> **SISTEMA DE DISEÑO DEL CLIENTE (2026-09-16).** Existe en
> `https://ui.partequipos.com` y sus tokens están extraídos, medidos y
> documentados en **`docs/design-tokens.md`**, que es su fuente única. Aplicado
> **solo al panel** (`src/app/(payload)/custom.scss`); el sitio público no se
> tocó. Tres datos que cambian la conversación con el diseñador: el sistema
> cubre **color, tipografía y radio** pero **no** escala ni espaciado (usa los de
> Tailwind v4); el sitio público usa la misma arquitectura, así que pegar los
> tokens es trivial, **pero las plantillas llevan 182 colores fijos de Tailwind
> en 31 ficheros** y hasta sustituirlos no cambiaría casi nada; y **queda una
> decisión pendiente de una línea** sobre el modo oscuro del panel
> (docs/design-tokens.md §9).

### 10.1 Inventario real (fuente de verdad)

> Medido por rastreo propio del sitio en producción (`npm run crawl`, 2026-07-27).
> **Estos datos reemplazan a los documentos del cliente**, que subcontaban.
> Salidas: `docs/url-map.csv`, `docs/inventario-repuestos.csv`, `docs/crawl-reporte.md`.

- **351 modelos de repuestos** (no ~332). Caterpillar **141** (documentos: 140 vs 130),
  Case Construction **39** (documentos: 38 vs 34). Resto: Hitachi 46, Komatsu 32,
  Hyundai 26, Liugong 15, Doosan 12, Link Belt 11, Kobelco 9, Bobcat 6, Yanmar 6,
  Okada 5, Volvo 3.
- **648 URLs vivas**: repuestos 435 · maquinaria 122 · blog 51 · corporativo 34 · otro 6.
  Todas responden 2xx; 0 errores y 0 redirecciones preexistentes.

### 10.2 Riesgos y hallazgos

- **RIESGO CERRADO** — la inconsistencia del inventario de modelos ya no bloquea:
  se resolvió por medición directa sobre el sitio en producción.
- **Hallazgo de alcance:** el **blog NO está vacío** — tiene **51 URLs vivas**.
  Requiere migración de contenido y sus redirects, no solo plantillas.
- **Hallazgo de alcance:** **lubricantes** tiene **índice + 4 subsecciones**
  (`/lubricantes/lubricantes-eni/` y 4 hijas), no 1 página como indicaba el
  documento de alcance.
- **Limpieza sugerida al cliente:** 2 duplicados con sufijo `-copy` son borradores
  publicados por error (`...case-construction-650l-copy`,
  `...komatsu-gd555-5-copy`). **No se migran**; quedan documentados.
- Decisiones sobre estos hallazgos: ADR `docs/decisions/0004-hallazgos-crawl.md`.
- **RIESGO ABIERTO — migraciones:** el esquema no se sincroniza solo en
  producción. Se requieren migraciones versionadas de Payload
  (`payload migrate`); el push automático es solo para desarrollo local.
  Detectado al probar `npm start` tras añadir el campo `puedeEditarSlugs` y la
  colección `Redirects`: la consulta falló con
  `column users.puede_editar_slugs does not exist`.

### 10.4 Despliegue (medido en producción el 2026-07-28)

- **RIESGO CERRADO — fricción de Payload sobre Vercel serverless: NO se
  materializó.** Medido en `https://partequipos.vercel.app`:
  `/admin` **2.89 s en frío** (tras 16 min sin uso) y **0.44 s en caliente**;
  subida a **Vercel Blob operativa desde serverless** (201 en 0.65 s); crear
  registros y renderizar catálogo por debajo del segundo. Ningún timeout ni
  error de pool. Los 28–48 s que veíamos en local eran compilación bajo demanda
  de `next dev`, no un problema de serverless.
- **Entornos separados (verificado):** rama Neon **`production`** (la usa
  Vercel) y **`development`** (local). Comprobado creando un registro en local
  y confirmando que **no** aparece en producción.
- **RIESGO CERRADO — flujo de migraciones verificado y operativo en producción.**
  Confirmado en la rama `production`: `payload_migrations` contiene
  `20260728_072955_inicial` con **`batch 1`** (ya no el marcador `dev`). El
  esquema de producción proviene de una migración versionada, no de push, así que
  los próximos cambios de colección se aplicarán y quedarán registrados.
- **RESUELTO — producción limpia y esquema aplicado por migración.** Se ejecutó
  `DROP SCHEMA` en la rama `production` y se redesplegó sin caché (2026-07-28).
  Verificado en producción: las **6 colecciones responden `totalDocs: 0`** con
  JSON válido (si faltaran tablas, Postgres daría `relation does not exist`, así
  que el esquema **existe**); `/admin` sirve el flujo de **primer usuario** y las
  credenciales anteriores dan `401`; las páginas manejan el vacío sin errores
  ("0 marcas disponibles", un solo `<h1>`, `404` en rutas ya inexistentes);
  `canonical`, `og:url` y JSON-LD usan el **dominio real**.
- **`development` intacta** tras la limpieza de producción: 5 marcas · 10 tipos ·
  81 modelos · 10 categorías · 3 media, y su usuario admin sigue operativo.
- **RESUELTO — el despliegue automático SÍ funciona.** Los últimos deployments
  provienen de **push a `main`** con su commit asociado (`ff54dda`, `0c66a0f`),
  no de un «Redeploy» manual. El diagnóstico anterior —que los push no
  disparaban despliegue— quedó explicado por el punto siguiente: el bloqueo era
  de plan, no de configuración de Git.
- **HALLAZGO — el plan Hobby de Vercel no admite colaboración en repositorios
  privados.** Al pasar el repositorio a privado, los despliegues quedaron en
  estado **«Blocked»**, lo que se manifestó como «los push no despliegan».
  **Solución temporal:** repositorio público, con autorización del cliente.
  **Decisión pendiente:** pasar a **Vercel Pro** (ya presupuestado en la
  cotización) **antes** de que el repositorio vuelva a ser privado; de lo
  contrario los despliegues se bloquearán de nuevo.
- **PENDIENTE — separar los stores de Vercel Blob.** Ambos entornos comparten el
  mismo `BLOB_READ_WRITE_TOKEN`. El `DROP SCHEMA` borró los registros de los 3
  media de producción, pero **los archivos siguen en el Blob y `development` los
  referencia**: no se deben borrar hasta separar los stores. Aislamiento a medias
  mientras esto siga así.
- **CUIDADO al desplegar — `payload migrate` es interactivo:** si
  `payload_migrations` contiene el marcador `dev` (`batch -1`, que deja el push
  de desarrollo), el comando abre un prompt —
  _"It looks like you've run Payload in dev mode… data loss will occur. Would you
  like to proceed?"_ — con `initial: false` y `onCancel: process.exit(0)`. Sin
  stdin (build de Vercel) **sale con código 0 sin aplicar nada**, y el `&&` deja
  continuar el build: el despliegue queda "Ready" pero sin migrar. Reproducido en
  local: `npm run migrate` colgado 5 min sin aplicar nada. Existe
  `forceAcceptWarning` para ejecución no interactiva. La migración inicial hace
  `CREATE TABLE` sin `IF NOT EXISTS`, así que solo es segura contra una base
  **vacía**. Al haber partido de un esquema limpio, este escenario ya no aplica
  en producción, pero volvería a darse si alguien hace push contra ella.

### 10.10 Línea base de tiempo de build (medida el 2026-08-09)

> Primera medición formal. **No hay registro de builds anteriores**: las cifras
> de Vercel de días pasados existen, pero no sabemos con cuántas páginas se
> hicieron, así que no son comparables. Esta es la línea base a partir de la cual
> se compara de aquí en adelante.

**Medición local (Windows, `development` en Neon, 189 páginas):**

| Fase                | En frío (`.next` borrado) | En caliente |
| ------------------- | ------------------------: | ----------: |
| Compilación         |                     132 s |        24 s |
| Generación estática |                    22,8 s |       9,6 s |
| **Total**           |                 **230 s** |    **58 s** |

**Vercel, 117 páginas** (commit `d00aaf0`, sin datos de maquinaria): **2 min**.

**El build lo domina la compilación, no la base de datos.** La compilación
depende del número de _componentes de ruta_ (~22), no del de páginas, así que es
prácticamente constante: crecer de 189 a 650 páginas no la mueve.

#### Latencia por consulta (local → Neon)

| Operación                   |  ms |
| --------------------------- | --: |
| `count` (ida y vuelta pura) | 113 |
| `find` por slug, `depth: 1` | 226 |
| `find` de ficha, `depth: 2` | 597 |
| `find` masivo, `limit: 0`   | 528 |

Un `find` cuesta ~2 idas y vueltas. **Esos 113 ms son de una máquina de
desarrollo por internet**; desde el build de Vercel contra Neon en la misma
región son de orden 1–5 ms, de ahí que Vercel tarde 2 min y local 230 s.

#### Consultas por página: NO hay agrupación

Cada página resuelve por su cuenta, y además resolvía **por duplicado**:
`generateMetadata` y el componente llaman a la misma cadena sin compartir
resultado por sí solos.

| Ruta                     | Consultas por página (antes) |
| ------------------------ | ---------------------------: |
| ficha de equipo / modelo |                    6 (3 × 2) |
| tipo                     |                            5 |
| marca                    |                            5 |
| categoría                |                            3 |
| índices                  |                          1–2 |

`generateStaticParams` sí hace **una sola consulta masiva por ruta** — ahí no hay
problema. El coste está en el renderizado de cada página.

#### Mitigación 1 aplicada: `cache()` de React (2026-08-09)

Las 24 funciones de `src/lib/queries/` se envolvieron en `cache()`. Ninguna
llamada cambió: las firmas son las mismas.

**Medido, no estimado.** Se contaron las consultas reales parcheando
`pg.Client.prototype.query` mediante `NODE_OPTIONS=--require`, sin tocar el
código de la aplicación, y se cronometró la fase de generación con `.next`
borrado antes de cada corrida:

| Métrica                        | Antes | Después | Cambio    |
| ------------------------------ | ----: | ------: | --------- |
| Consultas SQL en todo el build | 2.912 |   1.519 | **−48 %** |
| Generación estática (media)    | 9,9 s |   6,8 s | **−31 %** |

El conteo es **exactamente reproducible**: 2.912 en las dos corridas sin
`cache()` y 1.519 en las dos con él. Los tiempos son media de 3 y 4 corridas
limpias (sin `cache()`: 9,7 · 10,7 · 9,3 s — con: 7,0 · 7,6 · 5,9 · 6,7 s).

**Sin cambio de contenido.** Se compararon las 185 páginas prerenderizadas de
ambos builds por hash: **idénticas**. Hay que normalizar antes de comparar,
porque Next inyecta un `buildId` distinto en cada build y en crudo salen
diferentes el 100 % de las páginas aunque el contenido sea el mismo.

`cache()` memoiza **por petición**, así que no filtra datos entre páginas: eso es
justo lo que confirma la comparación de hashes.

Limitación conocida: no memoiza cuando el argumento es un array
(`getEquiposDeTipos`), porque la identidad cambia en cada llamada. No empeora
nada respecto de antes; simplemente ahí no ayuda.

#### Proyección a ~650 páginas

Extrapolación lineal desde la medida (verificada contra el modelo
consultas × latencia, que reproduce los 22,8 s observados):

| Escenario                          | Latencia | Generación estática |
| ---------------------------------- | -------: | ------------------: |
| Vercel + Neon (hoy)                |   1–5 ms |            ~10–20 s |
| Local por internet (hoy)           |   113 ms |               ~80 s |
| Infraestructura del cliente, media |   300 ms |            ~3,5 min |
| Infraestructura del cliente, mala  |   500 ms |            ~5,5 min |

Ni en el peor caso se acerca al límite de 45 min de Vercel. **El riesgo de
tiempo no es grave; el de concurrencia sí:** el build lanza 11 workers en
paralelo, así que se le exige al servidor un pico de conexiones simultáneas.
Con las 2.912 consultas medidas hoy a 189 páginas, el volumen real (~650) da
**~3.600 consultas** aun después de aplicar `cache()`. Esto convierte el
_pooler_ de §10.7 en requisito duro.

#### Aviso observado el 2026-08-13: el pico de conexiones ya se manifiesta

Con 204 páginas, un build local **falló** con `ETIMEDOUT` contra Neon en plena
generación estática; el reintento inmediato pasó sin tocar nada. Fue transitorio,
pero es la primera vez que se ve el síntoma, y confirma que el problema del pico
de conexiones **no es teórico**. Contra una base con menos capacidad que Neon
—o con más latencia— dejaría de ser transitorio.

#### Mitigaciones restantes (NO implementadas — decisión pendiente)

La 1 (`cache()`) ya está aplicada; ver arriba. Las demás quedan documentadas
para decidir cuando exista la infraestructura del cliente:

2. **Resolver desde un mapa en memoria**: una consulta masiva por colección al
   arrancar el build y resolución local. Bajaría de ~3.600 consultas a ~10, pero
   reestructura la capa de datos.
3. **Bajar `depth`** y pedir solo los campos usados (la ficha con `depth: 2`
   cuesta 2,6× una consulta normal).
4. **Limitar los workers** si el pool del cliente resulta estrecho.

La 2 solo se justifica si la latencia real de la infraestructura del cliente lo
pide; medir primero, optimizar después.

### 10.9 INCIDENTE 2026-08-09 — build colgado por el marcador `dev`

**Qué pasó.** Un build de Vercel se quedó **20 minutos colgado** en el prompt
interactivo de `payload migrate` (_"It looks like you've run Payload in dev
mode…"_) y hubo que cancelarlo a mano.

**Por qué.** Los scripts de datos (`npm run import`, `npm run seed:paginas`) se
ejecutaron desde una máquina de desarrollo apuntando `DATABASE_URI` a otra base.
El push de esquema estaba condicionado solo a `NODE_ENV !== "production"`, y
**`payload run` no fija `NODE_ENV`**, así que el push quedó activo: alteró el
esquema y `pushDevSchema` insertó el marcador `dev` (batch −1) en
`payload_migrations`. Ese marcador es justo lo que hace que `payload migrate`
pida confirmación — y en un build no hay stdin.

Confirmado en el código (`@payloadcms/drizzle/dist/utilities/pushDevSchema.js`:
inserta `name: 'dev', batch: -1`) y **reproducido en la rama `development`**: el
marcador aparece con fecha `2026-08-09T06:48`, la hora exacta de esa ejecución.

**Arreglo de la causa raíz.** Un script de datos no debe poder tocar el esquema,
corra donde corra:

- `payload.config.ts` desactiva el push también con `PAYLOAD_DISABLE_PUSH=true`.
- `import.ts` y `seed-paginas.ts` **se ponen esa variable ellos mismos** antes de
  cargar la config (import dinámico, porque los `import` estáticos se evalúan
  antes que cualquier sentencia). Ya no depende de que nadie la recuerde.

Se descartó `NODE_ENV=production`: cambia mucho más que el push, sigue siendo
ambiental —o sea, olvidable— y en Windows no funciona en los scripts de npm.

**Arreglo del síntoma (que el build falle ruidoso).** `npm run db:check`
(`scripts/db/check-migrations.ts`) lee `payload_migrations` y corta con código 1
y mensaje accionable si encuentra el marcador. Va **antes** de migrar:

```
Build Command:  npm run deploy:migrate && npm run build
```

Se descartó `forceAcceptWarning`: convertiría la parada en un avance silencioso
(lo contrario de lo que se quiere), el aviso de pérdida de datos es real, y la
migración inicial hace `CREATE TABLE` sin `IF NOT EXISTS`, así que contra una
base poblada fallaría igual.

**Procedimiento correcto para sembrar producción**

1. Comprobar antes y después: `DATABASE_URI="<pooled prod>" npm run db:check`.
2. Sembrar: `DATABASE_URI="<pooled prod>" npm run import` y luego
   `… npm run seed:paginas`. Ambos son idempotentes y ya no activan el push.
3. **Redesplegar**: sembrar desde un script no refresca el sitio desplegado
   (ver §10.6).
4. Si `db:check` encuentra el marcador `dev`, resolverlo **antes** de desplegar:
   si el esquema ya coincide con las migraciones del repo, basta
   `DELETE FROM payload_migrations WHERE batch = -1;`; si divergió, reconciliarlo
   primero.

### 10.12 Nota — `media` y `users` se perdieron en `development` (2026-08-13)

> El inventario de cierre encontró `users` y `media` en **0** en `development`,
> pese a que §10.4 registraba 3 media y un usuario admin operativo. Las tablas
> existían; estaban vacías. Causa probable: la recreación de la rama de Neon.
> **No se investigó más** — decisión de dirección, no aportaba nada.
>
> **Recuperado el 2026-08-13:** usuario admin de desarrollo
> `admin@partequipos.local` y 4 imágenes generadas con `sharp` (rotuladas
> «imagen de demostración»), asignadas al logo de la marca Hitachi, a la galería
> del equipo ZX350LC-5B (2 imágenes) y al modelo Bobcat E32.
>
> **Consecuencia mientras estuvieron vacías:** todas las plantillas se
> verificaron por su camino «sin imagen». El camino **con** imágenes se ejerció
> por primera vez en esa fecha.

### 10.13 No midas la optimización de imágenes en local

> `next start` en esta máquina **no optimiza**: `/_next/image` devuelve el
> original byte a byte (40.127 → 40.127) en todos los anchos y aunque el cliente
> mande `Accept: image/webp`. `sharp` está instalado y funciona.
>
> **En Vercel sí optimiza**, y bien: el mismo logo de 42.474 bytes sale en
> **946 bytes WebP** a `w=128` y 4.928 a `w=640`. La optimización la hace la
> infraestructura de Vercel, no nuestro proceso.
>
> Conclusión operativa: **un pase sin optimizar en local no es un defecto** y no
> hay que perseguirlo. Si alguna vez hay que auditar peso de imágenes, se mide
> contra el despliegue, nunca contra `npm start`.

### 10.14 LECCIÓN — el modo oscuro roto que sobrevivió todo el proyecto

> **Qué pasó.** `globals.css` traía desde el andamiaje de `create-next-app` un
> bloque `@media (prefers-color-scheme: dark)` que ponía el fondo en `#0a0a0a`.
> Nadie lo quitó, y todas las plantillas se construyeron con colores fijos
> (`text-gray-900`, `bg-gray-50`, `border-gray-200`).
>
> Resultado medido: con el modo oscuro activado en el sistema, los títulos
> quedaban en **1,12:1** de contraste — WCAG AA exige 4,5:1. Es decir,
> **cualquiera con modo oscuro veía las páginas prácticamente en blanco**.
> Sobrevivió desde el Sprint 0 hasta la auditoría del Bloque F.
>
> **Por qué no lo detectó nada.** Todas las verificaciones de este proyecto
> —QA automatizado, comparaciones de HTML, revisión de marcado— miran el
> **HTML de origen**. El fallo no estaba en el HTML: estaba en cómo lo pinta el
> navegador **según una preferencia del sistema operativo**. Ningún `curl` lo
> puede ver, y el navegador de quien desarrolla suele ir en modo claro.
>
> **La lección, generalizable:** verificar el HTML de origen no es verificar la
> página. Todo lo que dependa del entorno del visitante —preferencia de color,
> `prefers-reduced-motion`, tamaño de fuente del sistema, zoom, alto contraste—
> es invisible para nuestras comprobaciones actuales.
>
> **Qué hacer cuando llegue el diseño:** revisar explícitamente cada plantilla
> con el modo oscuro del sistema activado, y decidir de forma consciente si se
> soporta. Hoy **no se soporta**, y es deliberado: es preferible un solo tema
> legible que dos, uno de ellos roto. Soportarlo de verdad exige revisar cada
> color del sitio, no una variable.

### 10.15 LECCIÓN — en Payload, un HTTP 200 NO significa que algo funcionara

> **Qué pasó.** Al verificar los roles, la primera versión de la prueba dio tres
> «fallos» que no lo eran, porque comprobaba el **código de respuesta**:
>
> | Intento del editor            | HTTP | Qué pasó de verdad                |
> | ----------------------------- | ---- | --------------------------------- |
> | Ascenderse a administrador    | 200  | El rol **no cambió**              |
> | Darse permiso de editar slugs | 200  | El permiso **no se concedió**     |
> | Listar usuarios               | 200  | Devolvió **solo su propia ficha** |
>
> **Por qué.** Payload solo responde 403 cuando la denegación es de
> **colección**. Cuando es de **campo** (`field.access`), acepta la petición y
> **descarta en silencio** el campo que no puedes tocar. Y cuando la lectura se
> restringe devolviendo una **consulta** en vez de `false` —que es lo que
> permite que un editor use `/admin/account`—, la respuesta es 200 con menos
> filas, no un rechazo.
>
> **El riesgo, en las dos direcciones:**
>
> - Verificar por código **reporta agujeros inexistentes** (lo que me pasó), y
>   eso quema credibilidad y tiempo.
> - Peor: puede **dar por cerrado uno abierto**. Si un día el acceso de campo se
>   quita por error, la petición seguirá devolviendo 200 — exactamente igual que
>   cuando estaba bien protegido. Una prueba basada en el código HTTP seguiría
>   en verde mientras el editor se asciende a administrador.
>
> **La regla:** el control de acceso se verifica comprobando **el estado real de
> la base** después de la operación, no la respuesta HTTP. Está aplicado así en
> la verificación de roles; cualquier prueba futura de permisos debe hacer lo
> mismo.
>
> Es la misma familia de error que §10.14: **medir la señal fácil en vez de la
> que importa**. Allí era el HTML de origen en lugar de la página pintada; aquí,
> el código de respuesta en lugar del efecto.

### 10.16 Deuda técnica — la CSP protege menos de lo que aparenta

> La política de contenido está en **fase 1 (`Report-Only`)**: observa y avisa,
> **no bloquea nada**. Ver `next.config.ts`.
>
> **`script-src` incluye `'unsafe-inline'`, y eso desactiva buena parte de su
> valor.** Con `'unsafe-inline'`, una inyección de script en línea —el caso que
> la CSP existe para frenar— pasaría igual.
>
> **Por qué está ahí:** Next inyecta scripts en línea para la hidratación y
> Payload también en el panel. Quitarlo exige _nonces_ por petición, lo que con
> Turbopack y con el panel de Payload es **trabajo real**, no una línea de
> configuración: hay que generar el nonce en el middleware, propagarlo a la
> respuesta y lograr que ambas partes lo usen.
>
> **Que quede dicho para no engañarnos:** tener CSP en la lista de cabeceras
> **no** equivale a estar protegido contra XSS. Es una capa parcial. La defensa
> real hoy son la validación en servidor con Zod, el escapado de React y el
> control de acceso — no esta cabecera.
>
> **Pendiente:** pasar a fase 2 (quitar `-Report-Only`) tras unos días sin
> violaciones nuevas, y evaluar los nonces como trabajo aparte si el cliente
> quiere endurecerlo de verdad.

### 10.17 INCIDENTE 2026-09-13 — la migración de roles dejó las bases SIN ADMINISTRADOR

> **Qué pasó.** La migración `20260815_043632_roles_usuarios` añadió el campo con
> `ALTER TABLE "users" ADD COLUMN "rol" ... DEFAULT 'editor' NOT NULL`. Las
> cuentas que **ya existían** —la de producción y la de desarrollo— quedaron por
> tanto como **editor**.
>
> Consecuencia, medida con `npm run rol`: **0 administradores**. Nadie podía
> crear usuarios, borrar nada ni gestionar redirects. Y tampoco ascenderse,
> porque `rol` solo lo escribe un administrador (acceso de campo). Es decir, la
> interfaz quedó **sin salida**.
>
> **Por qué no lo vi al implementarlo.** La verificación de roles creó sus dos
> usuarios de prueba **desde un script**, asignándoles el rol explícitamente. Esa
> prueba no pasaba nunca por el camino real: «una cuenta que ya existía antes de
> la migración». Probé los permisos, no la migración de datos.
>
> **Arreglo estructural — hook `primerUsuarioEsAdministrador`.** El primer
> usuario de una base vacía se crea como administrador. Va en `beforeChange` y no
> ampliando el acceso del campo: así el valor lo pone el servidor y no depende de
> lo que mande el cliente. Verificado por el camino real
> (`POST /api/users/first-register` contra una base recién migrada): primer
> usuario → **administrador**; segundo → **editor**.
>
> **Vía de rescate — `npm run rol`.** Lista los usuarios y sus roles, avisa en
> grande si no hay ningún administrador y da el comando exacto para arreglarlo.
> Usa la API local, que ignora el control de acceso: es la única forma de salir
> cuando el panel ya no puede.
>
> **La lección, que es de familia conocida:** al añadir un campo obligatorio con
> valor por defecto hay que preguntarse **qué les pasa a las filas que ya
> existen**. El `DEFAULT` de una migración no es una decisión de esquema, es una
> decisión de datos — y aquí decidió dejar el sistema sin administradores.
>
> Encaja con §10.14 y §10.15: se probó lo nuevo y no la transición. Allí se
> midió el HTML en vez de la página, y el código HTTP en vez del efecto; aquí, el
> permiso en vez de la migración que lo reparte.

### 10.18 INCIDENTE 2026-09-13 — el suelo se movió sin que cambiara una línea

> **Qué pasó.** `/admin`, la API REST, el sitemap y el mapa de redirects
> devolvieron **500** en producción. El sitio público seguía en 200 porque sus
> páginas están prerenderizadas: cayó todo lo que carga la config de Payload en
> tiempo de petición.
>
> El error real, de los registros de runtime de Vercel:
>
> ```
> Could not load the "sharp" module using the linux-x64 runtime
> ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object file
> ```
>
> `payload.config.ts` importa `sharp` y lo pasa a `buildConfig`, así que cargar
> la config **es** cargar sharp.

**La causa raíz: una biblioteca nativa invisible para el trazador.**

Next decide qué ficheros entran en el paquete serverless con
[`@vercel/nft`](https://github.com/vercel/nft), que —en palabras de la propia
documentación— _analiza de forma estática `import`, `require` y `fs`_.

El binario `@img/sharp-linux-x64/lib/sharp-linux-x64.node` **no requiere su
libvips desde JavaScript**: lo enlaza el **enlazador dinámico del sistema
operativo** por rpath. Ninguno de los tres mecanismos que nft inspecciona puede
verlo. Resultado: el binario entra en el lambda y su biblioteca se queda fuera.
De ahí la firma exacta del error — el `.node` **sí** cargó, y falló el `dlopen`
de su dependencia.

**Y el repositorio no cambió.** Mismo commit, mismo `package-lock.json`, misma
versión de sharp (`0.35.3`, desde el 2026-07-28). Lo que cambió fue el **entorno
de construcción**: Vercel pasó de **CLI 58.1.0** a **59.11.7**. El despliegue del
2026-08-15 seguía sirviendo `/api/marcas/` en **200** mientras los nuevos daban
500, con el mismo código.

**El arreglo** (`next.config.ts`): `outputFileTracingIncludes` mete los ficheros
a mano. Verificado contra Next 16.2.11 —no de memoria— en los tipos instalados y
en `collect-build-traces.js`: es opción de **primer nivel** (no va bajo
`experimental`), la clave se empareja con `picomatch` en modo **`contains`** (así
que `"/*"` cubre todas las rutas con trazado) y los globs de valor se resuelven
desde la raíz del proyecto.

#### La primera hipótesis era plausible y era falsa

Vale la pena dejarla escrita, porque la trampa era buena:

El registro del build roto decía **`removed 6 packages in 1s`** tras
`Restored build cache from previous deployment`, y **todo** el árbol de sharp
está marcado `optional: true` en el lock —`@img/sharp-libvips-linux-x64` cuelga
solo por vía opcional, dos veces—. Encajaba además con la nota §10.5, que ya nos
había mordido con paquetes opcionales perdidos. Conclusión tentadora: el npm
nuevo podó los binarios de Linux.

**Qué la refutó, en dos medidas:**

1. **Redespliegue sin caché de build.** Instalación fresca,
   `added 697 packages`, mismo commit. **Error idéntico.** Si el podado fuera la
   causa, una instalación desde cero lo habría arreglado.
2. **Reproducción local de la instalación de Linux.** Con
   `npm ci --os=linux --cpu=x64` aparece
   `node_modules/@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.8.18.3` — el
   fichero exacto que el error dice que falta. **npm lo instala bien.**

Las dos juntas mueven la culpa de npm al empaquetado: el `.so` **está** en la
máquina de build y **no llega** al lambda.

**La lección, generalizable:** una dependencia nativa que el **sistema
operativo** enlaza es invisible para un trazador que lee `require`, y por tanto
puede desaparecer del despliegue **sin que cambie una línea del repositorio**,
porque el entorno de construcción se actualiza por debajo. El proyecto no se
rompió; se rompió el suelo.

Dos corolarios operativos:

- **Nada en nuestras puertas de calidad lo detecta.** `typecheck`, `lint`,
  `format`, las 198 pruebas y el propio `next build` pasaron en verde en el
  despliegue roto. El build **compiló y prerenderizó 118 páginas sin un error**;
  el fallo solo existe en tiempo de petición, dentro del lambda. Es la misma
  familia que §10.14 y §10.15: medir la señal fácil en vez de la que importa.
- **La sonda barata primero.** El redespliegue sin caché costó dos minutos y
  refutó la hipótesis antes de escribir código. El arreglo que se iba a aplicar
  sobre esa hipótesis —anclar los binarios como dependencias explícitas— habría
  sido un **no-op con aspecto de arreglo**, que es peor que no tocar nada.

**Procedimiento que funcionó, para repetirlo:** revertir el alias al último
despliegue bueno (`vercel promote <url>`) para levantar producción **primero**,
arreglar con calma después, y validar en un **preview construido en las mismas
condiciones que el roto** (mismo CLI, sin caché) antes de tocar el alias. Así la
única variable que cambia es el arreglo.

### 10.19 Deuda técnica — sharp tumba medio sitio, y es un componente accesorio

> `payload.config.ts` importa `sharp` en el nivel superior del módulo y lo pasa a
> `buildConfig`. Consecuencia medida en el incidente §10.18: **un fallo de la
> biblioteca de imágenes deja en 500 `/admin`, la API REST, el sitemap y el mapa
> de redirects.**
>
> Eso es demasiado acoplamiento para lo que sharp hace aquí: redimensionar
> imágenes al subirlas. Que no se pueda **leer** el catálogo porque no se puede
> **redimensionar** una foto es una dependencia mal colocada.
>
> **Arreglo posible:** cargar sharp de forma tolerante y degradar a «sin
> redimensionado» en vez de caer. Es **trabajo real**, no una línea: hay que ver
> qué hace Payload cuando `sharp` falta —los tamaños derivados de `Media`
> dependen de él— y decidir si una subida sin miniaturas es aceptable o debe
> rechazarse con un mensaje claro.
>
> **No se implementó** en el arreglo del incidente, por decisión de dirección:
> primero levantar producción. **Queda pendiente de decidir**, y el argumento a
> favor es más fuerte ahora que antes, porque ya sabemos que el modo de fallo no
> es hipotético: ocurrió, y sin que cambiara nada en el repositorio.

### 10.20 LECCIÓN — ninguna de nuestras verificaciones toca la aplicación desplegada

> **El hecho desnudo del incidente §10.18:** el despliegue roto pasó **todas**
> nuestras puertas de calidad. `typecheck`, `lint`, `format` y las **198
> pruebas** en verde; el propio `next build` **compiló, tipó y prerenderizó 118
> páginas sin un error**. Y `/admin`, la API REST, el sitemap y el mapa de
> redirects devolvían 500 en cuanto llegaba una petición.
>
> No fue mala suerte: **es lo que nuestras comprobaciones pueden ver.**

| Comprobación                | Qué mira                    | Corre                |
| --------------------------- | --------------------------- | -------------------- |
| `typecheck`, `lint`, `test` | el **código fuente**        | automático, en CI    |
| `next build`                | que el código **compile**   | automático, en build |
| `npm run qa`                | el **HTML servido**         | **a mano**           |
| _(nada)_                    | el **lambda ya desplegado** | —                    |

Las tres primeras se ejecutan **antes** de que exista el paquete serverless, así
que por construcción no pueden ver un fallo que solo existe dentro de él. La
cuarta sí mira el sitio desplegado, y es la única que habría detectado esto —
pero **solo se corre cuando alguien se acuerda**, y en el despliegue roto nadie
la corrió. El hueco no es que falte una herramienta: es que **la única que mira
el sitio real no está enganchada a nada**.

Y hay un agravante descubierto al separar las variables de entorno: `qa` lee el
sitemap, y el sitemap sale de `NEXT_PUBLIC_SERVER_URL`, que hoy es la misma en
Production y Preview. **`npm run qa` contra un preview mide producción sin
avisar.** El preview del arreglo se verificó ruta a ruta, no con `qa`; de haberlo
usado, habría dado verde midiendo otra cosa.

**Familia conocida.** §10.14 midió el HTML de origen en vez de la página
pintada. §10.15 midió el código HTTP en vez del efecto en la base. §10.17 probó
el permiso nuevo en vez de la migración que lo reparte. Aquí se mide **el código
en vez del despliegue**. Cuatro veces el mismo patrón: **la señal fácil está un
paso antes de donde ocurre el fallo.**

#### Comprobación mínima que cerraría el hueco (PROPUESTA — no implementada)

Una prueba de humo **contra la URL desplegada**, disparada **automáticamente**
al terminar cada despliegue —preview incluido—, que pida las rutas que solo
fallan en tiempo de petición y exija 200:

| Ruta                  | Por qué está en la lista                          |
| --------------------- | ------------------------------------------------- |
| `/admin/`             | carga la config de Payload; es lo que cayó        |
| `/api/marcas/`        | API REST contra la base                           |
| `/sitemap.xml`        | ruta dinámica con consulta                        |
| `/api/redirects-map/` | con `x-proxy-internal: 1`; sostiene los redirects |
| `/`                   | control: si esto cae, es otra cosa                |

Cuatro propiedades que la hacen valer, y que son el motivo de la propuesta:

1. **Ejercita el lambda**, no el código. Es el único nivel donde este fallo
   existe.
2. **Lista de rutas fija, escrita a mano. NO lee el sitemap** — leerlo es
   justamente el agravante de arriba.
3. **Corre también en preview**, así el fallo aparece antes de tocar el alias de
   producción. Requiere atravesar la protección de despliegue
   (`vercel curl`, o un token de derivación).
4. **Falla ruidosa.** Nada de avisos en un registro que nadie lee.

**Dónde engancharla.** Un workflow de GitHub Actions con el evento
`deployment_status` que Vercel ya publica: no necesita plan Pro, vive fuera de
Vercel —así que un fallo del propio Vercel no lo silencia— y reutiliza el
`scripts/qa/` existente añadiéndole un modo de rutas fijas.

**Lo que NO resuelve, para no venderla de más:** solo cubre las rutas de la
lista, y solo el camino «responde 200». Un 200 con contenido equivocado seguiría
pasando — que es §10.15 otra vez. Es una red para el fallo catastrófico, no una
verificación funcional.

**No implementada**: queda como propuesta pendiente de aprobación.

#### Addendum 2026-09-16 — no se pueden medir Core Web Vitals en una pestaña de fondo

Al intentar completar la línea base con la ficha de maquinaria y el artículo de
blog, la automatización del navegador devolvió **cero entradas** de `paint` y de
`largest-contentful-paint`, pese a que Chrome las soporta. Causa, medida:

```
document.visibilityState === "hidden"
```

**Chrome no emite temporizaciones de pintado en una pestaña que nunca se pinta.**
Y al forzar el pintado con una captura de pantalla, las entradas aparecen
**ancladas al instante de la captura**:

```
first-paint = first-contentful-paint = LCP = 38.080 ms
```

38 segundos. No es el rendimiento de la página: es cuándo se la obligó a pintar.

**Dos conclusiones operativas:**

1. **LCP, FCP y CLS no son medibles así.** Y ojo con el CLS: un `cls: 0` en una
   pestaña oculta **no es evidencia de nada** — sin maquetación no hay
   desplazamientos que contar. Reportarlo como 0 sería inventar un dato.
2. **TTFB y peso transferido sí valen**, porque son de red y no dependen del
   pintado.

Para medir de verdad hacen falta: una **ventana en primer plano**, o Lighthouse
en local, o la **clave de PageSpeed Insights** (§10.3 p.13, sigue pendiente del
cliente). La línea base del Bloque F se midió con la ventana visible; de ahí que
entonces sí diera cifras.

Es la cuarta vez que aparece el patrón de §10.14, §10.15 y §10.17: **la señal
fácil está un paso antes de donde ocurre lo que importa.** Aquí el
instrumento devolvía números con aspecto de medición.

### 10.21 RESUELTO — variables de entorno separadas por entorno

> **SEPARADO Y VERIFICADO el 2026-09-16.** `DATABASE_URI`, `PAYLOAD_SECRET` y
> `BLOB_READ_WRITE_TOKEN` tienen ya valor distinto en Production y Preview, con
> una rama de Neon `preview` clonada de `production` y un store de Blob nuevo.
>
> **Cómo se probó, sin exponer credenciales** (importa, porque las lecturas NO
> sirven: la rama es un clon, así que los datos son idénticos y ninguna consulta
> distingue una base de la otra — hace falta una **escritura**):
>
> 1. Se creó una `Marca` `prueba-aislamiento-borrar` desde el `/admin` del
>    **preview**. Resultado: preview `/api/marcas/` **6 docs** y su página en
>    **200**; producción **5 docs** y esa página en **404**.
> 2. Con el Build Command corregido (ver abajo), `db:check` imprime el host en
>    cada build — **solo el hostname, sin usuario ni contraseña**:
>
> | Entorno    | Host de Neon                                                    |
> | ---------- | --------------------------------------------------------------- |
> | Production | `ep-tiny-fog-awnwc8ie-pooler.c-12.us-east-1.aws.neon.tech`      |
> | Preview    | `ep-withered-cell-awv8x9ki-pooler.c-12.us-east-1.aws.neon.tech` |
>
> Endpoints distintos, los dos **pooled** (§10.7), los dos con 8 migraciones y
> sin marcador `dev`.
>
> **CORREGIDO TAMBIÉN — el Build Command de Vercel no era el documentado.** Era
> `npm run migrate && npm run build`, así que **`db:check` no corría en ningún
> build** y el guardián del marcador `dev` de §10.9 no estaba conectado, pese a
> estar documentado como si lo estuviera. Ya es
> `npm run deploy:migrate && npm run build`, verificado primero en preview.
>
> **Lo que sigue SIN verificar: el store de Blob.** Los registros de `media` del
> preview vienen clonados y apuntan al store de **producción**, así que leer no
> prueba nada: solo una **subida nueva** en el `/admin` del preview lo
> demostraría, comprobando que la URL del fichero lleva otro subdominio de
> `*.public.blob.vercel-storage.com`. Un **editor** puede subir (`create` es
> `escrituraContenido`), no hace falta administrador.
>
> Contexto original del hallazgo, que conviene conservar: **Las cuatro variables del
> proyecto están en `Production, Preview`**, y el procedimiento que salió de ese
> incidente es «validar en preview antes de tocar producción» — así que esto pasó
> de detalle a camino crítico: **un preview con una migración nueva aplicaría el
> esquema a la base de PRODUCCIÓN**, porque el build corre `payload migrate`.

| Variable                          | Acción                                | Por qué                                                                                                                        |
| --------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URI`                    | **Separar** · Preview = rama dedicada | Un preview migra la base a la que apunte                                                                                       |
| `PAYLOAD_SECRET`                  | **Separar** · valor nuevo en Preview  | Firma las sesiones: compartido, un token de preview valida en producción                                                       |
| `BLOB_READ_WRITE_TOKEN`           | **Separar** · segundo store           | Una subida desde preview escribe en el store de producción (§10.4)                                                             |
| `NEXT_PUBLIC_SERVER_URL`          | **Compartida a propósito**            | Que el preview emita `canonical` de producción evita que un preview indexado duplique el sitio. Ver la trampa de abajo         |
| Turnstile (2)                     | **Crear solo en Production**          | Sin clave se cae a las de prueba de Cloudflare, que aceptan cualquier token: es lo deseable en preview (§10.11)                |
| Resend (3)                        | **Crear solo en Production**          | `SOLICITUDES_EMAIL_TO` cae al **correo público real del cliente**: con Resend en preview, cada prueba de formulario le escribe |
| `NEXT_PUBLIC_PERMITIR_INDEXACION` | **Crear solo en Production**          | El día que se active para lanzar, en Preview haría **indexable cada preview** y duplicaría el sitio entero                     |

**La rama de Preview debe partir de `production`, NO de `development`.**
`development` usa push de esquema, así que lleva el marcador `dev` (batch −1) en
`payload_migrations`, y contra ese marcador `payload migrate` abre el prompt
interactivo de §10.9: sin stdin **sale con código 0 sin migrar**. El preview
quedaría «Ready» con esquema viejo.

**Trampa de `NEXT_PUBLIC_SERVER_URL`, que se acepta a cambio de la protección
SEO:** el sitemap de un preview lista URLs de **producción**, y `npm run qa` lee
el sitemap. **`npm run qa` contra un preview mide producción sin avisar.** Para
verificar un preview hay que ir ruta a ruta. Ver §10.20.

### 10.22 Los redirects NO funcionan en ningún preview, y por qué costó verlo

> Descubierto el 2026-09-16 al verificar la separación de entornos de §10.21.
> **En cualquier despliegue con la protección de Vercel activada —es decir,
> todos los preview— el mapa de redirects no se puede cargar.** Las páginas
> siguen sirviendo 200 porque la degradación del proxy funciona, pero **ningún
> redirect se aplica**.

**Por qué.** `proxy.ts` pide el mapa con `fetch` a su propio despliegue
(`${origin}/api/redirects-map/`, ADR 0005). Esa petición atraviesa la protección
de despliegue igual que cualquier visitante: responde **302 hacia
`vercel.com/sso-api`**. Comprobado:

```
HTTP 302 -> https://vercel.com/sso-api?url=...%2Fapi%2Fredirects-map%2F&nonce=...
```

**Dos fallos se tapaban entre sí.** `fetch` seguía la redirección hasta la página
de login, que responde **200 con HTML**. Así que `respuesta.ok` salía `true` y el
fallo aparecía mucho después, en el parseo:

```
[proxy] redirects no disponibles: SyntaxError: Unexpected token '<', "<!DOCTYPE "...
```

Un `SyntaxError` de JSON que no menciona la protección de despliegue ni el 302.
**Arreglado** (`src/proxy.ts`): `redirect: "manual"`, más una comprobación de
`content-type`. El mensaje ahora es `mapa de redirects: HTTP 302`.

#### El casi-accidente: el arreglo obvio habría roto producción en silencio

Poner `redirect: "manual"` **a secas** rompe los redirects en **producción**. El
proxy pedía `/api/redirects-map` **sin barra final**, y con `trailingSlash: true`
eso responde **308**:

```
GET /api/redirects-map   -> 308 -> /api/redirects-map/
GET /api/redirects-map/  -> 200 application/json
```

Funcionaba solo porque `fetch` seguía ese 308 — una ida y vuelta de más en cada
refresco del mapa. Al dejar de seguir redirecciones, el 308 se habría convertido
en error y **los redirects habrían muerto en producción sin que nada avisara**,
porque la degradación del proxy los oculta tras un 200.

Por eso el arreglo son **dos** cambios: la barra final **y** `redirect: "manual"`.
Se detectó midiendo la ruta sin barra antes de escribir el código, no después.

#### Corrección a la prueba de humo propuesta en §10.20

La propuesta incluía `/api/redirects-map/` entre las rutas a verificar. Al
probarla en un preview con `vercel curl` **dio 200** — porque `vercel curl`
**inyecta el token de derivación de la protección**, que el proxy real no tiene.
Es decir: la prueba habría dado **verde midiendo un camino privilegiado que el
llamante real no puede usar**. Es §10.15 otra vez, dentro de la propia
herramienta de verificación.

**Consecuencia para el procedimiento de §10.18** («validar en preview antes de
tocar producción»): **la ruta de redirects no se puede validar en un preview.**
Hay que verificarla en producción tras promocionar, o resolver antes la
derivación de la protección para las peticiones internas.

### 10.8 Deuda técnica — el logo institucional no está en `Media`

> `logo-partequipos.png` se referencia por **URL absoluta cableada** en
> `src/lib/seo/config.ts` (`logoPath` y `defaultOgImagePath`), en vez de tener un
> registro en la colección `Media` y referenciarse por relación.
>
> **Por qué es frágil:** el archivo vive en el Blob sin ningún registro en base
> que lo respalde, así que cualquier inventario de media lo da por huérfano. Si
> alguien lo borra del store —o cambiamos de almacenamiento— se rompen a la vez
> la **cabecera de todas las páginas** (`Header.tsx`), el **logo del JSON-LD
> `Organization`** (`jsonLd.ts`) y la **imagen social por defecto**
> (`buildMetadata.ts`), **sin que nada avise**: no hay error de compilación ni de
> tipos, solo una imagen rota en producción.
>
> Ya estuvo a punto de pasar: en la limpieza del Blob del 2026-08-09 figuraba
> como uno de los "3 media huérfanos" a borrar. Se salvó por revisar las
> referencias en código antes de ejecutar el borrado.
>
> **Arreglo pendiente:** subirlo a `Media` y que `seoConfig` lo resuelva por
> relación en vez de por URL fija. No se hizo en su momento para no mezclarlo con
> otra tarea; queda registrado aquí.

### 10.11 PENDIENTE PRE-LANZAMIENTO · PRIORIDAD ALTA — claves de producción

> **Los formularios públicos están hoy SIN PROTECCIÓN ANTI-SPAM en producción, y
> las solicitudes NO se notifican.** Nada de esto puede seguir así el día que el
> sitio se abra a buscadores.
>
> Comprobado el 2026-08-12 con `vercel env ls production`: el proyecto solo tiene
> `DATABASE_URI`, `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN` y
> `NEXT_PUBLIC_SERVER_URL`. Faltan las tres de abajo.

**1. Turnstile — `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`.**

Sin ellas, `src/lib/turnstile.ts` recurre a las **claves de prueba públicas de
Cloudflare**, que por diseño **aceptan cualquier token**. El captcha se dibuja y
la verificación del servidor responde `success: true` siempre: en la práctica es
un formulario abierto. Un bot que envíe un POST con cualquier cadena en
`cf-turnstile-response` escribe en `solicitudes`.

Ese comportamiento es correcto para desarrollar —permite probar sin cuenta de
Cloudflare— y **peligroso en producción**. Hacen falta las claves reales del
cliente; al ponerlas no hay que tocar código.

**2. Resend — `RESEND_API_KEY` (más `RESEND_FROM_EMAIL`).**

Sin ella no se configura adaptador de correo: la solicitud **se guarda igual**
—eso está probado y es deliberado, un fallo del correo no puede costar un lead—
pero **nadie se entera de que entró**. El registro lo deja escrito:

```
WARN: Solicitud guardada SIN aviso por correo: falta RESEND_API_KEY.
      El lead está en /admin y no se ha perdido.
```

Mientras esto siga así, la única forma de ver los leads es entrar a `/admin`. Un
lead comercial que nadie mira durante tres días es un lead perdido, así que esto
es tan urgente como el captcha. Requiere además **dominio verificado** en Resend.

### 10.7 PENDIENTE bloqueante — infraestructura de base de datos

> El cliente confirmó que la base de datos irá en **su propia infraestructura**.
> **Neon es transitorio**: sirve para la demo, no es la solución final.
>
> Dos requisitos son **bloqueantes** y hay que confirmarlos con su equipo antes
> de comprometer fechas:
>
> 1. **Accesible desde internet.** Vercel ejecuta funciones serverless con IP
>    saliente variable, así que la base debe aceptar conexiones desde fuera de su
>    red. Una base solo accesible por VPN o en red privada **no funciona** con
>    este hosting: obligaría a cambiar de estrategia de despliegue.
> 2. **Agrupador de conexiones (pooler). REQUISITO DURO, no recomendación.**
>    Cada invocación serverless abre su propia conexión; sin un pooler delante
>    (PgBouncer o equivalente) se agotan los límites del servidor bajo carga. Es
>    lo que hoy resuelve la cadena _pooled_ de Neon.
>
>    **El dato para llevar a la conversación (medido, no estimado — §10.10):** el
>    build de producción emite **~3.600 consultas** con el volumen real (~650
>    páginas), y las emite **en paralelo desde 11 procesos worker**. Esa cifra ya
>    incluye la optimización de `cache()` ya aplicada, que quitó el 48 % de las
>    consultas: sin pooler, el pico de conexiones simultáneas de un solo
>    despliegue basta para agotar los límites de un Postgres configurado por
>    defecto. No es una carga de tráfico, es una carga de **build**, y ocurre en
>    cada publicación.
>
> Si alguno no se cumple, hay que replantear el hosting antes de migrar los datos.

### 10.6 Los datos de producción son de DEMOSTRACIÓN

> **Producción NO contiene contenido real del cliente.** Está **sembrada**
> (2026-08-09) con datos de demo mediante `npm run import` (106 registros: 5
> marcas, 10 tipos, 81 modelos, 10 categorías) y `npm run seed:paginas` (9
> páginas institucionales), todos con **textos de relleno redactados por
> nosotros**.
>
> **Sembrar desde un script NO refresca el sitio desplegado.** Los scripts corren
> en un proceso aparte, así que el `revalidatePath` de los hooks no alcanza la
> instancia de Vercel: las rutas ya visitadas siguen sirviendo su versión en
> caché (se vio con `/` y `/nosotros/`, que quedaron en 404 con `Age` de ~10 h
> mientras los datos ya estaban en la base). **Tras una siembra masiva hay que
> redesplegar.**
>
> Los textos legales (garantías, tratamiento de datos, código de ética, términos)
> son **marcadores de posición sin validez jurídica** y lo dicen explícitamente en
> su propio contenido.
>
> **Antes de cargar contenido real del cliente hay que VACIAR producción**, igual
> que se hizo el 2026-07-28: los datos de demo no deben mezclarse con los reales,
> porque después no hay forma fiable de distinguirlos.
>
> Mientras tanto el entorno está **cerrado a buscadores**
> (`NEXT_PUBLIC_PERMITIR_INDEXACION`, ver README §7): es una demostración, no el
> sitio del cliente, y no debe competir con el WordPress vivo.

### 10.5 Nota operativa — regeneración de `package-lock.json`

> El `package-lock.json` se regenera **SIEMPRE** borrando **el lock Y
> `node_modules`**:
>
> ```bash
> rm -f package-lock.json && rm -rf node_modules && npm install
> ```
>
> **Nunca** con `--package-lock-only`, y **no basta con borrar solo
> `node_modules`**: el lock existente ancla las resoluciones y npm se limita a
> podar lo que esa máquina no usa.
>
> **Corregido el 2026-08-12.** La versión anterior de esta nota decía
> `rm -rf node_modules && npm install`, y **eso no arregla el problema**: al
> instalar `@payloadcms/email-resend` en Windows desaparecieron del lock
> `@emnapi/core` y el `@emnapi/runtime` anidado bajo
> `@unrs/resolver-binding-wasm32-wasi`, y la instalación limpia **no los
> devolvió**. `npm ci` seguía pasando en Windows y **fallando en CI**
> (run `31647508405`, commit `bbc66e3`). Borrando también el lock, la resolución
> arranca de cero y vuelven: 693 paquetes en vez de 690.
>
> Detalle que despista: los paquetes perdidos figuran como
> `optional + peer + dev`, lo que invita a darlos por inocuos. No lo son —
> Linux los necesita.
>
> Regenerarlo en Windows descarta entradas transitivas que la resolución de Linux
> necesita (`@emnapi/*`, dependencias de `sharp` y `@tailwindcss/oxide`), y **CI y
> Vercel construyen sobre Linux**. Si `npm ci` falla en CI con
> `Missing: X from lock file`, **esta es la causa**.

### 10.3 Pendientes de confirmar con el cliente

> Lista para la reunión de firma. Son datos que **no se pueden deducir del sitio
> actual sin riesgo de publicar información equivocada**; mientras tanto los
> campos afectados se **omiten** en vez de rellenarse con suposiciones
> (ver `src/lib/seo/config.ts`).

1. **Razón social y NIT** (bloquea `legalName` / `taxID` del JSON-LD
   `Organization`). `/tratamiento-de-datos/` declara **dos** entidades legales:
   - `PARTEQUIPOS S.A.S` · NIT 830.080.641-4 · Carrera 68D # 17 A – 84
   - `PARTEQUIPOS MAQUINARIA S.A.S` · NIT 830.116.807-7 · Diagonal 16 # 96 G-85

   ¿Cuál corresponde a este dominio? (La dirección de contacto pública coincide
   con la primera, pero es una inferencia, no un dato afirmado por el sitio.)

2. **URL canónica de LinkedIn.** La única del footer es un enlace de _challenge_
   de sesión (`/organization-guest/company/...?challengeId=...`), no estable.
   Falta la URL limpia del perfil.
3. **Página oficial de Facebook.** El sitio enlaza **dos**:
   `facebook.com/partequip0s` y `facebook.com/Partequipos-384833565199317`.
   Se usa la primera (enlace principal del footer) hasta confirmar.
4. **Teléfono de contacto.** Se publica el móvil `+57 317 670 7071`; el aviso
   legal menciona además un fijo `492-62-60` sin indicativo. Confirmar cuál(es)
   deben figurar y con qué formato.
5. **Dos URLs vivas de lubricantes con contenido similar.** Conviven:
   - `/lubricantes-eni/` (nivel 1) — título _«Lubricantes - Partequipos»_,
     describe _«Lubricantes Eni y Dispel»_. El rastreo la clasifica como
     **corporativo/institucional**.
   - `/lubricantes/lubricantes-eni/` (nivel 2) — título _«Lubricantes Eni»_, es
     la raíz de la sección construida, con sus 4 categorías.

   Parece la misma página en dos direcciones, probablemente heredado de una
   reestructuración del sitio. **Las dos responden 200 y están indexadas**, así
   que ninguna puede acabar en 404. Dos salidas posibles:
   **(a)** migrar la de nivel 1 como página institucional, o
   **(b)** redirigirla con **301** a la de nivel 2, concentrando la autoridad.

   La (b) es mejor para SEO si el contenido es realmente el mismo, pero eso
   **cambia lo que ve Google** y depende de si el cliente quiere una página
   separada que hable también de Dispel. **Es decisión de negocio, no técnica**;
   mientras tanto la de nivel 1 no se ha construido ni redirigido.

6. **Tres puertas de entrada al blog — canibalización.** Tres URLs vivas llevan
   al mismo contenido:
   - `/noticias/` — índice real, **con meta description propia y redactada**.
   - `/category/noticias/` — archivo automático de WordPress, **sin meta
     description** (título «Noticias archivos»).
   - `/blog-partequipos/` — su meta es **el texto genérico de la empresa**, el
     mismo de otras páginas: señal de que nadie le dio contenido propio.

   Las tres compiten por la misma intención de búsqueda y se reparten la
   autoridad. Y **ninguna declara canónica hacia otra**: las 648 URLs del
   rastreo se apuntan a sí mismas, así que Google las ve como tres páginas
   distintas.

   **Recomendación técnica:** 301 de `/category/noticias/` y `/blog-partequipos/`
   hacia `/noticias/`, la única con metadatos propios. **No se ha aplicado**: un
   301 sobre URLs indexadas es difícil de revertir una vez procesado y es
   decisión del cliente. **Si la aprueban son dos filas en la colección
   `Redirects` que ya existe**, sin tocar código. Ver ADR 0008.

7. **Anomalía de jerarquía en Case Construction (maquinaria nueva).** La URL
   `/…/nueva/marcas/case-construction/vibrocompactador-case-sv208/` cuelga al
   **nivel de tipo**, junto a `bulldozer` o `excavadoras`, cuando su contenido es
   un **modelo concreto** (el vibrocompactador SV208). Debería ser una ficha
   dentro de un tipo, no un tipo. **Se replicó tal cual** —igual que se hizo con
   las anomalías de Bobcat en repuestos— para no romper una URL indexada.
   Preguntar si se corrige (implicaría un 301) o se deja como está.

8. **Cuatro URLs de maquinaria clasificadas como basura que HOY ESTÁN VIVAS.**
   El ADR 0007 §5 las marcó como no migrables, y así se hizo. Pero **las cuatro
   responden 200 y están indexadas**: si se lanza sin decidir nada, pasan a
   **404** el día del cambio.

   | URL                                                 | Recomendación                                                  |
   | --------------------------------------------------- | -------------------------------------------------------------- |
   | `/…/nueva/excavadoras-propuesta2025/`               | **301 → `/…/nueva/excavadoras/`** — mismo `<title>`, duplicado |
   | `/…/usada/excavadoras4/`                            | **301 → `/…/usada/excavadoras/`** — duplicado                  |
   | `/maquinaria-pesada/test/`                          | 404 aceptable: es una página de prueba                         |
   | `/maquinaria-pesada/maquinaria-pesada-usada-otros/` | Decidir: sin hijos y con título duplicado, pero viva           |

   Para las dos primeras **el 301 es trivial y el destino está demostrado en el
   rastreo**: son dos filas en la colección `Redirects`, sin tocar código. **No
   se han cargado** porque la dirección las clasificó como basura; se pide
   confirmación explícita antes de dejarlas caer en 404.

9. **Destino de los respaldos.** El mecanismo está construido y probado
   (README §9), pero **no hay dónde guardarlos**. Tres opciones evaluadas:

   | Opción                                 | A favor                                                                                | En contra                                                                     |
   | -------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
   | Vercel Blob (ya contratado)            | Cero servicios nuevos; el token ya existe                                              | **Misma cuenta que el sitio**: un incidente de cuenta se lleva las dos cosas  |
   | **S3 / Cloudflare R2** _(recomendado)_ | Reglas de ciclo de vida del proveedor aplican la retención; cifrado en reposo de serie | Servicio nuevo que contratar                                                  |
   | Servidor del cliente                   | El dato no sale de su infraestructura                                                  | **Misma máquina que la base**: un fallo del servidor se lleva base y respaldo |

   **El principio que decide:** un respaldo no debe vivir en la misma cuenta ni
   en la misma máquina que aquello que respalda. **Vercel Blob y el servidor del
   cliente incumplen ese principio**; por eso la recomendación es almacenamiento
   externo (R2 o equivalente).

10. **Cifrado en reposo de los respaldos.** Los volcados contienen **datos
    personales de terceros**: correos de usuarios, y nombre, correo y teléfono de
    cada lead de `solicitudes`. Hoy el fichero va **comprimido pero NO cifrado**,
    y comprimir no es proteger.

    Es tema para tratar **junto con las políticas de seguridad que el cliente ya
    planteó** (MFA, WAF), no por separado: son la misma conversación sobre
    protección de datos, y la Ley 1581 de 2012 obliga igual en los dos frentes.

    Mitigación provisional en uso: `respaldos/` está en `.gitignore` y existe
    `BACKUP_SIN_DATOS_PERSONALES=true` para generar copias compartibles sin esas
    filas.

11. **Programación periódica de los respaldos.** Se define **cuando exista la
    infraestructura definitiva** — depende de dónde viva la base y de dónde se
    guarden los volcados (punto 9). Los scripts ya son automatizables tal cual:
    un cron que encadene `backup` → subida → `backup:prune`.

    Hasta entonces el respaldo es **manual**, y conviene decirlo así al cliente:
    el mecanismo existe y está probado, la periodicidad comprometida en el SLA
    todavía no.

12. **Sincronización de los binarios del Blob.** Hoy solo hay **inventario** —
    qué archivos existían, con nombre, tamaño y a qué registro pertenecían—, no
    copia de los bytes. Copiar los archivos exige decidir antes el destino, que
    es el punto 9.

    Consecuencia práctica si hoy hubiera un incidente: el catálogo se
    reconstruye entero desde el volcado y el inventario, pero **las imágenes
    habría que reponerlas a mano**.

13. **Clave de PageSpeed Insights (o Lighthouse CI).** El cliente pidió
    **umbrales de rendimiento verificados automáticamente que bloqueen el
    despliegue** — está clasificado como alcance adicional y no se ha
    implementado, pero **sin esto no se puede ni acordar la cifra**.

    La API pública de PSI devuelve **HTTP 429 sin clave**, comprobado también
    tras esperar. La línea base del Bloque F se midió con un navegador real,
    que es dato válido pero **no comparable** con la cifra de Lighthouse que el
    cliente reconocerá — Lighthouse simula móvil con red lenta y da números
    bastante peores.

    Hacen falta dos cosas: la **clave de API** y **sembrar producción**, porque
    hoy no se pueden medir la ficha de equipo ni el artículo (esas secciones no
    están cargadas allí).

14. **La línea base de rendimiento cambiará con el diseño. No es un umbral.**

    Lo medido hoy sobre producción: LCP 384–800 ms, **CLS 0**, cero tareas
    largas. Son cifras buenas, y hay que decir por qué lo son: **el elemento
    LCP es TEXTO** —un `<h1>` o un párrafo— en las tres plantillas medidas.

    En cuanto el diseño introduzca una **imagen destacada** arriba, el LCP
    pasará a depender de ella y las cifras empeorarán. Es esperable, no un
    fallo. Lo que se mantendrá es lo estructural: CLS 0 (las imágenes declaran
    dimensiones), TTFB del edge (~190 ms) y la ausencia de tareas largas.

    **Comprometer hoy un umbral basado en estas cifras sería un error**: se
    acordaría contra una página sin diseño.

15. **Icono cuadrado de la marca (favicon).** El único recurso gráfico que
    tenemos es el logotipo, de **1614 × 317** — una tira horizontal. Sirve para
    la cabecera y para el panel, pero **no para un favicon**: recortarlo daría
    un fragmento de letra sin sentido.

    Hoy el panel emite el logo como icono y el navegador acaba usando el
    `favicon.ico` que trae el andamiaje. No es un fallo, pero es lo primero que
    ve el cliente en la pestaña.

    Hace falta un **icono cuadrado** (ideal: SVG, o PNG de 512 × 512 con
    márgenes) del cliente o del diseñador. No se fabrica recortando el logo.
