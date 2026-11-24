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
 * LÍMITES (dirección): la pestaña, como mucho 5 clics separados 400 ms y dentro de 4 s; todo, 8 s;
 * después se rinde en silencio. Si el usuario pulsa una tecla o hace clic en cualquier sitio, se para en el acto: no se
 * le quita la pestaña que elija.
 */

const INTERVALO_MS = 200;
const ESPERA_MAXIMA_MS = 8000;
const RESALTE_MS = 2500;
/** Cuántas veces, como mucho, se pulsa la pestaña, cada cuánto y en cuánto tiempo. Después, se rinde. */
const MAXIMO_CLICS = 5;
const ENTRE_CLICS_MS = 400;
const ESPERA_PESTANA_MS = 4000;
/** Tras activarse el botón en React, lo que se espera a que Payload restaure la pestaña guardada. */
const CALMA_MS = 500;
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
     * Dos trampas, comprobadas en el preview del #585 y leídas en Payload 3.89 (`fields/Tabs`):
     * - Los botones de las pestañas llegan pintados del servidor: un clic antes de que React los
     *   active no hace nada. Se espera a que el botón tenga sus propiedades de React.
     * - Al montarse, Payload lee la pestaña guardada del usuario (petición asíncrona) y la RESTAURA,
     *   lo que pisaría un clic temprano. Se deja un momento de calma y, si aun así cambia, se
     *   vuelve a pulsar; solo se sigue cuando lleva varias vueltas activa seguidas.
     */
    let clics = 0;
    let ultimoClic = 0;
    let activoDesde = 0;
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
        const ahora = Date.now();
        if (!boton) {
          if (ahora - inicio > ESPERA_PESTANA_MS) parar();
          return;
        }
        // ¿Ya lo maneja React? Sin eso, el clic se pierde.
        if (!Object.keys(boton).some((k) => k.startsWith("__reactProps"))) {
          if (ahora - inicio > ESPERA_PESTANA_MS) parar();
          return;
        }
        if (!activoDesde) activoDesde = ahora;
        if (!boton.classList.contains("tabs-field__tab-button--active")) {
          estable = 0;
          // Tras los intentos o el tiempo de la pestaña, se rinde en silencio.
          if (clics >= MAXIMO_CLICS || ahora - inicio > ESPERA_PESTANA_MS) return parar();
          if (ahora - activoDesde < CALMA_MS || ahora - ultimoClic < ENTRE_CLICS_MS) return;
          boton.click();
          clics++;
          ultimoClic = ahora;
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
