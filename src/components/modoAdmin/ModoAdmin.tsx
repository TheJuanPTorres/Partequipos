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

function marcasGuardadas(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_MARCAS) !== "ocultas";
  } catch {
    return true;
  }
}

export function ModoAdmin() {
  const ruta = usePathname();
  const [sesion, setSesion] = useState<"comprobando" | "si" | "no">("comprobando");
  const [mapa, setMapa] = useState<Mapa | null>(null);
  const [marcas, setMarcas] = useState(true);
  const [confirmado, setConfirmado] = useState(false);

  // 1. La sesión, con el servidor. La pista sola no vale.
  useEffect(() => {
    let vivo = true;
    fetch("/api/users/me/", SIN_CACHE)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user?: unknown } | null) => {
        if (!vivo) return;
        if (d?.user) {
          setMarcas(marcasGuardadas());
          setSesion("si");
        } else {
          quitarPista();
          setSesion("no");
        }
      })
      .catch(() => vivo && setSesion("no"));
    return () => {
      vivo = false;
    };
  }, []);

  // 2. El mapa de esta página, cada vez que cambia la ruta.
  useEffect(() => {
    if (sesion !== "si") return;
    let vivo = true;
    fetch(`/api/modo-admin/mapa/?ruta=${encodeURIComponent(ruta)}`, SIN_CACHE)
      .then(async (r) => {
        if (!vivo) return;
        if (r.status === 401) {
          quitarPista();
          setSesion("no");
          return;
        }
        if (!r.ok) {
          setMapa(null);
          return;
        }
        setMapa((await r.json()) as Mapa);
        // El mapa solo responde bien a personal del panel: hasta entonces no se pinta nada.
        setConfirmado(true);
      })
      .catch(() => vivo && setMapa(null));
    return () => {
      vivo = false;
    };
  }, [sesion, ruta]);

  // Sitio a la franja: se reserva solo con sesión confirmada, y se devuelve al salir.
  useEffect(() => {
    if (sesion !== "si") return;
    const raiz = document.documentElement;
    raiz.setAttribute("data-modo-admin", "");
    // GA4 no cuenta las sesiones de administrador (por si la analítica ya estaba cargada).
    for (const clave of Object.keys(window)) {
      if (clave.startsWith("ga-disable-"))
        (window as unknown as Record<string, unknown>)[clave] = true;
    }
    return () => raiz.removeAttribute("data-modo-admin");
  }, [sesion]);

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
      .finally(() => {
        quitarPista();
        setSesion("no");
      });
  }, []);

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
    document.body,
  );
}
