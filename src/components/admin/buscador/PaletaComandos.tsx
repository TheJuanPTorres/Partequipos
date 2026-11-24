"use client";

import { IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  COLECCIONES_BUSCABLES,
  esAtajoPaleta,
  fichasDeRespuesta,
  filtrarComandos,
  urlBusqueda,
  type Comando,
} from "@/lib/panel/buscador";

import "./buscador.scss";

/*
 * BUSCADOR GLOBAL DEL PANEL (Ctrl+K, tanda 23, fase 1). «use client»: atajo de teclado, diálogo y
 * búsqueda mientras se escribe.
 *
 * Accesible con teclado y lector de pantalla (patrón «combobox» con lista de WAI-ARIA): el foco se
 * queda en el campo; las flechas mueven la opción activa (`aria-activedescendant`), Intro abre,
 * Escape cierra y el foco vuelve a donde estaba. Un aviso en vivo dice cuántos resultados hay.
 *
 * Se pinta en `body` (portal): el menú lateral cerrado en el móvil es `inert` y lo bloquearía.
 * Las fichas se piden a la API REST con la sesión de quien busca: su acceso decide qué ve.
 */

/** El evento con el que el botón del menú abre la paleta (y el filtro del menú, si se quiere). */
export const EVENTO_ABRIR_PALETA = "pq:abrir-paleta";

const TITULOS: Record<Comando["tipo"], string> = {
  seccion: "Secciones",
  accion: "Acciones",
  ficha: "Fichas",
};

const PAUSA_MS = 250;

