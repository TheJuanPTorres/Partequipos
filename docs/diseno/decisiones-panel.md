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

## 8. SEO guiado (2026-10-04, rama `feat/panel-seo-guiado`)

Aprobado por dirección. **Sin esquema:** `vistaBuscadores` es un campo `ui`
del grupo SEO, y los campos `ui` no guardan nada ni tienen columna.

- **Qué enseña:** debajo de «Buscadores y redes sociales», mientras se
  escribe (`src/components/admin/SeoGuiado.tsx`):
  - cómo saldrá en Google;
  - un contador de caracteres para el título (hasta 60) y la descripción
    (120–160; a partir de 160 el sitio la corta con «…»);
  - qué se usa si cada campo queda vacío;
  - qué imagen gana a la social.
- **Una sola fuente para panel y sitio:** las plantillas del título por
  defecto (`Repuestos ${modelo}`, `${categoría} nuevas`…) estaban escritas
  en cada página. Pasan a `src/lib/seo/porDefecto.ts` y las 8 páginas del
  catálogo las importan: el panel no puede enseñar un título distinto del que
  pone el sitio. `buildMetadata` usa también de ahí el recorte a 160.
  `src/lib/seo/seoPanel.ts` dice, por colección, de qué campo sale el nombre
  y la descripción y qué imagen gana. Las rutas `[...slug]` (páginas y
  artículos) y la home no se tocaron: usan el título tal cual.
- **Hallazgos, sin cambiar el sitio:**
  - `seoConfig.titleTemplate` («%s | Partequipos») **no se usa** en ninguna
    parte: el título sale tal cual se escribe. La guía del editor decía que
    «Partequipos» se añadía solo; se corrigió.
  - Cuando la ficha tiene imagen propia (primera de la galería, logo o imagen
    destacada), esa imagen gana a «Imagen al compartir en redes».
  - `CategoriaTecnica` tiene el grupo SEO, pero ninguna página propia: sus
    campos no se usan, y el bloque lo dice.
- **Colores:** la vista de Google va siempre en blanco, con los colores de su
  resultado (≥ 7:1). El estado del contador lo dice el texto; el punto de
  color es solo un apoyo.

## 9. Concordancia de «nuevas/usadas» (2026-10-04, rama `feat/panel-concordancia-titulos`)

Aprobado por dirección. El título por defecto y el `<h1>` de las categorías
decían «nuevas» y «usadas» para todas, y salían mal en 7 de las 11:

- **Nuevas:** «Compactadores nuevas» y «Cargadores nuevas».
- **Usadas:** «Bulldozers», «Minicargadores», «Compactadores», «Cargadores» y
  «Vibrocompactadores usadas».

`concuerda` (`src/lib/seo/porDefecto.ts`): si la última palabra del nombre
acaba en «-as», femenino; si no, masculino. Cubre las 11 de hoy, que están
en las pruebas. Una categoría nueva que no siga la regla se ve en el SEO
guiado del panel antes de publicarla. Lo usan el `generateMetadata`, el
`<h1>` de las dos páginas de categoría y el panel. Sin esquema.

## 10. Datos de la empresa en el panel (2026-10-04, rama `feat/panel-datos-empresa`)

Aprobado por dirección. **Cambio de esquema**, con la ventana de migraciones
tomada por C.

- **Panel:** en el global «SEO y datos de la empresa», un grupo nuevo,
  «Contacto de la empresa»:
  - campos: teléfono, WhatsApp (vacío = el teléfono), correo, dirección,
    ciudad y redes;
  - validaciones en español: número con indicativo y redes con `https://`.
- **Lectura:** `getEmpresa()` (`src/lib/queries/getSeo.ts`) devuelve los datos
  del global, con respaldo **campo a campo** en `src/lib/seo/config.ts`
  (función pura en `src/lib/seo/empresa.ts`, con pruebas). Si un campo queda
  vacío, o la base aún no tiene la migración, el sitio pinta lo de siempre.
- **Consumidores:**
  - el pie (teléfono, WhatsApp, correo, dirección y redes) y la cabecera
    (WhatsApp);
  - la home (WhatsApp y JSON-LD) y el índice de repuestos (JSON-LD);
  - `/contactanos/` (WhatsApp) y las dos fichas (WhatsApp con mensaje);
  - el JSON-LD `Organization` y el destino del aviso de solicitudes, si no hay
    `SOLICITUDES_EMAIL_TO`.
  - `lib/whatsapp.ts` ahora recibe el número.
