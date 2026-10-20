import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { LogoMarca } from "@/components/marca/LogoMarca";
import estilosMarca from "@/components/repuestos/marca.module.css";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import type { VistaLubricantes } from "@/lib/lubricantes/general";

import estilos from "./general.module.css";

/**
 * Bloque a dos columnas de la página general de lubricantes (plantilla de
 * Andrés 809451): el FORMULARIO de solicitud (el nuestro, con «Ciudad» y
 * «¿Qué necesitas?»; sin n.º de documento, Ley 1581) y, al lado, el título, el
 * texto, el logo de la marca destacada (`LogoMarca`) y «Ver catálogo» a su
 * página. Los textos salen del panel.
 */
export function BloqueLubricantes({
  id,
  bloque,
  origen,
  siteKey,
  whatsapp,
}: {
  id: string;
  bloque: VistaLubricantes["bloque"];
  origen: string;
  siteKey: string | null;
  whatsapp?: { href: string; etiqueta: string };
}) {
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.seccion} aria-labelledby={idTitulo}>
      <div className={estilos.recuadro}>
        <div className={`${estilos.columnaFormulario} ${estilosMarca.formulario}`}>
          <FormularioSolicitud
            {...configContactoMarca({
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
            })}
            variante="plano"
          />
        </div>
        <div className={estilos.columnaTexto}>
          <h2 id={idTitulo} className={estilos.titulo}>
            {bloque.titulo}
          </h2>
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
              ) : (
                <span />
              )}
              <Link href={bloque.marca.href} className={estilos.boton}>
                {bloque.textoBoton}
                <IconArrowRight aria-hidden="true" focusable="false" stroke={2} />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
