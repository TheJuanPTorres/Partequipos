"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { RespuestaMapa } from "@/lib/modoAdmin/mapa";
import { quitarPista } from "@/lib/modoAdmin/pista";

import { ESTILOS } from "./estilos";
import { MarcasEdicion } from "./MarcasEdicion";

/**
 * MODO ADMINISTRACIÓN SOBRE LA WEB (tanda 23, PROTOTIPO): el MÓDULO. Solo lo descarga quien tiene
 * la pista del panel (`CargadorModoAdmin`), y NO PINTA NADA hasta que el servidor confirma la
 * sesión:
 *
 * 1. `GET /api/users/me/` con la cookie httpOnly de la sesión. Sin usuario: borra la pista y fin.
 * 2. `GET /api/modo-admin/mapa/?ruta=…`: qué bloques de esta página puede editar ESE usuario (lo
 *    filtra el servidor). Un 401 aquí también borra la pista.
 *
 * La franja y los botones solo ENLAZAN al panel, que vuelve a comprobar permisos. Aquí no se
 * edita ni se guarda nada. Lo único que escribe es «Cerrar sesión», con el `POST
 * /api/users/logout/` que Payload ya tiene.
 *
 * «use client»: sesión, eventos de teclado y ratón, y portales.
 */
const CLAVE_MARCAS = "pq-modo-admin-marcas";
const SIN_CACHE: RequestInit = { credentials: "same-origin", cache: "no-store" };

type Mapa = RespuestaMapa & { usuario: string };

/*
 * Lo que el servidor YA confirmó en este documento (no sobrevive a una recarga): al volver a una
 * página con «Atrás», la franja y sus botones salen al momento con lo último que se supo de ella,
 * y el mapa se vuelve a pedir por detrás. Nunca se pinta nada que el servidor no haya confirmado
 * antes en esta misma carga.
 */
let sesionConfirmada = false;
const mapasVistos = new Map<string, Mapa>();

function marcasGuardadas(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_MARCAS) !== "ocultas";
  } catch {
    return true;
  }
}

