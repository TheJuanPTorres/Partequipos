"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import estilos from "./sedes.module.css";

/**
 * GLOBO DE SEDES (sección 9, fase G). Cliente: Mapbox GL necesita el
 * navegador. Porta el widget de ux-9 (`b9b46e6`): globo fijo sobre Colombia,
 * un pin por sede, el panel de la derecha con las fichas y la navegación
 * anterior/siguiente; al cambiar de sede el globo vuela hasta ella.
 *
 * Mapbox se carga desde su CDN —como en ux-9, sin dependencia nueva (§2)— y
 * SOLO cuando la sección se acerca a la pantalla: no pesa en el LCP. Si no
 * carga, queda la lista con su navegación, que funciona sin mapa.
 *
 * Movimiento reducido: los vuelos son instantáneos. No hay giro automático
 * (ux-9 lo tiene desactivado), así que no hace falta pausa.
 */
const VERSION = "v3.20.0";
const CSS = `https://api.mapbox.com/mapbox-gl-js/${VERSION}/mapbox-gl.css`;
const JS = `https://api.mapbox.com/mapbox-gl-js/${VERSION}/mapbox-gl.js`;

const CFG = {
  estilo: "mapbox://styles/mapbox/light-v11",
  centro: [-74.0, 4.6] as [number, number],
  zoom: 4.2,
  zoomMovil: 3.4,
  zoomSede: 8.5,
  zoomSedeMovil: 7.5,
  zoomAlejado: 5.2,
  duracion: 2200,
  margenVista: 80,
  desplazamiento: { x: -0.2, y: 0.25 },
  desplazamientoMovil: { x: 0, y: 0.5 },
  colores: { mar: "#FFFFFF", tierra: "#F4F4F4", fronteras: "#000000", iso: "CO" },
};

export type PuntoSede = { lat: number; lng: number; ciudad: string; titulo: string };

/* Lo poco de Mapbox GL que se usa, tipado a mano (no hay dependencia). */
type Padding = { top: number; bottom: number; left: number; right: number };
type Capa = { id: string; type: string };
type Mapa = {
  on: (evento: string, fn: () => void) => void;
  addControl: (c: unknown) => void;
  scrollZoom: { disable: () => void };
  setPadding: (p: Padding) => void;
  flyTo: (o: Record<string, unknown>) => void;
  fitBounds: (b: unknown, o: Record<string, unknown>) => void;
  getStyle: () => { layers?: Capa[] } | undefined;
  setPaintProperty: (id: string, prop: string, valor: unknown) => void;
  getSource: (id: string) => unknown;
  addSource: (id: string, s: Record<string, unknown>) => void;
  getLayer: (id: string) => unknown;
  addLayer: (l: Record<string, unknown>, antes?: string) => void;
  setFog: (f: Record<string, unknown>) => void;
  resize: () => void;
  remove: () => void;
};
type MapboxGL = {
  accessToken: string;
  Map: new (o: Record<string, unknown>) => Mapa;
  AttributionControl: new (o: Record<string, unknown>) => unknown;
  LngLatBounds: new () => { extend: (p: [number, number]) => void };
  Marker: new (o: Record<string, unknown>) => {
    setLngLat: (p: [number, number]) => { addTo: (m: Mapa) => unknown };
  };
};

declare global {
  interface Window {
    mapboxgl?: MapboxGL;
  }
}

