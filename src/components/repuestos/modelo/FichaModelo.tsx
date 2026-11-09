import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { LogoMarca } from "@/components/marca/LogoMarca";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import type { LogoConAlt } from "@/lib/marca/logoMarca";
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
  formulario,
}: {
  migas: BreadcrumbItem[];
  titulo: string;
  logo: LogoConAlt | null;
  /** Una línea de texto bajo el título; vacía, no se pinta. */
  linea: string;
  datos: DatoClave[];
  /** Los tipos de repuesto (categorías técnicas) elegidos en el tipo de máquina, con su página. */
  categorias: { id: number; nombre: string; href: string }[];
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
          <p className={`${estilos.antetitulo} texto-etiqueta`}>Repuestos para Maquinaria Pesada</p>
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
        {categorias.length > 0 ? (
          <nav aria-labelledby="modelo-tipos-repuesto" className={estilos.tipos}>
            <p id="modelo-tipos-repuesto" className={estilos.tiposTitulo}>
              Repuestos disponibles
            </p>
            <ul className={estilos.etiquetas}>
              {categorias.map((c) => (
                <li key={c.id}>
                  <a href={c.href} className={estilos.etiqueta}>
                    {c.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>

      <div className={estilos.cotizar} id="modelo-contacto">
        <h2 className={estilos.cotizarTitulo}>Pedir cotización</h2>
        <FormularioSolicitud {...formulario} variante="plano" compacto />
      </div>
    </section>
  );
}
