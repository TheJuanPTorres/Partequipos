# Página de marca de repuestos (ux-9) — inventario y mapa a Payload

Agente D, 2026-10-13. **Paso 1: solo inventario y mapa; sin código ni esquema.**

- Diseño: `partequipos-diseno\wordpress\repuestos-marca\elementor-3373-2026-10-13.json`.
- Referencia pintada: `partequipos.uxdesign.website/repuestos-para-maquinaria-pesada-caterpillar/`
  (aún sin medir; la medición va en el paso 3, con turno en `MEDICION.md`).
- Rutas: las 13 marcas de `url-map.csv`, sin cambiar slugs:
  `/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/<marca>/`.
  Hoy la sirve `…/[marca]/page.tsx` (migas, logo, `h1`, descripción y lista de tipos).

## 1. Secciones del diseño (6 contenedores de primer nivel)

| # | Sección | Contenido | Ocultos |
| - | ------- | --------- | ------- |
| 1 | Hero | Fondo `ZX130-7H_working_jobsite-14-scaled-2.jpg`; imagen frontal `Mesa-de-trabajo-7-copia-2.png`; título revelado «Repuestos para maquinaria pesada» + «CATERPILLAR En Colombia»; párrafo («En PARTEQUIPOS, ofrecemos una amplia variedad de repuestos originales y genéricos para mantener su maquinaria pesada CATERPILLAR en óptimas condiciones en todo Colombia.»); icono de ratón de scroll (ancla `#1`) | — |
| 2 | Categorías | `h2` «Nuestras categorías de repuestos» + 7 `icon-list` de una fila cada una: Tren de Rodaje, filtración, Baldes y herramienta de corte, lubricantes, Misceláneos, Componentes Mayores, Repuestos para Motor Diesel. **Sin enlace** en el diseño | las filas 1, 4, 5, 6 y 7 se ocultan en móvil → en móvil solo salen 2 |
| 3 | Repuestos según tipo de máquina | `h2` + 3 tarjetas (bulldozer, excavadora, retrocargadora) con imagen, título «Repuestos para maquinaria pesada <tipo> CATERPILLAR» y «Ver todo →» | la 3.ª se oculta en tableta |
| 4 | Segunda fila de tarjetas | Cargador frontal (tipo), «Maquinaria pesada usada» y «Aditamentos» (las dos últimas, al marketplace) | **todo el contenedor se oculta en móvil**; «Aditamentos» se oculta en tableta |
| 5 | Contacto | Títulos revelados «Contacto Partequipos» / «Si deseas más info, contáctanos» + formulario | — |
| 6 | Testimonios | Título revelado «Testimonios reales» + acordeón con vídeo (`play_text` «Ver Video»; 3+ ítems: imagen, nombre, ciudad, descripción, URL de YouTube) | — |

Decisión estándar «lo oculto en los tres tamaños no existe»: no hay ningún elemento
oculto en los tres a la vez. Las ocultaciones de arriba son por tamaño y se replican.

## 2. Mapa a lo que ya existe

| Pieza del diseño | Existe | Cómo se resuelve |
| ---------------- | ------ | ---------------- |
| Títulos revelados por palabras (widget `bangluxor_titulo_revelado_palabras_scroll`) | Sí | `components/movimiento/Revelado.tsx` (ya lo usan home y bloques) |
| Acordeón con vídeo (testimonios) | Sí | `SeccionTestimonios` + colección `Testimonio`, que la home ya pinta. **A confirmar:** que se pueda reutilizar fuera de la home |
| Formulario | Sí | `FormularioSolicitud` (Zod, Turnstile y aviso por SMTP). Los `radio` del diseño («interes», «perfil») no los tiene: **a decidir** si se añaden o se dejan fuera |
| Icono de ratón de scroll (`animated_mouse_scroll_icon`) | **No** | Widget nuevo. Es CSS/SVG; el zip está en `wordpress\widgtes\`. Pausa/`prefers-reduced-motion` según §9 |
| Tarjetas de tipo | Parcial | `getTiposDeMarca` ya da los tipos de la marca; falta la **imagen** y el enlace «Ver todo» a `rutas.tipo(marca, tipo)` |
| Categorías técnicas | Parcial | `CategoriaTecnica` tiene nombre e icono (6 valores), pero **no tiene página** (las 32 URL son huérfanas, §10.3) y la relación con la marca no existe. Hoy son transversales a todas las marcas |
| Tarjetas «usada» y «Aditamentos» | No | Enlazan al marketplace; el diseño las pone solo en la 2.ª fila |
| Fondo e imagen frontal del hero | No | La marca solo tiene `logo` |

## 3. Lo que exige esquema (PARADA tras el paso 1)

Para no tener datos quemados (§7.5) harían falta, **todos cambios de esquema**:

1. `Marca`: imagen de fondo del hero, imagen frontal opcional, texto de presentación
   (la `descripcion` actual sirve para el párrafo; el `h1` y su segunda línea salen del nombre).
2. `TipoEquipo`: `imagen` para la tarjeta.
3. `CategoriaTecnica`: más iconos (`Misceláneos`, `Componentes Mayores`, `Motor Diesel`
   no tienen valor; el `select` es un enum de Postgres) y su relación con la marca,
   o bien decidir que las categorías son las mismas para todas las marcas.
4. Dos tarjetas de marketplace (usada y aditamentos): imagen y título editables,
   probablemente en un global.

**Antes de pedir la ventana de migraciones** (§9, «sin esperas dentro de la ventana»)
necesito de dirección las decisiones de la sección 4. Hoy `VENTANA.md` está libre y
no la he tomado.

## 4. Preguntas para dirección

1. **Categorías (sección 2)**: ¿las 7 son comunes a las 13 marcas o cambian por marca?
   El diseño no las enlaza. ¿Se pintan sin enlace hasta que haya página de categoría?
2. **Contenido de ejemplo**: B todavía no importa los 347 modelos (PR #116, pendiente).
   ¿Construyo con los tipos que haya hoy en `development`/preview más imágenes de
   ejemplo marcadas «EJEMPLO UX-9 —» (§10.38)?
3. **Imágenes de ux-9** (fondo, frontal, tarjetas): son de Andrés, con licencia L3
   pendiente → solo preview, vía `Media` por script (nunca al repositorio).
4. **Radios del formulario** («interes», «perfil»): ¿se replican? Requieren campos nuevos
   en `Solicitud` (esquema).
5. **Ocultar «usada» y «Aditamentos» en móvil** es lo que pinta el diseño; ¿se respeta?
