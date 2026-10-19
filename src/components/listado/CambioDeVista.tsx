"use client";

import { IconLayoutGrid, IconLayoutList } from "@tabler/icons-react";
import { useState } from "react";

import estilos from "./listado.module.css";

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
 */
export function CambioDeVista({ idLista }: { idLista: string }) {
  const [vista, setVista] = useState<"lista" | "rejilla">("lista");
  const cambiar = (nueva: "lista" | "rejilla") => {
    setVista(nueva);
    document.getElementById(idLista)?.setAttribute("data-vista", nueva);
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
