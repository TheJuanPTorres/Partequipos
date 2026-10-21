"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import estilos from "@/components/ficha/ficha.module.css";

import nueva from "./fichaNueva.module.css";

/*
 * Una característica de la cabecera de la ficha nueva: dos líneas (nombre y
 * valor), cada una con «…» si no cabe (dirección, 2026-10-21). El texto
 * completo está siempre en el HTML, así que el lector de pantalla lo lee
 * entero; si alguna línea se corta, la tarjeta lo enseña además al pasar el
 * ratón (`title`) y se despliega al tocarla o con Intro (y se vuelve a plegar).
 *
 * Es de cliente solo para eso: medir si la línea se corta, que depende del
 * ancho y de la fuente. Se mide al montar, al cambiar el ancho y al llegar
 * Inter; sin JavaScript, la tarjeta es la misma con su «…».
 */
export function PastillaDato({
  etiqueta,
  valor,
  icono,
}: {
  etiqueta: string;
  valor: string;
  icono: ReactNode;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const abiertoRef = useRef(false);
  const [cortado, setCortado] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const li = ref.current;
    if (!li) return;
    const medir = () => {
      // Desplegada no se corta nada: se mantiene lo medido al plegarla.
      if (abiertoRef.current) return;
      const lineas = li.querySelectorAll<HTMLElement>("[data-linea]");
      setCortado([...lineas].some((l) => l.scrollWidth > l.clientWidth + 1));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(li);
    void document.fonts?.ready.then(medir);
    return () => observador.disconnect();
  }, []);

  const alternar = () => {
    abiertoRef.current = !abiertoRef.current;
    setAbierto(abiertoRef.current);
  };

  return (
    <li
      ref={ref}
      data-cortado={cortado ? "" : undefined}
      data-abierto={abierto ? "" : undefined}
      title={cortado ? `${etiqueta}: ${valor}` : undefined}
      tabIndex={cortado ? 0 : undefined}
      onClick={cortado ? alternar : undefined}
      onKeyDown={
        cortado
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                alternar();
              }
            }
          : undefined
      }
    >
      {icono}
      <span className={`${estilos.datoApilado} ${nueva.dosLineas}`}>
        <b data-linea="">{etiqueta}:</b> <span data-linea="">{valor}</span>
      </span>
    </li>
  );
}
