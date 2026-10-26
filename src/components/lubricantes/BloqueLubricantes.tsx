import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { LogoMarca } from "@/components/marca/LogoMarca";
import estilosMarca from "@/components/repuestos/marca.module.css";
import { configContactoMarca, type ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { VistaLubricantes } from "@/lib/lubricantes/general";

import { BotonCatalogo } from "./BotonCatalogo";
import estilos from "./general.module.css";

/**
 * Bloque a dos columnas de la página general de lubricantes (plantilla de
 * Andrés 809451): el FORMULARIO de solicitud (el nuestro, con «Ciudad» y
 * «¿Qué necesitas?»; sin n.º de documento, Ley 1581) y, al lado, el título, el
 * texto, el logo de la marca destacada (`LogoMarca`) y «Ver catálogo» a su
 * página (desde el 2026-10-26, botón principal bajo el título). Los textos salen del panel.
 *
 * También cierra la página de cada marca (Lubricantes ENI, plantilla 3946) y la de
 * cada una de sus líneas (plantilla 4039), con su propio formulario (`formulario`:
 * el mismo de los botones «Cotizar») y SIN «Ver catálogo» (dirección, 2026-10-22).
 */
export function BloqueLubricantes({
  id,
  bloque,
  origen,
  siteKey,
  whatsapp,
  formulario,
}: {
  id: string;
  bloque: VistaLubricantes["bloque"];
  origen: string;
  siteKey: string | null;
  whatsapp?: { href: string; etiqueta: string };
  /** El formulario de la página, si no es el de la página general. */
  formulario?: ConfigFormulario;
}) {
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.seccion} aria-labelledby={idTitulo}>
      <div className={estilos.recuadro}>
        <div className={`${estilos.columnaFormulario} ${estilosMarca.formulario}`}>
          <FormularioSolicitud
            {...(formulario ??
              configContactoMarca({
                origen,
                siteKey,
                whatsapp,
                boton: "Enviar",
                marca: "lubricantes",
                formulario: {
                  titulo: "Solicitud de información sobre lubricantes",
                  conCiudad: true,
                  etiquetaMensaje: "¿Qué necesitas?",
                },
              }))}
            variante="plano"
          />
        </div>
        <div className={estilos.columnaTexto}>
          <h2 id={idTitulo} className={estilos.titulo}>
            {bloque.titulo}
          </h2>
          {/*
           * «Ver catálogo» justo bajo el título (petición del cliente, 2026-10-26: más
           * protagonismo), como botón principal; antes, pequeño al final junto al logo.
           */}
          {bloque.marca?.href ? (
            <BotonCatalogo
              href={bloque.marca.href}
              texto={bloque.textoBoton}
              className={estilos.botonCatalogo}
            />
          ) : null}
          {bloque.parrafos.map((p, i) => (
            <p key={i} className={estilos.parrafo}>
              {p}
            </p>
          ))}
          {bloque.marca ? (
            <div className={estilos.pie}>
              {bloque.marca.logo ? (
                <LogoMarca
                  logo={bloque.marca.logo}
                  alt={bloque.marca.logo.alt}
                  sizes="115px"
                  className={estilos.logo}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