let cargaMapbox: Promise<MapboxGL> | null = null;
function cargarMapbox(): Promise<MapboxGL> {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  cargaMapbox ??= new Promise((resolver, rechazar) => {
    if (!document.querySelector(`link[href="${CSS}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = CSS;
      document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src = JS;
    s.async = true;
    s.onload = () =>
      window.mapboxgl ? resolver(window.mapboxgl) : rechazar(new Error("sin mapboxgl"));
    s.onerror = () => rechazar(new Error("no se pudo cargar mapbox-gl.js"));
    document.head.appendChild(s);
  });
  return cargaMapbox;
}

const esMovil = () => window.matchMedia("(max-width: 991px)").matches;
const sinMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Props = { token: string; sedes: PuntoSede[]; children: ReactNode };

export function GloboSedes({ token, sedes, children }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const contenedorMapa = useRef<HTMLDivElement>(null);
  const carril = useRef<HTMLUListElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const mapa = useRef<Mapa | null>(null);
  const pines = useRef<HTMLButtonElement[]>([]);
  const volando = useRef(false);
  const [actual, setActual] = useState(0);
  const [plegado, setPlegado] = useState(false);
  const total = sedes.length;

  const relleno = useCallback((derechaExtra: number): Padding => {
    const el = contenedorMapa.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    const d = esMovil() ? CFG.desplazamientoMovil : CFG.desplazamiento;
    return {
      top: Math.max(0, d.y * h),
      bottom: Math.max(0, -d.y * h),
      left: Math.max(0, d.x * w),
      right: Math.max(0, -d.x * w) + derechaExtra,
    };
  }, []);

  const anchoPanel = useCallback(
    (estaPlegado: boolean) =>
      !esMovil() && !estaPlegado && panel.current ? panel.current.offsetWidth + 24 : 0,
    [],
  );

  const vistaGeneral = useCallback(
    (estaPlegado: boolean, duracion: number) => {
      const m = mapa.current;
      const gl = window.mapboxgl;
      if (!m || !gl || sedes.length === 0) return;
      const limites = new gl.LngLatBounds();
      sedes.forEach((s) => limites.extend([s.lng, s.lat]));
      const p = relleno(anchoPanel(estaPlegado));
      const g = CFG.margenVista;
      m.fitBounds(limites, {
        padding: { top: p.top + g, bottom: p.bottom + g, left: p.left + g, right: p.right + g },
        duration: sinMovimiento() ? 0 : duracion,
        essential: true,
      });
    },
    [sedes, relleno, anchoPanel],
  );

  const volarA = useCallback(
    (i: number) => {
      const s = sedes[i];
      if (!mapa.current || !s) return;
      mapa.current.flyTo({
        center: [s.lng, s.lat],
        zoom: esMovil() ? CFG.zoomSedeMovil : CFG.zoomSede,
        minZoom: CFG.zoomAlejado,
        speed: 0.9,
        curve: 1.6,
        duration: sinMovimiento() ? 0 : CFG.duracion,
        essential: true,
      });
    },
    [sedes],
  );

  /** Ir a la sede `i`: desplaza el carril, marca el pin y vuela. */
  const ir = useCallback(
    (destino: number) => {
      const i = ((destino % total) + total) % total;
      setActual(i);
      volando.current = true;
      const item = carril.current?.querySelector<HTMLElement>(`[data-sede-indice="${i}"]`);
      if (item && carril.current) {
        carril.current.scrollTo(esMovil() ? { left: item.offsetLeft } : { top: item.offsetTop });
      }
      volarA(i);
      window.setTimeout(() => (volando.current = false), sinMovimiento() ? 50 : CFG.duracion + 200);
    },
    [total, volarA],
  );

  // Pin activo, en el DOM de Mapbox.
  useEffect(() => {
    pines.current.forEach((p, i) => {
      if (i === actual) p.setAttribute("data-activo", "");
      else p.removeAttribute("data-activo");
      p.setAttribute("aria-pressed", String(i === actual));
    });
  }, [actual]);

  // Al desplazar el carril a mano, la sede visible pasa a ser la activa.
  useEffect(() => {
    const lista = carril.current;
    if (!lista) return;
    const items = Array.from(lista.querySelectorAll<HTMLElement>("[data-sede-indice]"));
    const obs = new IntersectionObserver(
      (entradas) => {
        if (volando.current) return;
        for (const e of entradas) {
          if (!e.isIntersecting || e.intersectionRatio <= 0.5) continue;
          const i = Number((e.target as HTMLElement).dataset.sedeIndice);
          setActual((prev) => {
            if (prev !== i) volarA(i);
            return i;
          });
        }
      },
      { root: lista, threshold: 0.5 },
    );
    items.forEach((it) => obs.observe(it));
    return () => obs.disconnect();
  }, [volarA]);

  // Mapbox, solo cuando la sección se acerca a la pantalla.
  useEffect(() => {
    const el = raiz.current;
    const cont = contenedorMapa.current;
    if (!el || !cont) return;
    let cancelado = false;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        cargarMapbox()
          .then((gl) => {
            if (cancelado || mapa.current) return;
            gl.accessToken = token;
            const m = new gl.Map({
              container: cont,
              style: CFG.estilo,
              center: CFG.centro,
              zoom: esMovil() ? CFG.zoomMovil : CFG.zoom,
              projection: "globe",
              attributionControl: false,
              cooperativeGestures: false,
            });
            mapa.current = m;
            // Atribución VISIBLE: los términos de Mapbox lo exigen.
            m.addControl(new gl.AttributionControl({ compact: true }));
            m.scrollZoom.disable();
            m.on("load", () => {
              if (cancelado) return;
              pintarColores(m);
              m.setPadding(relleno(anchoPanel(false)));
              pines.current = sedes.map((s, i) => {
                const pin = document.createElement("button");
                pin.type = "button";
                pin.className = "sedes-pin";
                pin.setAttribute("aria-label", `Ver ${s.titulo} en el mapa`);
                const punto = document.createElement("span");
                punto.className = "sedes-pin__punto";
                const etiqueta = document.createElement("span");
                etiqueta.className = "sedes-pin__etiqueta";
                etiqueta.textContent = s.ciudad;
                etiqueta.setAttribute("aria-hidden", "true");
                pin.append(punto, etiqueta);
                pin.addEventListener("click", () => ir(i));
                new gl.Marker({ element: pin, anchor: "center" })
                  .setLngLat([s.lng, s.lat])
                  .addTo(m);
                return pin;
              });
              pines.current[0]?.setAttribute("data-activo", "");
              vistaGeneral(false, 0);
            });
          })
          .catch((e: unknown) => console.error("[sedes] el globo no cargó; queda la lista:", e));
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => {
      cancelado = true;
      obs.disconnect();
      mapa.current?.remove();
      mapa.current = null;
    };
  }, [token, sedes, relleno, anchoPanel, vistaGeneral, ir]);

  // Plegar o abrir el panel: recoloca el globo.
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    m.setPadding(relleno(anchoPanel(plegado)));
    if (plegado) vistaGeneral(true, CFG.duracion);
  }, [plegado, relleno, anchoPanel, vistaGeneral]);

  // Cambio de tamaño.
  useEffect(() => {
    let t = 0;
    const aplicar = () => {
      const m = mapa.current;
      if (!m) return;
      m.resize();
      m.setPadding(relleno(anchoPanel(plegado)));
    };
    const alCambiar = () => {
      window.clearTimeout(t);
      t = window.setTimeout(aplicar, 200);
    };
    window.addEventListener("resize", alCambiar, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", alCambiar);
    };
  }, [plegado, relleno, anchoPanel]);

  return (
    <div ref={raiz} className={estilos.globo} data-plegado={plegado ? "" : undefined}>
      <div
        ref={contenedorMapa}
        className={estilos.mapa}
        role="region"
        aria-label="Mapa de las sedes de Partequipos"
      />

      <div ref={panel} className={estilos.panel} inert={plegado || undefined}>
        <ul
          ref={carril}
          className={estilos.carril}
          tabIndex={0}
          aria-label="Sedes. Usa las flechas para pasar de una a otra."
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
              e.preventDefault();
              ir(actual + 1);
            }
            if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
              e.preventDefault();
              ir(actual - 1);
            }
          }}
        >
          {children}
        </ul>
        <button
          type="button"
          className={estilos.cerrar}
          onClick={() => setPlegado(true)}
          aria-label="Ocultar el panel de sedes"
        >
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
            <path
              d="M10.75 0.75L0.75 10.75M0.75 0.75L10.75 10.75"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <nav className={estilos.nav} aria-label="Navegación de sedes">
        <button
          type="button"
          className={estilos.navBoton}
          onClick={() => ir(actual - 1)}
          aria-label="Sede anterior"
        >
          <svg viewBox="0 0 12 11" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M5.19685 11L6.14173 10.0634L1.24724 4.96196V6.03804L6.16063 0.936594L5.21575 0L0 5.5L5.19685 11ZM12 6.21739V4.78261H1.11496V6.21739H12Z" />
          </svg>
        </button>
        <p className={estilos.contador} aria-live="polite">
          {actual + 1} / {total}
        </p>
        <button
          type="button"
          className={estilos.navBoton}
          onClick={() => ir(actual + 1)}
          aria-label="Sede siguiente"
        >
          <svg viewBox="0 0 12 11" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M6.80315 11L5.85827 10.0634L10.7528 4.96196V6.03804L5.83937 0.936594L6.78425 0L12 5.5L6.80315 11ZM0 6.21739V4.78261H10.885V6.21739H0Z" />
          </svg>
        </button>
      </nav>

      <button
        type="button"
        className={estilos.reabrir}
        onClick={() => setPlegado(false)}
        aria-label="Mostrar el panel de sedes"
        tabIndex={plegado ? 0 : -1}
        aria-hidden={!plegado}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path
            d="M9 19L15.2929 12.7071C15.6834 12.3166 15.6834 11.6834 15.2929 11.2929L9 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

/** Colores del planeta de ux-9: mar blanco, tierra gris, fronteras y contorno de Colombia. */
function pintarColores(m: Mapa) {
  const c = CFG.colores;
  try {
    let antes: string | undefined;
    for (const l of m.getStyle()?.layers ?? []) {
      if (l.type === "background") m.setPaintProperty(l.id, "background-color", c.mar);
      if (l.type === "fill") m.setPaintProperty(l.id, "fill-color", c.mar);
      if (!antes && l.type !== "background" && l.type !== "fill") antes = l.id;
    }
    if (!m.getSource("paises")) {
      m.addSource("paises", { type: "vector", url: "mapbox://mapbox.country-boundaries-v1" });
    }
    const capa = (id: string, def: Record<string, unknown>) => {
      if (!m.getLayer(id))
        m.addLayer({ id, source: "paises", "source-layer": "country_boundaries", ...def }, antes);
    };
    capa("sedes-tierra", { type: "fill", paint: { "fill-color": c.tierra } });
    capa("sedes-fronteras", {
      type: "line",
      paint: { "line-color": c.fronteras, "line-width": 0.5, "line-opacity": 0.55 },
    });
    capa("sedes-contorno", {
      type: "line",
      filter: ["==", ["get", "iso_3166_1"], c.iso],
      paint: {
        "line-color": c.fronteras,
        "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.9, 6, 1.2, 10, 1.4],
      },
    });
  } catch (e) {
    console.error("[sedes] el estilo del mapa no admite las capas de color:", e);
  }
  m.setFog({
    color: "#ffffff",
    "high-color": "#ffffff",
    "space-color": "#ffffff",
    "horizon-blend": 0.1,
    "star-intensity": 0,
  });
}
