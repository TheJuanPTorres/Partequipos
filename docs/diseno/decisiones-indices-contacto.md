# Páginas índice (repuestos y maquinaria), Contáctanos y Trabaja con nosotros — inventario y propuesta

Agente D, 2026-10-14. Plantillas de Andrés en `partequipos-diseno\wordpress\`:

| Plantilla                          | Fichero                                                   | Referencia pintada (WordPress de Andrés)                              |
| ---------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| «Repuestos para maquinaria pesada» | `repuesto-principal\Repuesto para maquinaria pesada.json` | `partequipos.uxdesign.website/ux-9/repuestos-para-maquinaria-pesada/` |
| «Categoría principal»              | `categoria-principal\Categoria Principal.json`            | `…/ux-9/ux-categoria-principal/`                                      |
| «Contáctanos»                      | `contacto\Contactanos.json`                               | `…/ux-9/contacto/`                                                    |
| «Trabaja con nosotros»             | `trabaja-con-nosotros\Trabaja con Nosotros.json`          | **No se construye** (ver §4)                                          |

Medidas tomadas de las referencias pintadas a 390, 1010 y 1440 (las dos primeras miden igual en alto: 2893, 2777 y 2871).

## 1. Las dos páginas índice son UNA plantilla

**Estructura (idéntica en las dos):** el encabezado de la página de marca (tarjeta redondeada con foto y velo, icono
de ratón) **sin logo y sin segunda línea**, y debajo una sección blanca de esquinas redondeadas con **seis tarjetas**
(tres por fila; la segunda fila es una repetición de relleno de Andrés y se oculta en móvil). Las tarjetas son las de
la página de marca: foto de 399 × 266, radio 20, panel blanco que sube sobre la foto, título de 20 px y «Ver todo →».

| Elemento                                 | Repuestos (`3172`)                                                                                                                     | Categoría principal (`2099`)                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Antetítulo (en negrita, sobre el título) | «Somos tu socio confiable en maquinaria pesada y repuestos»                                                                            | «Venta de repuestos»                              |
| Título                                   | **Pintado: «Repuestos para Maquinaria pesada»** (el JSON dice «Encuentra Maquinaria y Repuestos Rápido y Fácil»: manda lo pintado, §9) | «Encuentra Maquinaria y Repuestos Rápido y Fácil» |
| Párrafo                                  | «Partequipos SAS se enorgullece de ser tu destino de confianza para maquinaria pesada, repuestos y servicios técnicos de calidad…»     | no tiene                                          |
| Fondo                                    | La cabina de excavadora de la página de marca (`ZX130-7H…`, de Andrés, L3)                                                             | `564564.jpeg`: una excavadora Hitachi en una mina |
| Tarjetas                                 | «Maquinaria pesada nueva», «usada», «Aditamentos», **repetidas** (relleno)                                                             | las mismas                                        |

**Un solo componente** `IndiceTarjetas` (encabezado + rejilla de tarjetas, con los estilos de `marca.module.css`),
usado por `/repuestos-maquinaria-pesada-colombia/` y por `/maquinaria-pesada/`. Para el encabezado se añade un
`antetitulo` opcional a `VistaEncabezado` y la segunda línea pasa a ser opcional; las páginas de marca, tipo y
categoría no cambian.

## 2. Contenido real propuesto para las tarjetas

Las tarjetas de Andrés son relleno. Propuesta con **seis tarjetas reales** por página, **enlaces que ya existen** e
**imágenes de la web original** (`partequipos.com/wp-content/uploads/…`, del propio cliente; se suben a `Media` por
script, nunca al repositorio). Las imágenes se eligen mirando el preview; las de abajo son candidatas halladas en las
páginas actuales.

**Repuestos** (`/repuestos-maquinaria-pesada-colombia/`):

| #   | Tarjeta                     | Enlace                                                            | Imagen candidata                                      |
| --- | --------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Repuestos por marca         | `…/repuestos-maquinaria-pesada-marcas/`                           | `2023/10/20210512-131831-Construction-equipment.jpeg` |
| 2   | Categorías técnicas         | `…/categoria-repuestos-para-maquinaria-pesada/`                   | `2023/10/2-2-pins-and-bushes_02.jpg`                  |
| 3   | Tren de rodaje              | `…/categoria-…/tren-de-rodaje-para-maquinaria-pesada/`            | `2025/07/Tren-de-rodaje-1-2.png`                      |
| 4   | Filtración                  | `…/categoria-…/filtracion-para-maquinaria-pesada/`                | `2023/10/filtros-donaldson.jpg`                       |
| 5   | Herramienta de corte (GETS) | `…/categoria-…/herramienta-de-corte-gets-para-maquinaria-pesada/` | `2025/09/Dientes-web-1-1.png`                         |
| 6   | Lubricantes                 | `/lubricantes/lubricantes-eni/`                                   | `2022/03/Lubricantes.jpg`                             |

**Maquinaria** (`/maquinaria-pesada/`):

| #   | Tarjeta                 | Enlace                                                           | Imagen candidata                                      |
| --- | ----------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Maquinaria pesada nueva | `/maquinaria-pesada/maquinaria-pesada-nueva/`                    | `2024/04/76141-Hitachi.jpg`                           |
| 2   | Maquinaria pesada usada | `/maquinaria-pesada/maquinaria-pesada-usada/`                    | `2022/03/Imagen-ppal-4-scaled.jpg`                    |
| 3   | Aditamentos             | `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/` | `2024/04/grade-control.jpg`                           |
| 4   | Repuestos               | `/repuestos-maquinaria-pesada-colombia/`                         | `2023/10/20210512-131831-Construction-equipment.jpeg` |
| 5   | Lubricantes             | `/lubricantes/lubricantes-eni/`                                  | `2022/03/Lubricantes.jpg`                             |
| 6   | Servicio técnico        | `/servicio-tecnico/`                                             | `2022/05/DSC_0455-N-scaled.jpg`                       |

Con seis tarjetas desaparece la repetición de Andrés y **ninguna se oculta en móvil** (en ux-9 la segunda fila se
oculta porque es relleno; con contenido real ocultarla quitaría enlaces).

## 3. Contáctanos

Sin cambiar la URL (`/contactanos/`, hoy una página institucional que lleva el formulario). La plantilla:

- Antetítulo «Contacto Partequipos» y título (pintado: «Ponte en contacto con nosotro»; **errata**, se corrige a
  «Ponte en contacto con nosotros» y se anota para Andrés).
- A la izquierda una **foto** en tarjeta redondeada (`eed2c5bc…jpg`, dos trabajadores con casco: imagen de Andrés,
  L3, solo preview); a la derecha el formulario **de la página de marca**, con «Estoy interesado en» y «Quién soy»
  (ya existen `interes` y `perfil`), nombre, teléfono, correo y mensaje.
- «Canales adicionales» en rojo y **tres tarjetas** con sombra: «Llámanos», «Email» y «Dirección», con icono; sobre la
  tercera asoma una máquina decorativa (`excavadoras-1-01.png`, de Andrés, L3).
- Los datos salen del **global de la empresa** (`getEmpresa`: teléfono, WhatsApp, correo, dirección y ciudad), no se
  copian a mano. Las páginas del cliente legales/institucionales siguen en `[...slug]`; solo `contactanos` cambia.
- El diseño de Andrés no lleva el horario de atención que hoy muestra `/contactanos/`: se conserva debajo de las
  tarjetas (desviación, y es dato que va en el JSON-LD).

## 4. Trabaja con nosotros: NO se construye (decisión de dirección, 2026-10-14)

Según el mapa de alcance, `/nosotros/trabaja-con-nosotros/` redirige con **301** a
`https://partequipos.buk.co/trabaja-con-nosotros` (portal de empleo del cliente). **Hecho en `next.config.ts`**, junto
al de `/maquinaria/`, sin tocar ninguna base. **Desviación del diseño de Andrés** (su plantilla `trabaja-con-nosotros`
no se usa). El enlace «Trabaja con nosotros» del pie sigue siendo el que ponga el panel (hoy `/contactanos/`): cuando
dirección quiera, se apunta al portal.

