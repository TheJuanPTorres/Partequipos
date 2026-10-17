# Importación de la maquinaria usada de WordPress

Las **128 unidades** del tipo «maquinaria» del WordPress actual («Maquinaria /
Usados»), con sus **1.493 fotos**, a `equipos-usados` y `Media`. Mismo método
que el blog (`docs/blog-importacion.md`): simulación, idempotencia, manifiesto
y retirada exacta. Decisiones de dirección del 2026-10-07.

## 1. Fuente: un JSON extraído del XML, fuera del repositorio

La API pública de WordPress da la lista y las fotos, pero **no los campos ACF**
(`acf: {}`): referencia, horas, peso, serial y descripción. Por decisión de
dirección, no se pide al cliente que active la API: se usa la **exportación
XML** que entregó.

| Paso | Qué                                                                                                        |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| 1    | `python -I scripts/usados/extraer-xml.py <exportacion.xml> <salida.json>`                                  |
| 2    | La salida va a `Desktop\partequipos-cierre\usados-wordpress.json`. **Nunca al repositorio ni a `public/`** |

La exportación completa **tiene datos personales** (usuarios, y comentarios con
correo e IP). El extractor **no lee** autores, usuarios ni comentarios: solo
las unidades publicadas (el borrador se omite), sus campos ACF y taxonomías, y
los adjuntos que cuelgan de cada unidad. El JSON lleva el **serial**, que no es
un dato personal pero no se publica: hace falta para quitarlo.

## 2. Cómo se convierte cada campo

| WordPress                     | `equipos-usados` | Regla                                                                                                                                                         |
| ----------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Categoría                     | `categoria`      | EXCAVADORAS → «Excavadoras»; MINIEXCAVADORA → **«Miniexcavadoras»** (nueva, ver §3). La unidad sin categoría (1), por su peso: menos de 6 t, miniexcavadora   |
| Título («EXCAVADORA HITACHI») | `nombre`         | **Compuesto:** tipo, marca, modelo y año. «Excavadora Hitachi ZX350H-5B 2016». Sin año, sin año                                                               |
| `marcas`                      | `marca`          | «Hitachi», «LiuGong»                                                                                                                                          |
| `referencia`                  | `modelo`         | Sin espacios sobrantes ni la marca delante («HITACHI ZX40U-5 » → «ZX40U-5»)                                                                                   |
| `ano`                         | `anio`           | Cuatro cifras; si falta, el de la descripción («año 2003»), o vacío                                                                                           |
| `horas`                       | `horometro`      | «6313» y «4.219» (punto de miles) → número. **«PENDIENTE» → vacío** (3). Si el campo no se entiende («4.92»), el número de la descripción («4.926 horas») (1) |
| `peso`                        | `pesoOperativo`  | «7,5» y «7.5» → 7,5 t. Es la clase de peso de WordPress                                                                                                       |
| `descripcionequipo`           | `descripcion`    | **Texto plano y sin el serial.** Los emojis que WordPress pinta como imagen (📞) vuelven a ser su carácter                                                    |
| Fotos (adjuntos)              | `imagenes`       | En el orden en que se subieron. Los 3 `.zip` no son fotos y se omiten                                                                                         |
| Estado publicado              | `disponible`     | `true`                                                                                                                                                        |
| `serial`                      | —                | **No se publica** (§4)                                                                                                                                        |
| Potencia, motor, alcance…     | —                | Vacíos en las 128                                                                                                                                             |

## 3. La categoría «Miniexcavadoras»: un dato, no esquema

`categorias-usada` es una colección: la categoría es **un registro**, sin
migración. El listado (`generateStaticParams` de
`/maquinaria-pesada/maquinaria-pesada-usada/[categoria]/`) y el sitemap las leen
de la base, así que la URL
`/maquinaria-pesada/maquinaria-pesada-usada/miniexcavadoras/` aparece sola
(aprobada por dirección, §3.3). La crea el importador y la apunta en el
manifiesto: la retirada la borra.

Las miniexcavadoras salen en la portada en la pestaña **«Otros»**: la sección 3
separa «Excavadoras» del resto por el slug de la categoría.

## 4. El número de serie no se publica

Decisión de dirección. En WordPress va en la descripción, en el texto
alternativo de cada foto, en el nombre de cada fichero y en la URL de 52
unidades. Aquí:

| Dónde                | Cómo se quita                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Descripción          | `descripcionSinSerial`: con lo que lo presenta («y serial X…», «, serial X …», «SN X…»). Si quedara, la unidad iría sin descripción   |
| Texto alternativo    | `altDeFoto`: el de WordPress sin el serial ni la numeración del fichero («(1)», «-001»), más «foto n de N». Sin texto útil, el nombre |
| Nombre del fichero   | `nombreDeFicheroUsado`: `wp-usado-<id del adjunto>-<nombre de la unidad>.jpg`. El id es único y estable                               |
| Registros de consola | El script identifica cada unidad por su id de WordPress, nunca por el serial                                                          |

