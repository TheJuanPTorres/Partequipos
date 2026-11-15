"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import nueva from "./fichaNueva.module.css";

/*
 * LA DESCRIPCIÓN Y LOS BOTONES DE LA FICHA NUEVA, con «Leer más» (dirección, 2026-11-12).
 *
 * En escritorio la columna derecha NUNCA es más alta que la foto: esta envoltura no aporta su
 * alto a la fila (`contain: size` en el CSS, con un mínimo para unas líneas y los botones), así
 * que la fila la marca la galería y la descripción se recorta en lo que quede. En tablet y móvil
 * la descripción se recorta a unas líneas. Si el texto no cabe, sale «Leer más», que la despliega
 * entera (y «Leer menos» la vuelve a plegar).
 *
 * Es de cliente solo para eso: saber si el texto se corta depende del ancho, del alto de la foto y
 * de la fuente. Se mide al montar, al cambiar el tamaño y al llegar Inter. El texto entero está
 * siempre en el HTML (buscadores y lectores de pantalla). Sin JavaScript no se recorta nada
 * (`<noscript>`).
 */
export function DescripcionPlegable({
  descripcion,
  reserva,
  claseTexto,
  botones,
}: {
  /** La descripción ya pintada; `null` sin descripción (solo los botones). */
  descripcion: ReactNode | null;
  /** Su texto plano: la copia invisible que fija el alto mientras llega Inter (CLS). */
  reserva: string;
  /** Clases tipográficas del texto. */
  claseTexto: string;
  botones: ReactNode;
}) {
  const id = useId();
  const cajaRef = useRef<HTMLDivElement>(null);
  const cuerpoRef = useRef<HTMLDivElement>(null);
  const abiertoRef = useRef(false);
  const [cortado, setCortado] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const caja = cajaRef.current;
    const cuerpo = cuerpoRef.current;
    if (!caja || !cuerpo) return;
    const medir = () => {
      // Desplegada no se corta nada: se mantiene lo medido al plegarla.
      if (abiertoRef.current) return;
      // El cuerpo, no la caja: la copia de la reserva puede medir algo más que el texto.
      setCortado(cuerpo.scrollHeight > caja.clientHeight + 1);
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(caja);
    observador.observe(cuerpo);
    void document.fonts?.ready.then(medir);
    return () => observador.disconnect();
  }, []);

  const alternar = () => {
    abiertoRef.current = !abiertoRef.current;
    setAbierto(abiertoRef.current);
    if (!abiertoRef.current) cajaRef.current?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div
      className={nueva.envoltura}
      data-con-descripcion={descripcion ? "" : undefined}
      data-cortado={cortado && !abierto ? "" : undefined}
      data-abierto={abierto ? "" : undefined}
    >
      <noscript>
        <style>{`.${nueva.envoltura}{contain:none!important}.${nueva.descripcion}{max-height:none!important}`}</style>
      </noscript>
      {descripcion ? (
        <div
          ref={cajaRef}
          id={id}
          className={`${nueva.descripcion} ${nueva.reserva} ${claseTexto}`}
          data-reserva={reserva}
        >
          <div ref={cuerpoRef} className={nueva.cuerpoDescripcion}>
            {descripcion}
          </div>
        </div>
      ) : null}
      {/* La ranura está siempre: si el botón apareciera de golpe al medir, movería los botones (CLS). */}
      {descripcion ? (
        <div className={nueva.ranuraLeerMas}>
          {cortado || abierto ? (
            <button
              type="button"
              className={`${nueva.leerMas} texto-etiqueta`}
              aria-expanded={abierto}
              aria-controls={id}
              onClick={alternar}
            >
              {abierto ? "Leer menos" : "Leer más"}
              <span className="sr-only"> de la descripción</span>
            </button>
          ) : null}
        </div>
      ) : null}
      {botones}
    </div>
  );
}
