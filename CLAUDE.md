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

Volumen: ~470 URLs públicas, generadas desde ~22 componentes de ruta.

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

- **Fase:** MVP · Sprint 0
- **Plan vigente:** `docs/PLAN-MVP.md`
- **Base del repo:** inicializada con Next.js 16.2.11 (App Router, TS strict,
  Tailwind v4, ESLint + Prettier). Ver ADR `docs/decisions/0001-version-nextjs.md`.
- **Decisión pendiente y bloqueante:** hosting definitivo (Vercel vs. infraestructura
  del cliente). Ver `docs/decisions/`.

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
