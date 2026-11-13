import Image from "next/image";
import Link from "next/link";

import type { AlineacionTexto, AlineacionTitulo, AnchoTexto } from "@/lib/fields/alineacionTexto";
import { partirTitulo, type CategoriaDePortada } from "@/lib/portada/kitCliente";

import { Flecha } from "./Flecha";
import { TextoEditable } from "./TextoEditable";
import estilos from "./repuestosKit.module.css";

/**
 * «VENTA DE REPUESTOS», DISEÑO V3 DEL CLIENTE (2026-11-03; prototipo `CatalogoRepuestos` de
 * `partequipos-diseno\portada-repuestos-v3`), PORTADO a CSS modules. Sustituye al de la máquina
 * (2026-10-26/27): la sección ya NO lleva máquina (la Yanmar pasa a la banda «Marcas de repuestos»,
 * justo debajo). Título con una palabra en rojo, el texto del panel (un párrafo por línea, con su
 * alineación y ancho; SIN el botón de WhatsApp del prototipo, por decisión de Juan Pablo) y las categorías en tarjetas blancas con esquina
 * roja, 5 por fila desde portátil. Detrás, franjas diagonales grises y una roja, a la derecha del
 * texto (nunca lo cruzan).
 *
 * Componente de SERVIDOR, sin JavaScript. Las categorías son las técnicas con posición en la
 * portada (orden, nombre o «Título en portada», y la «Foto en la portada» o la de la tarjeta), y
 * cada tarjeta lleva a SU PÁGINA, no a WhatsApp como el prototipo.
 */

export type TextosRepuestosKit = {
  antetitulo: string;
  titulo: string;
  /** «Palabra del título en rojo». */
  tituloResaltado: string;
  /** «Alineación del título» (clienta, 2026-11-12): centrado por defecto. Mueve también el antetítulo. */
  tituloAlineacion: AlineacionTitulo;
  /**
   * Botón rojo bajo el título (clienta, 2026-11-12): «Ver todos los repuestos», al índice de
   * repuestos. Sigue la alineación del título. Sin texto o sin enlace, no se pinta.
   */
  botonTexto: string;
  botonEnlace: string;
  /** «Texto bajo el título»: un párrafo por línea. Vacío, no se pinta. */
  descripcion: string;
  descripcionAlineacion: AlineacionTexto;
  descripcionAncho: AnchoTexto;
};

const TITULO_POR_DEFECTO = "Encuentra Maquinaria y Repuestos Rápido y Fácil";

/**
 * El ancho de la foto en la tarjeta (18 vw en escritorio, 30 en tablet y 45 en el teléfono), por
 * cuánto se amplía el fichero para igualar las piezas: así se pide a la resolución que se pinta.
 */
function sizesEscalados(factor: number): string {
  const vw = (n: number) => `${Math.round(n * Math.max(1, factor))}vw`;
  return `(min-width: 1025px) ${vw(18)}, (min-width: 768px) ${vw(30)}, ${vw(45)}`;
}

export function SeccionRepuestosKit({
  categorias,
  textos,
}: {
  categorias: CategoriaDePortada[];
  textos: TextosRepuestosKit;
}) {
  if (categorias.length === 0) return null;
  const idTitulo = "repuestos-kit-titulo";
  const titulo = partirTitulo(textos.titulo || TITULO_POR_DEFECTO, textos.tituloResaltado);
  return (
    <section id="repuestos" className={estilos.seccion} aria-labelledby={idTitulo}>
      <div className={estilos.panel} data-titulo={textos.tituloAlineacion}>
        <Franjas />

        <div className={estilos.cabecera}>
          {textos.antetitulo ? <p className={estilos.antetitulo}>{textos.antetitulo}</p> : null}
          <h2 id={idTitulo} className={estilos.titulo}>
            {titulo.antes}
            {titulo.resaltado ? (
              <span className={estilos.resaltado}>{titulo.resaltado}</span>
            ) : null}
            {titulo.despues}
          </h2>
          {textos.botonTexto && textos.botonEnlace ? (
            <p className={estilos.verTodoFila}>
              <Link href={textos.botonEnlace} className={estilos.verTodo}>
                {textos.botonTexto}
                <Flecha className={estilos.flecha} />
              </Link>
            </p>
          ) : null}
          <TextoEditable
            texto={textos.descripcion}
            alineacion={textos.descripcionAlineacion}
            ancho={textos.descripcionAncho}
            className={estilos.descripcion}
          />
        </div>

        <ul className={estilos.tarjetas}>
          {categorias.map((c) => (
            <li key={c.id}>
              <Link href={c.href} className={estilos.tarjeta}>
                <span className={estilos.esquina} aria-hidden="true" />
                <span className={estilos.foto}>
                  {c.imagen && c.colocacion ? (
                    <span
                      className={estilos.fotoColocada}
                      style={{
                        left: `${c.colocacion.izquierda}%`,
                        top: `${c.colocacion.arriba}%`,
                        width: `${c.colocacion.ancho}%`,
                        height: `${c.colocacion.alto}%`,
                      }}
                    >
                      <Image
                        src={c.imagen.url}
                        alt=""
                        fill
                        sizes={sizesEscalados(c.colocacion.ancho / 100)}
                        className={estilos.fotoImg}
                      />
                    </span>
                  ) : c.imagen ? (
                    <Image
                      src={c.imagen.url}
                      alt=""
                      fill
                      sizes={sizesEscalados(1)}
                      className={estilos.fotoImg}
                    />
                  ) : null}
                </span>
                <span className={estilos.pie}>
                  <span className={estilos.nombre}>{c.nombre}</span>
                  <span className={estilos.boton} aria-hidden="true">
                    <Flecha className={estilos.flecha} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Las franjas del fondo: tres losas grises y una roja que baja desde arriba y se apaga. Van en una
 * capa que empieza A LA DERECHA de la columna del texto, así que nunca cruzan el título ni los
 * párrafos; por debajo del texto solo quedan detrás de las tarjetas, que son opacas. Solo desde
 * 1280 px: más estrecho no queda sitio a la derecha del texto.
 */
function Franjas() {
  return (
    <div className={estilos.franjas} aria-hidden="true">
      <span className={`${estilos.losa} ${estilos.losa1}`} />
      <span className={`${estilos.losa} ${estilos.losa2}`} />
      <span className={`${estilos.losa} ${estilos.roja}`} />
      <span className={`${estilos.losa} ${estilos.losa3}`} />
    </div>
  );
}
