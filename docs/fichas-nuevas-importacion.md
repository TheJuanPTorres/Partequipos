# Importación de las fichas de maquinaria nueva de WordPress

Las fichas de equipo nuevo del WordPress actual
(`/maquinaria-pesada/maquinaria-pesada-nueva/marcas/<marca>/<tipo>/<ficha>/`)
a `equipos-nuevos`, con la galería en `Media` y el PDF en `documentos`.

> **IMPORTACIÓN AL PREVIEW APROBADA (dirección, 2026-10-13)**, tras la
> simulación: las **80** fichas publicadas (no solo las 47 del mapa de
> alcance), por tandas, con **manifiesto** y **retirada exacta**, como los
> usados y el blog. Para el sitio publicado hará falta un runbook.

```
python -I scripts/maquinaria/extraer-xml.py <exportacion.xml> <salida.json>
npm run preview:fichas:simular              # lee la base del preview y cuenta; no escribe
npm run preview:fichas:simular -- comprobar # además, comprueba fotos y PDF en WordPress
npm run preview:fichas:importar             # una tanda de 20 fichas; repetir hasta acabar
npm run preview:fichas:importar -- actualizar  # vuelve a aplicar los datos (p. ej. el peso)
npm run preview:fichas:retirar              # deshace exactamente lo del manifiesto
```

El manifiesto (`Desktop\partequipos-cierre\manifiesto-fichas-preview.json`)
apunta las fichas, fotos y PDF que **crea** la importación y, de las fichas que
**ya existían** (las 38 de demostración), su valor de antes. La retirada
devuelve esas 38 a su valor, borra lo creado y comprueba que los ficheros dan
404 en el Blob.

## 1. Fuente: páginas de Elementor, extraídas del XML

Como los repuestos (`docs/repuestos-importacion.md`), cada ficha es una
**página** de Elementor, sin campos propios ni imagen destacada. La lectura
común de Elementor vive en `scripts/wordpress/elementor.py`, que comparten el
extractor de repuestos y este. Los dos extractores no leen autores, usuarios
ni comentarios. Ni el XML ni la salida van al repositorio: la salida se
guarda en `Desktop\partequipos-cierre\`.

Hay **dos maquetaciones**:

| Maquetación | Dónde está cada dato                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nueva       | Todo en la sección principal: galería (`image-carousel`), especificaciones, nombre, descripción y botón «Ficha técnica»                                               |
| Antigua     | En la sección principal, el nombre, la descripción y **una** imagen. Las especificaciones van en el primer texto tras un título «Especificaciones»; el PDF, más abajo |

De debajo de la sección principal solo se toman esas especificaciones y el
**primer** botón «Ficha técnica» con PDF: algunos bloques comunes enlazan
hasta 19 PDF de otros equipos. Lo demás (otros equipos, llamadas a WhatsApp,
formularios, plantillas comunes) no se lee.

## 2. Cómo se convierte cada dato

| WordPress                                                              | `equipos-nuevos`                         | Regla                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ruta                                                                   | marca, tipo y `slug`                     | Los slugs **tal cual** (§3.3). Si ya hay un equipo con ese tipo y slug, se **actualiza** (mismo id y URL); si no, se crea                                                                                                                                                                                                                                                       |
| Título de la página                                                    | `nombre`                                 | Tal cual: es el `<title>` de hoy y el título por defecto de la ficha                                                                                                                                                                                                                                                                                                            |
| Lo que sigue a la marca en el nombre                                   | `codigo`                                 | `codigoDeModelo` de los repuestos                                                                                                                                                                                                                                                                                                                                               |
| Texto de la sección principal                                          | `descripcion` (Lexical)                  | El HTML, convertido con el conversor de Payload, como el blog. Los enlaces a `partequipos.com` pasan a rutas relativas (`enlaceInterno`)                                                                                                                                                                                                                                        |
| Especificaciones (tabla o lista)                                       | `fichaTecnica` (etiqueta/valor)          | Tres formas: tabla de 2 o 4 columnas, tabla con `<th>` y grupos con `rowspan`, y lista con la etiqueta en negrita. Valores **tal cual**; etiquetas en mayúsculas → «Potencia neta», y tildes y erratas con la tabla `ETIQUETAS_CORREGIDAS` (sin unificar sinónimos). Una negrita mal cerrada que se lleva el principio del valor se repara. Sin «Destacar»: lo decide el editor |
| Fila «Peso operativo / operacional / de operación / en funcionamiento» | peso numérico en kg (campo de B)         | El script detecta el campo solo; cuando exista, `importar -- actualizar`. Entiende t, kg y lb; si no entiende el valor, vacío                                                                                                                                                                                                                                                   |
| Galería (o la imagen de la maquetación antigua)                        | `imagenes`                               | `wp-ficha-<id del adjunto>-<nombre>.<ext>`, AVIF → WebP en la máquina que importa (como los repuestos); texto alternativo con `altDeRepuesto`                                                                                                                                                                                                                                   |
| Botón «Ficha técnica»                                                  | `fichaTecnicaPdf` (`documentos`)         | `wp-ficha-<año>-<mes>-<fichero>.pdf`. Un PDF compartido por varias fichas se sube una vez                                                                                                                                                                                                                                                                                       |
| `<title>` y meta descripción de hoy (`url-map.csv`)                    | `seo.metaTitle` y `seo.metaDescription`  | Como los repuestos: el título, vacío si coincide con el nombre                                                                                                                                                                                                                                                                                                                  |
| —                                                                      | `entradilla`, `destacados`, `documentos` | Vacíos: WordPress no los tiene. Al actualizar una ficha de demostración, se **vacían** (su texto era de relleno)                                                                                                                                                                                                                                                                |

## 3. Lo que hay hoy en el preview

Las 38 fichas del preview son **de demostración**: se sembraron el 2026-09-16
con texto de relleno, y 4 de ellas llevan además la galería y el PDF de
ejemplo de la ficha V2 (marca «EJEMPLO UX-9 —»). Las 38 coinciden por tipo y
slug con una ficha de WordPress, así que la importación las **actualiza**:
mismo id y misma URL.

## 4. Errores del WordPress, corregidos al importar (para el cliente)

Decisión de dirección (2026-10-13): se corrigen aquí (`CORRECCIONES_WP` en
`src/lib/maquinaria/wordpress.ts`) y **el cliente debería corregirlos también
en su web** mientras siga publicada:

| Ficha                                           | Error en WordPress                                     | Al importar                                    |
| ----------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `bulldozer-case-construction-1150m`             | El botón «Ficha técnica» abre el PDF de la 1650M       | Sin PDF                                        |
| `retrocargadora-case-construction-580sv-tier4`  | El `<title>` dice «580N»                               | Sin título propio: sale el nombre de la ficha  |
| `retrocargadora-case-construction-851-fx-tier4` | La meta descripción habla de la 570 ST (hallazgo de C) | Sin descripción propia: sale la de por defecto |

## 5. Tope de los PDF: 30 MB

Un folleto de fabricante pesa 27,7 MB. Dirección subió el tope de
`documentos` de 25 a 30 MB (2026-10-13; CLAUDE.md §10.39).
