"use client";

import { IconSearch } from "@tabler/icons-react";
import { useId, useRef, useState } from "react";

import { coincideModelo } from "@/lib/repuestos/buscarModelo";

import estilos from "./modelosTexto.module.css";

/**
 * «BUSCA TU MODELO» (Ronda 12): un campo que filtra al escribir las tarjetas de la sección
 * `idSeccion`. No vuelve a pintar nada: las tarjetas vienen del servidor con su texto
 * normalizado en `data-modelo-busqueda` y aquí solo se les pone o quita `hidden`, así que el HTML
 * que ven los buscadores lleva TODOS los modelos. Un grupo (serie) sin ninguna tarjeta a la vista
 * se oculta con su título, y un aviso en vivo dice cuántos quedan.
 *
 * Sin JavaScript el campo no sale (`@media (scripting: enabled)`): la lista se ve entera.
 */
export function BuscadorModelos({ idSeccion, total }: { idSeccion: string; total: number }) {
  const idCampo = useId();
  const [aviso, setAviso] = useState("");
  const vacio = useRef<HTMLParagraphElement>(null);

  function filtrar(consulta: string) {
    const seccion = document.getElementById(idSeccion);
    if (!seccion) return;
    let visibles = 0;
    for (const tarjeta of seccion.querySelectorAll<HTMLElement>("[data-modelo-busqueda]")) {
      const encaja = coincideModelo(tarjeta.dataset.modeloBusqueda ?? "", consulta);
      tarjeta.hidden = !encaja;
      if (encaja) visibles += 1;
    }
    for (const grupo of seccion.querySelectorAll<HTMLElement>("[data-grupo-modelos]")) {
      grupo.hidden = !grupo.querySelector("[data-modelo-busqueda]:not([hidden])");
    }
    if (vacio.current) vacio.current.hidden = visibles > 0;
    setAviso(
      consulta.trim() === ""
        ? ""
        : visibles === 0
          ? "Ningún modelo coincide con tu búsqueda."
          : `${visibles} ${visibles === 1 ? "modelo" : "modelos"} de ${total}.`,
    );
  }

  return (
    <div className={estilos.buscador}>
      <label htmlFor={idCampo} className={estilos.buscadorEtiqueta}>
        Busca tu modelo
      </label>
      <div className={estilos.buscadorCaja}>
        <IconSearch aria-hidden="true" focusable="false" size={20} stroke={2} />
        <input
          id={idCampo}
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="Escribe el modelo, p. ej. 320D"
          className={estilos.buscadorCampo}
          onChange={(e) => filtrar(e.target.value)}
        />
      </div>
      <p aria-live="polite" className={estilos.buscadorAviso}>
        {aviso}
      </p>
      <p ref={vacio} hidden className={estilos.buscadorVacio}>
        No encontramos ese modelo. Pídenos tu repuesto con el formulario de abajo y te ayudamos.
      </p>
    </div>
  );
}
