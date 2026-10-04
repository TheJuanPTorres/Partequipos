# Decisiones del panel de Payload

Registro de las decisiones del trabajo sobre el panel (agente C). Auditoría de
partida: `Desktop\partequipos-cierre\informes\2026-10-02-auditoria-panel.md`.

## 1. Orden 1 de la auditoría (2026-10-02, rama `feat/panel-orden-1`)

Aprobado por dirección: cuatro mejoras sin cambio de esquema.

### 1.1 Marca y tipo coherentes

- **Problema:** modelos de repuesto y equipos nuevos guardan `marca` y `tipo`,
  y el tipo ya pertenece a una marca. El desplegable de tipos solo se filtra si
  la marca se elige antes; cambiarla después dejaba el tipo viejo, sin error.
  La ficha salía con las migas y el JSON-LD de una marca y la URL de otra.
- **Decisión:** se rechaza al guardar, con el mensaje junto a «Tipo de
  equipo»: gancho `marcaDelTipoCoincide`
  (`src/collections/hooks/marcaDelTipo.ts`), en `beforeValidate`. Corre en el
  panel, la API y la API local de los scripts.
- **Descartado:** derivar la marca del tipo y ocultarla. Ahorra un paso, pero
  cambia cómo trabaja el editor y lo aprobado era comprobar.
- **Datos existentes:** 0 filas incoherentes en `development`, `preview` y
  `production` (81 modelos y 38 equipos nuevos en cada una, SQL de solo
  lectura), así que nada ya guardado queda bloqueado.
- **Verificado por efecto** (§10.15) con `npm run qa:marca-tipo` contra
  `development`: crear con tipo de otra marca, y cambiar solo el tipo o solo la
  marca, se rechazan y la base no cambia; crear coherente se guarda. Deja la
  base como estaba.

### 1.2 Ayudas en lenguaje llano

Sin «URL indexada», «redirect 301», «ADR», «JSON-LD», «breadcrumbs» ni «OG» en
lo que lee el editor:

| Dónde                              | Antes                                         | Ahora                                                                                   |
| ---------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Slug (todas las colecciones)       | «Slug» y la URL indexada, el 301 y el ADR     | «Slug (dirección web)», qué es y a quién pedir el cambio                                |
| Marca en modelos y equipos nuevos  | «Desnormalizada para consultas y breadcrumbs» | Tiene que ser la del tipo; si cambia, volver a elegir el tipo                           |
| Grupo SEO                          | «SEO», «Meta título», «Imagen social (OG)»    | «Buscadores y redes sociales», «Título para buscadores», «Imagen al compartir en redes» |
| Artículos                          | `/{slug}/`, «archivo», «JSON-LD»              | La dirección real, «listado del blog», «la fecha que ven los buscadores»                |
| Permiso de editar slugs            | «redirect 301», «ADR 0005»                    | Qué permite y qué pasa con la dirección antigua                                         |
| Estado del destino (redirecciones) | «`npm run redirects:check`»                   | «el equipo técnico»                                                                     |
| Choque de slug artículo/página     | «espacio de URLs raíz»                        | Las dos viven en `partequipos.com/<slug>/`                                              |

Solo cambian etiquetas y descripciones: ni columnas ni migración (comprobado
con `npm run db:deriva`).

`PaginaInstitucional.ts` (terreno del agente B) quedó fuera; sus textos van
en §3.

### 1.3 Imágenes (`media`)

- Etiqueta «Imagen» / «Imágenes» en vez de «Media»: la colección solo admite
  JPEG, PNG y WebP.
- Columnas: fichero, texto alternativo y fecha, para ver de un vistazo los
  `alt` flojos. Búsqueda por fichero y texto alternativo.
- Descripción con los formatos y para qué sirve el texto alternativo.

### 1.4 Búsqueda por código

`listSearchableFields`: modelos por nombre y código («320D»), equipos nuevos
por nombre y código, equipos usados por nombre, marca y modelo.

