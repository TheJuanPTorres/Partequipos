import Image from "next/image";
import type { CSSProperties } from "react";

import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./navSecciones.module.css";

export type BotonSeccion = {
  texto: string;
  /** El `id` de su sección en la portada (sin `#`). */
  ancla: string;
  /** La máquina (o pieza) recortada del botón; sin ella, solo el texto. */
  imagen: ImagenLista | null;
};

/**
 * BARRA DE SECCIONES de la portada (diseño del cliente `NavSecciones.tsx`, 2026-11-03), portada
 * SIN la librería «motion» y sin JavaScript: un panel blanco montado sobre el borde de abajo del
 * hero con los tres botones principales, cada uno con su máquina recortada y un enlace a su
 * ancla. El fondo rojo descansa en el primero y se desliza al que está bajo el ratón o con el
 * foco (`:has`, solo CSS); al pasar, la máquina avanza un poco. El desplazamiento es suave y
 * deja la sección bajo la cabecera fija (`scroll-margin-top` de cada sección); con «reducir
 * movimiento», salto directo y nada se anima. En móvil caben los tres, con los nombres en hasta
 * tres líneas.
 *
 * Va justo DESPUÉS del hero (fuera de su `<section>`: el teclado y el ratón no tocan el
 * carrusel); `HeroPortada` con `conNav` sube sus controles lo que la barra tapa.
 */
export function NavSecciones({ botones }: { botones: BotonSeccion[] }) {
  if (botones.length === 0) return null;
  return (
    <nav aria-label="Secciones de Partequipos" className={estilos.nav}>
      <ul className={estilos.lista} style={{ "--botones": botones.length } as CSSProperties}>
        {botones.map((b) => (
          <li key={b.ancla} className={estilos.item}>
            <a href={`#${b.ancla}`} className={estilos.boton}>
              <span className={estilos.imagen}>
                {b.imagen ? (
                  <Image
                    src={b.imagen.url}
                    alt=""
                    fill
                    sizes="(max-width: 639px) 30vw, 200px"
                    className={estilos.maquina}
                  />
                ) : null}
              </span>
              <span className={estilos.etiqueta}>{b.texto}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
