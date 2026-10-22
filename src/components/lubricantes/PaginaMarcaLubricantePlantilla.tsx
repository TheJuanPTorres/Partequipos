import { RichText } from "@/components/layout/RichText";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { TarjetasMarca } from "@/components/repuestos/TarjetasMarca";
import estilosMarca from "@/components/repuestos/marca.module.css";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import type { VistaLubricantes } from "@/lib/lubricantes/general";
import { scriptAnclasALineas, type SeccionLubricante } from "@/lib/lubricantes/marca";
import { estiloDeMarca } from "@/lib/marca/colorMarca";
import { conAlt, logoPropio } from "@/lib/marca/logoMarca";
import { rutas } from "@/lib/routes";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import type { EnlaceWhatsApp } from "@/lib/whatsapp";
import type { MarcasLubricante } from "@/payload-types";

import { BloqueLubricantes } from "./BloqueLubricantes";
import estilos from "./lubricantes.module.css";

/** Ancla de las tarjetas de línea (el icono del ratón baja a ellas) y del formulario. */
const ANCLA_LINEAS = "lineas";
const ANCLA_CONTACTO = "contacto";

/**
 * PÁGINA DE UNA MARCA DE LUBRICANTES con la plantilla de Andrés «Categoría Lubricantes»
 * (3946; dirección, 2026-10-21). Sustituye a la provisional sencilla; el diseño propio de
 * ENI (`PaginaMarcaLubricante`) sigue opt-in con la casilla «Diseño propio» de la marca.
 *
 * DESDE EL 2026-10-22 (dirección) cada línea tiene su página (plantilla 4039), así que esta
 * ya no lista los productos:
 *
 * 1. Cabecera de la plantilla (la de las páginas índice): foto de la marca o, sin ella, el
 *    fondo oscuro; logo (`LogoMarca`), «Lubricantes {marca}» revelado por palabras, la
 *    entradilla y el icono del ratón; tras ella, la franja del color de la marca del panel.
 * 2. Una tarjeta por línea con su foto y «Ver todo» a su página, en el «Orden» del panel (4 en
 *    una fila en escritorio y 2 + 2 en tablet y móvil).
 * 3. El bloque final de la plantilla: nuestro formulario («Ciudad» y «¿Qué necesitas?») y
 *    «Máxima protección y eficiencia…» con los textos del panel y el logo, sin «Ver catálogo»
 *    (dirección, 2026-10-22; en `/lubricantes/` se queda).
 *
 * Las anclas viejas de las líneas (`#auto-liviano`), que pueden estar enlazadas desde fuera,
 * llevan a su página con un script en línea (`scriptAnclasALineas`).
 */
export function PaginaMarcaLubricantePlantilla({
  marca,
  secciones,
  bloque,
  whatsapp,
}: {
  marca: MarcasLubricante;
  secciones: SeccionLubricante[];
  /** Título, párrafos y botón del bloque final (los de la página general, del panel). */
  bloque: VistaLubricantes["bloque"];
  whatsapp?: EnlaceWhatsApp;
}) {
  const titulo = `Lubricantes ${marca.nombre}`;
  const logo = conAlt(logoPropio({ logo: marca.logo }), `Logo de ${marca.nombre}`);
  // El formulario del final de la página (los «Cotizar» de cada producto están en su línea).
  const formulario = configContactoMarca({
    origen: `${rutas.marcaLubricante(marca.slug)}/`,
    siteKey: turnstileSiteKey(),
    whatsapp,
    boton: "Enviar",
    marca: marca.nombre,
    formulario: {
      titulo: `Solicitud de información sobre ${titulo}`,
      conCiudad: true,
      etiquetaMensaje: "¿Qué necesitas?",
    },
  });
  const destinos = Object.fromEntries(
    secciones.map((s) => [s.ancla, `${rutas.categoriaLubricante(marca.slug, s.ancla)}/`]),
  );

  return (
    <main className={estilosMarca.pagina} style={estiloDeMarca(marca.colorPrincipal)}>
      {/* Antes de pintar nada más: un `#auto-liviano` viejo lleva a su página sin esperar. */}
      <script dangerouslySetInnerHTML={{ __html: scriptAnclasALineas(destinos) }} />
      <HeroMarca
        vista={{
          linea1: titulo,
          linea2: "",
          descripcion: marca.entradilla?.trim() ?? "",
          fondo: imagenDeMedia(marca.imagenCabecera, ""),
          // Una marca de lubricante no tiene casilla de tinta oscura: su logo, con sus colores.
          logo,
        }}
        anclaSiguiente={ANCLA_LINEAS}
        indice
      />

      <TarjetasMarca
        id={ANCLA_LINEAS}
        etiqueta={`Líneas de ${titulo}`}
        verTodo="Ver todo"
        tarjetas={secciones.map((s) => ({
          clave: s.ancla,
          titulo: s.nombre,
          href: destinos[s.ancla] ?? `#${s.ancla}`,
          imagen: s.imagen,
          soloEscritorio: false,
        }))}
        indice
        cuatroEnUnaFila
      />

      {marca.descripcion ? (
        <div className={`${estilos.descripcion} texto-cuerpo`}>
          <RichText data={marca.descripcion} />
        </div>
      ) : null}

      <BloqueLubricantes
        id={ANCLA_CONTACTO}
        bloque={{
          ...bloque,
          marca: { nombre: marca.nombre, href: null, logo },
        }}
        origen={formulario.origen}
        siteKey={formulario.siteKey}
        whatsapp={whatsapp}
        formulario={formulario}
      />
    </main>
  );
}
