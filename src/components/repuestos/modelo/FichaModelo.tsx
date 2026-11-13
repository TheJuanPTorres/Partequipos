import { IconBrandWhatsapp, IconMessageCircle } from "@tabler/icons-react";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { CategoriasFicha } from "@/components/repuestos/CategoriasFicha";
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
 * 2. El logo de la marca, una línea de separación y el `<h1>` con su línea de descripción.
 * 3. «Pedir cotización» (abre la VENTANA del formulario del sitio con el modelo ya puesto) y el
 *    botón verde de WhatsApp, a la derecha desde xl (1280 px) y debajo en pantallas menores.
 * 4. Los tipos de repuesto del tipo de máquina como tarjetas con panel del tono de la marca,
 *    DEBAJO y a todo el ancho.
 *
 * Diseño v2 del cliente (2026-11-13): fondo blanco con una luz diagonal del color de la marca,
 * cabecera con logo, separación y modelo con su línea.
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
        <div className={estilos.identidad}>
          {logo ? (
            <LogoMarca logo={logo} alt={logo.alt} sizes="170px" className={estilos.logo} priority />
          ) : null}
          {logo ? <span aria-hidden="true" className={estilos.separador} /> : null}
          <div className={estilos.titular}>
            <h1 id="modelo-titulo" className={estilos.titulo}>
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
            {linea ? <p className={estilos.linea}>{linea}</p> : null}
          </div>
        </div>
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

      <CategoriasFicha id="modelo-categorias" titulo={tituloCategorias} categorias={categorias} />
    </section>
  );
}
