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
 */

const INTERVALO_MS = 200;
const ESPERA_MAXIMA_MS = 8000;
const RESALTE_MS = 2500;

export function IrAlCampo() {
  const params = useSearchParams();
  const busqueda = params.toString();
  const hecho = useRef<string | null>(null);

  useEffect(() => {
    const { pestana, campo } = destinoDeUrl(busqueda);
    if (!pestana && !campo) return;
    if (hecho.current === busqueda) return;
    hecho.current = busqueda;

    let pestanaLista = !pestana;
    const inicio = Date.now();
    const temporizador = window.setInterval(() => {
      if (Date.now() - inicio > ESPERA_MAXIMA_MS) {
        window.clearInterval(temporizador);
        return;
      }
      if (!pestanaLista) {
        const boton = [
          ...document.querySelectorAll<HTMLButtonElement>(".tabs-field__tab-button"),
        ].find((b) => b.textContent?.trim() === pestana);
        if (!boton) return;
        if (!boton.classList.contains("tabs-field__tab-button--active")) boton.click();
        pestanaLista = true;
        if (!campo) {
          window.clearInterval(temporizador);
          boton.scrollIntoView({ block: "start" });
        }
        return;
      }
      if (!campo) return;
      const elemento = document.querySelector<HTMLElement>(`#${CSS.escape(idDeCampo(campo))}`);
      if (!elemento) {
        // Aún sin pintar: se baja para que Payload lo pinte.
        window.scrollBy({ top: 600 });
        return;
      }
      window.clearInterval(temporizador);
      elemento.scrollIntoView({ block: "center" });
      elemento.focus({ preventScroll: true });
      const caja = elemento.closest<HTMLElement>(".field-type") ?? elemento;
      caja.classList.add("pq-campo-destacado");
      window.setTimeout(() => caja.classList.remove("pq-campo-destacado"), RESALTE_MS);
    }, INTERVALO_MS);

    return () => window.clearInterval(temporizador);
  }, [busqueda]);

  return null;
}
