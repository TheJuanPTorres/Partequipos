"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { destinoDeUrl, idDeCampo } from "@/lib/panel/enlaceEditar";

import "./editar.scss";

/*
 * MODO ADMINISTRACIÓN SOBRE LA WEB (tanda 23): al abrir una ficha desde el enlace «Editar» de la
 * web (`?pestana=…&campo=…`, `src/lib/panel/enlaceEditar.ts`), abre la pestaña y lleva al campo:
 * scroll, foco y un resalte breve. «use client»: lee la URL y toca el formulario ya pintado.
 *
 * SEGURIDAD: solo usa lo que `destinoDeUrl` da por válido (pestaña de una lista cerrada; campo con
 * letras, números, puntos y guiones). La pestaña se busca comparando su TEXTO con la etiqueta de la
 * lista; el campo, con `CSS.escape`. Nada de lo que llega por la URL se escribe en la página.
 *
 * Payload solo pinta los campos cerca de la pantalla (`RenderIfInViewport`): si el campo aún no
 * existe, se baja un poco y se vuelve a mirar, hasta 8 s. Si no aparece, no se hace nada.
 *
 * LÍMITES (dirección): la pestaña, como mucho 4 clics en 2 s; todo, 8 s; después se rinde en
 * silencio. Si el usuario pulsa una tecla o hace clic en cualquier sitio, se para en el acto: no se
 * le quita la pestaña que elija.
 */

const INTERVALO_MS = 200;
const ESPERA_MAXIMA_MS = 8000;
const RESALTE_MS = 2500;
/** Cuántas veces, como mucho, se pulsa la pestaña; y en cuánto tiempo. Después, se rinde. */
const MAXIMO_CLICS = 4;
const ESPERA_PESTANA_MS = 2000;
/** Vueltas seguidas con la pestaña activa antes de ir al campo (≈ 0,6 s). */
const VUELTAS_ESTABLE = 3;

export function IrAlCampo() {
  const params = useSearchParams();
  const busqueda = params.toString();
  const hecho = useRef<string | null>(null);

  useEffect(() => {
    const { pestana, campo } = destinoDeUrl(busqueda);
    if (!pestana && !campo) return;
    if (hecho.current === busqueda) return;
    hecho.current = busqueda;

    /*
     * Payload recuerda la pestaña activa de cada usuario y la RESTAURA al terminar de cargar, lo que
     * pisa un clic temprano (comprobado en el preview del #585). Por eso se vuelve a pulsar mientras
     * no esté activa, y solo se sigue cuando lleva varias vueltas activa seguidas.
     */
    let clics = 0;
    let estable = 0;
    const inicio = Date.now();
    // Si el usuario hace algo (pulsa otra pestaña, escribe, hace clic), se le deja: se para aquí.
    const parar = () => {
      window.clearInterval(temporizador);
      window.removeEventListener("pointerdown", parar, true);
      window.removeEventListener("keydown", parar, true);
    };
    window.addEventListener("pointerdown", parar, true);
    window.addEventListener("keydown", parar, true);
    const temporizador = window.setInterval(() => {
      if (Date.now() - inicio > ESPERA_MAXIMA_MS) return parar();
      if (pestana) {
        const boton = [
          ...document.querySelectorAll<HTMLButtonElement>(".tabs-field__tab-button"),
        ].find((b) => b.textContent?.trim() === pestana);
        if (!boton) {
          if (Date.now() - inicio > ESPERA_PESTANA_MS) parar();
          return;
        }
        if (!boton.classList.contains("tabs-field__tab-button--active")) {
          estable = 0;
          // Tras los intentos o el tiempo de la pestaña, se rinde en silencio.
          if (clics >= MAXIMO_CLICS || Date.now() - inicio > ESPERA_PESTANA_MS) return parar();
          boton.click();
          clics++;
          return;
        }
        if (++estable < VUELTAS_ESTABLE) return;
        if (!campo) {
          parar();
          boton.scrollIntoView({ block: "start" });
          return;
        }
      }
      if (!campo) return;
      const elemento = document.querySelector<HTMLElement>(`#${CSS.escape(idDeCampo(campo))}`);
      if (!elemento) {
        // Aún sin pintar: se baja para que Payload lo pinte.
        window.scrollBy({ top: 600 });
        return;
      }
      parar();
      elemento.scrollIntoView({ block: "center" });
      elemento.focus({ preventScroll: true });
      const caja = elemento.closest<HTMLElement>(".field-type") ?? elemento;
      caja.classList.add("pq-campo-destacado");
      window.setTimeout(() => caja.classList.remove("pq-campo-destacado"), RESALTE_MS);
    }, INTERVALO_MS);

    return parar;
  }, [busqueda]);

  return null;
}
