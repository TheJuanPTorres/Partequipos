# Guía breve del editor — panel de partequipos.com

Para quien carga y mantiene el contenido del sitio. No hace falta saber nada
técnico. Si algo de esta guía no coincide con lo que ves en el panel, avisa al
equipo técnico: la guía se corrige, no tú.

---

## 1. Entrar

- El panel está en **`/admin`** del sitio (por ejemplo,
  `https://partequipos.vercel.app/admin`).
- Entras con tu correo y tu contraseña. Las cuentas las crea un
  **administrador**; no hay registro abierto.
- **Contraseña:** mínimo 12 caracteres. Mejor una frase larga que una palabra
  con símbolos. No se aceptan las obvias ni las que llevan tu correo.
- **La sesión dura 8 horas.** Después vuelve a pedirte la contraseña.
- **5 intentos fallidos bloquean la cuenta 30 minutos.** Si te pasa, espera o
  pide ayuda a un administrador.
- **¿Olvidaste la contraseña?** Hoy el aviso por correo no está activado, así
  que el enlace de recuperación no te llegará. Pide a un administrador que te
  ponga una nueva.
- Puedes cambiar tu propia contraseña en tu perfil (arriba a la derecha, o en
  **Usuarios**, donde solo te ves a ti).
- El panel tiene **modo claro y oscuro**, según la preferencia de tu equipo.

## 2. Qué puede hacer cada uno

| Puedes…                                           |  Editor  | Administrador |
| ------------------------------------------------- | :------: | :-----------: |
| Crear y editar catálogo, páginas, blog e imágenes |    ✅    |      ✅       |
| Ver las solicitudes y marcarlas atendidas         |    ✅    |      ✅       |
| Cambiar el menú, el pie y los datos de la empresa |    ✅    |      ✅       |
| **Borrar** cualquier cosa                         |    ❌    |      ✅       |
| Redirecciones                                     | solo ver |      ✅       |
| Crear usuarios y cambiar roles                    |    ❌    |      ✅       |

**Por qué el editor no borra:** borrar no tiene papelera ni vuelta atrás, y
una ficha borrada es una dirección que Google ya conocía y deja de existir.
Para retirar algo sin borrarlo hay alternativas (ver §6); si de verdad hay que
borrar, pídelo a un administrador.

## 3. Lo más importante: guardar es publicar

**No hay borradores.** Al pulsar **Guardar**, el cambio está en el sitio
público: en cuanto alguien recarga la página, lo ve.

Consecuencias prácticas:

- **Un artículo a medio escribir se publica al guardar.** Redáctalo fuera
  (Word, Google Docs) y pégalo en el panel cuando esté terminado.
- **Revisa antes de guardar**, sobre todo títulos y precios o datos técnicos.
- **El menú, el pie y los datos de la empresa (horario, contacto, logo)
  afectan a todas las páginas a la vez.**
- No hay historial de versiones: si cambias un texto, el anterior no se
  guarda. Si es largo o delicado, copia el original antes.

## 4. El menú del panel

A la izquierda, en grupos:

| Grupo         | Qué hay                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------- |
| Comercial     | **Solicitudes** que llegan de los formularios del sitio                                      |
| Repuestos     | Marcas, tipos de equipo, modelos y categorías técnicas                                       |
| Maquinaria    | Marcas, tipos y equipos nuevos; categorías y equipos usados                                  |
| Lubricantes   | Marcas y categorías de lubricante                                                            |
| Contenido     | Páginas, artículos del blog, imágenes, vídeos, sedes, testimonios, preguntas, cabecera y pie |
| Configuración | Usuarios, redirecciones y «SEO y datos de la empresa» (horario, imágenes y contacto)         |

En cada listado puedes **buscar** (en modelos y equipos nuevos, también por
código, p. ej. «320D»), **ordenar** pulsando en una columna y **filtrar** con
el botón «Filtros».

**Ver en el sitio:** en las fichas con página pública (marcas, tipos y
modelos de repuesto; marcas, tipos y equipos nuevos de maquinaria; categorías
de maquinaria nueva y usada; lubricantes; páginas, artículos y categorías del
blog), arriba del formulario hay un botón **«Ver en el sitio»** que abre esa
página en otra pestaña. Sale cuando la ficha ya está guardada; en móvil es solo
el icono. Lo que no tiene página propia (equipos usados, categorías técnicas,
sedes, testimonios, solicitudes…) no lo lleva.

## 5. Tareas frecuentes

### 5.1 Atender una solicitud

1. **Comercial → Solicitudes.** Lo más nuevo sale primero.
2. Ábrela, atiende al cliente por tu canal habitual.
3. Cambia **Estado** a **Atendida** y guarda.

**Contienen datos personales** (nombre, correo, teléfono). No se copian a hojas
de cálculo ni se reenvían fuera de la empresa sin necesidad: los protege la
Ley 1581 de 2012. No se borran: marcarlas atendidas conserva el historial.

