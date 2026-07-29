# Partequipos.com

Migración del sitio de catálogo de maquinaria pesada, repuestos y servicios.

- **Stack:** Next.js 16 (App Router) · TypeScript estricto · Payload 3 · PostgreSQL (Neon) · Tailwind · Vercel Blob
- **Contexto y reglas del proyecto:** [`CLAUDE.md`](./CLAUDE.md) — es la fuente de verdad
- **Decisiones técnicas:** [`docs/decisions/`](./docs/decisions/) (ADR, una por archivo)

---

## 1. Levantar en local

Requisitos: **Node.js ≥ 20.9** (probado en 24) y una base PostgreSQL (Neon).

```bash
npm install
cp .env.example .env.local     # y rellenar los valores (ver §2)
npm run dev                    # http://localhost:3000
```

El panel del CMS está en **`/admin`**. La primera vez pide crear el usuario
administrador.

### Comandos

| Comando                  | Qué hace                                                 |
| ------------------------ | -------------------------------------------------------- |
| `npm run dev`            | Servidor de desarrollo                                   |
| `npm run build`          | Compilación de producción                                |
| `npm start`              | Sirve la compilación de producción                       |
| `npm run lint`           | ESLint                                                   |
| `npm run typecheck`      | `tsc --noEmit`                                           |
| `npm test`               | Tests unitarios (`node:test`)                            |
| `npm run format`         | Prettier                                                 |
| `npm run generate:types` | Regenera `src/payload-types.ts` tras tocar una colección |
| `npm run import`         | Importa los CSV de `scripts/import/data` (idempotente)   |
| `npm run crawl`          | Rastrea el sitio actual y actualiza `docs/url-map.csv`   |
| `npm run migrate*`       | Migraciones de base de datos (ver §3)                    |

> **Importante:** `npm run build` **no** ejecuta el linter (cambió en Next 16).
> El control de calidad son comandos separados: `lint`, `typecheck`, `format:check`
> y `test`. Los corre el CI en cada push y PR (§5).

---

## 2. Variables de entorno

Nunca se versionan valores reales. La plantilla es [`.env.example`](./.env.example);
en local se copia a `.env.local` (ignorado por git) y en Vercel se cargan en el
panel del proyecto.

