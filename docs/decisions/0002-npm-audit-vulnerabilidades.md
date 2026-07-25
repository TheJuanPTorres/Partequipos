# ADR 0002 — Vulnerabilidades de `npm audit` tras integrar Payload

- **Estado:** Aceptada (riesgo asumido conscientemente, con revisión periódica)
- **Fecha:** 2026-07-25
- **Decisión tomada por:** Dirección técnica
- **Relacionado:** [[0001-version-nextjs]] (adopción de Next.js 16)

## Contexto

Tras integrar Payload 3.86 y su cadena de dependencias (Drizzle, monaco-editor,
sharp, etc.), `npm audit` reporta **19 advisories**:

| Ámbito                         | Totales                                        |
| ------------------------------ | ---------------------------------------------- |
| Todo el árbol                  | 19 (12 high · 6 moderate · 1 low · 0 critical) |
| Solo producción (`--omit=dev`) | 10 (3 high · 6 moderate · 1 low)               |
| Solo desarrollo                | 9                                              |

Antes de Payload (fin de la tarea 0.1) eran solo 3, todas heredadas de Next
(`postcss`×2 + `sharp`). El aumento proviene del árbol de Payload, no de código
propio.

## Decisión

**No ejecutar `npm audit fix --force`.** Su resolución "automática" propone
cambios que rompen el proyecto:

- Degradar **`next` a la v9.3.3** (para "arreglar" `postcss`/`sharp` internos de
  Next) — una regresión de ~6 años, incompatible con App Router, React 19 y todo
  el stack aprobado.
- Degradar/actualizar **`eslint` a la v10** como breaking change (para la cadena
  `brace-expansion` → `minimatch`).

Ninguna dependencia vulnerable es de primer nivel del proyecto: todas son
transitivas de `next`, `eslint-config-next` o `@payloadcms/*`. No hay un parche
sano aplicable hoy sin degradar el framework.

## Análisis del riesgo real

### Runtime (árbol de producción)

- **`postcss` (high)** — versión empaquetada por `next@16.2.11`. Los advisories
  (XSS por `</style>`, lectura de archivos vía `sourceMappingURL`) aplican al
  **procesar CSS controlado por un atacante**. En este proyecto el CSS lo
  escribimos nosotros; no se procesa CSS de terceros. Exposición baja.
- **`sharp` (high)** — CVEs heredados de libvips al procesar imágenes. Relevante
  solo si el optimizador procesa **imágenes no confiables**. Las imágenes entran
  por el panel `/admin` (autenticado) hacia Vercel Blob, no desde entrada anónima.
  Exposición baja.
- **`dompurify` (moderate)** — llega vía `monaco-editor`, que solo se carga en el
  **navegador del administrador** dentro de `/admin` (editor de campos). No forma
  parte del bundle público del sitio. Exposición limitada a usuarios ya
  autenticados del CMS.
- **`esbuild` (moderate)** — vía `drizzle-kit` bajo `@payloadcms/db-postgres`. El
  advisory afecta **solo al dev-server de esbuild** (permite que un sitio web haga
  peticiones al servidor de desarrollo). **No afecta el runtime de producción**;
  `drizzle-kit` se usa para push de esquema/migraciones, no en el request path.

### Solo desarrollo (no se despliega)

- **`brace-expansion` → `minimatch` (high)** — cadena de **tooling de ESLint**
  (`eslint`, `eslint-config-next`, `eslint-plugin-*`). Es un DoS por expansión no
  acotada. Solo corre en `npm run lint` en local/CI; **no llega al artefacto
  desplegado**. Riesgo efectivo nulo en producción.

Conclusión: las de mayor severidad nominal (`high`) son, o bien de **tooling de
desarrollo** (`brace-expansion`), o bien internas de Next con **superficie de
ataque baja** en nuestro uso (`postcss`, `sharp`). No hay ninguna `critical`.

## Plan

- **No forzar** el fix. Esperar a que **Next.js** y **eslint-config-next**
  actualicen sus dependencias internas (`postcss`, `sharp`, cadena `minimatch`) en
  versiones de parche.
- **Revisar `npm audit` en cada actualización de Next** (`npm update next` /
  bumps de `@payloadcms/*`) y actualizar este ADR si el panorama cambia.
- Si en el futuro apareciera una `critical` o una `high` con superficie real en el
  request path público, se reevalúa de inmediato (posible override puntual de
  versión con `overrides` en `package.json`).

## Consecuencia

Las 19 advisories quedan **aceptadas conscientemente por ahora**. No se ejecuta
`npm audit fix --force`. El estado se revisa en cada actualización de Next.
