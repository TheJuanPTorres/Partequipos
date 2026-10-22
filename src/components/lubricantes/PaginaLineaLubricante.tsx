import { RichText } from "@/components/layout/RichText";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilosMarca from "@/components/repuestos/marca.module.css";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import type { VistaLubricantes } from "@/lib/lubricantes/general";
import { agruparProductos, encabezadoDeLinea } from "@/lib/lubricantes/marca";
import { estiloDeMarca } from "@/lib/marca/colorMarca";
import { conAlt, logoPropio } from "@/lib/marca/logoMarca";
import { rutas } from "@/lib/routes";
import type { BreadcrumbItem } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import type { EnlaceWhatsApp } from "@/lib/whatsapp";
import type { CategoriasLubricante, MarcasLubricante } from "@/payload-types";

import { BloqueLubricantes } from "./BloqueLubricantes";
import estilos from "./lubricantes.module.css";
import { ProductosLinea } from "./ProductosLinea";

/** El icono del ratón baja a los productos; «Cotizar», sin JavaScript, al formulario. */
const ANCLA_PRODUCTOS = "productos";
const ANCLA_CONTACTO = "contacto";

/**
 * PÁGINA DE UNA LÍNEA DE LUBRICANTES (`/lubricantes/lubricantes-eni/motos-scooter/`) con la
 * plantilla de Andrés «Ficha producto lubricante» (4039; dirección, 2026-10-22), en la URL
 * que la línea tenía en WordPress.
 *
 * 1. Cabecera de las páginas índice: la foto de la línea (o el fondo oscuro), las migas, el
 *    logo de la marca (`LogoMarca`), «Lubricantes <línea>» revelado por palabras, el texto
 *    del panel y el icono del ratón.
 * 2. Los productos por grupos, en tarjetas con «Cotizar» y «Ficha técnica».
 * 3. Nuestro formulario y «Máxima protección…» con el logo, como la página de la marca, sin
 *    «Ver catálogo» (la plantilla no trae el bloque; dirección lo pide).
 */
export function PaginaLineaLubricante({
  marca,
  linea,
  migas,
  bloque,
  whatsapp,
}: {
  marca: MarcasLubricante;
  linea: CategoriasLubricante;
  migas: BreadcrumbItem[];
  /** Título y párrafos del bloque final (los de la página general, del panel). */
  bloque: VistaLubricantes["bloque"];
  whatsapp?: EnlaceWhatsApp;
}) {
  const logo = conAlt(logoPropio({ logo: marca.logo }), `Logo de ${marca.nombre}`);
  const vista = encabezadoDeLinea(linea, marca, logo);
  const formulario = configContactoMarca({
    origen: `${rutas.categoriaLubricante(marca.slug, linea.slug)}/`,
    siteKey: turnstileSiteKey(),
    whatsapp,
    boton: "Enviar",
    marca: marca.nombre,
    formulario: {
      titulo: `Solicitud de información sobre ${vista.linea1}`,
      conCiudad: true,
      etiquetaMensaje: "¿Qué necesitas?",
    },
  });

  return (
    <main className={estilosMarca.pagina} style={estiloDeMarca(marca.colorPrincipal)}>
      <HeroMarca
        vista={vista}
        anclaSiguiente={ANCLA_PRODUCTOS}
        indice
        franja={false}
        migas={migas}
      />

      {linea.descripcion ? (
        <div className={`${estilos.descripcion} texto-cuerpo`}>
          <RichText data={linea.descripcion} />
        </div>
      ) : null}

      <div id={ANCLA_PRODUCTOS}>
        <ProductosLinea
          grupos={agruparProductos(linea.productos ?? [])}
          marca={marca.nombre}
          formulario={formulario}
          anclaContacto={ANCLA_CONTACTO}
        />
      </div>

      <BloqueLubricantes
        id={ANCLA_CONTACTO}
        bloque={{ ...bloque, marca: { nombre: marca.nombre, href: null, logo } }}
        origen={formulario.origen}
        siteKey={formulario.siteKey}
        whatsapp={whatsapp}
        formulario={formulario}
      />
    </main>
  );
}