export function PaletaComandos({
  secciones,
  acciones,
  buscables,
  admin,
  api,
}: {
  secciones: Comando[];
  acciones: Comando[];
  /** Slugs de `COLECCIONES_BUSCABLES` que quien mira puede ver. */
  buscables: string[];
  admin: string;
  api: string;
}) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState("");
  // Las fichas van con el texto con que se pidieron: si ya no es el escrito, no se enseñan.
  const [fichas, setFichas] = useState<{ texto: string; lista: Comando[] }>({
    texto: "",
    lista: [],
  });
  const [activa, setActiva] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const anterior = useRef<HTMLElement | null>(null);
  const base = useId();
  const idLista = `${base}-lista`;
  const idTitulo = `${base}-titulo`;

  const abrir = useCallback(() => {
    anterior.current = document.activeElement as HTMLElement | null;
    setTexto("");
    setFichas({ texto: "", lista: [] });
    setActiva(0);
    setAbierta(true);
  }, []);

  const cerrar = useCallback(() => {
    setAbierta(false);
    // Al cerrar, el foco vuelve a donde estaba (el botón o el campo que se usaba).
    requestAnimationFrame(() => anterior.current?.focus?.());
  }, []);

  // El atajo, en todo el panel; y el botón del menú, por evento.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (!esAtajoPaleta(e)) return;
      e.preventDefault();
      if (abierta) cerrar();
      else abrir();
    };
    window.addEventListener("keydown", alPulsar);
    window.addEventListener(EVENTO_ABRIR_PALETA, abrir);
    return () => {
      window.removeEventListener("keydown", alPulsar);
      window.removeEventListener(EVENTO_ABRIR_PALETA, abrir);
    };
  }, [abierta, abrir, cerrar]);

  useEffect(() => {
    if (abierta) campo.current?.focus();
  }, [abierta]);

  // Qué se pide para el texto de ahora (vacío si es demasiado corto).
  const pedidos = useMemo(
    () =>
      COLECCIONES_BUSCABLES.filter((c) => buscables.includes(c.slug)).flatMap((c) => {
        const url = urlBusqueda(api, c, texto);
        return url ? [{ c, url }] : [];
      }),
    [buscables, api, texto],
  );
  const buscando = abierta && pedidos.length > 0 && fichas.texto !== texto;

  // Las fichas, con una pausa entre teclas; una búsqueda nueva cancela la anterior.
  useEffect(() => {
    if (!abierta || pedidos.length === 0) return;
    const control = new AbortController();
    const pedido = texto;
    const temporizador = setTimeout(async () => {
      const respuestas = await Promise.all(
        pedidos.map(({ c, url }) =>
          fetch(url, { credentials: "same-origin", signal: control.signal })
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => fichasDeRespuesta(admin, c, j))
            .catch(() => [] as Comando[]),
        ),
      );
      if (!control.signal.aborted) setFichas({ texto: pedido, lista: respuestas.flat() });
    }, PAUSA_MS);
    return () => {
      clearTimeout(temporizador);
      control.abort();
    };
  }, [abierta, texto, pedidos, admin]);

  const resultados = useMemo(
    () => [
      ...filtrarComandos([...secciones, ...acciones], texto),
      ...(pedidos.length > 0 && fichas.texto === texto ? fichas.lista : []),
    ],
    [secciones, acciones, texto, fichas, pedidos],
  );

  const ir = (c: Comando | undefined) => {
    if (!c) return;
    setAbierta(false);
    router.push(c.href);
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiva((i) => (resultados.length ? (i + 1) % resultados.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((i) => (resultados.length ? (i - 1 + resultados.length) % resultados.length : 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiva(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiva(Math.max(0, resultados.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      ir(resultados[activa]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
    } else if (e.key === "Tab") {
      // El único elemento con foco es el campo: Tab no sale del diálogo.
      e.preventDefault();
    }
  };

  // La opción activa, siempre visible al moverse con las flechas.
  useEffect(() => {
    if (!abierta) return;
    document.getElementById(`${base}-op-${activa}`)?.scrollIntoView({ block: "nearest" });
  }, [activa, abierta, base]);

  // Solo se abre tras una tecla o un clic, así que siempre hay `document`.
  if (!abierta) return null;

  const idActiva = resultados[activa] ? `${base}-op-${activa}` : undefined;
  const grupos = (["seccion", "accion", "ficha"] as const)
    .map((tipo) => ({
      tipo,
      items: resultados.map((c, i) => ({ c, i })).filter((x) => x.c.tipo === tipo),
    }))
    .filter((g) => g.items.length > 0);
  const aviso = buscando
    ? "Buscando fichas…"
    : resultados.length === 0
      ? texto.trim()
        ? `Nada coincide con «${texto.trim()}».`
        : "Escribe para buscar."
      : `${resultados.length} ${resultados.length === 1 ? "resultado" : "resultados"}.`;

  return createPortal(
    <div className="pq-paleta" onMouseDown={(e) => e.target === e.currentTarget && cerrar()}>
      <div aria-labelledby={idTitulo} aria-modal="true" className="pq-paleta__caja" role="dialog">
        <h2 className="sr-only" id={idTitulo}>
          Buscar en el panel
        </h2>
        <div className="pq-paleta__cabecera">
          <IconSearch aria-hidden="true" className="pq-paleta__lupa" size={20} />
          <input
            aria-activedescendant={idActiva}
            aria-autocomplete="list"
            aria-controls={idLista}
            aria-expanded="true"
            aria-label="Buscar secciones, fichas y acciones"
            autoComplete="off"
            className="pq-paleta__campo"
            onChange={(e) => {
              setTexto(e.target.value);
              setActiva(0);
            }}
            onKeyDown={alTeclear}
            placeholder="Busca una sección, una ficha por nombre o modelo, o «crear…»"
            ref={campo}
            role="combobox"
            spellCheck={false}
            type="text"
            value={texto}
          />
          <kbd className="pq-paleta__tecla">Esc</kbd>
        </div>
        <div className="pq-paleta__lista" id={idLista} role="listbox" aria-label="Resultados">
          {grupos.map((g) => (
            <div aria-labelledby={`${base}-g-${g.tipo}`} key={g.tipo} role="group">
              <div className="pq-paleta__grupo" id={`${base}-g-${g.tipo}`} role="presentation">
                {TITULOS[g.tipo]}
              </div>
              {g.items.map(({ c, i }) => (
                <div
                  aria-selected={i === activa}
                  className={`pq-paleta__opcion${i === activa ? " pq-paleta__opcion--activa" : ""}`}
                  id={`${base}-op-${i}`}
                  key={c.id}
                  onClick={() => ir(c)}
                  onMouseMove={() => i !== activa && setActiva(i)}
                  role="option"
                >
                  <span className="pq-paleta__etiqueta">{c.etiqueta}</span>
                  {c.contexto ? <span className="pq-paleta__contexto">{c.contexto}</span> : null}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p aria-live="polite" className="pq-paleta__aviso" role="status">
          {aviso}
        </p>
        <p aria-hidden="true" className="pq-paleta__pie">
          <kbd>↑</kbd> <kbd>↓</kbd> para moverte · <kbd>Intro</kbd> para abrir · <kbd>Ctrl</kbd>+
          <kbd>K</kbd> desde cualquier pantalla
        </p>
      </div>
    </div>,
    document.body,
  );
}
