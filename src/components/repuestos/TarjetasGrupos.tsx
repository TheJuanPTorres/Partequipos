import { IconMessageCircle } from "@tabler/icons-react";
import Image from "next/image";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { BotonTienda } from "@/components/tienda/BotonTienda";
import { VerTodosEquipos } from "@/components/nueva/VerTodosEquipos";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import { mensajeCotizar, type GrupoVista } from "@/lib/repuestos/grupos";
import { destinoTienda } from "@/lib/tienda/enlaceTienda";

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
 * - «Ver productos», en la misma fila (dirección, 2026-10-22): abre el MISMO panel que sube
 *   desde abajo del «Ver todo» de las marcas (`VerTodosEquipos`), con el grupo y su número, y los
 *   productos en una lista con buscador; sin enlaces (en WordPress no tienen página): cada uno abre
 *   la ventana de cotización con el producto y la categoría (Juan Pablo, 2026-10-26). La lista está además en el
 *   HTML de la página para Google; solo se ve sin JavaScript (`productosSinJs`), y el botón lleva a
 *   ella.
 *
 * «VER EN LA TIENDA» (2026-11-26): a la derecha de «Ver productos», un botón cuadrado de solo
 * icono con el «Enlace en la tienda» del grupo o, vacío, la tienda general; y en el panel de
 * productos, un botón de tienda a la derecha de cada producto (el suyo o el del grupo o el general).
 *
 * Misma rejilla y colocación que las tarjetas de la marca (`rejillaTarjetas`, regla #281).
 *
 * La foto, SIEMPRE ENTERA (dirección, 2026-10-26): son fotos de producto (motores, cilindros,
 * cabinas…) que con `cover` salían recortadas. Va con `contain`, centrada, con margen interior y
 * por encima del recuadro del nombre (`fotoProducto`).
 */
export function TarjetasGrupos({
  id,
  titulo,
  categoria,
  grupos,
  formulario,
  anclaContacto,
  tiendaGeneral = null,
}: {
  id: string;
  titulo: string;
  /** El nombre de la categoría, para el mensaje de «Cotizar». */
  categoria: string;
  grupos: GrupoVista[];
  /** El formulario de contacto de la página; cada tarjeta le añade su mensaje. */
  formulario: ConfigFormulario;
  anclaContacto: string;
  /** El enlace de la tienda general (el botón «Tienda» de la cabecera), si el panel lo tiene. */
  tiendaGeneral?: string | null;
}) {
  if (grupos.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section
      id={id}
      className={`${estilos.tarjetas} ${estilos.tarjetasIndice} ${estilos.tarjetasGrupos}`}
      aria-labelledby={idTitulo}
    >
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
      <ul className={`${estilos.rejilla} ${estilos.rejillaTarjetas}`}>
        {grupos.map((g) => {
          const idT = `${id}-${g.id}`;
          const idLista = `${idT}-productos`;
          // El del grupo o, vacío, el general; cada producto puede tener el suyo.
          const tiendaGrupo = destinoTienda(g.enlaceTienda, tiendaGeneral);
          return (
            <li key={g.id} className={estilos.tarjeta}>
              {g.imagen ? (
                <div className={estilos.foto}>
                  <Image
                    src={g.imagen.url}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1024px) 45vw, max(400px, 25vw)"
                    className={`${estilos.fotoImg} ${estilos.fotoProducto}`}
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
                {/* Opcional (2026-10-26, Filtros Donaldson): para qué sirve ese tipo de producto. */}
                {g.descripcion ? <p className={estilos.descripcionGrupo}>{g.descripcion}</p> : null}
                <div className={estilos.accionesGrupo}>
                  <BotonFormulario
                    href={`#${anclaContacto}`}
                    className={estilos.botonTarjeta}
                    formulario={{
                      ...formulario,
                      mensajeInicial: mensajeCotizar(g.nombre, categoria),
                    }}
                    titulo="Cotización"
                    nombreAccesible={`Cotizar: ${g.nombre}`}
                    ariaLabel={`Cotizar ${g.nombre}`}
                  >
                    <IconMessageCircle aria-hidden="true" focusable="false" stroke={2} size={16} />
                    Cotizar
                  </BotonFormulario>
                  {/* Sin productos (un grupo con solo descripción), sin «Ver productos». */}
                  {g.productos.length > 0 ? (
                    <VerTodosEquipos
                      titulo={g.nombre}
                      href={`#${idLista}`}
                      total={g.productos.length}
                      equipos={g.productos.map((p, i) => ({
                        id: i,
                        nombre: p,
                        href: null,
                        tienda: destinoTienda(g.enlacesProductos[i], tiendaGrupo),
                      }))}
                      buscador
                      cotizar={{ formulario, categoria }}
                      className={`${estilos.botonTarjeta} ${estilos.botonSecundario}`}
                      etiqueta="Ver productos"
                      describedBy={idT}
                    />
                  ) : null}
                  {tiendaGrupo ? (
                    <BotonTienda href={tiendaGrupo} origen="tipo-repuesto" nombre={g.nombre} />
                  ) : null}
                </div>
                {/*
                 * La lista en el HTML de la página (Google) y para quien no tiene JavaScript, que
                 * llega aquí con «Ver productos». Con JavaScript no se pinta: la enseña el panel.
                 */}
                {g.productos.length > 0 ? (
                  <ul
                    id={idLista}
                    className={`${estilos.listaProductos} ${estilos.productosSinJs}`}
                  >
                    {g.productos.map((p, i) => (
                      <li key={`${i}-${p}`}>{p}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <RecuadrosConScroll />
    </section>
  );
}
