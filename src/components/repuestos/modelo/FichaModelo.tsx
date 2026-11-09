import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { BaldosasCategorias } from "@/components/repuestos/BaldosasCategorias";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { LogoMarca } from "@/components/marca/LogoMarca";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { LogoConAlt } from "@/lib/marca/logoMarca";
import type { TarjetaMarca } from "@/lib/repuestos/marca";
import type { DatoClave } from "@/lib/repuestos/fichaModelo";
import type { BreadcrumbItem } from "@/lib/seo/jsonLd";

import estilos from "./fichaModelo.module.css";

/**
 * FICHA DE LA PÁGINA DE MODELO de repuestos SIN FOTO (Ronda 12, 2026-11-08: el cliente vende
 * repuestos, no máquinas). TODO en un solo contenedor, a dos columnas y en la primera pantalla.
 *
 * Izquierda: las migas, el logo pequeño de la marca, el `<h1>`, UNA línea de texto, los datos
 * clave (marca, tipo, serie, modelo) y los tipos de repuesto del tipo de máquina como etiquetas
 * enlazadas a su categoría.
 *
 * Derecha: el formulario corto de cotización, con el modelo ya puesto (la solicitud lo guarda
 * como referencia) y el botón verde de WhatsApp con el modelo en el mensaje (los trae el propio
 * formulario). En móvil, la información arriba y el formulario debajo.
 *
 * Propuesta de dirección, sin diseño de Andrés.
 */
export function FichaModelo({
  migas,
  titulo,
  logo,
  linea,
  datos,
  categorias,
  tituloCategorias,
  formulario,
}: {
  migas: BreadcrumbItem[];
  titulo: string;
  logo: LogoConAlt | null;
  /** Una línea de texto bajo el título; vacía, no se pinta. */
  linea: string;
  datos: DatoClave[];
  /** Los tipos de repuesto del tipo de máquina, en baldosas compactas bajo los datos clave. */
  categorias: TarjetaMarca[];
  tituloCategorias: string;
  formulario: ConfigFormulario;
}) {
  return (
    <section className={estilos.ficha} aria-labelledby="modelo-titulo">
      <div className={estilos.info}>
        <div className={estilos.migas}>
          <Breadcrumbs items={migas} />
        </div>
        <div className={estilos.marcaFila}>
          {logo ? (
            <LogoMarca logo={logo} alt={logo.alt} sizes="120px" className={estilos.logo} priority />
          ) : null}
        </div>
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
        {linea ? <p className={`${estilos.linea} texto-cuerpo`}>{linea}</p> : null}
        {datos.length > 0 ? (
          <dl className={estilos.datos}>
            {datos.map((d) => (
              <div key={d.etiqueta} className={estilos.dato}>
                <dt>{d.etiqueta}</dt>
                <dd>{d.valor}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <BaldosasCategorias
          id="modelo-categorias"
          titulo={tituloCategorias}
          categorias={categorias}
          compacta
        />
      </div>

      <div className={estilos.cotizar} id="modelo-contacto">
        <h2 className={estilos.cotizarTitulo}>Pedir cotización</h2>
        <FormularioSolicitud {...formulario} variante="plano" compacto />
      </div>
    </section>
  );
}