## 2. Guía breve del editor (2026-10-02, rama `feat/panel-guia-editor`)

Entregable cotizado del Sprint 4 (`docs/PLAN-MVP.md`): `docs/guia-editor.md`.
Escrita contra el panel después del orden 1 (etiquetas nuevas) y con los
mensajes de error copiados del código. Dice claro lo que hoy no hay:
borradores, historial, recuperación de contraseña por correo y edición del
teléfono y las redes desde el panel.

## 3. Textos de Páginas (2026-10-03, rama `feat/panel-textos-paginas`)

Aprobado por dirección como ayuda del panel. Antes se comprobó que ninguna
rama abierta del agente B toca `PaginaInstitucional.ts` (la única que lo
tocaba, `feat/pagina-nosotros`, ya está fusionada y es idéntica a `main`).

| Dónde          | Antes                                                          | Ahora                                                         |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| Colección      | «El slug es la ruta completa… son URLs indexadas»              | Qué páginas hay y por qué no cambiar la ruta de una publicada |
| Campo de ruta  | «Ruta (slug)», «Ej: 'nosotros'…»                               | «Ruta (dirección web)», con los ejemplos entre comillas «»    |
| Tipo de página | «Las legales no deberían despublicarse» (no existe esa acción) | Para qué es «Legal / cumplimiento» y que no se borran         |

**Hallazgo anotado, sin tocar:** a diferencia del resto de colecciones, la
ruta de las páginas **no se bloquea** tras crearlas (es un campo de texto
propio, no `slugField`). **Corregido el 2026-10-03:** este párrafo decía
además que nada creaba el 301; era falso: `revalidarPagina` ya lo crea al
cambiar la ruta. El bloqueo se hizo en §4.

## 4. Ruta de las páginas bloqueada tras crearlas (2026-10-03, rama `feat/panel-slug-paginas`)

Aprobado por dirección. Sin esquema.

- El acceso del slug sale de `slugField` a `slugEditable`
  (`src/lib/fields/slugField.ts`) y se aplica también a la ruta de
  `PaginaInstitucional`: se escribe al crear y, después, solo con el permiso
  «Puede editar slugs ya publicados». El 301 desde la ruta anterior lo crea
  `revalidarPagina`, como antes.
- **Pruebas:** `slugField.test.ts` cubre la regla y que el bloqueo esté
  puesto en `slugField` y en la ruta de las páginas. Quitando el bloqueo, la
  prueba falla.
- **Por efecto** (§10.15), con `npm run qa:slug-paginas` contra
  `development`:
  - Un editor sin el permiso no cambia la ruta: Payload lo descarta en
    silencio y la base no cambia.
  - Con el permiso, sí la cambia, y se crea la redirección.
  - No quedan restos.
  - Quitando el bloqueo, la comprobación sale en rojo.
- `src/payload-types.ts` regenerado: solo cambian comentarios, que recogen
  las descripciones de los PR #46, #48 y de este.

## 5. Revisión del panel en pantalla (2026-10-03, rama `feat/panel-revision-pantalla`)

`npm run panel:revision -- <url del preview>` (`scripts/qa/revision-panel.mjs`).

- **Cuenta:** la lee el propio script de `.env.editor-preview.local`
  (rol Editor; la rellena dirección). Solo imprime los **nombres** de las
  claves, nunca los valores. El agente no abre ese fichero: los permisos se
  lo deniegan.
- **Destino:** solo un preview del proyecto (`partequipos-*.vercel.app`).
  Rechaza producción y cualquier otro host antes de leer la cuenta
  (comprobado). El token de la protección va solo a ese origen.
- **Herramienta:** `playwright-core` 1.63.0 por `npx`, como `puppeteer-core`
  en `vuelo-pie`. No añade dependencias. Usa el Chrome instalado y ningún MCP.
