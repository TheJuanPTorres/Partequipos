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

| Capa          | Tecnología                                                              |
| ------------- | ----------------------------------------------------------------------- |
| Framework     | Next.js 16 · App Router · React 19                                      |
| Lenguaje      | TypeScript (modo estricto)                                              |
| CMS           | Payload 3 (integrado en el mismo proyecto, no como servicio aparte)     |
| Base de datos | PostgreSQL (Neon)                                                       |
| Estilos       | Tailwind CSS v4 (ver la corrección de abajo)                            |
| Hosting       | Vercel                                                                  |
| Archivos      | Vercel Blob (o Cloudflare R2)                                           |
| Errores       | **`console.error` a los registros de Vercel** — Sentry NO está (§10.31) |

> **CORREGIDO 2026-09-17 — NO usamos shadcn/ui ni Radix.** Esta tabla decía
> «Tailwind CSS + shadcn/ui» desde el Sprint 0. Era **intención, nunca
> materializada**, y es el tipo de dato que lleva a decisiones equivocadas: al
> evaluar el CLI del sistema de diseño del cliente, la primera pregunta fue si su
> primitivo chocaría con Radix… que no existe aquí.
>
> **Lo que hay de verdad, medido en el repo:**
>
> | Afirmación                      | Realidad                                                               |
> | ------------------------------- | ---------------------------------------------------------------------- |
> | `shadcn/ui`                     | **No instalado.** `src/components/ui/` contiene solo un `.gitkeep`     |
> | Radix (`@radix-ui/*`)           | **Ninguna dependencia**                                                |
> | `cva`, `clsx`, `tailwind-merge` | **Ninguna**                                                            |
> | Tailwind                        | **v4.3.3**, con `@tailwindcss/postcss`; sin fichero de configuración   |
> | Estilos del sitio público       | Utilidades de Tailwind **con colores fijos** (188 en 31 ficheros)      |
> | Estilos del panel               | SCSS propio sin capa: `src/app/(payload)/custom.scss`                  |
> | Iconos                          | `@tabler/icons-react` (aprobado 2026-09-17), solo en el menú del panel |
>
> **Consecuencia práctica:** adoptar componentes del sistema del cliente **no**
> duplicaría un primitivo, porque no hay ninguno. Ver `docs/design-tokens.md`.

> **CORREGIDO 2026-09-22 — SENTRY NO ESTÁ INSTALADO.** Esta tabla decía «Errores:
> Sentry» desde el Sprint 0, y es el mismo tipo de dato que shadcn/ui: **quedó
> aplazado en la tarea 0.4 y nunca se retomó**. Medido: **ningún `@sentry/*`** en
> `dependencies` ni en `devDependencies`, ningún `sentry.*.config.*`, ninguna
> `instrumentation.ts`. La única mención en el código es un **comentario**
> (`src/lib/revalidation.ts:56`).
>
> **Lo grave no es la tabla, es que el compromiso con el cliente sí existe** —
> cotización y Gestión de Incidencias— **y hoy no se cumple. Ver §10.31.**

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
- Sin `console.log` en el código entregado. Los errores van a `console.error`
  con prefijo de área (`[revalidación]`, `[redirects]`, `[proxy]`), y de ahí a
  los **registros de Vercel**. **NO hay Sentry** (§10.31), así que nadie recibe
  aviso y el registro se retiene solo lo que el plan permita: escribe el mensaje
  pensando en quien lo lea **dentro de la ventana de registros**, no meses
  después. Cuando Sentry entre, esta regla cambia y hay que revisar los 101
  puntos que hoy escriben a consola.

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
8. **La prueba de humo pasa en ese preview** (§10.20). Corre sola con cada
   despliegue, en la pestaña Actions.

> **ANTES DE PROMOCIONAR A PRODUCCIÓN — regla operativa, no sugerencia:**
> **si la prueba de humo falla en un preview, ese despliegue NO se promociona.**
>
> No es un check bloqueante a propósito (el motivo está en §10.20: con
> `deployment_status`, un despliegue que no ocurre dejaría el PR sin salida, y ya
> pasó — §10.30). Así que la disciplina es de quien promociona.
>
> Y recuerda por qué existe: el despliegue del incidente §10.18 pasó typecheck,
> lint, formato, 198 pruebas y un `next build` completo, y dejó `/admin`, la API,
> el sitemap y el mapa de redirects en **500**. **Verde en CI no es verde en el
> lambda.**

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

| #   | Pendiente                                                                                                                                                                                                                                                                                                                                                                                                                 | Bloquea                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Claves de Turnstile y Resend (§10.11)                                                                                                                                                                                                                                                                                                                                                                                     | **Lanzamiento.** VERIFICADO EN EL DOM (2026-09-17): `/contactanos/` **no pinta ningún widget de Turnstile** en producción. Es el único punto del sitio por donde entran datos de terceros y hoy no tiene barrera anti-bot; los leads tampoco se notifican                                                                                                             |
| 2   | Infraestructura de base de datos, con pooler (§10.7)                                                                                                                                                                                                                                                                                                                                                                      | **Migración.** Requisito duro                                                                                                                                                                                                                                                                                                                                         |
| 3   | Acceso a WordPress                                                                                                                                                                                                                                                                                                                                                                                                        | 51 artículos + ~55 páginas editoriales                                                                                                                                                                                                                                                                                                                                |
| 4   | CSV e imágenes reales                                                                                                                                                                                                                                                                                                                                                                                                     | 351 modelos + 80 fichas de maquinaria                                                                                                                                                                                                                                                                                                                                 |
| 5   | Razón social, NIT, LinkedIn, Facebook, teléfono (§10.3 1–4)                                                                                                                                                                                                                                                                                                                                                               | JSON-LD `Organization` completo                                                                                                                                                                                                                                                                                                                                       |
| 6   | Decisiones de URLs: lubricantes, blog, Case, basura viva (§10.3 5–8)                                                                                                                                                                                                                                                                                                                                                      | Redirects y 404 del día del cambio                                                                                                                                                                                                                                                                                                                                    |
| 7   | Destino, cifrado y periodicidad de respaldos (§10.3 9–12)                                                                                                                                                                                                                                                                                                                                                                 | Cumplir el SLA de Gestión de Incidencias                                                                                                                                                                                                                                                                                                                              |
| 8   | Clave de PageSpeed Insights (§10.3 13)                                                                                                                                                                                                                                                                                                                                                                                    | Umbrales de rendimiento contractuales                                                                                                                                                                                                                                                                                                                                 |
| 9   | Icono cuadrado de marca para el favicon (§10.3 15)                                                                                                                                                                                                                                                                                                                                                                        | El logo es 1614×317 y no sirve; lo primero que se ve en la pestaña                                                                                                                                                                                                                                                                                                    |
| 10  | Vercel Pro antes de volver el repositorio a privado                                                                                                                                                                                                                                                                                                                                                                       | Despliegue automático                                                                                                                                                                                                                                                                                                                                                 |
| 11  | Textos legales definitivos                                                                                                                                                                                                                                                                                                                                                                                                | Sustituir los marcadores de posición                                                                                                                                                                                                                                                                                                                                  |
| 12  | Logo para fondos oscuros: SVG, o PNG transparente ≥ 520 × 102 con letras claras                                                                                                                                                                                                                                                                                                                                           | **RESUELTO PARA EL PANEL el 2026-09-20** con `partequipos-wordmark` de su CLI (§10.27), sin esperar al cliente: medido 20,47 en claro y 15,2 en oscuro, con los ojales igualando el fondo exacto. **Sigue abierto para el SITIO PÚBLICO**, cuya cabecera, JSON-LD e imagen social usan el PNG con fondo blanco (§10.8)                                                |
| 13  | **Qué claims trae el `access_token` de Auth Central** y cuál es el flujo real de OAuth (§10.29)                                                                                                                                                                                                                                                                                                                           | **Cotización del SSO en firme.** Sin los claims no se puede diseñar el mapeo a nuestro campo `rol`; y la contradicción del flujo decide si el trabajo son ~30 h o ~46 h                                                                                                                                                                                               |
| 14  | **Crear la organización de Sentry a su nombre** (§10.31): plan **Team** ($26/mes, usuarios ilimitados —el gratuito admite **uno**, y la revisión semanal la tiene que poder hacer más de una persona—), **decidir la región del centro de datos con su área jurídica** (US o UE: es transferencia internacional de datos personales, Ley 1581 de 2012, y se fija al crear la organización) e **invitarnos como miembros** | **Compromiso contractual que hoy no se cumple**: Sentry está en la cotización (stack y costos operativos) y la Gestión de Incidencias promete **revisión semanal de errores**. Hasta que exista la cuenta **no se instala nada**, porque la verificación del blindaje de datos necesita el destino real. Desbloquea además el endpoint de informes de la CSP (§10.16) |

**DE LA DIRECCIÓN TÉCNICA** — asumido por la dirección, no depende del cliente:

| Pendiente                                                        | Motivo                                                                                                                                                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rotar la contraseña del rol `neondb_owner` de `development`      | Se pegó en claro en una conversación el 2026-09-16. Rotar en Neon y actualizar `.env.local`                                                                                                                                |
| **Sentry: aprobar la dependencia, la cuenta y el plan** (§10.31) | **Compromiso contractual sin cumplir**: está en la cotización y en la revisión semanal de errores de Gestión de Incidencias. Añade dependencia, así que §2 exige aprobación. Cierra también el endpoint de la CSP (§10.16) |

**DEL DISEÑADOR:**