### 5.2 Añadir un modelo de repuesto

1. **Repuestos → Modelos → Crear.**
2. **Nombre** (p. ej. «CAT 320D»). El **slug** se crea solo al guardar.
3. **Primero la marca, después el tipo de equipo.** El desplegable de tipos
   solo enseña los de la marca elegida. Si cambias la marca, vuelve a elegir
   el tipo: el panel no deja guardar un tipo de otra marca.
4. **Código** (p. ej. «320D»), descripción e imágenes.
5. **Buscadores y redes sociales** (opcional): ver §8.
6. Guardar.

Equipos nuevos (**Maquinaria → Equipos nuevos**) funcionan igual: marca, luego
tipo. Además llevan puntos destacados y ficha técnica: copia los datos tal
como los publica el fabricante, con su unidad («20.500 kg»). Si no hay dato
oficial, no lo pongas.

### 5.3 Equipos usados

- **Maquinaria → Equipos usados.** No tienen página propia: salen dentro de la
  página de su **categoría**.
- Marca y modelo son texto libre: entra cualquier marca.
- **Al venderse, desmarca «Disponible»** en vez de borrarlo. Si fue un error,
  se vuelve a marcar.
- «Pestaña en la portada»: por defecto, según su categoría; elige
  «Aditamentos» si es un aditamento.

### 5.4 Escribir un artículo del blog

1. **Recuerda §3: se publica al guardar.** Tenlo terminado antes.
2. **Contenido → Artículos → Crear.** Título, categoría y **fecha de
   publicación** (ordena el blog y es la que ven los buscadores).
3. **Entradilla:** el resumen que sale en el listado y al compartir.
4. **Imagen destacada:** sale en el listado y al compartir en redes.
5. El slug sale del título. **No puede repetir el de una página** del sitio
   (artículos y páginas comparten las direcciones `partequipos.com/<slug>/`);
   si coincide, el panel te lo dice y tienes que elegir otro.

### 5.5 Subir imágenes

- **Contenido → Imágenes**, o directamente desde el campo de imagen de una
  ficha.
- **Formatos: JPEG, PNG o WebP.** Ni SVG, ni PDF, ni AVIF, ni HEIC (las fotos
  del iPhone): conviértelas antes. El panel lo comprueba por el contenido, no
  por el nombre del fichero.
- **Texto alternativo, obligatorio:** describe lo que se ve, como se lo
  contarías a alguien por teléfono. «Excavadora Hitachi ZX200 trabajando en una
  obra», no «foto1» ni «imagen». Lo leen los lectores de pantalla y los
  buscadores.
- **Recorta antes de subir.** El recorte del panel está desactivado a
  propósito.
- **Punto focal:** al abrir una imagen puedes marcar qué parte es la
  importante. Cuando el sitio tiene que recortarla para encajarla (por ejemplo,
  en la portada), conserva esa zona.
- Fotos grandes, sí; enormes, no: con 2.000–2.500 px de ancho sobra.

### 5.6 Subir vídeos

- **Contenido → Vídeos.** MP4 o WebM, **máximo 4 MB**. Si pesa más, hay que
  exportarlo con más compresión.
- **Imagen de póster, obligatoria:** es lo que se ve antes de que cargue y para
  quien tiene el movimiento reducido activado.
- **Qué muestra el vídeo:** descríbelo siempre, aunque sea decorativo.

### 5.7 Testimonios, preguntas frecuentes y sedes

- **Testimonios:** son de personas reales. **No se pueden publicar sin marcar
  la autorización de uso**, con su fecha y dónde está el documento firmado. Si
  una persona pide retirar su testimonio, desmarca «Publicado» (o la
  autorización) y guarda.
- **Preguntas frecuentes:** solo salen las marcadas como publicadas.
- **Orden:** en testimonios, preguntas y sedes, el número menor sale primero.

### 5.8 La portada

- Es la página de tipo «Portada» (ruta `inicio`) en **Contenido → Páginas**.
- **Hero (carrusel):** cada diapositiva lleva título, párrafo, imagen de fondo,
  una versión **vertical para móvil** (recomendada: el móvil carga mucho más
  rápido) y, si quieres, la máquina recortada en PNG transparente.
- Cada sección de la portada tiene su bloque en esa página. Lo que dejes vacío
  no se pinta.

### 5.9 Menú, pie y datos de la empresa

- **Cabecera:** enlaces del menú y botón.
- **Pie de página:** columnas de enlaces, lema y textos.
- Los enlaces son rutas del sitio que empiezan por «/» (p. ej.
  `/contactanos/`) o direcciones completas `https://…`.

**Configuración → SEO y datos de la empresa** tiene tres partes. **Lo que dejes
vacío no rompe nada: el sitio usa el dato de siempre.**