## 5. Esquema (APROBADO por dirección el 2026-10-14, una sola migración)

Global `paginas-indice` («Páginas índice y contacto», grupo «Partes del sitio»), **solo opcionales** salvo el título y
el enlace de cada tarjeta. Migración `20261014_054118_paginas_indice`: crea las tablas y **siembra con SQL explícito
los textos y las seis tarjetas de cada página** (título y enlace), sin imágenes.

- `repuestos` y `maquinaria` (dos grupos iguales): `antetitulo`, `titulo`, `texto`, `fondo` y `tarjetas` (hasta 6:
  `titulo`, `enlace`, `imagen`).
- `contacto`: `antetitulo`, `titulo`, `tituloCanales`, las tres etiquetas de los canales, `tituloHorario`, `foto` e
  `imagenDecorativa`. Teléfono, correo y dirección salen del **global de la empresa**.

## 6. Decisiones de dirección (2026-10-14) y desviaciones del diseño

| #   | Decisión / desviación                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `/maquinaria-pesada/` pasa a la plantilla de seis tarjetas (antes, una lista de dos enlaces).                                                                                                                                                                                |
| D2  | **Título de repuestos: el PINTADO** («Repuestos para Maquinaria pesada»). El JSON exportado dice «Encuentra Maquinaria y Repuestos Rápido y Fácil» (que es el de la página de maquinaria): **diferencia JSON / pintado para Andrés.**                                        |
| D3  | El antetítulo de «Categoría principal» pintado es «Venta de repuestos» (relleno que no corresponde a maquinaria): **decidido por dirección (2026-10-14): «Maquinaria nueva y usada»** (ya sembrado por la migración).                                                        |
| D4  | Seis tarjetas **reales** (marcas, categorías, tren de rodaje, filtración, GETS, lubricantes / nueva, usada, aditamentos, repuestos, lubricantes, servicio técnico) en vez de las tres repetidas de Andrés; ninguna se oculta en móvil. Fotos de la web original del cliente. |
| D5  | La principal de repuestos ya no enlaza directamente a cada marca y cada categoría (lo hacía la versión provisional anterior): enlaza a los dos índices y a tres categorías; el resto, a un clic de distancia.                                                                |
| D6  | Contáctanos: el título es el `<h1>` (en ux-9, `<h2>`); errata «con nosotro» corregida; el horario de atención se conserva bajo las tarjetas de canales; el teléfono y el correo son enlaces; la foto se oculta en móvil, como en ux-9.                                       |
| D7  | Contáctanos **pinta la tarjeta roja del pie**, como la plantilla (antes se ocultaba, decisión del 2026-10-06 para la ficha de producto).                                                                                                                                     |
| D8  | «Trabaja con nosotros» **NO se construye**: `/nosotros/trabaja-con-nosotros/` redirige con 301 a `https://partequipos.buk.co/trabaja-con-nosotros` (mapa de alcance), en `next.config.ts`. La plantilla de Andrés no se usa.                                                 |

## 7. Imágenes

`npm run preview:indices:sembrar` / `:retirar` (solo preview, con manifiesto): sube las fotos de las tarjetas **de la web
original** (suyas) y las de Andrés (fondos, foto y máquina de Contáctanos: L3, «EJEMPLO UX-9 —»), para ver el diseño
completo en el preview.

**En PRODUCCIÓN, solo las 10 fotos del cliente** (decisión de dirección, 2026-10-14): las 4 de Andrés (L3) no se suben;
«contenido real, y donde no haya foto real, sin foto». Las páginas lo toleran: el encabezado queda en tono oscuro y
Contáctanos pinta el formulario a todo el ancho, sin foto ni máquina. Pasos en `runbook-indices-produccion.md` (en
`partequipos-cierre`), con los ficheros listos en `partequipos-diseno\wordpress\indices\assets\`.

## 8. Coordinación

- `/maquinaria-pesada/` es la sección de **B**: avisado en `ESTADO.md`. Su #140 (categoría secundaria) no la toca.
