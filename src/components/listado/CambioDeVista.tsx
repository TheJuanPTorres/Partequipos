"use client";

import { IconLayoutGrid, IconLayoutList } from "@tabler/icons-react";
import { useState } from "react";

import { CURVA, DURACION_MS } from "@/lib/listado/animaciones";

import estilos from "./listado.module.css";

/** Como mucho se recolocan con animación las tarjetas que se ven (y no más de estas). */
const MAX_RECOLOCADAS = 12;

const seVe = (caja: DOMRect) => caja.bottom > 0 && caja.top < innerHeight;

/**
 * El icono de cuadrícula de ux-9: alterna la vista del listado entre LISTA
 * (por defecto) y REJILLA (decisión 6 de dirección, 2026-10-14), sin cambiar
 * la URL ni recargar.
 *
 * Por qué es de cliente: guarda qué vista se ve y la cambia al pulsar. Es lo
 * único interactivo de la plantilla; sin JavaScript, el listado se ve en lista
 * y todo lo demás funciona igual.
 *
 * Cambia el atributo `data-vista` de la lista de tarjetas (`idLista`), que
 * está en otra columna de la página: así no hace falta convertir el listado
 * entero en componente de cliente.
 *
 * Con `recolocar` (animación A8 de usados, `src/lib/listado/animaciones.ts`),
 * las tarjetas que se ven se desplazan desde su sitio de antes hasta el nuevo
 * (solo `transform` y `opacity`); las que entran en la vista, con un fundido.
 */
export function CambioDeVista({
  idLista,
  recolocar = false,
}: {
  idLista: string;
  recolocar?: boolean;
}) {
  const [vista, setVista] = useState<"lista" | "rejilla">("lista");
  const cambiar = (nueva: "lista" | "rejilla") => {
    setVista(nueva);
    const lista = document.getElementById(idLista);
    if (!lista) return;
    const animar =
      recolocar &&
      lista.getAttribute("data-vista") !== nueva &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tarjetas = animar ? [...lista.children] : [];
    const antes = tarjetas.map((t) => t.getBoundingClientRect());
    lista.setAttribute("data-vista", nueva);
    let recolocadas = 0;
    tarjetas.forEach((t, i) => {
      if (recolocadas >= MAX_RECOLOCADAS) return;
      const ahora = t.getBoundingClientRect();
      const caja = antes[i];
      if (!caja || !seVe(ahora)) return;
      recolocadas++;
      const opciones = { duration: DURACION_MS, easing: CURVA };
      if (!seVe(caja)) {
        t.animate([{ opacity: 0 }, { opacity: 1 }], opciones);
        return;
      }
      t.animate(
        [
          {
            transform: `translate(${caja.left - ahora.left}px, ${caja.top - ahora.top}px)`,
            opacity: 0.6,
          },
          { transform: "none", opacity: 1 },
        ],
        opciones,
      );
    });
  };
  return (
    <div className={estilos.vista} role="group" aria-label="Vista del listado">
      <button
        type="button"
        aria-pressed={vista === "lista"}
        aria-label="Ver en lista"
        onClick={() => cambiar("lista")}
      >
        <IconLayoutList size={24} stroke={1.6} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-pressed={vista === "rejilla"}
        aria-label="Ver en rejilla"
        onClick={() => cambiar("rejilla")}
      >
        <IconLayoutGrid size={24} stroke={1.6} aria-hidden="true" />
      </button>
    </div>
  );
}
