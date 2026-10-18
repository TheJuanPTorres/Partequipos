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

**Al día a 2026-10-14.** Cambios desde la versión del 2026-10-03:

- Vercel Pro y el límite de gasto.
- Los dos almacenes del Blob.
- Mapbox, SMTP y Turnstile.
- Search Console.
- La carpeta `Devs\Partequipos-runbooks`.
- Las importaciones finales con una exportación nueva del WordPress.
- Las 650 URL.
- La transferencia del proyecto a la cuenta del cliente.

Lo comprobado en seco el 2026-10-03 sigue en los recuadros «En seco» y en el
resumen del final.

**Marca de lo que depende del cliente:** 🟥 **CLIENTE** en cada fila o paso
que no podemos resolver nosotros. El resumen está en «Qué depende del
cliente», al final.

---

## Orden general

| #   | Paso                                                                                                                              | Cuándo                     | Quién                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------- |
| 1   | Requisitos del cliente cerrados ([a](#a-requisitos-previos))                                                                      | Antes de fijar la fecha    | 🟥 Cliente; dirección los recoge       |
| 2   | Transferencia del proyecto a la cuenta del cliente ([j](#j-transferencia-del-proyecto-a-la-cuenta-del-cliente)), si se hace antes | Semanas antes              | Dirección y 🟥 cliente                 |
| 3   | Base y almacenes definitivos ([b](#b-base-de-datos-definitiva), [a.3](#a3-los-dos-almacenes-del-blob))                            | Semanas antes              | Dirección y 🟥 cliente                 |
| 4   | Retirar §10.38 ([c](#c-retirar-1038-o-confirmar-las-licencias))                                                                   | Antes de las importaciones | Dirección                              |
| 5   | Congelar el WordPress y sacar la exportación final ([k.1](#k1-congelar-el-wordpress-y-exportación-final))                         | T − 3 días                 | 🟥 Cliente                             |
| 6   | Importaciones finales, en orden ([k](#k-importaciones-finales-con-una-exportación-nueva-del-wordpress))                           | T − 3 a T − 1 días         | Dirección, con los runbooks del agente |
| 7   | Variables de producción ([d](#d-variables-de-entorno-por-entorno-solo-nombres))                                                   | T − 2 días                 | Dirección, con valores 🟥 del cliente  |
| 8   | Las 650 URL contra `vercel.app` ([f](#f-las-650-url-redirects-301-contra-docsurl-mapcsv))                                         | T − 1 día y T − 2 h        | Agente; revisa dirección               |
| 9   | DNS y certificado ([g](#g-dns-y-certificado-en-el-orden-que-evita-la-caída))                                                      | T − 48 h a T               | 🟥 Cliente (GoDaddy) y dirección       |
| 10  | Quitar el `noindex` ([e](#e-quitar-el-noindex-sitemap-y-robots))                                                                  | T, tras g                  | Dirección                              |
| 11  | Humo del lanzamiento y Search Console ([h](#h-prueba-de-humo-del-lanzamiento-search-console-y-vuelta-atrás))                      | T + 15 min                 | Agente, dirección y 🟥 cliente         |
| 12  | Vigilancia ([i](#i-qué-vigilar-las-2472-h-siguientes))                                                                            | T a T + 72 h               | Dirección y agente                     |

**Por qué las importaciones van ANTES del DNS:** todos los importadores
descargan las imágenes de `https://partequipos.com/wp-content/uploads/…`, y el
del blog lee además la API de WordPress en `https://partequipos.com/wp-json/`.
En cuanto el dominio apunta a Vercel, esas direcciones ya no son el
WordPress y dan 404. **Con el DNS cambiado ya no se puede importar nada** sin
dar otra dirección al WordPress viejo.

---

## 0. Dónde se ejecutan los runbooks: `Devs\Partequipos-runbooks`

**Decisión de dirección del 2026-10-14.** Dirección ejecuta todos los runbooks
de producción desde `C:\Users\Juan Torres\Desktop\Devs\Partequipos-runbooks`,
una copia del repositorio **en la que no trabaja ningún agente**. Así una rama
a medias de un agente nunca acaba ejecutándose contra producción.

Antes de cada runbook, en una **ventana de PowerShell nueva**:

```powershell
cd "C:\Users\Juan Torres\Desktop\Devs\Partequipos-runbooks"
git fetch -q origin
git checkout -q --detach origin/main
git status --short                 # esperado: vacío
git log --oneline -1               # el commit de main que pide el runbook
npm ci                             # solo si cambió package-lock.json
```

- **Si `git status` no está vacío, se para:** alguien tocó la copia.
- Cada runbook dice qué PR necesita; cuando importa, lo comprueba con `git merge-base --is-ancestor <sha> HEAD`.
- Las credenciales se piden con `Read-Host -AsSecureString`, solo en esa ventana, y se borran al final (`Remove-Item Env:…`).
- Los runbooks viven en `Desktop\partequipos-cierre\`, fuera del repositorio.

---

## a) Requisitos previos

**BLOQUEA** significa que sin ese requisito no se lanza.

| #   | Requisito                                                                            | Bloquea                         | Estado a 2026-10-14                                                                                                                                                                                                                                                                     | Quién                                     |
| --- | ------------------------------------------------------------------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | **Vercel Pro** y su **límite de gasto**                                              | **BLOQUEA**                     | **Pro activo desde el 2026-10-13** en la cuenta de hoy. Falta revisar el límite de gasto (a.2). Si el proyecto pasa a la cuenta del cliente, esa cuenta también necesita Pro (j)                                                                                                        | Dirección; 🟥 cliente si se transfiere    |
| 2   | **Base de datos definitiva**: accesible desde internet y con pooler                  | **BLOQUEA**                     | Sin decidir. Hoy, Neon (ver b)                                                                                                                                                                                                                                                          | 🟥 Cliente                                |
| 3   | **Almacén del Blob de producción** en la cuenta definitiva                           | **BLOQUEA** si cambia de cuenta | Hoy, `parte-equipos` en nuestra cuenta, sin conectar a ningún entorno (a.3)                                                                                                                                                                                                             | Dirección; 🟥 cliente si se transfiere    |
| 4   | **Claves de Turnstile** del dominio `partequipos.com`                                | **BLOQUEA**                     | Sin claves en Vercel. Desde el 2026-10-06, producción sin claves **no pinta el widget** y acepta el envío sin verificar (§10.11)                                                                                                                                                        | 🟥 Cliente                                |
| 5   | **SMTP del cliente**: valores de producción de las `SMTP_*` y `SOLICITUDES_EMAIL_TO` | **BLOQUEA**                     | Probado de punta a punta en un preview el 2026-10-07 con valores de prueba. Faltan los de producción y SPF/DKIM del remitente (§10.11)                                                                                                                                                  | 🟥 Cliente                                |
| 6   | **Sentry**: organización a su nombre, plan Team y región                             | No técnicamente                 | Sin cuenta. Es un **compromiso contractual sin cumplir** (§10.31); lanzar sin él lo decide dirección por escrito                                                                                                                                                                        | 🟥 Cliente; decide dirección              |
| 7   | **Mapbox**: medio de pago y token restringido                                        | No                              | Token en Vercel desde el 2026-10-06: el **público por defecto**, **sin medio de pago** y **sin restricción de URL** (a.4)                                                                                                                                                               | 🟥 Cliente; dirección                     |
| 8   | **Acceso al DNS** de `partequipos.com` (GoDaddy)                                     | **BLOQUEA**                     | Alguien con acceso el día del cambio **y** 48 h antes, para bajar el TTL                                                                                                                                                                                                                | 🟥 Cliente                                |
| 9   | **Textos legales definitivos**                                                       | **BLOQUEA**                     | Las 4 páginas legales se importaron de WordPress el 2026-10-14. Falta que el cliente confirme que esos son los vigentes                                                                                                                                                                 | 🟥 Cliente                                |
| 10  | **Contenido real**                                                                   | **BLOQUEA**                     | **Cargado en producción el 2026-10-14**: repuestos, blog y páginas, fichas nuevas y usados. Faltan servicio técnico y lubricantes, índices, home y Nosotros (runbooks listos), y la **exportación final** (k)                                                                           | Dirección; 🟥 cliente (exportación final) |
| 11  | **Decisión sobre las 14 URL pendientes y las 4 de maquinaria vivas**                 | **BLOQUEA**                     | Sin decidir. Si no se decide, el día del cambio dan 404 (`docs/redirects-cobertura.md` §3 y §4)                                                                                                                                                                                         | 🟥 Cliente                                |
| 12  | **Las 128 fichas de usados de WordPress** (`/maquinaria-pesada-usada/<unidad>/`)     | No                              | No están en `url-map.csv` y desde el 2026-10-16 cada unidad tiene su página y las 128 antiguas llevan 301 (`npm run preview:usados:redirects`; para producción, con el importador, `docs/usados-importacion.md` §7). **Solo el Search Console del cliente** dice cuáles están indexadas | 🟥 Cliente                                |
| 13  | **Licencias L1–L5** o retirada de §10.38                                             | **BLOQUEA**                     | Paso c. Retirada lista: es el runbook de la retirada de la copia                                                                                                                                                                                                                        | 🟥 Cliente o dirección                    |
| 14  | **Acceso a Search Console** de `partequipos.com`                                     | No, pero sí para vigilar        | Hace falta para h e i, y para la fila 12                                                                                                                                                                                                                                                | 🟥 Cliente                                |
| 15  | Razón social, NIT, redes y teléfono (§10.3 p.1–4)                                    | No                              | El JSON-LD `Organization` sale sin esos campos, sin error                                                                                                                                                                                                                               | 🟥 Cliente                                |
| 16  | Icono cuadrado para el favicon (§10.3 p.15)                                          | No                              | Se ve en la pestaña; no afecta al SEO                                                                                                                                                                                                                                                   | 🟥 Cliente o diseñador                    |

**Comprobación previa (dirección):** cada fila marcada **BLOQUEA** tiene una
respuesta escrita del cliente, guardada fuera del repositorio.

> **En seco (2026-10-03):**
>
> - **DNS:** servidores de nombres `ns01/ns02.domaincontrol.com` (GoDaddy). El apex da `A 45.89.205.198` (LiteSpeed y PHP: el WordPress), y `www` es `CNAME` a `partequipos.com`.
> - **Correo en Microsoft 365:** `MX partequipos-com.mail.protection.outlook.com`. Hay además registros `TXT` de SPF y de verificación de Microsoft, Resend, Brevo y MailerLite. **Ninguno de esos se toca en el paso g.**
> - **Variables de Vercel** (solo nombres, el 2026-10-03): `DATABASE_URI`, `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SERVER_URL`, `BLOB_STORE_ID` en Production y Preview. Después se añadieron `NEXT_PUBLIC_MAPBOX_TOKEN` (Production y Preview, 2026-10-06) y las `SMTP_*` de prueba (solo Preview, 2026-10-07).

### a.2) Vercel Pro y el límite de gasto

**Estado:** el equipo de Vercel pasó a **Pro el 2026-10-13**. El motivo
inmediato fue el cupo de 2.000 operaciones avanzadas del Blob de Hobby: la
importación de usados al preview lo agotó y, como es de toda la cuenta, dejó
también a producción sin imágenes. El presupuesto está en
`Desktop\partequipos-cierre\informes\2026-10-13-blob-y-listados.md`. Pro
también hace falta para volver a hacer privado el repositorio (§10.4).

**El límite de gasto («Spend Management»)**, según la
[documentación de Vercel](https://vercel.com/docs/spend-management) (revisada
el 2026-10-14):

- Solo cuenta el **uso medido por encima del crédito mensual** de Pro: funciones, optimización de imágenes, Blob… **No** cuentan los puestos ni las integraciones.
- Avisa por web y correo al **50 %, 75 % y 100 %**; por SMS, solo al 100 %.
- La opción **«Pause Production Deployments»** pausa la producción de **todos** los proyectos del equipo al llegar al límite. El sitio responde **503 `DEPLOYMENT_PAUSED`** hasta que alguien reanuda **cada proyecto a mano**. Subir el límite no lo reanuda.
- Vercel comprueba el gasto **cada pocos minutos**, así que el aviso y la pausa llegan con retraso.
- Según los anuncios de Vercel, en Pro viene **activado por defecto** y **pausa la producción por defecto**. Hay que mirarlo en nuestro equipo: no se ha comprobado.

**Pasos (dirección, con el rol Owner o Billing):**

1. **Previa:** Settings → Billing → Spend Management. Anotar si está activado, el importe («On-Demand Budget») y si «Pause Production Deployments» está activado.
2. **Decidir** (dirección, y 🟥 **el cliente** si paga él), con este criterio:
   - Un sitio cuyo negocio es el tráfico orgánico **no debería apagarse solo**: un 503 largo es peor que una factura. Lo recomendado es **avisos sí y pausa no**, o pausa con un importe muy por encima del uso esperado.
   - El uso esperado es bajo. Las ~3.600 operaciones del Blob del mes del lanzamiento cuestan unos 0,02 USD (informe del 2026-10-13).
   - Lo que podría dispararse es la **optimización de imágenes** (unas 1.900 imágenes, en varios anchos) y las funciones de los listados dinámicos de usados.
3. **Acción:** importe fijado; avisos al 50/75/100 % para dirección **y para quien pague del lado del cliente** (Settings → My Notifications → Spend Management: cada persona configura los suyos).
4. **Final:** la misma pantalla con lo decidido. Anotar el importe y la decisión sobre la pausa en el informe del lanzamiento.

**Si un día el sitio da 503 `DEPLOYMENT_PAUSED`:** es esto, no un fallo del
código. Se sube el límite y se reanuda el proyecto desde su panel (Settings →
General → Resume).

### a.3) Los dos almacenes del Blob

**Configuración desde el 2026-10-13** (CLAUDE.md §10.4):

| Almacén                 | Conectado a      | Quién lo usa                                                                   |
| ----------------------- | ---------------- | ------------------------------------------------------------------------------ |
| `parte-equipos-preview` | **solo Preview** | Los previews; `development` (`.env.local`) y los scripts locales, con su token |
| `parte-equipos`         | **ninguno**      | Producción, con su `BLOB_READ_WRITE_TOKEN` propio, puesto a mano en Production |

- **Regla: un almacén nunca se conecta a otro entorno que el suyo.** Hasta el 2026-10-13 el del preview estaba conectado también a Production; dirección lo quitó y redesplegó.
- **El token de producción NO se revoca ni se sustituye**, aunque el panel de Vercel recomiende conectar el almacén y quitar los tokens estáticos. Motivos:
  1. **Todo lo que corre fuera de Vercel usa ese token:** los importadores de los runbooks, `blob:almacen`, `blob:huerfanos`, `backup:blob` y los runbooks de dirección.
  2. **La guarda del almacén** (§10.37) reconoce el almacén **por el id que lleva el propio token**. Sin token no hay comprobación previa, y los scripts se quedarían sin almacén.
- El **id del almacén de producción está escrito en el código** (`ALMACEN_PRODUCCION`, `src/lib/blob/almacen.ts`). Las URL de las ~1.900 imágenes de la base también llevan el host del almacén. **Si el almacén cambia** (cuenta nueva, j), hace falta un PR que cambie el id **y** reescribir esas URL. No es un cambio de variable.

**Comprobación (dirección, sin escribir):**

- En Vercel → Storage: cada almacén conectado a lo de la tabla, y a nada más.
- En la ventana de un runbook, con el token de producción cargado: `npm run blob:almacen` da el almacén de producción con ✓.
- Sin credenciales: las imágenes de la portada publicada salen del almacén de producción, y las de un preview, del suyo.

### a.4) Mapbox

- **Hoy:** `NEXT_PUBLIC_MAPBOX_TOKEN` está en Production y Preview desde el 2026-10-06, con el globo de sedes verificado en producción (`decisiones-home-ux9.md` §23). Es el token **público por defecto** de la cuenta: **sin medio de pago** y **sin restricción de URL**.
- **Riesgo sin medio de pago:** si se agota el cupo gratuito, el mapa deja de cargar, sin cobro. La sección no se rompe: queda la lista de sedes (G3).
- **Riesgo sin restricción:** cualquiera puede copiar el token del HTML (todo `NEXT_PUBLIC_*` es público) y gastar el cupo desde otro sitio.

**Pasos:**

1. 🟥 **CLIENTE:** añade un **medio de pago** a su cuenta de Mapbox (licencia L5: la cuenta es la del cliente).
2. **Dirección o cliente:** en Mapbox → Tokens, crea un token **público** nuevo, con solo los permisos de lectura que trae por defecto y **restringido por URL** a `https://partequipos.com`. Si se quiere ver el mapa en los previews, se añade también `https://partequipos-*.vercel.app` o se usa otro token para Preview.
3. **Dirección:** sustituye `NEXT_PUBLIC_MAPBOX_TOKEN` en **Production** y redespliega (es `NEXT_PUBLIC_*`: se incrusta en el build).
4. **Final:** en `https://partequipos.com/`, la sección de sedes pinta el globo. **Hasta el cambio de DNS, un token restringido a `partequipos.com` no funciona en `partequipos.vercel.app`**: el cambio se hace en la ventana del paso g.4, o se restringe a los dos dominios y se quita `vercel.app` después.
5. Cuando el nuevo funcione, se **borra el token por defecto viejo** de las variables de Vercel (no se puede borrar en Mapbox: el público por defecto no se elimina).

---

## b) Base de datos definitiva

**Quién:** dirección (es producción). 🟥 **El cliente decide dónde vive la
base** (§10.7).

**Hoy el contenido real ya está en la base de producción de Neon**: se cargó
el 2026-10-14 con los runbooks 1–3 y el de fichas. Así que la vía del
2026-10-03 («base vacía, migrar e importar desde cero») ya no es la única.
Hay dos salidas, y la elige dirección con el cliente:

| Salida                                                                 | Qué supone                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Se queda Neon** (proyecto transferido al cliente o pagado por él) | Nada que mover. Si el proyecto de Neon cambia de dueño, la cadena de conexión puede cambiar: se actualiza `DATABASE_URI` en Production y se redespliega                                                                                   |
| **2. Base del cliente**                                                | Restaurar el último respaldo en la base nueva (README §9.3, restauración probada) **o** migrar desde cero y repetir todas las importaciones (k). Restaurar es más rápido y conserva lo editado en el panel; repetir pierde esas ediciones |

**Si es la salida 2:**

1. **Previa: la base nueva está vacía.** En su consola SQL:

   ```sql
   SELECT to_regclass('public.payload_migrations') AS migraciones,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS tablas;
   ```

   Esperado: `migraciones` vacío y `tablas` = 0. **Si hay tablas, se para:** la
   migración inicial hace `CREATE TABLE` sin `IF NOT EXISTS` (§10.4).

2. **Cadena de conexión:** la **pooled** (§10.7). Se pega en Vercel (`DATABASE_URI`, Production), nunca en la terminal del agente.
3. **Migrar:** lo hace el primer despliegue con la base nueva (Build Command `npm run deploy:migrate && npm run build`).
   - **Final:** el registro del build dice `Migrated:` para **todas** las de `src/migrations` (hoy **38** ficheros `.ts`), y `db:check` no encuentra el marcador `dev`.
   - **Estructura:** la consulta de §10.34, generada desde el último snapshot por el agente (`consultaEstructura` de `src/lib/db/estructuraSnapshot.ts`), da **0 filas**. La ejecuta dirección en la consola SQL de la base nueva; es de solo lectura.
4. **Datos:** restauración del respaldo (README §9.3) o las importaciones de k, en su orden. **No ejecutar `npm run seed:paginas`**: siembra textos de relleno (§10.6).
5. **Primer usuario**, solo si se migró desde cero: en `/admin/` se crea la cuenta y el gancho `primerUsuarioEsAdministrador` la hace administradora (§10.17). **Final:** `npm run rol` lista **1 administrador**.
6. **Redesplegar sin caché de build.** Sembrar desde un script no refresca lo prerenderizado (§10.6). **Final:** `db:check` limpio y la prueba de humo en verde.

> **En seco:** «migrar desde cero» se prueba **en cada PR**: el job de CI
> aplica todas las migraciones a un Postgres 17 vacío y exige 0 filas
> (§10.25).

---

## c) Retirar §10.38 o confirmar las licencias

**Quién:** dirección. **Bloquea** todo lo que sigue y **va antes de las
importaciones finales** (k): el runbook del contenido real de la home se
niega mientras quede un fichero `demo-copia-`.

Hay dos salidas, y hay que elegir una:

- **Retirada:** `Desktop\partequipos-cierre\runbook-retirada-demo-produccion.md`. Deshace exactamente la copia y está probado de punta a punta (§10.38). **Requisito: el PR #157, en `main` desde el 2026-10-14 (`e3b46e3`).**
  - **Final:** `demo-copia en media 0`, los ficheros del manifiesto en **404** pasados 60–70 s (§10.32), y la home pinta sin huecos.
- 🟥 **CLIENTE: confirmación escrita de las licencias** L1–L5, los logos de fabricantes y la autorización de los testimonios. Se guarda fuera del repositorio y se anota en §10.38 como **cerrada**.
  - **Desde el 2026-10-16, también:** las fotos de los **aditamentos** importados de WordPress. Varias parecen de catálogo de fabricante (Okada, NPK, CASE, Link Belt). Detalle en `docs/aditamentos-importacion.md` §5.

**Contenido de EJEMPLO:** se retira **en los dos casos** (fichas «EJEMPLO
UX-9 —», testimonios, sedes y preguntas).

- **Final:** la orden siguiente da `"totalDocs":0`. Con `-g`, para que `curl.exe` no interprete los corchetes. Desde el 2026-10-15 la API pide el token de lectura (`API_LECTURA_TOKEN` de Production, en `$env:PQ_LECTURA`; ver d):

  ```powershell
  curl.exe -sg -H "x-partequipos-lectura: $env:PQ_LECTURA" "https://partequipos.vercel.app/api/equipos-usados/?limit=0&where[descripcion][like]=EJEMPLO"
  ```

---

## d) Variables de entorno por entorno (solo nombres)

**Quién:** dirección, en Vercel → Settings → Environment Variables. Los
valores marcados 🟥 los da el cliente.

| Variable                                | Production                               | Preview                                      | Nota                                                                                                                                                                                           |
| --------------------------------------- | ---------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URI`                          | base definitiva, **pooled** (b)          | rama `preview` de Neon                       | Distinta en cada entorno (§10.21)                                                                                                                                                              |
| `PAYLOAD_SECRET`                        | propio                                   | propio, distinto                             | Compartido, un token de preview valdría en producción                                                                                                                                          |
| `BLOB_READ_WRITE_TOKEN`                 | almacén `parte-equipos`, puesto a mano   | lo da la conexión de `parte-equipos-preview` | Ver a.3. **No se revoca**                                                                                                                                                                      |
| `BLOB_STORE_ID`                         | lo gestiona Vercel                       | lo gestiona Vercel                           | No se toca                                                                                                                                                                                     |
| `NEXT_PUBLIC_SERVER_URL`                | **`https://partequipos.com`** (paso g.4) | el mismo                                     | **Hoy vale `https://partequipos.vercel.app`**. Cambiarlo exige redesplegar                                                                                                                     |
| `NEXT_PUBLIC_PERMITIR_INDEXACION`       | `true` **solo en el paso e**             | **nunca**                                    | En Preview haría indexable cada preview                                                                                                                                                        |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`        | 🟥 clave real                            | **sin valor**                                | Sin claves, producción **no pinta el widget** y acepta el envío sin verificar, con un `console.error [turnstile]`; el preview usa las de prueba (§10.11)                                       |
| `TURNSTILE_SECRET_KEY`                  | 🟥 clave real                            | **sin valor**                                | Igual                                                                                                                                                                                          |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | 🟥 servidor del cliente                  | servidor de prueba                           | Probado en un preview el 2026-10-07 (§10.11). Sin `SMTP_SECURE=true`, STARTTLS obligatorio                                                                                                     |
| `SMTP_USER`, `SMTP_PASS`                | 🟥 cuenta del cliente                    | cuenta de prueba                             | `SMTP_PASS` como **Sensitive**                                                                                                                                                                 |
| `SMTP_FROM_ADDRESS`, `SMTP_FROM_NAME`   | 🟥 remitente del cliente                 | remitente de prueba                          | Con SPF y DKIM del dominio del remitente, o acabará en spam                                                                                                                                    |
| `SOLICITUDES_EMAIL_TO`                  | 🟥 buzón comercial del cliente           | buzón de prueba                              | En producción, si falta, va al correo de contacto del panel. En preview, si falta, **no se envía**                                                                                             |
| `NEXT_PUBLIC_MAPBOX_TOKEN`              | **token restringido** (a.4)              | el de hoy o ninguno                          | Hoy, el público por defecto, en los dos entornos                                                                                                                                               |
| `SENTRY_DSN` y su token                 | cuando exista (§10.31)                   | —                                            | No existen todavía                                                                                                                                                                             |
| `API_LECTURA_TOKEN`                     | propio, **Sensitive**, ≥ 32 caracteres   | propio, distinto                             | Token de lectura de la API REST para runbooks y scripts (desde el 2026-10-15; sin sesión, la API da 403). Va en la cabecera `x-partequipos-lectura`. Se rota cambiándolo y redesplegando       |
| `REVALIDACION_TOKEN`                    | propio, **Sensitive**, ≥ 32 caracteres   | propio, distinto                             | Secreto de `POST /api/revalidar/` (desde el 2026-10-18): vacía la caché del sitio al final de cada runbook de importación. Va en la cabecera `x-partequipos-revalidar`. Sin él, la ruta da 403 |

**Previa:** `npx vercel env ls` lista los nombres y los entornos, sin valores.

**Final:**

- La misma orden muestra cada variable en su entorno.
- **Ninguna de Turnstile está en Preview.** Las `SMTP_*` de Preview son las de prueba, nunca las del cliente.
- Las `NEXT_PUBLIC_*` solo cambian tras **redesplegar**.
- **Turnstile:** el HTML de `/contactanos/` sirve la clave real, **no** `1x00000000000000000000AA`, y el widget se pinta. El widget del cliente tiene que tener `partequipos.com` entre sus dominios en Cloudflare. **Hasta el cambio de DNS no se puede probar el reto en el dominio**: se prueba en g.6 y h.5.
- **SMTP:** un envío de prueba (h.5) llega al buzón de `SOLICITUDES_EMAIL_TO`, y el registro de Vercel dice `[avisos] Aviso de solicitud enviado por SMTP.`

> **En seco (2026-10-03):** el canónico de la portada de producción es
> `https://partequipos.vercel.app/` y el sitemap lista URL de ese mismo host.
> **Hoy es correcto:** el sitio de demostración no debe apuntar su canónico al
> WordPress. **El día del lanzamiento es imprescindible cambiarlo**: sin el
> cambio, el canónico, el `og:url`, el JSON-LD y el sitemap mandarían a Google
> a `vercel.app`.

---

## e) Quitar el `noindex`: sitemap y robots

**Quién:** dirección. Va **después** del paso g, con el dominio sirviendo ya
este sitio: abrir antes indexaría `partequipos.vercel.app`. **Requisito:
§10.38 cerrada** (c).

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

   - El último recuento tiene que ser **al menos** las 620 conservadas de f que tengan contenido.
   - Ninguna `<loc>` puede llevar `vercel.app`.
   - Las páginas filtradas (`?marca=…`) y las categorías vacías no salen en el sitemap ni se indexan: es deliberado (D4).

> **En seco (2026-10-03), contra `partequipos.vercel.app`:** las tres vías
> del bloqueo estaban activas, como deben, y había `Strict-Transport-Security`.

---

## f) Las 650 URL: redirects 301 contra `docs/url-map.csv`

**Quién:** el agente la ejecuta y dirección la revisa. **Solo hace GET**: no
escribe nada.

```powershell
$env:LANZAMIENTO_BASE = "https://partequipos.com"
$env:LANZAMIENTO_ESTRICTO = "true"
$env:LANZAMIENTO_INFORME = "$env:TEMP\lanzamiento-urls.json"
npm run lanzamiento:urls
```

**Los 301 de la base que no están en `url-map.csv`** (las 128 URL antiguas de las unidades usadas, entre otras):

- Desde el 2026-10-17, el mapa del dominio ya no lleva las URL antiguas, solo un resumen con clave de cada una. Así que el comprobador pregunta por las rutas que conoce.
- Para que las compruebe todas, dirección escribe antes la lista desde la base, con el entorno de un runbook, y la pasa en `LANZAMIENTO_RUTAS_EXTRA`:

```powershell
# Con DATABASE_URI y BLOB_READ_WRITE_TOKEN de la sesión del runbook (solo lectura).
$EXTRA = "$HOME\Desktop\partequipos-cierre\origenes-redirects.txt"
npx tsx scripts/redirects/origenes.ts produccion "salida=$EXTRA"
$env:LANZAMIENTO_RUTAS_EXTRA = $EXTRA
npm run lanzamiento:urls
Remove-Item $EXTRA, Env:LANZAMIENTO_RUTAS_EXTRA
```

**Esperado:** `Redirects de la base: N; comprobados N. Todos.`

**Cuidado:** algunas de esas rutas llevan el serial de una unidad, y las líneas «✗» las imprimen. Esa salida no se pega en ningún sitio público, y el fichero se borra después.

Recorre las **650 URL** de `docs/url-map.csv`: las 648 del rastreo más 2
entradas del blog. Sigue cada redirect hasta 5 saltos, sin dejar que `fetch`
los siga solo. La decisión está en `src/lib/lanzamiento/urlMap.ts`, con
pruebas que comprueban que **falla** con un 404, un 302, un bucle, un destino
equivocado o un 500.

| Clase                 | Cuántas | Qué exige                                              | Si no                             |
| --------------------- | ------: | ------------------------------------------------------ | --------------------------------- |
| Conservada            |     620 | 200 directo (un 308 que solo pone la barra final vale) | **Bloquea**                       |
| Redirect cargado      |      10 | 301 o 308 hasta **su** destino, y 200                  | **Bloquea**                       |
| Pendiente del cliente |      14 | Se informa                                             | No bloquea; es 🟥 la fila 11 de a |
| Basura                |       6 | Se informa                                             | No bloquea                        |

Un **302, 303 o 307** en cualquier cadena bloquea: no transfiere autoridad.

**Qué redirects da por esperados** (desde el PR de este cambio, 2026-10-14):

- los de `scripts/import/data/redirects.csv`;
- los fijos de `next.config.ts` (`src/lib/redirects/fijos.ts`): `/maquinaria/` y `/nosotros/trabaja-con-nosotros/`, este al portal de empleo externo;
- **los que sirve el propio dominio** en `/api/redirects-map/`, la lista que aplica el proxy. Ahí están los de los importadores (repuestos), los de la migración de lubricantes y los creados en el panel (D7).

Notas:

- Si no puede leer esa lista (un preview protegido, o un mapa vacío por un fallo de la base), **no sigue**.
- Un origen con destino distinto en el fichero y en la base es un **conflicto**, y bloquea.
- Los orígenes de redirect que no están en `url-map.csv` también se recorren: tienen que llegar a un 200.

> **Medido el 2026-10-14 contra `https://partequipos.vercel.app`**, en
> estricto, código 0:
>
> - 650 URL más 1 origen fuera del mapa (`/maquinaria/`);
> - 49 redirects esperados: 10 del fichero, 2 fijos y 47 de la base;
> - **0 bloqueantes**: 584 conservadas en 200 y 49 redirects ok;
> - 13 pendientes y 5 basura en 404, informativas.
>
> Antes del arreglo, ese mismo sitio habría dado **36 bloqueos falsos**: 35
> redirects de la base y el del portal de empleo.

**Criterio:** con `LANZAMIENTO_ESTRICTO=true` sale con código **0**. Se ejecuta:

1. contra `https://partequipos.vercel.app` **antes** de cambiar el DNS (T − 1 día y otra vez en g.4);
2. contra `https://partequipos.com` **después** del paso g.

`docs/redirects-cobertura.md` sigue con las cifras del 2026-08-13 (618
conservadas sobre 648); las vigentes son las de esta tabla.

> **En seco (2026-10-03), contra `https://partequipos.vercel.app`, con datos
> de demostración:** 171 conservadas en 200 y 447 en 404 por falta de
> contenido; 10 de 10 redirects en 301 de un solo salto; **cero** 5xx,
> 302/307, bucles o cadenas. Con el contenido real cargado, el recuento de
> conservadas en 200 tiene que llegar a todas.

---

## g) DNS y certificado, en el orden que evita la caída

**Quién:** 🟥 **el cliente** (o quien tenga el DNS) toca GoDaddy, y
dirección, Vercel. **Requisito: las importaciones finales de k, terminadas y
comprobadas.**

> **Lo que NO se toca nunca:** `MX`, los `TXT` (SPF, Microsoft, Resend,
> Brevo, MailerLite) ni cualquier otro registro que no sea el `A` del apex y
> el `CNAME` de `www`. El correo de la empresa está en Microsoft 365 y depende
> de ellos.

1. **T − 48 h · bajar el TTL** del `A @` y del `CNAME www` a **300 s** (🟥 cliente).
   - **Previa:** anotar los valores actuales (`A 45.89.205.198`, `www CNAME partequipos.com`) y el TTL. Así se puede volver atrás.

     ```powershell
     nslookup -type=A partequipos.com ns01.domaincontrol.com
     nslookup -type=CNAME www.partequipos.com ns01.domaincontrol.com
     nslookup -debug partequipos.com ns01.domaincontrol.com | Select-String ttl
     ```

   - **Final:** la última orden da `ttl = 300`.

2. **T − 24 h · añadir los dominios al proyecto en Vercel** (dirección), **en el equipo donde vaya a vivir el proyecto** (j): `partequipos.com` y `www.partequipos.com`.
   - `www` se configura como **redirect permanente (301 o 308)** hacia el apex, igual que hoy en WordPress.
   - Si Vercel pide verificar la propiedad, añade un `TXT _vercel`: lo crea 🟥 el cliente en GoDaddy y **no sustituye a nada**.

3. **T − 24 h · pre-generar el certificado**, para que el HTTPS funcione desde el primer segundo ([documentación de Vercel](https://vercel.com/docs/domains/pre-generating-ssl-certs)):

   ```powershell
   npx vercel certs issue partequipos.com www.partequipos.com --challenge-only
   ```

   - 🟥 El cliente crea en GoDaddy los `TXT _acme-challenge` que devuelve esa orden.
   - Cuando estén propagados: `npx vercel certs issue partequipos.com www.partequipos.com`.
   - **Final:** el sitio nuevo responde con su certificado **sin haber cambiado el DNS todavía**:

     ```powershell
     curl.exe -sI https://partequipos.com/ --resolve partequipos.com:443:<IP de Vercel>
     ```

     Esperado: `HTTP/1.1 200` con `x-vercel-id`. Las IP y el `CNAME` exactos son los del panel de Vercel.

4. **T − 2 h · despliegue de lanzamiento listo** (dirección):
   - `NEXT_PUBLIC_SERVER_URL=https://partequipos.com` y, si va restringido, el token de Mapbox nuevo (a.4); redesplegar.
   - **Final:**
     - prueba de humo en verde;
     - `npm run lanzamiento:urls` en estricto contra `https://partequipos.vercel.app`, con código 0;
     - el canónico de la portada es `https://partequipos.com/`.
   - **El bloqueo de indexación sigue activo** en este momento.

5. **T · cambio** (🟥 cliente, en GoDaddy):
   - `A @` → la IP de Vercel del panel.
   - `CNAME www` → el `CNAME` del panel.
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
   - **El WordPress no se apaga** hasta pasadas las 72 h de i: es la vuelta atrás. Mientras tanto sigue en `45.89.205.198`.
   - **La prueba de humo pasa a mirar el dominio nuevo** (#224). Los 301 de la base (`/gracias/`) se comprueban en el dominio publicado, que hoy es `https://partequipos.vercel.app` (`DOMINIO_PUBLICADO` en `src/lib/qa/humo.ts`). Con el DNS ya en Vercel:
     - **en CI:** un PR que cambie esa constante a `https://partequipos.com`, por la rutina de §9. Es lo que usa el workflow `humo.yml`, que no fija `HUMO_DOMINIO`;
     - **a mano:** `$env:HUMO_DOMINIO="https://partequipos.com"` antes de `npm run humo` (lo usa h.1).
     - **Final:** la prueba de humo del despliegue de `main` con ese cambio, en verde, con `/gracias/` en 301 desde `partequipos.com`.
     - Si no se cambia, el humo sigue mirando `vercel.app`, que tras la redirección de j al dominio puede dejar de dar el 301 esperado y salir en rojo.

---

## h) Prueba de humo del lanzamiento, Search Console y vuelta atrás

### Prueba de humo del lanzamiento (agente y dirección, justo después de g.6)

| #   | Comprobación               | Orden                                                                                                                                | Esperado                                                    |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 1   | Humo del lambda            | `$env:HUMO_URL="https://partequipos.com"; $env:HUMO_ENTORNO="production"; $env:HUMO_DOMINIO="https://partequipos.com"; npm run humo` | Las 5 rutas en 200                                          |
| 2   | Las 650 URL                | Paso f, en estricto, contra `https://partequipos.com`                                                                                | Código 0                                                    |
| 3   | QA del HTML                | `$env:QA_BASE="https://partequipos.com"; npm run qa`                                                                                 | 0 errores                                                   |
| 4   | Robots, canónico y sitemap | Paso e, final (después de abrir la indexación)                                                                                       | Todo `partequipos.com`                                      |
| 5   | Formulario real            | Un envío desde `/contactanos/` con datos evidentes de prueba («PRUEBA LANZAMIENTO»)                                                  | Se pinta y pasa Turnstile, se guarda y llega el correo SMTP |
| 6   | Panel                      | `/admin/` con la cuenta de administración                                                                                            | Entra                                                       |
| 7   | Correo de la empresa       | Un correo cualquiera al buzón del cliente                                                                                            | Llega (el MX no se tocó)                                    |
| 8   | Mapa de sedes              | La portada, en la sección de sedes                                                                                                   | El globo con el token nuevo, sin errores de consola         |

El envío de prueba (5) se borra después **desde el panel** (dirección).

### Search Console (🟥 cliente, o dirección con acceso dado por el cliente)

**Antes del lanzamiento (T − 1 semana):**

1. **Previa:** comprobar si ya existe la propiedad de **dominio** `partequipos.com` (verificada por DNS) y quién la administra. Si existe, se conserva: no hay cambio de dominio, así que **no se usa** «Cambio de dirección». Si no existe, se crea con un `TXT` en GoDaddy (🟥 cliente).
2. **Dar acceso** de propietario o usuario completo a dirección.
3. **Exportar** (Indexación → Páginas) la lista de páginas indexadas y el informe de Rendimiento de los últimos 3 meses. Es la línea base para comparar después, y la respuesta a la fila 12 de a: qué fichas de usados de WordPress están indexadas.

**El día del lanzamiento (tras e):**

4. Enviar `https://partequipos.com/sitemap.xml` en Sitemaps. Si había un sitemap de WordPress enviado (`/sitemap_index.xml` u otro), se quita.
5. **Inspección de URL** de la portada, una ficha de repuesto, una de maquinaria y un artículo: «Rastreo permitido» y sin `noindex`, y «Solicitar indexación» en la portada.
6. **Final:** el sitemap figura como «Correcto» con el número de URL enviadas (puede tardar horas).

### Vuelta atrás

**Se vuelve atrás si, tras el cambio de DNS, pasa cualquiera de estos:**

- la prueba de humo (1) en rojo y sin arreglo en 30 min;
- más del 1 % de las URL conservadas o algún redirect fallan en (2), **sin causa de contenido conocida**;
- 5xx repetidos en los registros de Vercel;
- el formulario no guarda;
- el correo de la empresa deja de llegar (alguien tocó el MX: se arregla el MX, no se revierte el sitio).

**Pasos (🟥 cliente en GoDaddy y dirección en Vercel):**

1. Restaurar en GoDaddy los valores anotados en g.1: `A @ 45.89.205.198` y `CNAME www partequipos.com`. Con TTL 300 la vuelta tarda unos 5 min.
2. Si ya se había abierto la indexación: `NEXT_PUBLIC_PERMITIR_INDEXACION` fuera de Production y redesplegar, para que `vercel.app` no quede indexable.
3. **Final:** `curl.exe -sI https://partequipos.com/` vuelve a dar `Server: LiteSpeed` y `X-Powered-By: PHP`.
4. Si el fallo era del despliegue y no del dominio, el procedimiento de §10.18 (volver al despliegue bueno anterior desde el panel de Vercel) basta, sin tocar el DNS.
5. **Si el sitio da 503 `DEPLOYMENT_PAUSED`**, no se vuelve atrás: es el límite de gasto (a.2). Se sube el límite y se reanuda el proyecto.

---

## i) Qué vigilar las 24–72 h siguientes

| Qué                 | Dónde                                                                                               | Cada cuánto          | Alarma                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| Errores del lambda  | Registros de runtime de Vercel, filtro `error`, prefijos `[proxy]`, `[redirects]`, `[revalidación]` | 2 veces al día       | Cualquier 5xx repetido. **No hay Sentry** (§10.31): nadie avisa solo                                  |
| 404 de URL antiguas | Search Console → Indexación de páginas → «No encontrada (404)»                                      | Diario               | Una URL del mapa que no esté en «pendiente» o «basura», o una ficha de usados indexada (fila 12 de a) |
| Rastreo             | Search Console → Estadísticas de rastreo                                                            | Diario               | Picos de errores de servidor o de tiempo de respuesta                                                 |
| Sitemap             | Search Console → Sitemaps                                                                           | Diario               | Errores de lectura o URL enviadas que no se indexan                                                   |
| Leads               | `/admin` → Solicitudes, y el buzón de `SOLICITUDES_EMAIL_TO`                                        | Diario               | Una solicitud sin su correo de aviso, o en el registro: «Solicitud guardada SIN aviso por correo»     |
| Spam                | Panel de Turnstile en Cloudflare y `solicitudes`                                                    | Diario               | Solicitudes basura que pasan el reto, o un `[turnstile]` en el registro (claves ausentes)             |
| Gasto               | Vercel → Usage y los avisos del límite de gasto (a.2)                                               | Diario               | Un aviso del 50 %, o el uso de optimización de imágenes subiendo sin parar                            |
| Mapbox              | Panel de Mapbox → estadísticas del token                                                            | Una vez a las 48 h   | Cargas de mapa cerca del cupo gratuito                                                                |
| Rendimiento         | Lighthouse con el método de §10.3 p.14; Core Web Vitals en Search Console, cuando haya datos        | Una vez a las 24 h   | LCP móvil por encima de la referencia vigente                                                         |
| Base de datos       | Panel de la base: conexiones y latencia                                                             | Tras cada despliegue | Conexiones cerca del límite del pooler (§10.7)                                                        |
| Prueba de humo      | GitHub → Actions, en cada despliegue                                                                | En cada despliegue   | Rojo: no se promociona (§7)                                                                           |
| Tráfico orgánico    | Search Console → Rendimiento, comparado con la exportación de h                                     | Diario               | Caída sostenida de clics más allá de la volatilidad normal de un cambio de plataforma                 |

**Al cerrar las 72 h** (dirección, con 🟥 el cliente):

- decidir el apagado del WordPress, guardando antes un respaldo completo suyo (ficheros y base) **y una última exportación XML**;
- subir el TTL a su valor habitual;
- redirigir `partequipos.vercel.app` al dominio con un redirect permanente, desde los dominios del proyecto en Vercel.

---

## j) Transferencia del proyecto a la cuenta del cliente

**Quién:** dirección, con 🟥 **el cliente** (dueño de la cuenta de destino).
**Cuándo:** recomendado **antes** del lanzamiento, con tiempo para
comprobarlo todo, y nunca el mismo día del cambio de DNS. Si se hace
después, los dominios se mueven con el proyecto.

**Lo que dice la [documentación de Vercel](https://vercel.com/docs/projects/transferring-projects)** (revisada el 2026-10-14):

- **Sin caída:** el proyecto sigue sirviendo. Mientras dura (de 10 s a 10 min) no se puede desplegar ni cambiar ajustes.
- **Requisitos:** quien transfiere es **Owner** del equipo de origen y **miembro** del de destino. El destino necesita un **medio de pago** válido.
- **Pasan:** despliegues, variables de entorno, configuración, dominios y alias, Git, ajustes de seguridad y nombre.
- **NO pasan:**
  - las integraciones (se vuelven a añadir);
  - los registros de runtime y de build;
  - los datos de monitorización;
  - el uso, que empieza de cero;
  - **los almacenes del Blob**, que tienen su propio mecanismo («Transfer Store»).

**Previa (🟥 cliente y dirección):**

1. El cliente tiene un **equipo de Vercel en Pro**, con medio de pago, y ha invitado a dirección como miembro.
2. Fijar el **límite de gasto** en ese equipo (a.2): es por equipo y no viaja con el proyecto.
3. El equipo del cliente puede leer el repositorio de GitHub: la **GitHub App de Vercel** de su equipo tiene acceso al repositorio. **Si no, los push dejan de desplegar sin avisar** (§10.30).
4. Anotar la lista de variables (`npx vercel env ls`) y los almacenes conectados, para compararla después.

**Acción (dirección):** proyecto → Settings → General → **Transfer
Project** → el equipo del cliente; revisar la lista de dominios y variables y
confirmar.

**El Blob, aparte (dirección y 🟥 cliente):**

- **Almacén del preview:** se transfiere o se crea uno nuevo en el equipo del cliente. Si se crea uno nuevo, cambian su id y su token: hay que cambiar `ALMACEN_PREVIEW` en el código, `.env.local` y `.env.preview.local` (dirección), y volver a sembrar el preview.
- **Almacén de producción (`parte-equipos`):** Storage → el almacén → Settings → **Transfer Store**. La documentación solo describe ese paso entre las cuentas propias (de Hobby a Pro y al revés). **Antes de hacerlo, confirmar con soporte de Vercel**:
  - que se puede transferir al equipo de otra persona;
  - que **conserva el id, las URL y el token**.
- **Si el id cambiara** (o hubiera que crear un almacén nuevo), las ~1.900 URL guardadas en la base y `ALMACEN_PRODUCCION` del código apuntarían al viejo (a.3). Sería un trabajo aparte, con su runbook, y **antes** del lanzamiento.

**Final:**

- El proyecto aparece en el equipo del cliente y el de origen ya no.
- La lista de variables coincide con la previa.
- Un push a una rama de prueba **despliega** en el equipo nuevo: estado «Vercel» en el commit y prueba de humo en verde.
- **La prueba de humo de GitHub sigue funcionando:** usa `VERCEL_AUTOMATION_BYPASS_SECRET` contra los previews. Si la protección de despliegue cambió con la transferencia, el humo de los previews da 302 (§10.20). Entonces dirección genera un secreto nuevo en el equipo del cliente, lo pone en GitHub y en `.env.preview.local`, y **rota** el viejo.
- `npm run blob:almacen`, en la ventana de un runbook, sigue dando el almacén de producción con ✓, y las imágenes de la portada dan 200.

**Fuera de Vercel, que también hay que decidir (🟥 cliente):**

- **Neon:** el proyecto de Neon (base de producción, `preview` y `development`) está en nuestra cuenta. Se transfiere a la organización del cliente o se sustituye por su base (b).
- **GitHub:** el repositorio sigue en nuestra cuenta y **es público** (§10.33). Se transfiere o no; en los dos casos, volver a privado exige Pro en el equipo de Vercel que despliega.
- **Mapbox, Cloudflare (Turnstile), SMTP y Search Console** ya son cuentas del cliente.

---

## k) Importaciones finales con una exportación nueva del WordPress

**Por qué:** el contenido de producción salió de la **exportación XML del
2026-10-07** y de la API de WordPress del 2026-10-14. Lo que el cliente
publique o cambie en WordPress después no está en el sitio nuevo. Antes del
lanzamiento se repiten las importaciones con una exportación nueva, para no
perder ese contenido.

**Todo esto va ANTES del cambio de DNS** (ver «Orden general»).

### k.1) Congelar el WordPress y exportación final

1. 🟥 **CLIENTE:** desde una fecha acordada (**T − 3 días**), **nadie publica ni edita** en el WordPress. Lo que se cambie después no llega al sitio nuevo.
2. 🟥 **CLIENTE** (o dirección con acceso): Herramientas → Exportar → **Todo el contenido**. Se guarda como `Desktop\partequipos-diseno\wordpress-cliente\partequipos.WordPress.<fecha>.xml`, **fuera del repositorio** (lleva datos personales: seriales, correos).
3. **Agente:** con la exportación nueva, en el preview, extrae las fuentes y compara con las de producción. Saca la lista de lo **nuevo**, lo **cambiado** y lo **desaparecido** por importador. Así dirección sabe qué esperar de cada simulación.

### k.2) Qué hace cada importador al repetirse

**Leído en el código el 2026-10-14.** Todos son **idempotentes** (sin
duplicados) y, en general, **no borran lo que desaparece** de la exportación
nueva. Lo que el cliente quitó de WordPress se queda en el sitio nuevo, y se
retira a mano desde el panel.

**Dos excepciones que sí borran:**

- **Contenido real:** las sedes que no están en la fuente.
- **Repuestos:** los tipos y modelos que no existen en WordPress (la demo).
  Está acotado a la demo aprobada (2 tipos y 25 modelos, o ninguno); con
  cualquier otro recuento se para.

| Importador (runbook)               | Fuente                                                | Existentes                                                                                                                                            | Nuevos               | Imágenes ya subidas                                                          |
| ---------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| Repuestos (1)                      | XML → `scripts/repuestos/extraer-xml.py`              | Se **sobrescriben** siempre (marcas, tipos, modelos; nombre, textos y SEO). No pisa una imagen elegida por un editor                                  | Se crean             | Se reutilizan por el id del adjunto de WordPress                             |
| Blog y páginas (2)                 | **API de WordPress en vivo** (`/wp-json/`), no el XML | Se **sobrescriben** por slug. **La firma de un artículo cambiada en el panel se pierde**                                                              | Se crean             | Se reutilizan por el nombre `wp-AAAA-MM-…`                                   |
| Usados (3)                         | XML → `scripts/usados/extraer-xml.py`                 | **Se saltan**, salvo con `actualizar`: datos, categoría, fotos y **`disponible` a sí** (pisa lo marcado en el panel)                                  | Se crean, por tandas | Se reutilizan por el id del adjunto                                          |
| Fichas nuevas                      | XML → `scripts/maquinaria/extraer-xml.py`             | **Se saltan**, salvo con `actualizar`: lo reescribe casi todo, también **«Destacar» a no** en la ficha técnica                                        | Se crean, por tandas | Se reutilizan; un PDF con el mismo nombre no se vuelve a subir               |
| Servicio técnico y lubricantes (B) | XML → `scripts/servicio-lubricantes/extraer-xml.py`   | Se **sobrescriben** (página, marca y sus 4 categorías; la lista de productos se reemplaza entera)                                                     | Entran en la lista   | Se reutilizan por nombre                                                     |
| Contenido real de home y Nosotros  | XML → `scripts/contenido-real/extraer-xml.py`         | Se **sobrescriben**. **Lo que un editor cambie después en esas secciones de la portada se pierde.** Las sedes que no estén en la fuente **se borran** | Se crean             | Se reutilizan por clave: una foto distinta con la misma clave **no se sube** |

**Dos avisos que salen de esa lectura:**

- **`actualizar` en usados y fichas avanza por tandas** (desde el 2026-10-14): el manifiesto guarda qué registros se actualizaron ya con esa fuente, y cada ejecución sigue por donde iba hasta que no queda ninguno. Con una exportación nueva (otro fichero fuente) empieza de cero sola; `reiniciar` lo fuerza con la misma. Antes tomaba siempre los primeros 10 o 20.
- **Repuestos puede negarse a ejecutarse** si un tipo creado en la primera importación ya no está en la exportación nueva: lo cuenta como «demo» y la comprobación solo acepta la demo aprobada (inferido del código, no probado). **Si la simulación se niega, se para y se avisa al agente.**

**Lo que cambia la regla de «sobrescribe»:** cualquier corrección hecha
**en el panel de producción** sobre un registro importado (un texto, una
firma, una ficha destacada, una sección de la portada) **se pierde** al
repetir. Antes de k.3, dirección pregunta al cliente y al equipo qué se ha
corregido en el panel desde el 2026-10-14. Esos cambios o se hacen también
en WordPress antes de la exportación, o se vuelven a hacer en el panel
después.

### k.3) Orden

Cada runbook, completo y con su comprobación final, antes del siguiente.
Todos desde `Devs\Partequipos-runbooks` (0) y con la exportación nueva en la
variable `$XML` del runbook.

| #   | Runbook (en `Desktop\partequipos-cierre\`)               | Estado a 2026-10-14                    | Qué hacer con la exportación nueva                                                                                                            |
| --- | -------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Servicio técnico y lubricantes (B)                       | Sin ejecutar                           | Ejecutarlo directamente con la exportación nueva                                                                                              |
| 2   | Fotos de los índices (D), por el panel                   | Sin ejecutar                           | No depende del XML                                                                                                                            |
| 3   | Retirada de la copia de demostración (c)                 | Sin ejecutar                           | No depende del XML. **Antes del 5**: el contenido real se niega si queda copia                                                                |
| 4   | Repuestos (1)                                            | Ejecutado (exportación del 2026-10-07) | Extraer, **simular**, importar. Revisar en la simulación lo creado y lo cambiado                                                              |
| 5   | Contenido real de home y Nosotros                        | Sin ejecutar                           | Ejecutarlo con la exportación nueva. Necesita las marcas y categorías de 4                                                                    |
| 6   | Fichas de maquinaria nueva                               | Ejecutado (exportación del 2026-10-07) | Simular, importar las nuevas y, si cambiaron datos, `actualizar` (repetir hasta «quedan después: 0»)                                          |
| 7   | Usados (3)                                               | Ejecutado (exportación del 2026-10-07) | Simular, importar las nuevas (por tandas) y, si cambiaron, `actualizar` (repetir hasta «quedan después: 0»). Las vendidas, a mano en el panel |
| 8   | Blog y páginas de texto (2)                              | Ejecutado (API del 2026-10-14)         | Volver a ejecutar **mientras el WordPress siga en el dominio**: lee la API en vivo                                                            |
| 9   | Redeploy sin caché de build, `db:check` y prueba de humo | —                                      | Una sola vez al final: los scripts no revalidan lo prerenderizado                                                                             |
| 10  | Las 650 URL contra `vercel.app` (f)                      | —                                      | Código 0 en estricto                                                                                                                          |

**Presupuesto del Blob:** solo se suben las imágenes nuevas; las ya subidas se
reutilizan. Con Pro no hay cupo que agotar (a.2).

**Final del bloque:** el agente pinta la home, Nosotros, una ficha de
repuestos, una de maquinaria nueva, una de usados y un artículo en el
despliegue de producción, y dirección le pasa los recuentos de cada runbook.

---

## Qué depende del cliente

| #   | Qué                                                                                       | Paso   | Bloquea                      |
| --- | ----------------------------------------------------------------------------------------- | ------ | ---------------------------- |
| 1   | Equipo de Vercel en Pro, medio de pago y límite de gasto, si el proyecto pasa a su cuenta | a.2, j | Sí, si se transfiere         |
| 2   | Dónde vive la base definitiva (o transferir el proyecto de Neon)                          | b, j   | **Sí**                       |
| 3   | Claves de Turnstile con `partequipos.com` en sus dominios                                 | a, d   | **Sí**                       |
| 4   | Valores SMTP de producción, `SOLICITUDES_EMAIL_TO` y SPF/DKIM del remitente               | a, d   | **Sí**                       |
| 5   | Mapbox: medio de pago (y crear el token restringido, si lo hace él)                       | a.4    | No                           |
| 6   | Acceso a GoDaddy 48 h antes y el día del cambio                                           | g      | **Sí**                       |
| 7   | Textos legales: confirmar que los importados son los vigentes                             | a      | **Sí**                       |
| 8   | Congelar el WordPress y la exportación final                                              | k.1    | **Sí**                       |
| 9   | Las 14 URL pendientes y las 4 de maquinaria vivas                                         | a, f   | **Sí**                       |
| 10  | Las 128 fichas de usados de WordPress: página propia, redirect o 404                      | a      | No                           |
| 11  | Licencias L1–L5, o aceptar la retirada de §10.38                                          | c      | **Sí**                       |
| 12  | Acceso a Search Console y exportaciones previas                                           | h      | No, pero sin él no se vigila |
| 13  | Sentry (cuenta, plan y región)                                                            | a      | Contractual                  |
| 14  | Razón social, NIT, redes, teléfono y favicon                                              | a      | No                           |

---

## Resultado de la ejecución en seco (2026-10-03)

| Paso | Comprobado ese día, sin escribir                                           | Resultado                                                                                                                                                           |
| ---- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a    | DNS público, MX y TXT de `partequipos.com`; nombres de variables en Vercel | GoDaddy, WordPress en `45.89.205.198`, correo en Microsoft 365, `TXT` de Resend ya presente; faltaban las variables de Turnstile, SMTP, Mapbox, Sentry e indexación |
| b    | —                                                                          | Sin base definitiva. «Migrar desde cero» lo prueba CI en cada PR                                                                                                    |
| c    | —                                                                          | Runbook de retirada probado (§10.38)                                                                                                                                |
| d    | Canónico y sitemap de producción                                           | `NEXT_PUBLIC_SERVER_URL` de producción es `vercel.app`: **hay que cambiarlo el día del lanzamiento**                                                                |
| e    | Las tres vías del bloqueo                                                  | Activas                                                                                                                                                             |
| f    | `npm run lanzamiento:urls` contra `partequipos.vercel.app`                 | 171 conservadas en 200 y 447 en 404 por contenido; 10/10 redirects en 301 de un salto; 0 errores de mecanismo                                                       |
| g    | TTL y registros actuales; `www` responde 301 al apex                       | Valores anotados en g.1 para la vuelta atrás                                                                                                                        |
| h    | La prueba de humo corre en cada despliegue                                 | —                                                                                                                                                                   |