`contieneSerial` lo busca también pegado o con espacios («X 9876», «snx9876»).

**Corregido el 2026-10-14: cualquier «serial <código>», no solo el del campo.**
Un agente encontró en el preview 2 descripciones que conservaban la palabra
«serial» con un código:

- en una, el código era **la parte final** del serial de su ficha;
- en la otra, **un código distinto** del que guarda la ficha.

La limpieza solo buscaba el serial completo del campo. Ahora `quitarSerial`
quita además cualquier mención con su código (`MENCION_SERIAL`): «serial A1234»,
«serial X 98765», «S/N 12345», «número de serie 4321». El código tiene que
llevar al menos un dígito, así que «serial y motor» o «serie ZX» no se tocan.
Si después quedara una mención (`mencionaSerial`), la unidad va sin descripción.

Medido sobre las 128 con la limpieza nueva: **0** descripciones y **0** textos
alternativos con el serial o con una mención de serial; ninguna unidad pierde
la descripción.

**Texto alternativo:** 1.423 de las 1.493 fotos lo traen («EXCAVADORA HITACHI
ZX200-6 SN …»); las 70 restantes usan el nombre de la unidad. Se añade «foto n
de N» porque todas las fotos de una unidad traían el mismo texto.

## 5. Avisos de datos (para el cliente)

El script los imprime en la simulación; se importa el campo de WordPress.

| Unidad (id WP) | Qué                                                                             |
| -------------- | ------------------------------------------------------------------------------- |
| 47293          | Sin categoría en WordPress; va a «Excavadoras» por su peso (35 t)               |
| 53674          | Horas: 4643 en el campo y «46431» en la descripción                             |
| 54694          | Horas: 2195 en el campo y 6313 en la descripción (texto copiado de otra unidad) |
| 50298          | La referencia «ZX35U5-A» no aparece en la descripción (¿«ZX35U-5A»?)            |
| 54487          | Sin año en WordPress; 2003, tomado de su descripción                            |
| 3 unidades     | Horas «PENDIENTE»: van sin horómetro                                            |

Además, en WordPress hay «excavadoras» de 3,5 y 4 t, el mismo peso que algunas
miniexcavadoras. Se respeta la categoría de WordPress.

## 6. Uso

```
npm run preview:usados:simular             # no escribe ni pide nada a WordPress
npm run preview:usados:simular -- fotos    # además, comprueba cada foto (~17 min)
npm run preview:usados:importar            # una tanda de 10 unidades
npm run preview:usados:importar -- tanda=20
npm run preview:usados:importar -- tanda=200 actualizar   # reaplica los datos a las ya importadas
npm run preview:usados:retirar
```

- **Por tandas:** cada ejecución importa como mucho `tanda` unidades y termina;
  la siguiente sigue donde se quedó. La memoria del proceso no crece con las
  1.493 fotos.
- **Idempotente:** cada foto se busca por el **id de su adjunto**
  (`wp-usado-<id>-…`), no por el nombre entero, que lleva el de la unidad y
  puede cambiar; cada unidad, por el manifiesto o, sin él, por su primera foto.
  Una unidad ya importada se actualiza, no se duplica. Probado con un
  manifiesto al que le faltaba una unidad: la actualizó y no subió ninguna
  foto.
- **`actualizar`:** vuelve a aplicar los datos a las unidades ya importadas
  (tras corregir una regla) y rehace su texto alternativo. **Avanza por
  tandas** (desde el 2026-10-14): el manifiesto guarda en `actualizacion` qué
  unidades se actualizaron ya con esa fuente (por el hash del JSON), y cada
  ejecución sigue por donde iba. Con otra fuente empieza de cero;
  `actualizar reiniciar` lo fuerza. Antes repetía siempre las primeras 10. Sin ella, el texto
  alternativo que haya cambiado un editor se respeta. Si una pasada anterior
  dejó dos copias de una foto, borra la que creó la importación y ya no usa
  ninguna unidad (pasó una vez en el preview, con la unidad que ganó el año).
- **Manifiesto:** `Desktop\partequipos-cierre\manifiesto-usados-<destino>.json`
  (unidades con su id de WordPress, fotos con su URL real y la categoría).
- **Retirada:** borra exactamente lo del manifiesto y comprueba que los
  ficheros dan 404 (70 s y hasta 3 vueltas más).
