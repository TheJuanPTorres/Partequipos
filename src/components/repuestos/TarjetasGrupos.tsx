import { IconChevronDown, IconMessageCircle } from "@tabler/icons-react";
import Image from "next/image";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import { mensajeCotizar, type GrupoVista } from "@/lib/repuestos/grupos";

import estilos from "./marca.module.css";
import { RecuadrosConScroll } from "./RecuadrosConScroll";

/**
 * «QUÉ INCLUYE» de la página de categoría técnica con la PLANTILLA 4007 de Andrés (la de la marca
 * de repuestos; dirección, 2026-10-22): una tarjeta «difuminada» por grupo de productos, con la
 * foto de su página de WordPress, el nombre tal cual y dos acciones:
 *
 * - «Cotizar»: los productos no tienen página propia, así que abre la VENTANA del formulario con
 *   el grupo ya escrito en «¿Qué necesitas?» (`mensajeCotizar`). Sin JavaScript baja al
 *   formulario de la página (`anclaContacto`).
 * - «Ver productos (N)»: la lista de lo que incluye, en un `<details>` nativo (como el «VER MÁS»
 *   de WordPress). La lista está en el HTML aunque esté plegada: es lo que lee Google.
 *
 * Misma rejilla y colocación que las tarjetas de la marca (`rejillaTarjetas`, regla #281), salvo
 * que las tarjetas no se estiran: al desplegar una, las demás de su fila no cambian.
 */
export function TarjetasGrupos({
  id,
  titulo,
  categoria,
  grupos,
  formulario,
  anclaContacto,
}: {
  id: string;
  titulo: string;
  /** El nombre de la categoría, para el mensaje de «Cotizar». */
  categoria: string;
  grupos: GrupoVista[];
  /** El formulario de contacto de la página; cada tarjeta le añade su mensaje. */
  formulario: ConfigFormulario;
  anclaContacto: string;
}) {
  if (grupos.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section
      id={id}
      className={`${estilos.tarjetas} ${estilos.tarjetasIndice}`}
      aria-labelledby={idTitulo}
    >
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
      <ul className={`${estilos.rejilla} ${estilos.rejillaTarjetas} ${estilos.rejillaGrupos}`}>
        {grupos.map((g) => {
          const idT = `${id}-${g.id}`;
          return (
            <li key={g.id} className={estilos.tarjeta}>
              {g.imagen ? (
                <div className={estilos.foto}>
                  <Image
                    src={g.imagen.url}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1024px) 45vw, 400px"
                    className={estilos.fotoImg}
                    style={{ objectPosition: g.imagen.posicion }}
                  />
                </div>
              ) : null}
              <div
                className={estilos.panel}
                data-con-foto={g.imagen ? "" : undefined}
                data-recuadro-scroll={g.imagen ? "" : undefined}
              >
                <h3 id={idT} className={estilos.tituloTarjeta}>
                  {g.nombre}
                </h3>
                <BotonFormulario
                  href={`#${anclaContacto}`}
                  className={estilos.botonTarjeta}
                  formulario={{
                    ...formulario,
                    mensajeInicial: mensajeCotizar(g.nombre, categoria),
                  }}
                  titulo={`Cotizar: ${g.nombre}`}
                  ariaLabel={`Cotizar ${g.nombre}`}
                >
                  <IconMessageCircle aria-hidden="true" focusable="false" stroke={2} size={16} />
                  Cotizar
                </BotonFormulario>
                <details className={estilos.desplegable}>
                  <summary className={estilos.verProductos} aria-describedby={idT}>
                    <span>Ver productos ({g.productos.length})</span>
                    <IconChevronDown aria-hidden="true" stroke={2} width={18} height={18} />
                  </summary>
                  <ul className={estilos.listaProductos}>
                    {g.productos.map((p, i) => (
                      <li key={`${i}-${p}`}>{p}</li>
                    ))}
                  </ul>
                </details>
              </div>
            </li>
          );
        })}
      </ul>
      <RecuadrosConScroll />
    </section>
  );
}
