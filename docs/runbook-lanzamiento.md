# Runbook de lanzamiento — partequipos.com

> **Qué es:** el orden de pasos para que `partequipos.com` deje de servir el
> WordPress y pase a servir este sitio sin perder tráfico orgánico (§1 de
> `CLAUDE.md`).
>
> **Quién ejecuta:** cada paso lo indica: **dirección**, **cliente** o
> **agente**. Toda escritura en producción la hace dirección (§9).
>
> **Comandos:** en PowerShell, con `curl.exe` (no el alias `curl`).
>
> **Secretos:** este documento nombra **variables**, nunca valores. Los valores
> se pegan en el panel de Vercel, no en un fichero ni en la terminal.
>
> **Regla de cada paso:** comprobación previa de solo lectura, acción y
> comprobación final. Si la previa no da lo esperado, **no se sigue**.

**Ejecución en seco del 2026-10-03:** lo que se pudo comprobar hoy sin escribir
en producción está en el recuadro «En seco» de cada paso. El resumen está al
final, en «Resultado de la ejecución en seco».

---

## a) Requisitos previos del cliente

**BLOQUEA** significa que sin ese requisito no se lanza.

| #   | Requisito                                                             | Bloquea                         | Por qué                                                                                                                                                          | Quién                     |
| --- | --------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1   | **Vercel Pro**                                                        | **BLOQUEA**                     | Hobby es para uso personal y no comercial, y bloquea los despliegues si el repositorio vuelve a ser privado (§10.4, §10.33). Está presupuestado en la cotización | Cliente                   |
| 2   | **Base de datos definitiva, accesible desde internet y con pooler**   | **BLOQUEA**                     | §10.7: Vercel sale con IP variable; sin pooler, el build (~3.600 consultas desde 11 procesos) agota las conexiones                                               | Cliente                   |
| 3   | **Almacén de Vercel Blob de producción** en la cuenta definitiva      | **BLOQUEA** si cambia de cuenta | Hoy existe en la nuestra. Si el proyecto pasa a la cuenta del cliente, hace falta un almacén nuevo y volver a subir las imágenes                                 | Cliente y dirección       |
| 4   | **Claves de Turnstile** del dominio `partequipos.com`                 | **BLOQUEA**                     | Sin ellas el formulario de contacto acepta cualquier envío (§10.11). Hoy no hay ninguna en Vercel                                                                | Cliente                   |
| 5   | **Resend** (clave y dominio verificado) **o SMTP**                    | **BLOQUEA**                     | Sin aviso, los leads solo se ven entrando en `/admin` (§10.11)                                                                                                   | Cliente                   |
| 6   | **Sentry** (organización a su nombre, plan Team y región)             | No técnicamente                 | El sitio funciona sin Sentry, pero es un **compromiso contractual sin cumplir** (§10.31). Lanzar sin él lo decide dirección por escrito                          | Cliente; decide dirección |
| 7   | **Token de Mapbox** (`NEXT_PUBLIC_MAPBOX_TOKEN`)                      | No                              | Sin token, la sección de sedes muestra la lista y no el globo                                                                                                    | Cliente                   |
| 8   | **Acceso al DNS** de `partequipos.com` (hoy en GoDaddy)               | **BLOQUEA**                     | Sin él no hay cambio de dominio. Hace falta alguien con acceso el día del cambio **y** 48 h antes, para bajar el TTL                                             | Cliente                   |
| 9   | **Textos legales definitivos**                                        | **BLOQUEA**                     | Los actuales son marcadores sin validez jurídica (§10.6)                                                                                                         | Cliente                   |
| 10  | **Contenido real**: CSV, imágenes y acceso a WordPress                | **BLOQUEA**                     | Sin él, 447 de las 618 URLs que se conservan darían 404 (ver «En seco» del paso f)                                                                               | Cliente                   |
| 11  | **Decisión sobre las 14 URLs pendientes y las 4 de maquinaria vivas** | **BLOQUEA**                     | Si no se decide nada, el día del cambio pasan a 404 (`docs/redirects-cobertura.md` §3 y §4)                                                                      | Cliente                   |
| 12  | **Licencias L1–L5** o retirada de §10.38                              | **BLOQUEA**                     | Paso c                                                                                                                                                           | Cliente y dirección       |
| 13  | Razón social, NIT, redes y teléfono (§10.3 p.1–4)                     | No                              | El JSON-LD `Organization` sale sin esos campos, sin error                                                                                                        | Cliente                   |
| 14  | Icono cuadrado para el favicon (§10.3 p.15)                           | No                              | Se ve en la pestaña; no afecta al SEO                                                                                                                            | Cliente o diseñador       |