- **Después de importar, redesplegar:** el script corre fuera de Next y no
  revalida (las líneas `[revalidación] falló … static generation store
missing` son normales, como en el blog).

Para el sitio publicado, el runbook
`Desktop\partequipos-cierre\runbook-importar-usados-lanzamiento.md` (sin
ejecutar), con una exportación nueva cerca del lanzamiento.

## 7. Página de cada unidad (2026-10-16, decisión de dirección)

Cada unidad DISPONIBLE tiene su página, con **la misma plantilla** que la ficha
de producto V2 de nueva (`src/components/ficha/FichaProducto.tsx`; cambian solo
los datos):

- **URL:** `/maquinaria-pesada/maquinaria-pesada-usada/<categoria>/<dirección web>/`
  (ruta `[categoria]/[unidad]`). La dirección web es el campo `slug` de
  `equipos-usados`, único **dentro de la categoría**; `pagina` y `marcas`
  están reservadas (chocarían con la paginación y con las páginas de marca).
- **Por qué no se conserva la de WordPress:** el slug antiguo de 86 de las 128
  unidades lleva el número de serie (que nunca se publica). El nuevo sale del
  nombre compuesto («excavadora-hitachi-zx350h-5b-2016»), con el id de WordPress
  al final solo si dos de la misma categoría chocan
  (`src/lib/usados/direcciones.ts`). Las 128 antiguas
  (`/maquinaria-pesada-usada/<slug>/`) llevan **301** a la nueva.
- **Prueba del serial:** `src/lib/usados/direcciones.test.ts` comprueba, contra
  el JSON real y los 126 seriales distintos, que ninguna dirección nueva
  contiene un serial. Se omite sin el JSON (CI): ejecutarla a mano antes de
  importar a producción.
- **Datos:** peso, año, horómetro y ubicación (los que haya); sin ficha técnica
  en filas; «Descargar ficha técnica completa» solo si la unidad tiene PDF;
  «Cotizar» y «Habla con un experto» como en nueva; JSON-LD `Product` sin precio
  y con `itemCondition` usada. Cotizar guarda el nombre de la unidad como
  referencia de texto (`referenciaTexto`).
- **No disponible:** `permanentRedirect` a su categoría; fuera del sitemap.
- **Enlaces:** «Ficha técnica» (home y listados) → la página; «Ver más» sigue
  llevando a la categoría.
- **Redirecciones:** `npm run preview:usados:redirects-simular | redirects |
redirects-retirar` leen el slug de la base y el `enlace` de la fuente.
  Idempotentes, con manifiesto propio. En el sitio publicado (donde las 128
  ya estaban desde el 2026-10-14), con `runbook-importar-aditamentos-lanzamiento.md`.
- **El importador pone la dirección web (2026-10-16):** cada unidad se crea
  con el `slug` de `direccionesDeUnidades`, calculado sobre todas. Una unidad
  ya importada la conserva al actualizarla y, si no coincide, se avisa.
  - **Las 128 de hoy** (preview y sitio publicado) la recibieron por SQL de la migración del #193: las repetidas llevan el id de la base, no el de WordPress.
  - Los 301 leen la base, así que apuntan a lo que se sirve (`docs/aditamentos-importacion.md` §4).
- **Fecha de publicación (2026-10-17):** campo `fechaPublicacion` en `equipos-usados` (migración `20261017_142401_fecha_publicacion_usados`: por defecto, la fecha de creación; las que ya existían la toman de `created_at`). **Ordena** el carrusel de la portada y la opción «Más recientes» de los listados (a igual fecha, el año; «Año más reciente» conserva el orden de antes).
  - **La fecha de WordPress** es el `post_date_gmt` del XML (`extraer-xml.py` la saca como `fechaGmt`; `fechaDeWordPress` la pasa a ISO). Los dos importadores la ponen al crear y al actualizar. Las 4 unidades de aditamentos no tienen página propia: **comparten la fecha de la página que las lista** (2022-03-22), así que son las más antiguas y entre ellas manda la fecha de creación.
  - **Para lo ya importado:** `npm run preview:usados:fechas-simular | fechas | fechas-retirar` (`scripts/usados/fechas-publicacion.ts`), con los manifiestos de las dos importaciones y las fuentes re-extraídas (`usados-wordpress-fechas.json`, `aditamentos-wordpress-fechas.json`, fuera del repositorio). Idempotente; la retirada devuelve la fecha de creación. Para el sitio publicado, `runbook-fechas-publicacion-usados.md`.
- **Hay que redesplegar** tras importar (el script no revalida).

## 8. Lo que NO se hace todavía

- **Sincronización:** es una importación de una vez. Después, el inventario se
  lleva en el panel.
