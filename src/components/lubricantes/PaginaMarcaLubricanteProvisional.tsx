import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { RichText } from "@/components/layout/RichText";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { TarjetasMarca } from "@/components/repuestos/TarjetasMarca";
import estilosMarca from "@/components/repuestos/marca.module.css";
import type { SeccionLubricante } from "@/lib/lubricantes/marca";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import { rutas } from "@/lib/routes";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import type { EnlaceWhatsApp } from "@/lib/whatsapp";
import type { MarcasLubricante } from "@/payload-types";
import { conAlt, logoPropio } from "@/lib/marca/logoMarca";

import estilos from "./lubricantes.module.css";
import { SeccionesLubricante } from "./SeccionesLubricante";

/** Ancla de la primera sección bajo la cabecera y del formulario. */
const ANCLA_LINEAS = "lineas";
const ANCLA_CONTACTO = "contacto";

/**
 * PÁGINA PROVISIONAL DE UNA MARCA DE LUBRICANTES (2026-10-19, dirección): en producción solo se
 * publican plantillas de ANDRÉS, así que el diseño propio de ENI (`PaginaMarcaLubricante`) queda
 * apagado por defecto (casilla «Diseño propio» de la marca) y esta muestra el contenido de forma
 * sencilla, con el lenguaje de la página de marca de repuestos: su cabecera y sus tarjetas, las
 * líneas con sus productos y el formulario al final.
 */
export function PaginaMarcaLubricanteProvisional({
  marca,
  secciones,
  whatsapp,
}: {
  marca: MarcasLubricante;
  secciones: SeccionLubricante[];
  whatsapp?: EnlaceWhatsApp;
}) {
  const titulo = `Lubricantes ${marca.nombre}`;
  // El mismo formulario en la página y en la ventana de «Cotizar».
  const formulario: ConfigFormulario = {
    tipo: "contacto",
    origen: `${rutas.marcaLubricante(marca.slug)}/`,
    siteKey: turnstileSiteKey(),
    whatsapp,
    titulo: `Más información sobre ${titulo}`,
    textoBoton: "Obtener más información",
  };
  return (
    <main>
      <HeroMarca
        vista={{
          linea1: "Lubricantes",
          linea2: marca.nombre,
          descripcion: marca.entradilla?.trim() ?? "",
          fondo: imagenDeMedia(marca.imagenCabecera, ""),
          // Una marca de lubricante no tiene casilla de tinta oscura: su logo, con sus colores.
          logo: conAlt(logoPropio({ logo: marca.logo }), marca.nombre),
        }}
        anclaSiguiente={ANCLA_LINEAS}
      />

      <TarjetasMarca
        id={ANCLA_LINEAS}
        titulo="Líneas de producto"
        verTodo="Ver productos"
        tarjetas={secciones.map((s) => ({
          clave: s.ancla,
          titulo: s.nombre,
          href: `#${s.ancla}`,
          imagen: s.imagen,
          soloEscritorio: false,
        }))}
        // El estilo «difuminado» de las tarjetas del sitio (dirección, 2026-10-21).
        indice
      />

      {marca.descripcion ? (
        <div className={`${estilos.descripcion} texto-cuerpo`}>
          <RichText data={marca.descripcion} />
        </div>
      ) : null}

      <SeccionesLubricante
        secciones={secciones}
        anclaContacto={ANCLA_CONTACTO}
        formulario={formulario}
      />

      <section
        id={ANCLA_CONTACTO}
        className={estilosMarca.contacto}
        aria-labelledby={`${ANCLA_CONTACTO}-titulo`}
        style={{ scrollMarginTop: 110 }}
      >
        <h2 id={`${ANCLA_CONTACTO}-titulo`} className={estilosMarca.tituloContacto}>
          Más información sobre {titulo}
        </h2>
        <div className={estilosMarca.formulario}>
          <FormularioSolicitud {...formulario} variante="plano" />
        </div>
      </section>
    </main>
  );
}
