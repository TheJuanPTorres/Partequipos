import { IconBrandWhatsapp, IconMessageCircle } from "@tabler/icons-react";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { BaldosasCategorias } from "@/components/repuestos/BaldosasCategorias";
import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { LogoMarca } from "@/components/marca/LogoMarca";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { LogoConAlt } from "@/lib/marca/logoMarca";
import type { TarjetaMarca } from "@/lib/repuestos/marca";
import type { BreadcrumbItem } from "@/lib/seo/jsonLd";

import estilos from "./fichaModelo.module.css";

/**
 * FICHA DE LA PÁGINA DE MODELO de repuestos SIN FOTO (Ronda 12, 2026-11-08: el cliente vende
 * repuestos, no máquinas). Ronda 17 (2026-11-09): sin el formulario completo. Un solo contenedor
 * blanco:
 *
 * 1. Las migas.
 * 2. Primera línea: el logo de la marca a la IZQUIERDA y el `<h1>` a la DERECHA (en móvil, si no
 *    caben, el logo encima).
 * 3. A la altura de la descripción: «Pedir cotización» (abre la VENTANA del formulario del sitio
 *    con el modelo ya puesto) y el botón verde de WhatsApp, a su derecha en escritorio y debajo
 *    en móvil.
 * 4. Los tipos de repuesto del tipo de máquina como baldosas, DEBAJO y a todo el ancho.
 *
 * Propuesta de dirección, sin diseño de Andrés.
 */
export function FichaModelo({
  migas,
  titulo,
  logo,
  linea,
  categorias,
  tituloCategorias,
  formulario,
  whatsapp,
}: {
  migas: BreadcrumbItem[];
  titulo: string;
  logo: LogoConAlt | null;
  /** Una línea de texto bajo el título; vacía, no se pinta. */
  linea: string;
  /** Los tipos de repuesto del tipo de máquina, en baldosas compactas bajo la descripción. */
  categorias: TarjetaMarca[];
  tituloCategorias: string;
  /** El formulario que abre «Pedir cotización», con el modelo ya puesto. */
  formulario: ConfigFormulario;
  /** El enlace de WhatsApp con el modelo en el mensaje; sin número, no hay botón. */
  whatsapp?: string;
}) {
  return (
    <section className={estilos.ficha} aria-labelledby="modelo-titulo">
      <div className={estilos.migas}>
        <Breadcrumbs items={migas} />
      </div>

      <div className={estilos.cabecera}>
        {logo ? (
          <LogoMarca logo={logo} alt={logo.alt} sizes="120px" className={estilos.logo} priority />
        ) : null}
        <h1 id="modelo-titulo" className={`${estilos.titulo} texto-titulo-bloque`}>
          {titulo.split(" ").map((palabra, i) => (
            <span key={`${i}-${palabra}`}>
              {i > 0 ? " " : null}
              {palabra.includes("-") ? (
                <span className={estilos.sinCorte}>{palabra}</span>
              ) : (
                palabra
              )}
            </span>
          ))}
        </h1>
      </div>

      <div className={estilos.cuerpo}>
        {linea ? <p className={`${estilos.linea} texto-cuerpo`}>{linea}</p> : <span />}
        <div className={estilos.acciones} id="modelo-contacto">
          <BotonFormulario
            href="/contactanos/"
            className={estilos.botonCotizar}
            formulario={formulario}
            titulo="Pedir cotización"
          >
            <IconMessageCircle aria-hidden="true" focusable="false" stroke={2} size={20} />
            Pedir cotización
          </BotonFormulario>
          {whatsapp ? (
            <a
              href={whatsapp}
              data-whatsapp-boton=""
              className={estilos.botonWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp aria-hidden="true" focusable="false" stroke={2} size={20} />
              Escríbenos por WhatsApp
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          ) : null}
        </div>
      </div>

      <BaldosasCategorias
        id="modelo-categorias"
        titulo={tituloCategorias}
        categorias={categorias}
        compacta
      />
    </section>
  );
}