| Pendiente                                     | Nota                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Color, tipografía y radio: **YA EXISTEN**     | Extraídos y medidos: `docs/design-tokens.md`                                              |
| Escala tipográfica y espaciado                | **No los define el sistema**: usa los de Tailwind v4                                      |
| Catálogo de componentes                       | Ver bloque G de `RUTA-DESARROLLO.md`                                                      |
| Restricciones de peso y dimensiones de imagen | Sostiene los umbrales de rendimiento                                                      |
| Decisión sobre modo oscuro del SITIO          | El panel ya lo soporta con los tokens del sistema; el sitio público sigue sin él (§10.14) |
| Icono cuadrado para el favicon                | Alternativa al cliente si él no lo tiene (§10.3 15)                                       |
| Logo para fondos oscuros                      | Alternativa al cliente (#12); mirar antes `partequipos-wordmark` del CLI (§10.27)         |
| Menú plegable en móvil                        | Hoy no hay; si lo mete, revisar teclado y `aria-expanded`                                 |

**NUESTRO** — se puede hacer sin esperar a nadie, pero no es urgente:

| Pendiente                                             | Referencia      |
| ----------------------------------------------------- | --------------- |
| Logo institucional fuera de `Media` (URL cableada)    | §10.8           |
| Separar los stores de Vercel Blob por entorno         | §10.4           |
| Mitigaciones 2–4 de consultas en el build             | §10.10          |
| Repetir la auditoría de rendimiento con el diseño     | §10.3 p.14      |
| Revisar el modo oscuro con el diseño puesto           | §10.14          |
| Pasar la CSP a fase 2 — **depende de tener endpoint** | §10.16 · §10.31 |
| Desacoplar `sharp` del arranque de Payload            | §10.19          |
| Prueba de humo automática post-despliegue             | §10.20          |
| Verificar el store de Blob de preview con una subida  | §10.21          |
| Redirects no validables en preview (proteccion)       | §10.22          |

> **SISTEMA DE DISEÑO DEL CLIENTE (2026-09-16).** Existe en
> `https://ui.partequipos.com` y sus tokens están extraídos, medidos y
> documentados en **`docs/design-tokens.md`**, que es su fuente única.
>
> **Aplicado SOLO al panel** (`src/app/(payload)/custom.scss`), con **modo claro
> y oscuro** e **interfaz en español**. El sitio público no se tocó.
>
> Lo que va al brief del diseñador, recuadro inicial de ese documento: el
> sistema cubre **color, tipografía y radio**, pero **no** define escala
> tipográfica ni espaciado (son los de Tailwind v4) **ni tokens de sombra**; y las
> plantillas públicas llevan **188 colores fijos de Tailwind en 31 ficheros**
> (175 grises), así que pegar los tokens en `globals.css` es trivial pero no
> cambiaría casi nada hasta sustituirlos.
>
> **PANEL — TRABAJO DE DISEÑO CERRADO (2026-09-17).** Tres fases, cada una por
> rama + preview, medidas pintadas en claro y oscuro (§10.23, §10.24) y llevadas
> a producción con `qa` sin errores. Detalle y cifras: `docs/design-tokens.md` §8,
> «Estado final».
>
> | Fase | Qué cambió                                                                                           |
> | ---- | ---------------------------------------------------------------------------------------------------- |
> | Base | Tokens de color, tipografía y radio; modo oscuro; interfaz en español                                |
> | 1    | Superficies: tarjetas, filas de array, espaciado entre campos y bajo etiquetas                       |
> | 2    | Campos (radio, relleno, borde ≥ 3:1, foco primario, 32 px), casilla, botones y píldoras con contorno |
> | 3    | Menú (esquinas, fondo y barra del activo, 25 px; 36 px táctil), tablas sin franjas, migas atenuadas  |
>
> **Criterio que manda en todas las fases:** accesibilidad y usabilidad por
> encima de la fidelidad al sistema. Donde el sistema bajaba de AA o no
> comunicaba un estado, se desvió y está anotado (foco, borde derivado, contorno
> de píldoras, barra del activo, densidad del menú).
>
> **Sigue fallando uno, documentado y sin corregir:** el campo de solo lectura en
> claro (3,66:1), sin salida limpia. El borde de los inputs, que fallaba de
> fábrica (1,49 · 1,29), **quedó resuelto en la fase 2** (3,11 · 3,35).
>
> **Fuera de alcance:** iconos del menú (exigen un `Nav` a medida), grupos como
> tarjeta (estrechaban el formulario) y el sitio público. **Pendiente de
> terceros:** logo para fondos oscuros (#12) y favicon (#9).

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

### 10.13 La optimización de imágenes en local — CAMBIÓ CON LA VERSIÓN

> **ACTUALIZADO 2026-09-22: `next start` SÍ optimiza.** Medido con **Next
> 16.3.5** al montar el prototipo del hero: `/_next/image/?url=/prototipo/
hero-fondo.jpg&w=750&q=75` devolvió **`image/webp` de 37 kB** desde un JPEG de
> **593 kB**, y la imagen frontal salió en 62 kB WebP desde un PNG de 908 kB. Lo
> hace el proceso local con `sharp`.
>
> **Lo que decía esta nota, y por qué era cierto cuando se escribió:** con
> **16.2.x** se midió que `/_next/image` devolvía el original **byte a byte**
> (40.127 → 40.127) en todos los anchos y aun mandando `Accept: image/webp`. No
> era un error de medición: era el comportamiento de esa versión.
>
> **La lección, que es la que hay que conservar:** una nota operativa sobre el
> comportamiento de una herramienta **caduca con su versión**, y esta caducó sin
> que nadie lo notara porque nadie volvió a medir. Si una nota dice «X no
> funciona en local», hay que volver a comprobarlo tras cada salto de Next o de
> `sharp` —igual que se revalida el trazado de §10.18—, y no darla por buena
> porque esté escrita aquí.
>
> **En Vercel también optimiza**, como siempre: el logo de 42.474 bytes sale en
> **946 bytes WebP** a `w=128` y 4.928 a `w=640`.
>
> Conclusión operativa **nueva**: ya se puede comparar peso de imágenes entre dos
> builds locales, y esa comparación es válida porque las dos pasan por el mismo
> optimizador. Lo que sigue **sin** ser comparable es una cifra local contra una
> de producción: cambian la red, la caché del borde y el hardware.

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
>
> #### CORREGIDO 2026-09-22 — la CSP no reporta a ningún sitio
>
> Esa condición de arriba —«tras unos días sin violaciones nuevas»— **este
> montaje no la puede evaluar**.
>
> **La cabecera no declara `report-uri` ni `report-to`**, y no existe ninguna
> cabecera `Report-To` ni `Reporting-Endpoints` en el proyecto. Comprobado:
> `next.config.ts` es la **única** fuente de CSP (no hay `vercel.json`), y son
> 12 directivas —`default-src`, `script-src`, `style-src`, `img-src`,
> `font-src`, `frame-src`, `connect-src`, `object-src`, `base-uri`,
> `form-action`, `frame-ancestors`— ninguna de reporte.
>
> **Consecuencia exacta:** sin endpoint, el navegador **no envía el informe a
> ningún servidor**. La violación sale solo en la consola de devtools **del
> visitante**. Así que **nadie ha observado nada**, y no por descuido: no hay
> nada que observar. Quitar el `-Report-Only` hoy sería **decidir a ciegas**, y
> el modo de fallo es silencioso en la dirección peor — un script bloqueado en
> el panel, o Turnstile sin cargar en `/contactanos/`, que es el único punto de
> entrada de datos de terceros.
>
> **El destino natural del informe era Sentry, y Sentry tampoco está** (§10.31).
> Las dos cosas se deciden juntas.
>
> **Séptima vez del patrón de §10.14 a §10.24, con un giro:** allí el
> instrumento devolvía un dato falso; aquí **el instrumento no existía** y el
> plan lo daba por hecho. El silencio se leyó como «no hay violaciones».

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

**Antes de tocar el alias, la prueba de humo del preview tiene que estar en
verde (§10.20 y §7).** Si falla, el despliegue no se promociona: es exactamente
este incidente el que la puso ahí.

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
>
> **MENOS URGENTE desde el 2026-09-21, y conviene decir por qué exactamente.**
> La prueba de humo de §10.20 pide `/admin/` en **cada despliegue, preview
> incluido**, y exige 200. Este modo de fallo —sharp que no carga y tumba la
> config de Payload— es justo el que ahí sale en rojo. Con la regla de §7, un
> preview en rojo **no se promociona**, así que el fallo ya no llega a producción
> sin que nadie lo vea: es lo que cambió.
>
> **Lo que NO cambió, para no confundir detección con arreglo:** el
> acoplamiento sigue igual de mal puesto, y un fallo de sharp sigue tumbando
> `/admin`, la API, el sitemap y el mapa de redirects. La red solo cubre lo que
> pasa por un despliegue nuevo; si el suelo se mueve **bajo un despliegue ya
> promocionado** —que es literalmente lo que pasó en §10.18, con el mismo commit
> sirviendo 200 antes y 500 después— nada lo detecta hasta el siguiente
> despliegue. Detectarlo antes de promocionar baja la urgencia; no baja el
> riesgo.

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

#### IMPLEMENTADA el 2026-09-21

`.github/workflows/humo.yml` + `npm run humo`, con la decisión en
`src/lib/qa/humo.ts` y sus pruebas en `humo.test.ts`.

| Qué        | Cómo quedó                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rutas      | **Lista fija escrita a mano.** `/admin/`, `/api/marcas/`, `/sitemap.xml`, `/`, y `/api/redirects-map/` **solo en producción**                            |
| Exigencia  | **200 exacto.** Un 3xx también falla: en `/admin/` significaría que la protección no se derivó                                                           |
| Reintentos | Solo con 5xx o red caída, **máximo 4 intentos** y esperas de 1 s, 2 s y 4 s: **7 s por ruta como techo**. Un 4xx NO se reintenta: no es arranque en frío |
| Fallo      | Ruidoso: imprime ruta, código, intentos, **por qué esa ruta está en la lista** y el comando de revert de §10.18                                          |
| Disparo    | `deployment_status`, el evento que Vercel ya publica. Corre en **preview y producción**                                                                  |

**El token de derivación, y una corrección a lo que este documento afirmó
primero (2026-09-22).** La versión inicial de este párrafo decía que
`deployment_status` **solo dispara el workflow si el fichero existe en la rama
por defecto, y ejecuta ESA definición**, y de ahí concluía que ningún PR podía
alterar lo que corre. La documentación de GitHub Actions dice exactamente eso
—textual: _«will only trigger a workflow run if the workflow file exists on the
default branch»_— pero **lo observado en este repositorio la contradice**:

| Hora (UTC) | Commit    | ¿Estaba `humo.yml` en `main`?               | ¿Disparó? |
| ---------- | --------- | ------------------------------------------- | --------- |
| 22:44      | `eaff6e2` | **No** — solo en `test/guardianes`          | **Sí**    |
| 00:29      | `eaff6e2` | Sí (avance rápido a `main` un minuto antes) | Sí        |
| 00:30      | `1e5b8c8` | Sí                                          | Sí        |

La primera se disparó **un minuto después de subir el fichero a una rama**, con
`main` todavía sin él. Así que la regla documentada **no describe lo que hace
Vercel + GitHub aquí**, y el mecanismo exacto —de qué sha toma la definición—
**no se ha aislado**.

**Qué sigue siendo cierto de la protección del secreto, y qué queda abierto:**

- **Cierto:** escribir en este repositorio exige acceso de colaborador, así que
  quien puede alterar el workflow ya podía leer el secreto por otras vías. El
  repositorio **no usa `pull_request_target`**, que es el camino conocido para
  filtrar secretos a código de un PR.
- **ABIERTO, y no se da por resuelto:** si un PR **de un fork** genera un
  despliegue de Vercel, y GitHub toma la definición del sha de ese despliegue,
  ese código correría con el secreto. **No se ha comprobado** —no ha habido
  ningún PR de fork— y el sha de un fork no es alcanzable desde este
  repositorio, lo que hace el escenario dudoso, pero **dudoso no es descartado**.
  Si alguna vez llega un PR externo, **rotar el token de Vercel** es más barato
  que investigarlo.

El token viaja en la cabecera `x-vercel-protection-bypass`, **nunca en la URL**
—acabaría en los registros— y el script solo dice si está presente.
En producción se pasa **vacío a propósito**: allí no hay protección que derivar.

**Y hay una demostración en vivo de que falla cuando debe, que no se buscó:** la
ejecución de las 22:44 **falló en rojo** porque el secreto todavía no estaba
cargado en GitHub. El camino «sin token» se había probado a mano; ahí se le vio
cortar solo, en CI.

**La excepción de §10.22, escrita en el código:** `/api/redirects-map/` se mide
**solo en producción**. En un preview el token la haría responder 200 midiendo
**un camino privilegiado que el proxy real no tiene**, que es §10.15 dentro de la
propia herramienta.

**VERIFICADO QUE FALLA CUANDO DEBE**, con los dos niveles:

- **Pruebas unitarias:** falla con 500, con 302, con la red caída; no reintenta
  un 4xx; y para en el límite de intentos.
- **De punta a punta, contra despliegues reales:** contra **producción**, las 5
  rutas en 200. Contra un **preview con un token inválido**, las 4 rutas en
  **302 y salida 1**. Sin token, corta antes con el motivo.

**NO se ha hecho check requerido para fusionar, y el motivo importa:** con
`deployment_status`, si Vercel **no despliega** el check nunca aparece y el PR
queda bloqueado sin salida — y eso ya nos pasó (§10.30). Además el flujo actual
fusiona por avance rápido desde local, sin PR, así que exigirlo cambiaría la
forma de trabajar. Y cuando el repositorio vuelva a privado, las reglas de
protección de rama **exigen plan de pago** en una cuenta personal. Si algún día
se quiere bloqueante, la versión robusta no es esta: es un job disparado por
`pull_request` que **espera** el preview vía API de Vercel.

**Regla operativa mientras no sea bloqueante:** si la prueba de humo falla en un
preview, **ese despliegue no se promociona**.

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

### 10.23 LECCIÓN — cambiar el tema a mano no es cambiar el tema

> **Qué pasó (2026-09-16).** Para medir el contraste del panel en claro y en
> oscuro sin recargar, se alternó el atributo `data-theme` del elemento `<html>`
> desde la consola y se midió cada vez. Los números salían limpios, con aspecto de
> medición, y **una parte era falsa**.
>
> La pista fue un dato que no cuadraba: el borde de los campos salía **`#29292a`
> en los dos modos**. Ese valor es exactamente el paso 150 de la rampa **oscura**,
> y aparecía también estando en «claro». Repitiendo por el mecanismo real —la
> cookie `payload-theme` y recargar la página— el borde en claro dio **`#d1d1d1`**,
> que es el valor correcto.

**Lo observado, sin adornarlo:**

| Qué se medía                               | Al alternar `data-theme` a mano | Con cookie + recarga |
| ------------------------------------------ | ------------------------------- | -------------------- |
| Variables resueltas en una sonda **nueva** | cambiaban bien                  | igual                |
| Elementos **que ya estaban** en la página  | conservaban el valor anterior   | valor correcto       |
| Borde del input en «claro»                 | `#29292a` (oscuro) — **falso**  | `#d1d1d1`            |

**No se aisló el mecanismo exacto**, y es mejor decirlo que inventarlo: puede
ser invalidación de estilos, puede ser que Payload aplique el tema por algo más
que el atributo. Lo que sí está probado es el **efecto**: el atajo no reproduce
el cambio real, y los elementos ya pintados son justo los que mienten.

**Por qué es peligroso:** la mitad de las cifras de esa tanda eran correctas
—las que salían de sondas creadas en el momento—, así que el conjunto parecía
coherente. Un error que afecta a todo se detecta; uno que afecta a la mitad se
publica.

**La regla:** para medir un tema, **entrar en ese tema como entra el usuario**.
En el panel de Payload eso es la cookie `payload-theme` (o la preferencia del
sistema operativo) y **recargar**. Nunca alternar el atributo en caliente.

**Quinta vez que el instrumento devuelve algo con aspecto de dato:**

| Sección | Se midió…                                       | …en lugar de…                        |
| ------- | ----------------------------------------------- | ------------------------------------ |
| §10.14  | el HTML de origen                               | la página pintada                    |
| §10.15  | el código HTTP                                  | el efecto en la base                 |
| §10.17  | el permiso nuevo                                | la migración que lo reparte          |
| §10.20  | el código, y el pintado de una pestaña de fondo | el despliegue, y una pestaña visible |
| §10.23  | el tema forzado desde la consola                | el tema al que entra un usuario      |

**Y en la misma tanda, un primo cercano:** `docs/design-tokens.md` afirmó que los
grises que fallaban eran el paso 500 e «iguales a los de fábrica». Era una
**coincidencia de valor tomada por identidad**: el paso real era el 400, y el de
fábrica era peor, no igual. Se detectó al ir a aplicar el remedio, resolviendo la
rampa en vez de suponerla. Es el mismo defecto de fondo: **un número plausible
que nadie contrastó con la fuente**.

### 10.24 LECCIÓN — el borde autorrellenado leído a mitad de su transición

> **Qué pasó (2026-09-17).** Al verificar la fase 2 del panel en producción, el
> borde del campo del inicio de sesión dio **1,49:1**: justo el valor que tenía
> **antes** de la fase 2, como si el arreglo no se hubiera desplegado. Tres
> lecturas seguidas, tras dejar asentar la página, dieron **3,11:1**, el valor
> correcto.
>
> **Por qué.** Chrome había **autorrellenado** el campo, y el borde estaba a
> mitad de su transición. `formInput` de Payload **3.88** declara
> —leído de 3.88, **sin reverificar** en la 3.89 que corremos hoy—
> `transition-property: border, box-shadow, background-color` con
> **`transition-duration: 100ms`** para el borde (verificado en
> `@payloadcms/ui/dist/scss/vars.scss`). `getComputedStyle` devuelve el valor
> **interpolado en ese instante**, no el final: la lectura capturó un estado
> transitorio que ningún usuario llega a ver.
>
> **Se repitió el mismo día sin autorrelleno**, en la vista de crear artículo:
> primera lectura del borde del título 1,49 y del botón «Crear» 20,47; tres
> lecturas a los 8 s dieron los valores correctos (`#909090`, 3,11). Ahí **no se
> aisló el mecanismo** —puede ser la misma transición al hidratar o el montaje
> de Payload—; lo probado es el efecto.
>
> **Por qué es peligroso:** el número era **plausible**. No era basura; era un
> valor real de la página, el de antes del cambio. Una sola lectura habría
> reportado «el arreglo no llegó a producción» con evidencia de aspecto sólido.
>
> **La regla:** en la página pintada, **varias lecturas separadas tras dejar
> asentar**, y solo vale si coinciden. Una lectura única cerca de una carga, un
> autorrelleno o una interacción no es una medición.

**Sexta vez que el instrumento devuelve algo con aspecto de dato:**

| Sección | Se midió…                                       | …en lugar de…                        |
| ------- | ----------------------------------------------- | ------------------------------------ |
| §10.14  | el HTML de origen                               | la página pintada                    |
| §10.15  | el código HTTP                                  | el efecto en la base                 |
| §10.17  | el permiso nuevo                                | la migración que lo reparte          |
| §10.20  | el código, y el pintado de una pestaña de fondo | el despliegue, y una pestaña visible |
| §10.23  | el tema forzado desde la consola                | el tema al que entra un usuario      |
| §10.24  | un instante de la transición del borde          | el estado asentado                   |

### 10.26 HALLAZGO — dos filas de preferencia para la misma clave, y tres formas de leerlas

> Descubierto el 2026-09-17 al reagrupar el menú del panel. En **producción**,
> `payload-preferences` tenía **dos filas** con la clave `nav` para el **mismo
> usuario** (ids 12 y 13). Una con `Configuración=cerrado`, la otra vacía.
>
> Solo se vio porque el script de lectura imprimía «usuarios: 1 · filas: 2». La
> primera versión de ese script **agrupaba por usuario y se quedaba con la
> primera coincidencia**, así que enseñaba una salida limpia que escondía la
> segunda fila. Corregido: `npm run prefs:menu` lista **filas**, no usuarios, y
> marca las huérfanas.

**Lo que SÍ está verificado**, leyendo Payload 3.88 (**leído de 3.88, sin
reverificar** en 3.89): con duplicados, el
estado deja de ser determinista, porque cada camino elige fila con un criterio
distinto.

| Quién                                         | Cómo ordena                                 | Qué fila coge         |
| --------------------------------------------- | ------------------------------------------- | --------------------- |
| El servidor al pintar el menú (`getNavPrefs`) | sin `sort`: cae al `-createdAt` por defecto | la creada más tarde   |
| El cliente (`preferences.findOne`, vía REST)  | `sort: '-updatedAt'`                        | la actualizada última |
| La escritura (`db.upsert` → `updateOne`)      | `select … limit 1` **sin `ORDER BY`**       | la que dé Postgres    |
| El borrado de Payload (`DELETE …/:key`)       | `deleteOne` con `where`, sin orden          | la que dé Postgres    |

**Efecto medido en producción:** el menú pintaba los 6 grupos desplegados, o sea
leyendo la fila vacía (la más nueva), y el `Configuración=cerrado` de la otra no
se aplicaba. Coherente con la tabla.

**Apareció también en la base de PREVIEW** (clonada de producción) con los seis
grupos del menú en cerrado y fecha del 2026-09-17. La dirección apunta a que
**probablemente los plegó ella** al revisar el menú, pero **no está confirmado**:
si vuelve a pasar sin que nadie toque los grupos, hay que investigarlo, porque
entonces habría algo más escribiendo esa preferencia.

**Origen: NO confirmado.** Lo más probable es una **carrera entre dos peticiones**
cuando todavía no existía ninguna fila: la escritura es un _upsert_ por clave y
usuario, y dos POST simultáneos sin fila previa crean dos. **No se intentó
reproducir** — decisión de dirección: no cambiaba el plan. Queda el rastro por si
reaparece.

**Resuelto en producción** borrando la fila duplicada con `npm run prefs:borrar`,
que exige el **id** exacto justamente porque el borrado por clave no garantiza
cuál cae.

**La lección, que es la de §10.24 en otra forma:** un resumen que agrupa puede
esconder el dato que importa. Cuando el recuento de la cabecera no cuadre con las
líneas de detalle —1 usuario, 2 filas—, **el resumen está mal, no el recuento**.

### 10.28 RESUELTO — dos CVE críticos de Next, cerrados con 16.3.5

> **Estado: cerrado el 2026-09-18.** Producción corre **Next 16.3.5** y
> **`next` ya no aparece en `npm audit`** (quedan 7 avisos ajenos: 1 bajo, 6
> moderados). Lo que sigue conserva el análisis, porque explica por qué se hizo
> en dos pasos —mitigar primero, actualizar después— y qué hay que revalidar la
> próxima vez.
>
> El punto de partida: `npm audit` (2026-09-17) marcaba **next** como crítico en
> el rango `>=16.0.0 <16.3.3`, y corríamos **16.2.11**.

| Aviso                                                                                                | CVSS | Condición que exige                                                                              | ¿Nos aplica?                                                               |
| ---------------------------------------------------------------------------------------------------- | ---: | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) · RCE por _path traversal_  |  9,0 | Servidor alojado **en sistema de ficheros Windows**, con Pages o App Router sin Cache Components | **Producción NO**: Vercel es Linux. **El desarrollo local SÍ**: es Windows |
| [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) · RCE al optimizar **AVIF** |  9,5 | Que se optimice un fichero **AVIF** (fallo de `libheif` dentro de `sharp`)                       | **Sí, por un camino autenticado** (ver abajo)                              |

**Parcheado en 16.3.3**; la última estable es **16.3.5**. Ojo: **16.2.12 existe y
NO basta** — sigue por debajo de 16.3.3.

#### El camino real del AVIF, medido en nuestra configuración

- `next.config.ts` no declara `formats`, así que Next **emite solo WebP** (el
  valor por defecto verificado en `image-config.js`). El problema no es la
  salida: es **decodificar un AVIF de entrada**.
- `remotePatterns` solo admite `**.public.blob.vercel-storage.com`, así que un
  extraño **no puede** pasarle una URL arbitraria a `/_next/image`.
- Pero `Media` es `upload: true` **sin `mimeTypes`**, y `payload.config.ts` pasa
  `sharp` a `buildConfig`. Es decir: **un editor autenticado puede subir un
  `.avif` manipulado y nuestro propio lambda lo decodifica con `sharp` 0.35.4**.
  No es «sin autenticar» como dice el aviso, pero es un camino que existe.

**Mitigación barata, sin actualizar Next** (no implementada, pendiente de
decisión): restringir `mimeTypes` en `Media` a JPEG, PNG y WebP. Cierra el
camino de subida y además evita que entren formatos que el sitio no sirve.

**Para el desarrollo local en Windows:** `npm run dev` es `next dev` a secas. Si
el servidor de desarrollo escucha más allá de `localhost`, cualquiera en la
misma red entra en el escenario del primer aviso. Mitigación inmediata:
`next dev -H 127.0.0.1`.

#### Qué implicaría subir de 16.2.11, con la compatibilidad de Payload verificada

**Payload lo soporta.** Documentación vigente (`getting-started/installation`):
los rangos válidos son `15.2.9–15.2.x`, `15.3.9–15.3.x`, `15.4.11–15.4.x` y
**`16.2.6+`**. Y el `peerDependencies` del paquete instalado dice exactamente
`>=15.2.9 <15.3.0 || >=15.3.9 <15.4.0 || >=15.4.11 <15.5.0 || >=16.2.6 <17.0.0`.
**16.3.5 cae dentro**, así que subir no rompe el ADR 0001; el rango es estrecho
pero no nos bloquea (recordatorio: 15.5 nunca estuvo soportado).

Lo que exige el cambio, y por qué no es un `npm i next@latest` y a correr:

1. **Regenerar el lock borrando lock y `node_modules`** (§10.5): instalar en
   Windows sin eso ya nos tiró las entradas `@emnapi/*` que Linux necesita.
2. **Revalidar el trazado de `sharp`** (§10.18): `outputFileTracingIncludes` se
   verificó contra el `collect-build-traces` de **16.2.11**. Un salto de minor
   puede mover ese código, y el modo de fallo es un 500 en `/admin`, la API, el
   sitemap y el mapa de redirects.
3. **Revalidar el proxy** (`src/proxy.ts`, §10.22) y las cabeceras/CSP.
4. **Preview primero**, ruta a ruta: `/admin/`, `/api/marcas/`, `/sitemap.xml`,
   `/` y una ficha. `npm run qa` contra un preview mide producción (§10.21).
5. **Tener a mano el revert de alias** de §10.18 antes de tocar producción.

**Esfuerzo: 2–4 h** con verificación completa. **Riesgo: medio** — el salto es
de minor, pero toca justo las piezas que ya nos rompieron producción una vez.

#### Lo que se hizo de verdad, y contra qué versión se revalidó (2026-09-18)

**Paso 1 — mitigar sin tocar Next** (commits `3743615`, `a06e8f3`):

- `Media.upload.mimeTypes` a JPEG, PNG y WebP. Payload lo usa en las dos
  direcciones: `accept` del selector y validación en servidor.
- Hook propio `formatoDeImagenPermitido`, porque el mensaje de rechazo de Payload
  está **cableado en inglés** (`checkFileRestrictions.js`) y el panel está en
  español (§5). Mira **firmas de contenido**, no la extensión.
- `npm run dev` pasa a `next dev -H 127.0.0.1`: el primer aviso solo afecta a
  hosts Windows, o sea a la máquina de desarrollo.

Verificado en el preview: GIF rechazado; **GIF renombrado a `.png` rechazado
igual** (Payload también detecta por contenido); PNG válido aceptado. Y de paso
quedó cerrado el pendiente del **store de Blob de preview** (§10.21): la subida
fue a `lsndnc29nh4ws7eh…`, producción usa `sr2s4ngkjzfzpxhi…`, y al borrar el
registro el binario también desapareció (404).

**Paso 2 — subir a 16.3.5** (commit `d1d8314`), con la lista de arriba cumplida:

| Qué se revalidó                     | Contra qué                       | Resultado                                                               |
| ----------------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `outputFileTracingIncludes`         | código de **16.3.5**             | Sigue de primer nivel, y en modo `contains`                             |
| Trazado real de `libvips`           | **`/admin/` en el preview: 200** | No se puede probar en Windows: el paquete de Linux no existe en local   |
| Proxy y CSP                         | preview, cabeceras               | CSP intacta en 4 rutas, sigue `Report-Only`                             |
| Redirects (§10.22, solo producción) | `/gracias/`                      | **301** hacia `/contactanos/`                                           |
| Panel pintado                       | preview y producción             | 6 grupos con icono, 19 entradas, cabecera 40 px, sin errores de consola |
| `qa` completo                       | producción                       | **0 errores**                                                           |
| Puertas locales                     | 16.3.5                           | typecheck, lint, formato y **210 pruebas**                              |

**El revert de alias quedó preparado antes de promocionar** (§10.18) y no hizo
falta usarlo.

#### Decisión: NO se probó una subida en producción

El camino de rechazo y aceptación de formatos se verificó **en preview, con el
mismo código**. En producción se comprobó lo que importaba sin escribir nada: las
**5 PNG existentes se listan con su miniatura**, se abren, y el selector filtra
(`accept="image/jpeg, image/png, image/webp"`).

**Por qué no se reconfirmó ahí:** una subida de prueba escribe en el **Blob de
producción** —la cuenta que sirve el sitio real— para volver a demostrar algo ya
demostrado. Decisión de dirección: no compensa. Si algún día hace falta, el
procedimiento es el del preview: subir, comprobar y borrar registro y binario.

#### LECCIÓN — la versión se fija, no se deja flotar

`npm install next@16.3.5` escribió **`^16.3.5`** en `package.json`. Se cambió a
**`16.3.5` exacto** antes de commitear, y el lock se regeneró con ese valor.

**Por qué importa aquí más que en otros proyectos:** la ventana de Payload es
estrecha (`>=16.2.6 <17.0.0`, y 15.5 nunca estuvo soportado), así que un caret
permite saltar a una versión de Next **que nadie ha verificado con este panel**,
y el salto ocurriría en el próximo `npm install` de cualquiera.

**Ya nos pasó, en la misma sesión y sin avisar:** `^3.86.0` resolvió a **3.89.0**
en los ocho paquetes de Payload al regenerar el lock, y el repositorio siguió
documentando «3.88» un rato más. Esa deriva no dio ningún error; simplemente dejó
la documentación hablando de otra versión.

**La regla, en la línea de §10.25:** para las dependencias que sostienen el
arranque —Next y Payload— **versión exacta**, y el salto como tarea con su
verificación. Un rango convierte una decisión en una deriva silenciosa.

**Convertido en guardarraíl** (`src/lib/deps/versiones-fijas.test.ts`, §10.25):
CI falla si `next`, `payload` o cualquier `@payloadcms/*` declara un rango. La
lista no está escrita a mano —se deduce de `package.json`—, así que un paquete
nuevo de Payload queda cubierto sin tocar la prueba, y lleva su propia
comprobación del guardián. Al escribirlo **encontró el caso vivo**: `payload` y
sus cinco paquetes seguían en `^3.86.0`. Se fijaron a **3.89.0**, que es lo que
ya estaba instalado y desplegado: no cambia nada en ejecución, solo cierra la
deriva.

#### Nota de versión: el panel ya corre Payload 3.89.0, no 3.88.0

Al regenerar el lock para instalar los iconos, el rango `^3.86.0` resolvió a
**3.89.0** en los ocho paquetes de Payload, y así se construyó el despliegue de
la fase B. Todo lo que este repositorio documenta como «verificado contra 3.88»
—los componentes `@internal` del menú, el selector de error de la fecha, la
transición de 100 ms del borde— se leyó del código de 3.88. **La fase B se
verificó pintada ya sobre 3.89.0 y el menú propio funciona**, pero cualquier
afirmación futura sobre el código de Payload hay que releerla en la versión
instalada, no en estas notas.

### 10.30 SIN DIAGNOSTICAR — un commit que nunca disparó despliegue (2026-09-20)

> `3e286fe` («el logotipo recupera su nombre accesible»), en la rama
> `feat/panel-wordmark`, **nunca generó despliegue en Vercel**. Verificado por
> dirección en la lista de deployments: no aparece **ni en cola, ni cancelado, ni
> bloqueado, ni con error**. Simplemente no existe.
>
> **Qué descarta el caso:**
>
> - El commit **sí está en el remoto**: `git ls-remote` devolvió el mismo sha que
>   local, y `origin/feat/panel-wordmark` lo tiene.
> - **La integración de Git funcionaba minutos antes**: los dos commits
>   anteriores de esa misma rama (`0721e20`, `de78c99`) sí desplegaron.
> - **No es el plan ni el repositorio privado** (§10.4): otras ramas siguieron
>   desplegando el mismo día.
>
> **Cómo se salió adelante sin diagnosticarlo:** la rama `docs/wordmark-registro`
> se creó **encima** de ese commit, y su push **sí** desplegó. Comprobado con
> `git merge-base --is-ancestor 3e286fe 3701202` —no por suposición— y mirando el
> árbol del commit desplegado, que contiene el arreglo. Así que **el preview de
> otra rama sirvió para verificar el commit que no se desplegó**.
>
> **Si vuelve a pasar:** mirar las entregas del webhook en GitHub (Settings →
> Webhooks → el de `vercel.com` → Recent Deliveries). Si el evento `push` no
> aparece, el corte es de GitHub hacia Vercel; si aparece con error, es de Vercel.
> Y como desbloqueo inmediato, un «Redeploy» manual de ese commit, o un commit
> nuevo encima, que es lo que resolvió este caso.
>
> **Decisión de dirección: no se persigue ahora.** Queda el rastro, porque es el
> segundo aviso que tenemos sobre el disparo de despliegues —el primero fue el
> bloqueo por plan de §10.4— y lo que no se anota se vuelve a diagnosticar desde
> cero.

### 10.31 COMPROMISO INCUMPLIDO — Sentry está en la cotización y no está en el repo

> Descubierto el 2026-09-22 buscando un destino para los informes de la CSP
> (§10.16). No es deuda técnica nuestra y ya está: **es algo que el cliente pagó
> y hoy no tiene.**

**Medido en el repositorio, no inferido:**

| Qué se buscó                                    | Resultado                                                 |
| ----------------------------------------------- | --------------------------------------------------------- |
| `@sentry/*` en `dependencies`/`devDependencies` | **Ninguno** (12 de producción, 10 de desarrollo)          |
| `sentry.client.config.*` / `sentry.server.*`    | **No existen**                                            |
| `instrumentation.ts`                            | **No existe**                                             |
| `error.tsx` / `global-error.tsx` en `(site)`    | **No existen**; el único `not-found.tsx` es del panel     |
| Menciones en el código                          | **Una, y es un comentario**: `src/lib/revalidation.ts:56` |

**Dónde se aplazó, y que nunca se retomó:** `docs/sprint-0.md`, **tarea 0.4
(«Despliegue y observabilidad»)**, con el criterio **sin marcar**: `[ ] Sentry
capturando errores de servidor y de cliente`. La verificación de cierre de ese
sprint incluye «4. Un error provocado a propósito llega a Sentry», y
`docs/PLAN-MVP.md` lista «Sentry conectado». Se avanzó igual.

**Y el `README.md` lo da por hecho**, que es lo que hace que nadie lo note: la
tabla de variables pide `NEXT_PUBLIC_SENTRY_DSN` y
`SENTRY_AUTH_TOKEN`/`ORG`/`PROJECT` con un **«sí»** en Preview y Producción
—ninguna de las cuatro está cargada en Vercel (§10.11)— y la lista «Antes de dar
un despliegue por bueno» incluye «5. Sentry recibe errores de servidor y de
cliente», **un paso que nadie ha podido pasar nunca**. Es el mismo defecto del
Build Command de §10.21: documentación que describe un guardián no conectado.

#### El compromiso con el cliente, que es lo que convierte esto en prioridad

Transmitido por la dirección técnica: Sentry aparece en **dos** documentos
contractuales.

| Documento                  | Qué compromete                                                |
| -------------------------- | ------------------------------------------------------------- |
| **Cotización**             | En el **stack** y en los **costos operativos**                |
| **Gestión de Incidencias** | **Revisión semanal de errores** como mantenimiento preventivo |

_(Los dos documentos **no están en el repositorio** y no se han leído en esta
sesión: estas dos líneas son cita indirecta de la dirección.)_

**La revisión semanal hoy es imposible, y conviene decir por qué y no solo
que falta la herramienta.** Lo que hay son **101 llamadas a `console.error` /
`console.warn`** en `src` y `scripts`, con prefijo de área, que van a los
**registros de runtime de Vercel**. Eso implica tres cosas:

1. **Nadie recibe aviso.** Hay que entrar al panel de Vercel y mirar.
2. **No se retienen para una revisión semanal.** La retención de los registros
   de runtime **depende del plan y de Observability Plus** (documentación de
   Vercel, que remite a sus límites; en Hobby es corta, y la vía para conservar
   más es un **Log Drain**). Una revisión de los errores de la semana pasada no
   tiene contra qué hacerse.
3. **No hay agrupación, ni frecuencia, ni versión, ni traza con fuentes.** Un
   error que ocurre 400 veces son 400 líneas sueltas.

**Y hay un agujero aparte del registro:** el sitio público **no tiene
`error.tsx` ni `global-error.tsx`**, así que un fallo de render en un Server
Component sirve la página de error por defecto de Next. No se pierde el dato
—va al registro— pero el visitante ve una pantalla genérica sin salida.

**Segundo compromiso que esto desbloquearía:** Sentry es el destino natural de
los informes de la **CSP** (§10.16), que hoy no se recogen en ninguna parte.
**Un solo trabajo cierra los dos**, y por eso se plantean juntos.

**NO se ha instalado nada.** Añadir `@sentry/nextjs` es una dependencia nueva y
**§2 exige aprobación previa**; además hay que decidir cuenta, plan y —lo que
más importa— **qué datos salen del sitio**: `solicitudes` guarda nombre, correo
y teléfono de terceros, y la Ley 1581 de 2012 aplica igual aquí que en los
respaldos (§10.3 p.10).

#### PLAN APROBADO (2026-09-22) — en espera de que el cliente cree la cuenta

> **NO se instala nada hasta que exista la organización de Sentry** (pendiente
> #14 del cliente). Decisión de dirección, y el motivo es bueno: **una
> dependencia inerte no aporta nada**, y la verificación que de verdad importa
> —la del blindaje de datos— **necesita el destino real** para comprobarse.
> Instalar antes sería tener el riesgo sin la prestación.

**Opción C, en este orden:**

1. **SDK solo de servidor. NADA de SDK de cliente en `(site)`.** El objetivo del
   negocio es tráfico orgánico (§1) y la línea base de rendimiento ya depende
   del diseño que falta (§10.3 p.14): el SDK de navegador añadiría JavaScript a
   cada página de catálogo para cubrir un fallo que ocurre en el **lambda**
   (§10.18). La CSP reporta por cabecera desde el navegador, así que **no
   necesita SDK de cliente** para nada de esto.
2. **Revalidar `outputFileTracingIncludes` al anidar con `withPayload`.**
   `next.config.ts` ya va envuelto, y `withSentryConfig` envuelve también. Es
   exactamente la pieza que rompió producción en §10.18, y el modo de fallo es
   un 500 en `/admin`, la API, el sitemap y el mapa de redirects. Se revalida
   **contra la versión instalada**, no contra estas notas.
3. **Blindaje de datos, que no es un extra: es parte del trabajo.** Los valores
   por defecto de `dataCollection` del SDK **mandarían los datos personales**:
   `httpBodies` recoge el cuerpo de la petición entrante —el POST del
   formulario con nombre, correo y teléfono— y `stackFrameVariables: true`
   captura las **variables locales** de cada marco, o sea el objeto ya validado
   por Zod. Configuración exigida: `httpBodies: []`,
   `stackFrameVariables: false`, `userInfo: false` (sin IP), `cookies: false`
   (la sesión del panel no tiene por qué viajar), `httpHeaders` con lista de
   permitidos, un `beforeSend` propio como última barrera, y el **Data
   Scrubbing** del servidor de Sentry activado además, para que el filtro no
   dependa solo de nuestro código.
   **Quedarse en `sendDefaultPii: false` NO protege**: su propia documentación
   lo marca obsoleto en favor de `dataCollection`, y los cuerpos y las variables
   locales salen igual.
4. **La prueba con datos reconocibles. Sin ella no se da por terminado.** Se
   provoca un error **dentro del camino del formulario** en preview, con un
   nombre, un correo y un teléfono inventados y buscables, y **se busca esa
   cadena en el evento que llegó a Sentry**. Si aparece, la configuración no
   sirve —diga lo que diga el código—. Es §10.15 aplicado aquí: se verifica el
   **efecto**, no la configuración.
5. **`/api/csp-report/` con filtrado, y fase 2 de la CSP tras una semana de
   datos reales.** La ruta recibe el `report-uri`, **filtra el ruido de
   extensiones de navegador** —que inyectan scripts en la página del visitante y
   disparan violaciones que no son nuestras—, deduplica y reenvía a Sentry. Se
   hace con ruta propia y no apuntando la cabecera directamente a Sentry por dos
   razones: el filtrado, y que su endpoint nativo de informes de cabeceras
   **hoy no aparece en el índice de su documentación** y no se da por vivo sin
   comprobarlo. Solo **después de una semana con datos** se quita el
   `-Report-Only` (§10.16).

**Esfuerzo estimado:** 4–6 h el SDK con blindaje y verificación · 2–3 h la ruta
de CSP · 1–2 h la fase 2. **Riesgo:** medio en el paso 2 (toca lo que ya rompió
producción) y medio en el 3 (la configuración de PII es lo delicado).

#### TRES COMPROBACIONES OBLIGATORIAS EL DÍA QUE SE INSTALE

> Salen de la auditoría del árbol (abajo) y **no son recomendaciones**: sin las
> tres, la instalación no se da por hecha. Cada una cubre un riesgo concreto que
> ya se midió, no una preocupación general.

**1. `@sentry/cli-linux-x64` tiene que estar en el lock antes de commitear.**
`@sentry/cli` trae **8 paquetes opcionales por plataforma**
(`@sentry/cli-linux-x64`, `-win32-x64`, `-darwin`, …). Al instalar se borran lock
y `node_modules` (§10.5) y **se comprueba el del Linux**, porque aquí se instala
en Windows y **CI y Vercel construyen sobre Linux**.

**Es la tercera aparición del mismo patrón, y por eso ya no se trata como mala
suerte:**

| Cuándo | Qué faltó                                          | Cómo se vio                                 |
| ------ | -------------------------------------------------- | ------------------------------------------- |
| §10.5  | `@emnapi/core` y su `runtime` anidado              | `npm ci` verde en Windows, **rojo en CI**   |
| §10.18 | `libvips-cpp.so` de `@img/sharp-libvips-linux-x64` | **500 en producción** sin cambiar una línea |
| Sentry | `@sentry/cli-linux-x64` _(riesgo, no ocurrido)_    | Fallaría el build al subir _source maps_    |

**2. Revalidar en preview que `import-in-the-middle` no choca con Payload ni con
Turbopack.** Ese paquete —y `require-in-the-middle`— **parchean la carga de
módulos** para instrumentar, así que se meten justo por debajo de las dos piezas
más sensibles que tenemos. Se comprueba **en el despliegue**, no en local, y con
las rutas que cargan la config de Payload en tiempo de petición: `/admin/`,
`/api/marcas/`, `/sitemap.xml` y una ficha. La prueba de humo (§10.20) cubre las
tres primeras **automáticamente**, así que el trabajo extra es mirar la consola
del panel y los registros de runtime buscando avisos de parcheo.

**3. Medir el peso de una página de catálogo antes y después.** `@sentry/browser`,
`@sentry/react`, `@sentry/replay`, `@sentry/replay-canvas` y `@sentry/feedback`
**se instalan aunque no se usen**: son dependencias de `@sentry/nextjs`. «Solo
servidor» significa **no cargarlos**, no que no se descarguen, y el modo de fallo
es silencioso —el sitio funciona, solo pesa más— en el único sitio donde no
podemos permitirlo (§1: el objetivo es tráfico orgánico). La cifra se toma de la
**misma ruta** antes y después, contra el **despliegue** y no contra `npm start`
(§10.13).

#### El árbol transitivo, leído del registro SIN instalar (2026-09-22)

Mismo criterio que con el CLI del cliente (§10.27): se lee antes de ejecutar.
Recorrido de `dependencies` desde `@sentry/nextjs@10.75.2` contra
`registry.npmjs.org`.

> **ALCANCE DE ESTA AUDITORÍA, para quien la relea y no le atribuya más de lo
> que hizo:** se auditó **qué entra, de quién es y qué corre al instalar**.
> **NO se auditó el código** de los 55 paquetes nuevos. Nadie debe leer esta
> sección como «el árbol de Sentry está revisado»: está **inventariado**.

| Dato                                      | Cifra                                                            |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Paquetes en el árbol                      | **104**, más **8 opcionales** de `@sentry/cli` por plataforma    |
| **Ya presentes en nuestro lock**          | **49** (los `@babel/*`, `browserslist`, `picomatch`, `debug`, …) |
| **NUEVOS**                                | **55** — 19 `@sentry/*`, 8 `@opentelemetry/*`, 28 ajenos         |
| Dependencias directas de `@sentry/nextjs` | 14, incluidas `rollup` y `@rollup/plugin-commonjs`               |

**Lo que hay que mirar, y por qué:**

- **`@sentry/cli@3.8.0` tiene `postinstall`**, y es el único del árbol que
  **descarga de la red al instalar**. Leído su `scripts/install.js`: el binario
  normalmente llega por el **paquete opcional de la plataforma**, y el
  `postinstall` solo hace de **respaldo** descargando de
  `downloads.sentry-cdn.com` con validación de checksum contra el
  `checksums.txt` del paquete. Tiene escape: `SENTRYCLI_SKIP_DOWNLOAD=1`.
  **Para qué sirve:** subir _source maps_ en el build. Nada en tiempo de
  petición.
- **Los otros 11 scripts del árbol son `prepare`** (`rollup`, `glob`,
  `minimatch`, `lru-cache`, `undici`, …), y **`prepare` no corre al instalar
  desde el tarball publicado**: solo al instalar desde git o desde fuente. No
  son un camino de ejecución en un `npm ci`.
- **`import-in-the-middle` y `require-in-the-middle`** vienen con
  `@sentry/node`: **parchean la carga de módulos** para instrumentar. Es como
  funciona la instrumentación automática, y es el punto donde una
  incompatibilidad con Payload o con Turbopack se notaría. A revalidar en el
  preview, no a suponer.
- **Se instala el SDK de navegador aunque no se use**: `@sentry/browser`,
  `@sentry/react`, `@sentry/replay`, `@sentry/replay-canvas`, `@sentry/feedback`
  son dependencias **directas o transitivas** de `@sentry/nextjs`. «Solo
  servidor» significa **no cargarlo** —sin config de cliente, sin DSN público—,
  no que no se descargue. Lo que importa es que **no entre en el bundle de
  `(site)`**, y eso se comprueba midiendo el peso de una página de catálogo
  antes y después.
- **Cinco nombres raros, comprobados uno por uno** porque en un árbol nuevo es
  donde se esconde un typosquat: `obug` y `verkit` son de **sxzz**, `tagged-tag`
  de **sindresorhus**, `flru` y `empathic` de **lukeed**. Todos con repositorio
  público y descripción coherente. **Sin hallazgos.**

**Los límites del método, además del alcance de arriba:** el recorrido siguió
solo `dependencies` —los 8 opcionales de `@sentry/cli` se listaron **aparte, a
mano**, y ese descuido es justo el riesgo de la comprobación 1— y resolvió cada
rango a la última estable cuando no era exacto, así que **las versiones
definitivas las fija el lock el día de la instalación**, no esta tabla.

**Los tres riesgos que salieron de aquí están arriba como comprobaciones
obligatorias**, no como advertencias: es la diferencia entre anotar un riesgo y
atraparlo (§10.25).

### 10.29 PREGUNTA BLOQUEANTE AL CLIENTE — su PDF y su propio código se contradicen sobre el flujo de OAuth

> Descubierto el 2026-09-20 al estudiar el componente `login-screen` de su CLI
> (§10.27). **Esto se aclara ANTES de cotizar el SSO en firme**: las dos
> versiones exigen trabajo distinto y tienen riesgos distintos.

**Versión A — el PDF de integración que entregó el cliente.** Según lo que
transmitió la dirección técnica de ese documento: **el canje del código exige
`client_secret`, así que va en servidor**; **no emiten `id_token` ni tienen
`/userinfo`**; y el **refresh token rota en cada uso**, así que hay que
serializar renovaciones concurrentes. _(Reportado por dirección; el PDF no se ha
leído en esta sesión, así que estas tres líneas son cita indirecta.)_

**Versión B — el código que publica su propio CLI**, textual de
`hooks/use-auth.ts` (registro `https://ui.partequipos.com/r/use-auth.json`):

> «Auth Central no entrega un `code` para canjear: manda el `access_token` y el
> `refresh_token` directo en el query del redirect.»

Y el formato del callback, también textual:

> `?status=success&token=…&refresh_token=…&state=…`

**Las dos no pueden ser ciertas a la vez.** Consecuencias:

| Si manda…                       | Qué implica                                                                                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A: código + `client_secret`** | El canje va en un endpoint nuestro. Flujo estándar, tokens nunca en la URL. El componente del CLI **no ayuda** en esa parte                                                               |
| **B: tokens en el query**       | Los tokens **viajan en la URL**: quedan en el historial, pueden filtrarse por `Referer` y **NUNCA se puede registrar la URL del callback** (ni en logs, ni en Sentry, ni en un `console`) |

**Lo que las dos versiones comparten**, y por eso no hay atajo: el hook dice
—textual— que el `refresh_token` «se renueva desde TU BACKEND —nunca desde el
navegador— porque el `grant_type=refresh_token` de `/oauth2/token` exige el
client secret». O sea, **la rotación del refresh es trabajo nuestro en las dos
versiones**, y el componente no implementa nada de eso.

**Segunda pregunta, igual de bloqueante: qué claims trae el `access_token`.** El
hook dice que es un JWT RS256 de 15 minutos validable **offline** contra
`{authUrl}/.well-known/jwks.json` (issuer = `authUrl`, audience = nuestro
`clientId`), lo que **matiza** la trampa del `id_token` ausente: la identidad
saldría de sus claims. Pero **el registro no dice qué claims son**, y de eso
depende el mapeo al campo `rol` de `Users`. Pendiente #13 del cliente.

**Estimación revisada del SSO con lo que se sabe hoy: 30–46 h** (antes 30–50 h
suponiendo construirlo desde cero). El componente abarata **la pantalla, no el
protocolo**: de las tres trampas del PDF **no cubre ninguna**.

**Recomendación para cuando llegue el momento —anotada ahora para no repetir el
estudio:** copiar **solo `use-auth`**, que declara **cero dependencias**, y
construir la pantalla con nuestro propio marcado. `login-screen` arrastra
`button`, `input` y `spinner`, y con ellos **cuatro paquetes nuevos**
—`@base-ui/react` (9,6 MB), `class-variance-authority`, `clsx` y
`tailwind-merge`— para lo que en modo `oidc` acaba siendo **un botón**: el
formulario de correo no aplica a una app satélite, porque ese POST deja cookie
en el dominio de Auth Central, no un token para nosotros.

**Y lo que el componente NO resuelve del lado de Payload:** no autentica contra
Payload. Payload necesita **su propia sesión** —es la que sostiene los roles y
todo el control de acceso—, así que la integración exige un endpoint que valide
el JWT, resuelva el usuario y emita la cookie de Payload
(`getFieldsToSign`, `jwtSign`, `generatePayloadCookie`; API pública, verificada
en 3.89.0), o una `auth.strategies` en `Users`. La pantalla de login **sí** se
puede sustituir (`admin.components.views.login` gana sobre la vista interna,
verificado en `getRouteData`), pero eso es lo de menos. **No poner
`disableLocalStrategy`:** conviene conservar correo y contraseña como vía de
rescate (§10.17).

**La integración sigue planificada AL FINAL**, y no por el coste: cada
`redirect_uri` se registra por dominio y los de staging y producción todavía no
existen.

### 10.27 CLI del sistema de diseño del cliente — cómo usarlo sin regalar el repo

> Partequipos publica su sistema como CLI al estilo de shadcn: copia los
> componentes al repositorio y quedan editables.
> `npm view partequipos` → **0.3.5**, MIT, 18,5 kB, una dependencia
> (`@clack/prompts`), publicado por **GitHub Actions con OIDC** desde
> `github.com/Partequipos/design-system`. Su registro vive en
> `https://ui.partequipos.com/r/*.json` (89 entradas, **77 componentes**).
>
> **Leído el código del paquete antes de ejecutarlo** (510 líneas, sin
> telemetría y sin scripts de instalación):

| Comando | Qué hace de verdad                                                                                             |
| ------- | -------------------------------------------------------------------------------------------------------------- |
| `list`  | **Solo lee**: descarga `registry.json` e imprime. No escribe ni instala                                        |
| `add`   | Escribe en `src/components/ui/…` **y ejecuta el gestor de paquetes** con las dependencias que diga el registro |
| `init`  | Inyecta el bloque de tokens en el CSS global, entre marcadores, de forma idempotente                           |

**RIESGO DE CADENA DE SUMINISTRO, que es el que importa.** `add` hace
`spawnSync(pm, ['add', ...deps], { shell: true })` con `deps` leídas del **JSON
del registro**, no del paquete npm firmado. Es decir: **quien controle
`ui.partequipos.com` puede hacernos instalar cualquier paquete de npm**, y ese
dominio no está bajo nuestro control ni bajo la protección de npm.

**LA REGLA, no negociable:**

1. **Componentes de uno en uno.** `add <componente>`, nunca varios a ciegas.
2. **Revisar `https://ui.partequipos.com/r/<componente>.json` antes**: mirar
   `dependencies` y `registryDependencies` y aceptarlas explícitamente.
3. **NUNCA `add --all`.** Además del riesgo, mete 77 ficheros que CI tiene que
   tipar y lintar, la mayoría sin usar.
4. **Revisar el diff** de cada fichero copiado antes de confirmarlo, como
   cualquier código de terceros que entra al repositorio.
5. **Los tokens se pegan a mano**, no con `init`: para Next el CLI apunta a
   `app/globals.css` **relativo a la raíz** y el nuestro está en
   `src/app/(site)/globals.css`; `init` crearía un fichero huérfano que Next
   ignora. El bloque conserva los marcadores del CLI para poder regenerarlo.

**Dos hallazgos del registro, anotados para pendientes abiertos:**

- **`partequipos-wordmark` — EVALUADO el 2026-09-20, y sirve para el pendiente
  #12** (logo sobre fondo oscuro). **Sigue sin instalar.** Lo que trae, leído del
  registro:
  - **Un solo fichero**, `components/ui/partequipos-wordmark.tsx`, 16,7 kB y 97
    líneas: un `<svg viewBox="0 0 718 173" aria-hidden>` con 18 `path`.
  - **`dependencies: []` y `registryDependencies: []`.** Cero paquetes nuevos,
    **cero imports** —ni siquiera de React— y nada de `fetch`, `eval` ni scripts.
  - **No usa `currentColor`**; usa **tres props con variables CSS por defecto**:
    `textColor = var(--foreground)` en 10 paths, `holeColor = var(--sidebar)` en
    los 7 ojales de las letras, y `pColor = "#D92035"` —el rojo de marca— en 1.
    Así que **se adapta al tema**, y en el panel se le pasarían nuestras
    variables (`--theme-elevation-1000` y el fondo real de la superficie) en vez
    de las del sistema.
  - **Cumple la regla de §10.27 sin fricción:** es un componente suelto, se
    añadiría de uno en uno, no declara dependencias que revisar y el diff es un
    único fichero de marcado.
  - **Lo que hay que decidir antes:** el favicon (#9) **sigue pendiente** —esto
    no lo resuelve—, y el logo institucional del SITIO seguiría siendo el PNG
    cableado de §10.8. Esto solo arregla el panel en oscuro.
- **`partequipos-logo`**: no evaluado todavía.

**APLICADO el 2026-09-20 — `partequipos-wordmark` en el panel** (rama
`feat/panel-wordmark`, **sin fusionar**). Es el caso más limpio del CLI: un
fichero, cero dependencias, cero imports, solo marcado.

- **Comprobación de cadena de suministro, hecha:** el fichero escrito por el CLI
  es **idéntico byte a byte** al del registro (16.708 bytes), `package.json`
  quedó intacto y no se instaló nada. Por eso el fichero **se excluye de
  Prettier** (`.prettierignore`): formatearlo rompería esa comparación, que es la
  única defensa real cuando se añade o se actualiza un componente suyo.
- **Los colores son los del PANEL, no los del sistema:** `textColor` →
  `--theme-elevation-1000`, `holeColor` → `--theme-bg`. Sus valores por defecto
  (`var(--foreground)`, `var(--sidebar)`) **no existen** en el panel de Payload.
- **Un defecto que introdujo el cambio, y se corrigió:** su `<svg>` trae
  `aria-hidden="true"`, así que al sustituir el PNG **se perdió el `alt`**. Va
  envuelto en `role="img"` con `aria-label="Partequipos"`.
- **VERIFICADO PINTADO en los dos modos, y encontró un defecto:** en las **migas
  de pan** el hueco del icono mide **18 × 22 px con `overflow: hidden`**, y el
  wordmark a esa altura ocupa 91 px — se veía «PA» recortado, aunque el
  componente compilaba y renderizaba sin queja. Ahí va ahora el **isotipo**
  (`partequipos-logo`: un fichero, cero dependencias, verificado byte a byte),
  que a 20 px de alto ocupa 14 y cabe. El nombre accesible sale como
  `img "Partequipos"` en el árbol de accesibilidad. Cifras en
  `docs/design-tokens.md`.
- **`empty`** cubre los estados vacíos del panel, si algún día se retoma esa
  parte (hoy cerrada por decisión de dirección: fidelidad estética sin retorno).

### 10.25 GUARDARRAÍLES — convertir un olvido silencioso en un fallo ruidoso

> El patrón que comparten las lecciones §10.14 a §10.24 es que **el fallo no
> avisa**: el sitio sigue respondiendo 200, el panel sigue pintando, el build
> sigue en verde. Contra eso solo sirve una comprobación que **rompa** cuando
> alguien olvida algo, y que corra sin que nadie se acuerde de ella.
>
> Esta es la lista de los que existen. **Al añadir una pieza que se pueda
> olvidar, el sitio correcto para el guardarraíl es esta tabla**, no un párrafo
> de documentación que nadie relee.

| Guardarraíl                            | Qué olvido atrapa                                                                                       | Dónde                                                      | Cuándo corre     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------- |
| Cobertura del sitemap                  | Una ruta pública nueva que no se emite en el sitemap, y un patrón declarado que ya no existe            | `src/lib/seo/sitemap.test.ts`                              | CI, en cada push |
| Grupos del menú del panel              | Una colección sin `admin.group`: Payload la mete en «Colecciones», el grupo por defecto, sin decir nada | `src/collections/grupos.test.ts`                           | CI, en cada push |
| Unicidad de slug entre colecciones     | Un artículo y una página institucional con el mismo slug, que se taparían en la raíz (ADR 0008)         | hook `slugUnicoEntreColecciones` + su prueba               | CI y escritura   |
| Destino de un redirect                 | Un 301 hacia una URL que no corresponde a ninguna ruta construida: un 301 hacia un 404                  | `src/lib/redirects/destino.ts` + `npm run redirects:check` | CI y a mano      |
| Marcador `dev` en `payload_migrations` | Un push de esquema de desarrollo que dejaría el build «Ready» sin migrar (§10.9)                        | `npm run db:check`, antes de `payload migrate`             | En cada build    |
| Versión exacta de Next y Payload       | Un rango (`^3.86.0`) que deriva en silencio a una versión que nadie verificó con este panel             | `src/lib/deps/versiones-fijas.test.ts`                     | CI, en cada push |

**Los dos primeros son literalmente el mismo patrón:** una lista declarada y una
lista real, y una prueba que exige que coincidan.

#### ¿Y quién vigila al vigilante? (auditado el 2026-09-21)

**Un guardarraíl que no falla nunca puede estar roto y parecer sano.** Auditados
los seis, uno por uno:

| Guardarraíl             | ¿Se comprueba que FALLA cuando debe?                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cobertura del sitemap   | **Sí**: una ruta inventada que debe salir como no cubierta                                                                                         |
| Grupos del menú         | **Sí**: una colección sin grupo, y un grupo sin icono                                                                                              |
| `settingsMenu`/carpetas | **Sí**: objetos inventados que fijan qué cuenta como «configurado»                                                                                 |
| Unicidad de slug        | **Sí, por construcción**: la prueba tiene casos que **rechazan** y casos que **aceptan**, así que un hook que dijera siempre «no» también fallaría |
| Destino de un redirect  | **Sí, por construcción**: además de los destinos válidos, hay casos que **deben** rechazarse (un nivel de más, una rama inventada)                 |
| Versión exacta          | **Sí**: un rango (`^16.3.5`, `>=16.2.6`) debe reconocerse como rango                                                                               |
| Marcador `dev`          | **Sí, tras refactorizarlo**. Ver abajo                                                                                                             |

**El caso del marcador `dev` merece explicación, porque es el único que corta un
build.** Probar que corta exigiría **plantar el marcador en una base real**: un
efecto secundario sobre `production`, `preview` o `development`, justo lo que el
guardián existe para evitar. La salida fue separar la **decisión** del **acceso a
datos**: `src/lib/db/veredictoMigraciones.ts` es una función pura que recibe las
filas y devuelve el veredicto, y `scripts/db/check-migrations.ts` se queda con la
consulta y el mensaje. Las pruebas cubren que **aborta** con el marcador
presente, incluido el caso en que `batch` llega como **cadena** `"-1"` —el driver
lo hace, y `"-1" === -1` es `false`—, y que **no** confunde el batch 0 ni un −2.

**Y hay una demostración en vivo, que no se buscó:** `npm run db:check` contra
`development` **aborta con código 1**, porque esa base lleva el marcador desde el
incidente de §10.9. El guardián no es teórico: se le ve cortar.

**Lo que queda sin cubrir por pruebas, dicho claro:** la consulta SQL y el
`to_regclass` del script. Eso es acceso a datos, no criterio, y comprobarlo
exigiría una base.

**Lo que NINGUNO cubre:** todos corren antes de que exista el despliegue, así que
no ven lo que solo falla en tiempo de petición. Ese hueco sigue abierto y su
propuesta está en §10.20.

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
>
> **Y cuando llegue el diseño del sitio, este arreglo tiene un candidato mejor
> (anotado el 2026-09-21).** El CLI del cliente publica `partequipos-logo` y
> `partequipos-wordmark` (§10.27): SVG, **un fichero y cero dependencias cada
> uno**, con los colores por props, ya en uso en el panel y **verificados
> pintados en los dos modos**. Sustituirlos aquí quitaría de un golpe **tres
> dependencias del PNG del Blob**: la cabecera de todas las páginas, el logo del
> JSON-LD `Organization` y la imagen social por defecto.
>
> **NO se hace ahora, por decisión de dirección:** el diseño del sitio público es
> trabajo del diseñador y rehacer la cabecera dos veces no tiene sentido. Las dos
> cosas se resuelven en la misma tanda, porque son la misma: el día que se toque
> la cabecera se decide si el logo va por `Media` o por componente.
>
> **Un matiz que hay que tener presente ese día:** un SVG en línea **no sirve
> para el JSON-LD ni para la imagen social**. `Organization.logo` y el
> `og:image` exigen una **URL de imagen** que un rastreador pueda descargar, así
> que esos dos seguirían necesitando un fichero —PNG o SVG servido— aunque la
> cabecera pase a componente. El componente solo resuelve lo que se pinta en el
> navegador.

### 10.11 PENDIENTE PRE-LANZAMIENTO · PRIORIDAD ALTA — claves de producción

> **Los formularios públicos están hoy SIN PROTECCIÓN ANTI-SPAM en producción, y
> las solicitudes NO se notifican.** Nada de esto puede seguir así el día que el
> sitio se abra a buscadores.
>
> Comprobado el 2026-08-12 con `vercel env ls production`: el proyecto solo tiene
> `DATABASE_URI`, `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN` y
> `NEXT_PUBLIC_SERVER_URL`. Faltan las tres de abajo.

**1. Turnstile — `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`.**

> **MEDIDO EN PRODUCCIÓN, no inferido (2026-09-17).** Se inspeccionó el DOM de
> `https://partequipos.vercel.app/contactanos/`: **no existe ningún nodo del
> widget de Turnstile**, ni contenedor propio ni `iframe` de
> `challenges.cloudflare.com`. Antes esto se deducía de que faltaban las
> variables de entorno; ahora está comprobado sobre la página pintada, que es el
> nivel que exige §10.14.
>
> Consecuencia exacta: **el formulario de contacto —el único punto del sitio por
> donde entran datos de terceros— acepta envíos sin ninguna barrera anti-bot**, y
> cada envío escribe en `solicitudes`, la única colección con datos personales
> (nombre, correo y teléfono). Sumado a la falta de `RESEND_API_KEY`, un envío
> entra sin verificar y sin que nadie reciba aviso.

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

    **CORRECCIÓN 2026-09-22 — el «99» NO es una cifra de Lighthouse, y se
    estaba citando como si lo fuera.** Iba camino de una reunión con el cliente,
    así que conviene que quede escrito con los números al lado.

    | Cómo se mide                                      | Puntuación         | LCP               |
    | ------------------------------------------------- | ------------------ | ----------------- |
    | Navegador real, ventana visible (esta línea base) | «99» (de ahí sale) | 384–800 ms        |
    | **Lighthouse móvil sobre producción**, 3 corridas | **73 · 90 · 83**   | 4,2 · 3,3 · 4,0 s |

    Las dos son válidas y **miden cosas distintas**: Lighthouse emula un móvil
    con red lenta y CPU frenada; el navegador real mide esta máquina con fibra.
    La cifra que el cliente va a reconocer —y la que usaría cualquier auditoría
    suya— es la de Lighthouse.

    **Y una advertencia de método que vale para las dos:** entre corridas del
    **mismo** código la puntuación se movió **17 puntos** (73 a 90) y el LCP casi
    un segundo. Una sola corrida no es una medición (§10.24): hay que dar
    mediana y rango, y comparar siempre en la misma máquina y condiciones.

    Con el hero del diseño puesto, la comparación controlada —misma máquina,
    build local, 3 corridas por lado, única variable el hero— dio **96 → 87** de
    mediana y el LCP pasando de texto (2,2 s) a la **imagen de fondo** (3,75 s).
    Detalle en `docs/design-tokens.md` §11.

15. **Icono cuadrado de la marca (favicon).** El único recurso gráfico que
    tenemos es el logotipo, de **1614 × 317** — una tira horizontal. Sirve para
    la cabecera y para el panel, pero **no para un favicon**: recortarlo daría
    un fragmento de letra sin sentido.

    Hoy el panel emite el logo como icono y el navegador acaba usando el
    `favicon.ico` que trae el andamiaje. No es un fallo, pero es lo primero que
    ve el cliente en la pestaña.

    Hace falta un **icono cuadrado** (ideal: SVG, o PNG de 512 × 512 con
    márgenes) del cliente o del diseñador. No se fabrica recortando el logo.