- **Migración `20261004_175926_empresa_contacto`** (va después de la de B,
  `animaciones`): columnas `seo.empresa_*` y la tabla `seo_empresa_redes`.
  Siembra con SQL explícito (§3.5) los mismos valores de `config.ts`, sobre
  la fila 1 del global, la que creó la migración del horario.
- **`config.ts`:** queda como respaldo y solo cambia su comentario. Lo editó la
  herramienta de edición sobre un fragmento sin el patrón del almacén
  (permitido por dirección).
- La razón social y el NIT siguen en `config.ts`, pendientes del cliente
  (CLAUDE.md §10.3).

## 11. Logo institucional en el panel (2026-10-04, rama `feat/panel-logo`)

Aprobado por dirección (CLAUDE.md §10.8). **Cambio de esquema**, con la
ventana de migraciones tomada por C.

- **Panel:** en el global «SEO y datos de la empresa», sección «Imágenes»,
  campo de subida «Logo» (colección `media`, que ya solo admite JPEG, PNG y
  WebP).
- **Respaldo, distinto por sitio, para que con el campo vacío NADA cambie**
  (`src/lib/seo/logo.ts`, con pruebas):
  - cabecera y pie: `public/logo-partequipos.png` (el de Andrés,
    transparente), 187 × 51;
  - JSON-LD `Organization` (home e índice de repuestos) y `Article.publisher`:
    `seoConfig.logoPath`;
  - imagen social de las páginas sin imagen propia: `seoConfig.defaultOgImagePath`.
- **Con el logo subido**, los cuatro usan el de `Media`. En la cabecera y el
  pie las medidas se escalan a 187 px de ancho con su proporción, para que
  `next/image` no genere el `srcset` del original.
- **Lectura:** el global `seo` se pide UNA vez por petición (`getSeoGlobal`,
  `depth: 1`) y de ahí salen `getHorario`, `getEmpresa` y `getLogo`.
- **Metadata:** las 20 páginas pasan de `buildMetadata` (puro, sigue con sus
  pruebas) a `metadataDe` (`src/lib/seo/metadata.ts`), que añade la imagen
  social por defecto. Las `generateMetadata` síncronas pasan a `async`, y
  `/noticias/` cambia su `metadata` constante por `generateMetadata`.
- **Migración `20261004_191621_logo_institucional`:** solo esquema (columna
  `seo.logo_id`, su clave foránea a `media` con `ON DELETE set null` y su
  índice). Borrar el logo en `Media` deja el campo vacío y el sitio vuelve al
  de siempre.
- **No cambia:** el favicon del panel (`payload.config.ts`, sigue con
  `seoConfig.logoPath`; el favicon espera el icono cuadrado, §10.3 p.15) y el
  logo del propio panel (`partequipos-wordmark`).
- **Ojo al subirlo (para dirección):** el mismo fichero sirve para la cabecera
  (fondo claro) y como imagen social. Un PNG transparente con letras oscuras
  se ve bien en la cabecera, pero algunas redes pintan la transparencia en
  negro. Si molesta, cada página puede llevar su propia imagen social.

## 12. Imagen al compartir por defecto (2026-10-04, rama `feat/panel-imagen-social`)

Aprobado por dirección. **Cambio de esquema**, con la ventana tomada por C.

- **Por qué:** el logo es un PNG transparente con letras oscuras, bueno para
  la cabecera pero no para las redes: algunas pintan la transparencia en negro
  (§11).
- **Panel:** en «Imágenes», junto al logo, campo opcional «Imagen al compartir
  por defecto» (opaca, 1200 × 630).
- **Respaldo en cadena** (`urlImagenSocialPorDefecto`, con pruebas): la imagen
  social del panel → el logo del panel → `seoConfig.defaultOgImagePath`. Solo
  para `og:image` y `twitter:image` de las páginas sin imagen propia.
- **El JSON-LD `Organization` y `Article.publisher` siguen con el logo.**
- **Migración `20261004_205655_imagen_social`:** solo esquema (columna
  `seo.imagen_social_id`, clave foránea a `media` con `ON DELETE set null` e
  índice).
- **Probado en `development`** con imágenes de demostración, y retiradas
  después: solo la imagen social (redes con ella, JSON-LD con el logo de
  siempre) y las dos a la vez (redes con la imagen social; cabecera, pie y
  JSON-LD con el logo).