export function ModoAdmin() {
  const ruta = usePathname();
  const [sesion, setSesion] = useState<"comprobando" | "si" | "no">(
    sesionConfirmada ? "si" : "comprobando",
  );
  const [mapas, setMapas] = useState(() => new Map(mapasVistos));
  const [marcas, setMarcas] = useState(true);
  const [confirmado, setConfirmado] = useState(sesionConfirmada);
  // El contenedor de la franja: se crea suelto y solo se cuelga del `<body>` con la sesión confirmada.
  const [anfitrion] = useState(() => {
    const caja = document.createElement("div");
    caja.setAttribute("data-pqma", "");
    return caja;
  });
  // El mapa de ESTA ruta; al cambiar de página no se enseña el de la anterior.
  const mapa = mapas.get(ruta) ?? null;
  // Para dejar de pedir el mapa cuando ya se sabe que no hay sesión.
  const sinSesion = sesion === "no";

  const salir = useCallback(() => {
    sesionConfirmada = false;
    mapasVistos.clear();
    quitarPista();
    setSesion("no");
  }, []);

  // 1. La sesión, con el servidor. La pista sola no vale.
  useEffect(() => {
    let vivo = true;
    // Vista la decisión guardada de las marcas (el servidor no la conoce).
    queueMicrotask(() => vivo && setMarcas(marcasGuardadas()));
    if (sesionConfirmada) return;
    fetch("/api/users/me/", SIN_CACHE)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user?: unknown } | null) => {
        if (!vivo) return;
        if (d?.user) setSesion("si");
        else salir();
      })
      .catch(() => vivo && setSesion("no"));
    return () => {
      vivo = false;
    };
  }, [salir]);

  // 2. El mapa de esta página, cada vez que cambia la ruta. Se pide A LA VEZ que la sesión (no
  // después): cada petición puede despertar su propia función, y en fila tardaban el doble
  // (medido por C con sesión, 2026-11-24: unos 10 s en frío). Nada se pinta hasta tener LAS DOS.
  useEffect(() => {
    if (sinSesion) return;
    let vivo = true;
    fetch(`/api/modo-admin/mapa/?ruta=${encodeURIComponent(ruta)}`, SIN_CACHE)
      .then(async (r) => {
        if (!vivo) return;
        if (r.status === 401) {
          salir();
          return;
        }
        if (!r.ok) return;
        const nuevo = (await r.json()) as Mapa;
        if (!vivo) return;
        mapasVistos.set(ruta, nuevo);
        setMapas(new Map(mapasVistos));
        // El mapa solo responde bien a personal del panel: hasta entonces no se pinta nada.
        sesionConfirmada = true;
        setConfirmado(true);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [sinSesion, ruta, salir]);

  const visible = sesion === "si" && confirmado;

  /*
   * La franja y los botones van en un contenedor propio, EL PRIMERO del `<body>`: así, con el
   * teclado, lo primero que se alcanza con Tab es la franja y, después, cada «Editar» en el orden
   * de la página (al recibir el foco, el navegador lleva la pantalla hasta él). Solo existe con
   * la sesión confirmada.
   */
  useEffect(() => {
    if (!visible) return;
    document.body.prepend(anfitrion);
    return () => anfitrion.remove();
  }, [visible, anfitrion]);

  // Sitio a la franja: se reserva solo con sesión confirmada, y se devuelve al salir.
  useEffect(() => {
    if (!visible) return;
    const raiz = document.documentElement;
    raiz.setAttribute("data-modo-admin", "");
    // GA4 no cuenta las sesiones de administrador (por si la analítica ya estaba cargada).
    for (const clave of Object.keys(window)) {
      if (clave.startsWith("ga-disable-"))
        (window as unknown as Record<string, unknown>)[clave] = true;
    }
    return () => raiz.removeAttribute("data-modo-admin");
  }, [visible]);

  const alternarMarcas = useCallback(() => {
    setMarcas((antes) => {
      try {
        window.localStorage.setItem(CLAVE_MARCAS, antes ? "ocultas" : "visibles");
      } catch {
        // Sin `localStorage`, vale para esta visita.
      }
      return !antes;
    });
  }, []);

  // Atajo: Alt + Mayús + E.
  useEffect(() => {
    if (sesion !== "si") return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyE") {
        e.preventDefault();
        alternarMarcas();
      }
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [sesion, alternarMarcas]);

  const cerrarSesion = useCallback(() => {
    fetch("/api/users/logout/", { ...SIN_CACHE, method: "POST" })
      .catch(() => undefined)
      .finally(salir);
  }, [salir]);

  if (sesion !== "si" || !confirmado) return null;

  return createPortal(
    <>
      <style>{ESTILOS}</style>
      <div className="pqma-franja" role="region" aria-label="Modo administración">
        <span className="pqma-aviso">
          <strong>Estás viendo la web como administrador</strong>
          {mapa?.usuario ? <span className="pqma-quien"> · {mapa.usuario}</span> : null}
        </span>
        {mapa?.pagina ? (
          <a
            className="pqma-boton pqma-boton--principal"
            href={mapa.pagina.href}
            target="_blank"
            rel="noopener"
          >
            Editar esta página
          </a>
        ) : null}
        {mapa?.borrador ? (
          <a className="pqma-boton" href={mapa.borrador} target="_blank" rel="noopener">
            Ver borrador
          </a>
        ) : null}
        <a className="pqma-boton" href="/admin/" target="_blank" rel="noopener">
          Ir al panel
        </a>
        <button
          type="button"
          className="pqma-boton"
          aria-pressed={!marcas}
          aria-keyshortcuts="Alt+Shift+E"
          onClick={alternarMarcas}
        >
          Ocultar marcas de edición
          <kbd className="pqma-tecla">Alt + Mayús + E</kbd>
        </button>
        <button type="button" className="pqma-boton" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>
      {marcas && mapa ? <MarcasEdicion bloques={mapa.bloques} ruta={ruta} /> : null}
    </>,
    anfitrion,
  );
}