- **Qué hace:** a 1440 y a 390 captura la portada del panel, Imágenes,
  Páginas, Modelos y el formulario del primer modelo. Busca además textos en
  inglés y errores de consola. Las capturas van fuera del repositorio, en
  `Desktop\partequipos-cierre\capturas\panel-<fecha>\`. No escribe nada.
- **Primera corrida:** el «formulario» salió igual que la lista, porque el
  primer enlace de la página era el de «Crear». Se corrigió para coger un
  enlace de fila.

## 6. Arreglos de la revisión en pantalla (2026-10-04, rama `feat/panel-arreglos-revision`)

Aprobados por dirección. Sin esquema. Cada uno se vio en las capturas de
`npm run panel:revision`; las de antes y después van en el informe del día.

| #   | Qué se veía                                            | Causa                                                                                                                                                 | Arreglo                                                                                                                      |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fechas «septiembre 15° 2026, 11:56 PM»                 | El formato por defecto de Payload (`MMMM do yyyy, h:mm a`) con la traducción al español                                                               | `admin.dateFormat: "d MMM yyyy, HH:mm"`                                                                                      |
| 2   | Pestaña «API» en cada formulario, con el JSON en bruto | Opción por defecto de Payload                                                                                                                         | `admin.hideAPIURL: true` en todas las colecciones y globales (`sinPestanaApi` en `payload.config.ts`). La API REST no cambia |
| 3   | «Buscar por Nombre **O** Código»                       | La traducción `general.or` de Payload es «O»                                                                                                          | `i18n.translations.es.general.or = "o"`; en el constructor de filtros, donde empieza línea, vuelve la mayúscula por CSS      |
| 4   | Móvil: en Modelos no se veían los números de página    | La barra de selección de Payload va fija abajo con fondo opaco aunque esté vacía, y tapaba la paginación (comprobado con `elementFromPoint` a 390 px) | Se oculta cuando no hay nada seleccionado (`:has(... :empty:only-child)`)                                                    |
| 5   | Móvil: «Creado:» cortado por la derecha                | La barra de fechas tiene altura fija y `overflow: hidden`; no puede bajar de línea                                                                    | ≤ 768 px: solo «Última modificación»                                                                                         |

## 7. «Ver en el sitio» (2026-10-04, rama `feat/panel-ver-en-el-sitio`)

Aprobado por dirección. Sin esquema.

- **Qué es:** el `admin.preview` de Payload, que pinta en el formulario un
  enlace con `target="_blank"`. Lo pone `conVerEnElSitio` en
  `payload.config.ts` en las 13 colecciones con página pública. La ruta la
  calcula `src/lib/panel/verEnElSitio.ts` con las mismas `rutas` del sitio.
  El texto del botón es «Ver en el sitio»; Payload decía «Vista previa», y
  aquí no hay borradores que previsualizar.
- **Ruta relativa a propósito:** el panel y el sitio son la misma app, así que
  el enlace abre la página del mismo despliegue. En un preview `NEXT_PUBLIC_SERVER_URL`
  apunta a producción (§10.21) y el enlace llevaría a otra base.
- **Cuándo no hay botón:** sin slug, o si no se encuentra la relación (marca o
  tipo). Así no se enlaza a un 404. Colecciones sin página propia (usados,
  sedes, testimonios, solicitudes…): no lo tienen.
- **Botón con texto:** el `PreviewButton` de Payload es solo un icono, con el
  texto en `title`, y en la primera captura no se entendía qué hacía. Se
  sustituye por `src/components/admin/VerEnElSitio.tsx`: el `Button` de
  Payload como enlace, con «Ver en el sitio», el icono y la misma URL. En
  móvil (≤ 768 px) queda el icono, y el texto pasa a ser solo para lectores de
  pantalla.
- `rutaDePagina` (la portada `inicio` es `/`) se movió aquí desde
  `revalidateHooks.ts`, que ahora la importa: la ruta de una página la decide
  un solo sitio.