- **Horario de atención:** un tramo por grupo de días con el mismo horario.
  Sale en la página de contacto y en la información que leen los buscadores.
- **Imágenes:**
  - **Logo:** el de la cabecera, el pie y el que leen los buscadores. PNG con
    fondo transparente y letras oscuras, de al menos 520 px de ancho.
  - **Imagen al compartir por defecto:** la que sale al pegar en WhatsApp,
    LinkedIn o Facebook el enlace de una página que no tiene imagen propia.
    Imagen **opaca** (sin transparencia), de **1200 × 630 px**. Si la dejas
    vacía, se usa el logo; pero algunas redes pintan la transparencia del logo
    en negro, así que conviene subirla.
- **Contacto de la empresa:** teléfono, WhatsApp, correo, dirección, ciudad y
  redes sociales. Salen en el pie, la cabecera, el botón de WhatsApp, la página
  de contacto y la información que leen los buscadores.
  - **Teléfono y WhatsApp:** completos, con indicativo: `+57 317 670 7071`. Si
    dejas el WhatsApp vacío, se usa el teléfono.
  - **Redes:** la dirección completa del perfil, copiada del navegador, con
    `https://`. En el pie salen Facebook, Instagram, LinkedIn y YouTube.

## 6. Retirar algo sin borrarlo

| Qué                  | Cómo                         |
| -------------------- | ---------------------------- |
| Equipo usado vendido | Desmarcar «Disponible»       |
| Testimonio           | Desmarcar «Publicado»        |
| Pregunta frecuente   | Desmarcar «Publicada»        |
| Solicitud atendida   | Estado «Atendida»            |
| Cualquier otra cosa  | Pedírselo a un administrador |

## 7. El slug (la dirección web)

- Es la última parte de la dirección de una página: en
  `…/repuestos-…/caterpillar/excavadora/cat-320d/`, el slug es `cat-320d`.
- **Se crea solo** a partir del nombre: minúsculas, sin tildes y con guiones.
- **Después de guardar ya no se puede cambiar**, porque Google ya conoce esa
  dirección. Si tiene una errata, un administrador puede darte el permiso
  «Puede editar slugs ya publicados»: la dirección antigua seguirá llevando a
  la nueva.
- En las **páginas** (Contenido → Páginas) se llama «Ruta (dirección web)» y
  funciona igual.

## 8. Buscadores y redes sociales

Cada ficha con página propia tiene un bloque **«Buscadores y redes
sociales»**. Es opcional. Debajo de los campos verás **cómo saldrá en Google**
mientras escribes, un **contador de caracteres** y **qué se usa si lo dejas
vacío**.

- **Título para buscadores:** lo que sale en azul en Google. Hasta unos 60
  caracteres; Google corta lo que pase. **No se le añade nada**: si quieres
  que diga «Partequipos», escríbelo tú.
- **Descripción para buscadores:** el texto bajo el título en Google. Entre
  120 y 160 caracteres; a partir de 160 se corta con «…».
- **Imagen al compartir en redes:** la que sale al pegar el enlace en
  WhatsApp, LinkedIn o Facebook. En algunas fichas gana su propia imagen (la
  primera de la galería, el logo o la imagen destacada); el bloque te dice
  cuál. Si la ficha no tiene ninguna, se usa la **imagen al compartir por
  defecto** de «SEO y datos de la empresa» (§5.9).

Si dejas un campo vacío, el sitio usa el nombre o la descripción de la ficha;
el bloque te enseña exactamente qué texto.

## 9. Mensajes de error frecuentes

| Mensaje (resumido)                                        | Qué hacer                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| «El tipo … es de otra marca»                              | Elige un tipo de la marca seleccionada, o cambia la marca          |
| «El slug … ya lo usa una página / un artículo»            | Cambia el slug antes de guardar                                    |
| «… no es una imagen JPEG, PNG ni WebP»                    | Convierte la imagen y vuelve a subirla                             |
| «… pesa … MB y el máximo es 4 MB»                         | Exporta el vídeo con más compresión                                |
| «El recorte está desactivado»                             | Recorta la imagen en tu equipo antes de subirla                    |
| «No se puede publicar sin la autorización de uso marcada» | Marca la autorización (si la tienes firmada) o déjalo sin publicar |
| «Usa una ruta del sitio que empiece por «/»…»             | Escribe el enlace como `/contactanos/` o `https://…`               |
| «Escribe el número completo, con indicativo…»             | Escribe el teléfono entero: `+57 317 670 7071`                     |
| «Tiene que empezar por https://…»                         | Copia la dirección del perfil desde el navegador, con `https://`   |
| «No es una dirección válida…»                             | Pega la dirección completa del perfil, no solo el nombre           |
| El slug aparece gris y no se puede escribir               | Es normal tras crear la ficha: ver §7                              |

Si ves un error que no está aquí, haz una captura con la hora y envíasela al
equipo técnico.