**Comprobación previa (dirección):** cada fila marcada **BLOQUEA** tiene una
respuesta escrita del cliente, guardada fuera del repositorio.

> **En seco (2026-10-03):**
>
> - **DNS:** servidores de nombres `ns01/ns02.domaincontrol.com` (GoDaddy). El apex da `A 45.89.205.198` (LiteSpeed y PHP: el WordPress), y `www` es `CNAME` a `partequipos.com`.
> - **Correo en Microsoft 365:** `MX partequipos-com.mail.protection.outlook.com`. Hay además registros `TXT` de SPF y de verificación de Microsoft, **Resend**, Brevo y MailerLite. **Ninguno de esos se toca en el paso g.**
> - **Resend:** ya hay un `TXT resend-domain-verification` en el dominio. Puede que el cliente ya tenga el dominio verificado en una cuenta de Resend: preguntárselo antes de crear otra.
> - **Variables de Vercel hoy** (solo nombres):
>   - **Production:** `DATABASE_URI`, `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SERVER_URL`, `BLOB_STORE_ID`.
>   - **Preview:** las mismas.
>   - **Ninguna de Turnstile, Resend, Sentry, Mapbox ni indexación.**

---

## b) Base nueva: migrar desde cero, `db:check` y carga del contenido real

**Quién:** dirección (es producción). El agente prepara la consulta de
estructura y revisa las salidas.

1. **Previa: la base está vacía.** En la consola SQL de la base nueva:

   ```sql
   SELECT to_regclass('public.payload_migrations') AS migraciones,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS tablas;
   ```

   Esperado: `migraciones` vacío y `tablas` = 0. **Si hay tablas, se para:** la
   migración inicial hace `CREATE TABLE` sin `IF NOT EXISTS` (§10.4).

2. **Cadena de conexión:** la **pooled** (§10.7). Se pega en Vercel
   (`DATABASE_URI`, Production; paso d), nunca en la terminal del agente.

3. **Migrar.** No hace falta lanzarlo a mano: el Build Command
   (`npm run deploy:migrate && npm run build`) corre `db:check` y después
   `payload migrate` en el primer despliegue con la base nueva.
   - **Final:** el registro del build dice `Migrated:` para **todas** las de `src/migrations` (hoy 21 ficheros `.ts`), y `db:check` no encuentra el marcador `dev`.
   - **Estructura:** la consulta de §10.34, generada desde el último snapshot, da **0 filas** contra la base nueva. La genera el agente (`consultaEstructura` de `src/lib/db/estructuraSnapshot.ts`) y la ejecuta dirección en la consola SQL de la base nueva. Es solo lectura.

4. **Primer usuario:** en `https://<despliegue>/admin/` se crea la cuenta. El
   gancho `primerUsuarioEsAdministrador` la hace administradora (§10.17).
   - **Final:** `npm run rol`, con `DATABASE_URI` de la base nueva fijada en la sesión de dirección, lista **1 administrador**.

5. **Contenido real:**
   - CSV del cliente con `npm run import`, que también carga los 10 redirects de `scripts/import/data/redirects.csv`.
   - WordPress: artículos y páginas. **No hay importador todavía**: depende del acceso del cliente (a, fila 10).
   - **No ejecutar `npm run seed:paginas`**: siembra textos de relleno (§10.6).
   - **Final:** `npm run redirects:check:estricto` sale con código 0, con **0 `sin-ruta`** y 0 avisos.

6. **Redesplegar sin caché de build.** Sembrar desde un script no refresca lo
   prerenderizado (§10.6).
   - **Final:** `npm run db:check` sigue limpio y la prueba de humo del despliegue sale en verde.

