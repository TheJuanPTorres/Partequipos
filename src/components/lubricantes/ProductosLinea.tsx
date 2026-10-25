import Image from "next/image";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { BotonVisorPdf } from "@/components/ficha/BotonVisorPdf";
import { configContactoMarca, type ConfigFormulario } from "@/lib/formularios/configFormulario";
import { nombreCompleto, type GrupoProductos } from "@/lib/lubricantes/marca";
import { conMensaje } from "@/lib/whatsapp";

import estilos from "./lubricantes.module.css";

/**
 * LOS PRODUCTOS DE UNA LÍNEA DE LUBRICANTES (plantilla de Andrés 4039, 2026-10-22): una
 * barra blanca por grupo con su título y las tarjetas de sus productos. Los productos sin
 * grupo (Auto liviano y Auto pesado) van sin barra: el `<h1>` ya nombra la línea.
 *
 * Cada tarjeta: foto, «NOMBRE GRADO», «Cotizar» (la ventana emergente con el producto como
 * referencia; sin JavaScript, el formulario del final) y «Ficha técnica», el PDF en nuestro
 * visor si tiene «Páginas como imágenes» o, si no, en otra pestaña. Sin PDF, sin el botón.
 *
 * Componente de SERVIDOR: los dos botones son las únicas islas de cliente, y no cargan nada
 * hasta que se pulsan.
 */
export function ProductosLinea({
  grupos,
  marca,
  formulario,
  anclaContacto,
}: {
  grupos: GrupoProductos[];
  marca: string;
  /** El formulario de la página: cada «Cotizar» lo reutiliza con su producto. */
  formulario: ConfigFormulario;
  anclaContacto: string;
}) {
  return (
    <div className={estilos.lineas}>
      {grupos.map((g) => {
        const idTitulo = `grupo-${g.clave}`;
        // Sin barra de grupo, el nombre cuelga directamente del `<h1>`: sin saltar niveles.
        const Nombre = g.titulo ? "h3" : "h2";
        return (
          <section
            key={g.clave}
            className={estilos.grupo}
            aria-labelledby={g.titulo ? idTitulo : undefined}
            aria-label={g.titulo ? undefined : "Productos"}
          >
            {g.titulo ? (
              <div className={estilos.cabeceraGrupo}>
                <h2 id={idTitulo} className={estilos.tituloGrupo}>
                  {g.titulo}
                </h2>
              </div>
            ) : null}

            <ul className={estilos.productos}>
              {g.productos.map((p) => {
                const nombre = nombreCompleto(p);
                const cotizacion = configContactoMarca({
                  origen: formulario.origen,
                  siteKey: formulario.siteKey,
                  // El WhatsApp de la ventana lleva el producto en el mensaje, como las fichas.
                  whatsapp: formulario.whatsapp
                    ? conMensaje(
                        formulario.whatsapp,
                        `Hola, quiero cotizar el lubricante ${marca} ${nombre}.`,
                      )
                    : undefined,
                  boton: formulario.textoBoton,
                  marca,
                  producto: `Lubricante ${marca} ${nombre}`,
                });
                return (
                  <li key={p.clave} className={estilos.producto}>
                    <div className={estilos.fotoCaja}>
                      {p.imagen ? (
                        <Image
                          src={p.imagen.url}
                          alt={p.imagen.alt}
                          width={p.imagen.width}
                          height={p.imagen.height}
                          sizes="(max-width: 767px) 88vw, (max-width: 1024px) 44vw, 280px"
                          className={estilos.foto}
                        />
                      ) : null}
                    </div>
                    <Nombre className={estilos.nombre}>{nombre}</Nombre>
                    <div className={estilos.botones}>
                      <BotonFormulario
                        href={`#${anclaContacto}`}
                        className={estilos.cotizar}
                        formulario={cotizacion}
                        ariaLabel={`Cotizar ${nombre}`}
                      >
                        Cotizar
                      </BotonFormulario>
                      {p.pdf ? (
                        <BotonVisorPdf
                          titulo={p.pdf.titulo}
                          pdf={p.pdf.pdf}
                          paginas={p.pdf.paginas}
                          className={estilos.ficha}
                        >
                          Ficha técnica
                          <span className="sr-only"> de {nombre}</span>
                        </BotonVisorPdf>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