| Variable                                                  | Local (`.env.local`)    | Preview (Vercel) | Producción (Vercel)       |
| --------------------------------------------------------- | ----------------------- | ---------------- | ------------------------- |
| `DATABASE_URI`                                            | rama **dev** de Neon    | rama **preview** | rama **producción**       |
| `PAYLOAD_SECRET`                                          | cualquiera, largo       | propio           | **propio y distinto**     |
| `NEXT_PUBLIC_SERVER_URL`                                  | `http://localhost:3000` | URL del preview  | `https://partequipos.com` |
| `BLOB_READ_WRITE_TOKEN`                                   | store de pruebas        | store de pruebas | store de producción       |
| `NEXT_PUBLIC_SENTRY_DSN`                                  | opcional                | sí               | sí                        |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT`     | opcional                | sí               | sí                        |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | opcional                | sí               | sí                        |

Reglas:

- **`DATABASE_URI` debe ser la cadena _pooled_ de Neon** (el host contiene
  `-pooler`). La conexión directa satura los límites en serverless.
- **Cada entorno usa su propia rama de base de datos.** Los datos de demo son
  semilla de desarrollo, no contenido real: producción arranca vacía.
- `PAYLOAD_SECRET` distinto por entorno: filtrar el de producción invalidaría
  todas las sesiones del panel.

---

## 3. Migraciones de base de datos

**Por qué existen:** el esquema **no** se sincroniza solo en producción. En
desarrollo Payload hace _push_ (compara y altera el esquema en caliente), pero
eso no tiene control de versiones ni marcha atrás, así que está **desactivado en
producción** (`push: process.env.NODE_ENV !== "production"` en
`src/payload.config.ts`).

Las migraciones viven en **`src/migrations/`** y **se versionan en el repo**.

### Al cambiar una colección

```bash
# 1. Editas la colección en src/collections/…
npm run generate:types                  # actualiza payload-types.ts
npm run migrate:create -- nombre-corto  # genera src/migrations/<fecha>_nombre-corto.ts
git add src/migrations src/payload-types.ts
```

Revisa el SQL generado antes de commitear: es código que se ejecutará contra la
base de producción.

### Aplicar migraciones

```bash
npm run migrate:status   # qué hay pendiente
npm run migrate          # aplica las pendientes
npm run migrate:down     # revierte el último lote
```

En el despliegue se aplican **antes** de que arranque la nueva versión. En Vercel
se configura como _Build Command_:

```
npm run migrate && npm run build
```

> **Ojo con la migración inicial:** genera `CREATE TABLE` sin `IF NOT EXISTS`, así
> que está pensada para una base **vacía** (la rama de producción recién creada).
> La base de desarrollo ya tiene el esquema aplicado por _push_, por lo que ahí no
> debe ejecutarse.

---

## 4. Despliegue

- **Hosting:** Vercel. `main` despliega a producción; cada rama genera un preview.
- **Variables:** se cargan en el panel de Vercel por entorno (§2). Nunca en el repo.
- **Build Command:** `npm run migrate && npm run build` (aplica migraciones antes
  de compilar).
- **Base de datos:** una rama de Neon por entorno.

### Antes de dar un despliegue por bueno

1. `/admin` carga y permite autenticarse.
2. Subir una imagen a `Media` funciona (va a Vercel Blob, no a disco).
3. Las páginas de catálogo renderizan.
4. El proxy de redirects responde `301` en una URL con redirect.
5. Sentry recibe errores de servidor y de cliente.

---

## 5. Integración continua

`.github/workflows/ci.yml` se ejecuta en **cada push a `main` y en cada PR**.
Existe porque en Next 16 `next build` ya no ejecuta el linter (ADR 0001): sin
esto, un error de lint o de tipos llegaría a `main` sin que nadie lo note.

Valida cuatro cosas, en este orden:

| Paso    | Comando                | Qué falla si se rompe                         |
| ------- | ---------------------- | --------------------------------------------- |
| Tipos   | `npm run typecheck`    | `any` implícito, tipo incorrecto, import roto |
| Lint    | `npm run lint`         | reglas de ESLint (incluye `any` y `console`)  |
| Formato | `npm run format:check` | archivo sin pasar por Prettier                |
| Tests   | `npm test`             | tests unitarios de `src/**/*.test.ts`         |

**No necesita secretos ni base de datos**: los cuatro pasos corren sin conexión
(verificado ejecutándolos sin `.env.local`). Si algún día un paso necesitara
credenciales, hay que discutirlo antes de añadir secretos al repositorio.

**El build no corre en CI a propósito.** Vercel lo ejecuta en cada despliegue —
duplicarlo sumaría ~2 minutos por ejecución para detectar lo mismo un rato antes.
Lo que el build detectaría y el CI no (un fallo de compilación) aparecería igual
en el preview del PR, antes de fusionar. Si en el futuro se despliega fuera de
Vercel, habría que añadirlo.

**La versión de Node se fija una sola vez**, en `.nvmrc` (+ `engines.node` en
`package.json`). Vercel y el CI leen de ahí, así que no pueden divergir.

**El repositorio es privado.** Dos consecuencias prácticas:

- Las ejecuciones del CI **consumen los minutos de Actions del plan de GitHub**
  (en repos públicos serían gratis). De ahí que el workflow no ejecute el build
  —lo hace Vercel— y que use `concurrency` con `cancel-in-progress`, para no
  gastar minutos en ejecuciones que ya quedaron obsoletas.
- El estado del CI **no se puede consultar sin credenciales**: ni por la API
  pública ni por enlace anónimo. Se revisa desde la pestaña **Actions** del repo
  o con `gh run list` autenticado.

> **Cuidado al regenerar `package-lock.json` desde Windows.** El CI corre en
> Linux, y `npm install --package-lock-only` re-resuelve el árbol para la
> plataforma actual: descarta entradas que la resolución de Linux necesita
> (`@emnapi/runtime`, `@emnapi/core`, dependencias wasm de `sharp` y
> `@tailwindcss/oxide`) y el paso de instalación falla con `EUSAGE — Missing:
… from lock file`, **aunque en local funcione**. Si hay que rehacer el lock:
>
> ```bash
> rm package-lock.json && rm -rf node_modules && npm install
> ```

### Si el CI falla

Reproduce el mismo paso en local; son los mismos comandos:

```bash
npm run typecheck     # errores de tipos
npm run lint          # o `npm run lint:fix` para lo autocorregible
npm run format:check  # o `npm run format` para arreglarlo
npm test
```

Casi siempre es formato: `npm run format` y volver a commitear. No fusiones un PR
con el CI en rojo — la rama `main` debe estar siempre desplegable (CLAUDE.md §6).

---

## 6. Estructura

```
src/
  app/(site)/        sitio público
  app/(payload)/     panel del CMS (generado por Payload)
  collections/       colecciones de Payload + hooks
  components/        catalog/ · seo/ · ui/ · layout/
  lib/
    queries/         acceso a datos (API local de Payload)
    seo/             metadata y JSON-LD
    redirects/       normalización y protección de bucles
    fields/          campos reutilizables (slug, SEO)
  migrations/        migraciones versionadas (generadas)
  proxy.ts           redirects 301/302 en el borde
scripts/
  import/            CSV → Payload (idempotente)
  crawl/             rastreo del sitio actual
docs/
  url-map.csv        mapa de URLs del sitio actual
  decisions/         ADR
```