> **En seco:** no aplicable hoy (no existe la base definitiva). La vía
> «migrar desde cero» sí está probada **en cada PR**: el job de CI aplica todas
> las migraciones a un Postgres 17 vacío y exige 0 filas (§10.25).

---

## c) Retirar §10.38 o confirmar las licencias

**Quién:** dirección. **Bloquea** todo lo que sigue.

Hay dos salidas, y hay que elegir una:

- **Retirada:** se ejecuta `Desktop\partequipos-cierre\runbook-retirada-demo-produccion.md`. Deshace exactamente la copia y está probado de punta a punta (§10.38, PR #31).
  - **Previa:** el manifiesto de la copia existe y lista los ficheros.
  - **Final:** los ficheros del manifiesto dan **404** en el Blob (`curl.exe -s -o NUL -w "%{http_code}" <url>`, **pasados 60 s**: §10.32), y la home pinta sin huecos.
- **Confirmación escrita de las licencias** L1–L5, los logos de fabricantes y la autorización de los testimonios. Se guarda fuera del repositorio y se anota en §10.38 como **cerrada**.

**Contenido de EJEMPLO:** se retira **en los dos casos**. Son las fichas
«EJEMPLO UX-9 —», los testimonios, las sedes y las preguntas: la retirada lo
quita con `ejemplo` del manifiesto.

- **Final:** la orden siguiente da `"totalDocs":0`. Con `-g`, para que `curl.exe` no interprete los corchetes:

  ```powershell
  curl.exe -sg "https://partequipos.com/api/equipos-usados/?limit=0&where[descripcion][like]=EJEMPLO"
  ```

---

## d) Variables de entorno por entorno (solo nombres)

**Quién:** dirección, en Vercel → Settings → Environment Variables.

| Variable                          | Production                       | Preview             | Nota                                                                                       |
| --------------------------------- | -------------------------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URI`                    | base definitiva, **pooled**      | rama de preview     | Distinta en cada entorno (§10.21)                                                          |
| `PAYLOAD_SECRET`                  | propio                           | propio, distinto    | Compartido, un token de preview valdría en producción                                      |
| `BLOB_READ_WRITE_TOKEN`           | almacén de producción            | almacén del preview | La guarda del almacén lo comprueba (§10.37)                                                |
| `NEXT_PUBLIC_SERVER_URL`          | **`https://partequipos.com`**    | el mismo            | **Hoy vale `https://partequipos.vercel.app`** (ver «En seco»). Cambiarlo exige redesplegar |
| `NEXT_PUBLIC_PERMITIR_INDEXACION` | `true` **solo en el paso e**     | **nunca**           | En Preview haría indexable cada preview                                                    |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`  | clave real                       | **sin valor**       | Sin valor caen las de prueba de Cloudflare, que es lo deseado en preview (§10.11)          |
| `TURNSTILE_SECRET_KEY`            | clave real                       | **sin valor**       | Igual                                                                                      |
| `RESEND_API_KEY`                  | clave real                       | **sin valor**       | En preview, cada prueba de formulario escribiría al correo real del cliente                |
| `RESEND_FROM_EMAIL`               | dirección del dominio verificado | —                   |                                                                                            |
| `RESEND_FROM_NAME`                | opcional                         | —                   |                                                                                            |
| `SOLICITUDES_EMAIL_TO`            | buzón comercial del cliente      | —                   | Si falta, cae al correo público de `seoConfig`                                             |
| `NEXT_PUBLIC_MAPBOX_TOKEN`        | token del cliente                | el mismo, o ninguno | Opcional                                                                                   |
| `SENTRY_DSN` y su token           | cuando exista (§10.31)           | —                   | No existen todavía. Será `SENTRY_DSN` y no `NEXT_PUBLIC_…`                                 |
| `BLOB_STORE_ID`                   | lo gestiona Vercel               | lo gestiona Vercel  | No se toca                                                                                 |

**Previa:** `npx vercel env ls` lista los nombres y los entornos, sin valores.

**Final:**

- La misma orden muestra cada variable de la tabla en su entorno.
- **Ninguna de Turnstile ni de Resend está en Preview.**
- Las `NEXT_PUBLIC_*` solo cambian tras **redesplegar**: se incrustan en el build.

> **En seco (2026-10-03):** el canónico de la portada de producción es
> `https://partequipos.vercel.app/` y el sitemap lista 198 URLs de ese mismo
> host. O sea, **`NEXT_PUBLIC_SERVER_URL` de producción no es
> `https://partequipos.com`**, como decía la tabla del README §2.
>
> - **Hoy es correcto:** el sitio de demostración no debe apuntar su canónico al WordPress.
> - **El día del lanzamiento es imprescindible cambiarlo.** Sin el cambio, el canónico, el `og:url`, el JSON-LD y el sitemap mandarían a Google a `vercel.app`.

---

## e) Quitar el `noindex`: sitemap y robots

**Quién:** dirección. Va **después** del paso g, con el dominio sirviendo ya
este sitio: abrir antes indexaría `partequipos.vercel.app`.

1. **Previa:** las tres vías del bloqueo, activas (README §7):

   ```powershell
   $D = "https://partequipos.com"
   curl.exe -sI "$D/" | Select-String -Pattern "x-robots-tag"          # noindex, nofollow, noarchive
   curl.exe -s  "$D/robots.txt"                                         # Disallow: /
   curl.exe -s  "$D/" | Select-String -Pattern 'name="robots"'          # noindex
   ```

2. **Acción:** `NEXT_PUBLIC_PERMITIR_INDEXACION=true` en **Production** y redesplegar.

3. **Final:**

   ```powershell
   curl.exe -sI "$D/" | Select-String -Pattern "x-robots-tag"          # nada
   curl.exe -s  "$D/robots.txt"                                         # Allow: /, Disallow: /admin y /api/, Sitemap: https://partequipos.com/sitemap.xml
   curl.exe -s  "$D/" | Select-String -Pattern 'name="robots"'          # sin noindex
   curl.exe -s  "$D/" | Select-String -Pattern 'rel="canonical"'        # https://partequipos.com/
   (curl.exe -s "$D/sitemap.xml" | Select-String -Pattern "<loc>https://partequipos.com/" -AllMatches).Matches.Count
   ```

   El último recuento tiene que ser **al menos** las 618 conservadas que tengan contenido. Ninguna `<loc>` puede llevar `vercel.app`.

> **En seco (2026-10-03), contra `partequipos.vercel.app`:**
>
> - `X-Robots-Tag: noindex, nofollow, noarchive`.
> - `robots.txt` con `Disallow: /` y sin `Sitemap:`.
> - `<meta name="robots" content="noindex, nofollow, nocache">`.
> - `Strict-Transport-Security: max-age=31536000`.
> - El sitemap sirve 198 `<loc>`.
>
> Las tres vías del bloqueo están activas, como deben.

---

## f) Redirects 301: comprobación automática contra `docs/url-map.csv`

**Quién:** el agente la ejecuta y dirección la revisa. **Solo hace GET**: no
escribe nada.

```powershell
$env:LANZAMIENTO_BASE = "https://partequipos.com"
$env:LANZAMIENTO_ESTRICTO = "true"
$env:LANZAMIENTO_INFORME = "$env:TEMP\lanzamiento-urls.json"
npm run lanzamiento:urls
```

Recorre las **648 URLs** del rastreo sobre el dominio indicado, siguiendo cada
redirect hasta 5 saltos sin dejar que `fetch` los siga solo. La decisión está en
`src/lib/lanzamiento/urlMap.ts`, con pruebas que comprueban que **falla** con un
404, un 302, un bucle, un destino equivocado o un 500.

| Clase (de `docs/redirects-cobertura.md`) | Cuántas | Qué exige                                              | Si no                          |
| ---------------------------------------- | ------: | ------------------------------------------------------ | ------------------------------ |
| Conservada                               |     618 | 200 directo (un 308 que solo pone la barra final vale) | **Bloquea**                    |
| Redirect cargado                         |      10 | 301 o 308 hasta **su** destino, y 200                  | **Bloquea**                    |
| Pendiente del cliente                    |      14 | Se informa                                             | No bloquea; es la fila 11 de a |
| Basura                                   |       6 | Se informa                                             | No bloquea                     |

Un **302, 303 o 307** en cualquier cadena bloquea: no transfiere autoridad.

**Criterio:** con `LANZAMIENTO_ESTRICTO=true` sale con código **0**. Se ejecuta:

1. contra el despliegue nuevo **antes** de cambiar el DNS, con `LANZAMIENTO_BASE` en la URL del despliegue de producción (`https://partequipos.vercel.app`);
2. otra vez **después** del paso g, contra `https://partequipos.com`.

> **En seco (2026-10-03), contra `https://partequipos.vercel.app`, con datos
> de demostración:**
>
> | Clase      | Resultado                                                                                 |
> | ---------- | ----------------------------------------------------------------------------------------- |
> | Conservada | **171 en 200** · **447 en 404**                                                           |
> | Redirect   | **10 de 10 en 301 de un solo salto**; 8 llegan a 200 y los 2 `-copy`, a un destino en 404 |
> | Pendiente  | 14 en 404                                                                                 |
> | Basura     | 6 en 404                                                                                  |
>
> - **Cero** 5xx, 302/307, bucles, cadenas o redirects inesperados.
> - **Los 447 son falta de contenido, no de rutas:** 362 son de repuestos (el demo tiene 81 de 351 modelos), 42 de maquinaria y 43 son artículos del blog.
> - **Los 2 `-copy`, igual:** su canónico no está entre los modelos del demo (`redirects-cobertura.md` §5).
> - **Conclusión de hoy:** el mecanismo de rutas y redirects funciona. Con el contenido real cargado (b.5), el recuento de conservadas en 200 tiene que llegar a 618.

---

## g) DNS y certificado, en el orden que evita la caída

**Quién:** el cliente (o quien tenga el DNS) toca GoDaddy, y dirección, Vercel.

> **Lo que NO se toca nunca:** `MX`, los `TXT` (SPF, Microsoft, Resend, Brevo,
> MailerLite) ni cualquier otro registro que no sea el `A` del apex y el
> `CNAME` de `www`. El correo de la empresa está en Microsoft 365 y depende de
> ellos.

1. **T − 48 h · bajar el TTL** del `A @` y del `CNAME www` a **300 s** (cliente).
   - **Previa:** anotar los valores actuales (`A 45.89.205.198`, `www CNAME partequipos.com`) y el TTL. Así se puede volver atrás.

     ```powershell
     nslookup -type=A partequipos.com ns01.domaincontrol.com
     nslookup -type=CNAME www.partequipos.com ns01.domaincontrol.com
     nslookup -debug partequipos.com ns01.domaincontrol.com | Select-String ttl
     ```

   - **Final:** la última orden da `ttl = 300`.

2. **T − 24 h · añadir los dominios al proyecto en Vercel** (dirección): `partequipos.com` y `www.partequipos.com`.
   - `www` se configura como **redirect permanente (301 o 308)** hacia el apex, igual que hoy en WordPress (`www` responde 301 a `https://partequipos.com/`).
   - Si Vercel pide verificar la propiedad, añade un `TXT _vercel`: se crea en GoDaddy (cliente) y **no sustituye a nada**.

3. **T − 24 h · pre-generar el certificado**, para que el HTTPS funcione desde el primer segundo ([documentación de Vercel](https://vercel.com/docs/domains/pre-generating-ssl-certs)):

   ```powershell
   npx vercel certs issue partequipos.com www.partequipos.com --challenge-only
   ```

   - El cliente crea en GoDaddy los `TXT _acme-challenge` que devuelve esa orden.
   - Cuando estén propagados: `npx vercel certs issue partequipos.com www.partequipos.com`.
   - **Final:** el sitio nuevo responde con su certificado **sin haber cambiado el DNS todavía**:

     ```powershell
     curl.exe -sI https://partequipos.com/ --resolve partequipos.com:443:<IP de Vercel>
     ```

     Esperado: `HTTP/1.1 200` con `x-vercel-id`. Las IP y el `CNAME` exactos son los que muestra el panel de Vercel al añadir el dominio.

4. **T − 2 h · despliegue de lanzamiento listo** (dirección):
   - `NEXT_PUBLIC_SERVER_URL=https://partequipos.com` y redesplegar (paso d).
   - **Final:**
     - prueba de humo en verde;
     - `npm run lanzamiento:urls` en estricto contra `https://partequipos.vercel.app`, con código 0;
     - el canónico de la portada es `https://partequipos.com/`.
   - **El bloqueo de indexación sigue activo** en este momento.

5. **T · cambio** (cliente, en GoDaddy):
   - `A @` → la IP de Vercel del panel.
   - `CNAME www` → el `CNAME` del panel (`cname.vercel-dns.com.` o el que indique).
   - Nada más.

6. **T + 5–15 min · comprobación final:**

   ```powershell
   nslookup -type=A partequipos.com ns01.domaincontrol.com     # la IP de Vercel
   nslookup -type=A partequipos.com 1.1.1.1                    # igual, cuando caduque el TTL
   curl.exe -sI https://partequipos.com/ | Select-String -Pattern "^HTTP|x-vercel-id|server"
   curl.exe -sI https://www.partequipos.com/ | Select-String -Pattern "^HTTP|location"   # 301/308 al apex
   nslookup -type=MX partequipos.com                          # SIGUE en outlook.com
   ```

   - Esperado: `x-vercel-id` presente y **ni** `Server: LiteSpeed` **ni** `X-Powered-By: PHP`.
   - **El WordPress no se apaga** hasta pasadas las 72 h del paso i: es la vuelta atrás.

---

## h) Prueba de humo del lanzamiento, Search Console y vuelta atrás

### Prueba de humo del lanzamiento (agente y dirección, justo después de g.6)

| #   | Comprobación               | Orden                                                                                   | Esperado                                    |
| --- | -------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | Humo del lambda            | `$env:HUMO_URL="https://partequipos.com"; $env:HUMO_ENTORNO="production"; npm run humo` | Las 5 rutas en 200                          |
| 2   | Las 648 URLs               | Paso f, en estricto, contra `https://partequipos.com`                                   | Código 0                                    |
| 3   | QA del HTML                | `$env:QA_BASE="https://partequipos.com"; npm run qa`                                    | 0 errores                                   |
| 4   | Robots, canónico y sitemap | Paso e, final (después de abrir la indexación)                                          | Todo `partequipos.com`                      |
| 5   | Formulario real            | Un envío desde `/contactanos/` con datos evidentes de prueba («PRUEBA LANZAMIENTO»)     | Pasa Turnstile, se guarda y llega el correo |
| 6   | Panel                      | `/admin/` con la cuenta de administración                                               | Entra                                       |
| 7   | Correo de la empresa       | Un correo cualquiera al buzón del cliente                                               | Llega (el MX no se tocó)                    |

El envío de prueba (5) se borra después **desde el panel** (dirección).

### Search Console (cliente o dirección, con la cuenta del cliente)

1. **Previa:** comprobar si ya existe la propiedad de **dominio** `partequipos.com` (verificada por DNS). Si existe, se conserva: no hay cambio de dominio, así que **no se usa** «Cambio de dirección».
2. Enviar `https://partequipos.com/sitemap.xml` en Sitemaps.
3. **Inspección de URL** de la portada, una ficha de repuesto, una de maquinaria y un artículo: «La URL está en Google» y «Rastreo permitido», sin `noindex`.
4. **Final:** el sitemap figura como «Correcto» con el número de URLs enviadas (puede tardar horas).

### Vuelta atrás

**Criterios. Se vuelve atrás si, tras el cambio de DNS, pasa cualquiera de estos:**

- la prueba de humo (1) en rojo y sin arreglo en 30 min;
- más del 1 % de las URLs conservadas o algún redirect fallan en (2), **sin causa de contenido conocida**;
- 5xx repetidos en los registros de Vercel;
- el formulario no guarda;
- el correo de la empresa deja de llegar (alguien tocó el MX: se arregla el MX, no se revierte el sitio).

**Pasos (cliente en GoDaddy y dirección en Vercel):**

1. Restaurar en GoDaddy los valores anotados en g.1: `A @ 45.89.205.198` y `CNAME www partequipos.com`. Con TTL 300 la vuelta tarda unos 5 min.
2. Si ya se había abierto la indexación: `NEXT_PUBLIC_PERMITIR_INDEXACION` fuera de Production y redesplegar, para que `vercel.app` no quede indexable.
3. **Final:** `curl.exe -sI https://partequipos.com/` vuelve a dar `Server: LiteSpeed` y `X-Powered-By: PHP`.
4. Si el fallo era del despliegue y no del dominio, el procedimiento de §10.18 (volver al despliegue bueno anterior desde el panel de Vercel) basta, sin tocar el DNS.

---

## i) Qué vigilar las 24–72 h siguientes

| Qué                  | Dónde                                                                                               | Cada cuánto          | Alarma                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Errores del lambda   | Registros de runtime de Vercel, filtro `error`, prefijos `[proxy]`, `[redirects]`, `[revalidación]` | 2 veces al día       | Cualquier 5xx repetido. **No hay Sentry** (§10.31): nadie avisa solo                                       |
| 404 de URLs antiguas | Search Console → Indexación de páginas → «No encontrada (404)»                                      | Diario               | Una URL del mapa que no esté en «pendiente» o «basura»                                                     |
| Rastreo              | Search Console → Estadísticas de rastreo                                                            | Diario               | Picos de errores de servidor o de tiempo de respuesta                                                      |
| Sitemap              | Search Console → Sitemaps                                                                           | Diario               | Errores de lectura o URLs enviadas que no se indexan                                                       |
| Leads                | `/admin` → Solicitudes, y el buzón de `SOLICITUDES_EMAIL_TO`                                        | Diario               | Una solicitud sin su correo de aviso, o un aviso en el registro: «Solicitud guardada SIN aviso por correo» |
| Spam                 | Panel de Turnstile en Cloudflare y `solicitudes`                                                    | Diario               | Solicitudes basura que pasan el reto                                                                       |
| Rendimiento          | Lighthouse con el método de §10.3 p.14; Core Web Vitals en Search Console, cuando haya datos        | Una vez a las 24 h   | LCP móvil por encima de la referencia vigente                                                              |
| Base de datos        | Panel de la base del cliente: conexiones y latencia                                                 | Tras cada despliegue | Conexiones cerca del límite del pooler (§10.7)                                                             |
| Prueba de humo       | GitHub → Actions, en cada despliegue                                                                | En cada despliegue   | Rojo: no se promociona (§7)                                                                                |
| Tráfico orgánico     | Search Console → Rendimiento, comparado con la semana anterior                                      | Diario               | Caída sostenida de clics más allá de la volatilidad normal de un cambio de plataforma                      |

**Al cerrar las 72 h** (dirección):

- decidir el apagado del WordPress, guardando antes un respaldo completo suyo;
- subir el TTL a su valor habitual;
- redirigir `partequipos.vercel.app` al dominio con un redirect permanente, desde los dominios del proyecto en Vercel.

---

## Resultado de la ejecución en seco (2026-10-03)

| Paso | Comprobado hoy, sin escribir                                               | Resultado                                                                                                                                                           |
| ---- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a    | DNS público, MX y TXT de `partequipos.com`; nombres de variables en Vercel | GoDaddy, WordPress en `45.89.205.198`, correo en Microsoft 365, `TXT` de Resend ya presente; faltan las variables de Turnstile, Resend, Mapbox, Sentry e indexación |
| b    | —                                                                          | Sin base definitiva. «Migrar desde cero» lo prueba CI en cada PR                                                                                                    |
| c    | —                                                                          | Runbook de retirada probado el 2026-10-02 (§10.38)                                                                                                                  |
| d    | Canónico y sitemap de producción                                           | `NEXT_PUBLIC_SERVER_URL` de producción es hoy `vercel.app`: **hay que cambiarlo el día del lanzamiento**                                                            |
| e    | Las tres vías del bloqueo                                                  | Activas                                                                                                                                                             |
| f    | `npm run lanzamiento:urls` contra `partequipos.vercel.app`                 | 171 conservadas en 200 y 447 en 404 por contenido; 10/10 redirects en 301 de un salto; 0 errores de mecanismo                                                       |
| g    | TTL y registros actuales; `www` responde 301 al apex                       | Valores anotados arriba para la vuelta atrás                                                                                                                        |
| h    | La prueba de humo corre en cada despliegue                                 | —                                                                                                                                                                   |
