"use client";

import {
  IconCheck,
  IconCircleCheck,
  IconMessageCircle,
  IconPhoto,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";

import { conFormaDeMarca } from "@/components/marca/FormaMarca";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import { tituloDeVentana } from "@/lib/formularios/tituloVentana";
import { coincideModelo, enOrdenNatural, normalizarBusqueda } from "@/lib/repuestos/buscarModelo";
import { cotizacionDeProducto } from "@/lib/repuestos/cotizarProducto";
import { mejoraApagadaEnLaPagina } from "@/lib/repuestos/mejoras";
import type { ImagenLista } from "@/lib/utils/relations";

import panel from "./panelEquipos.module.css";

/** La ventana de cotización (con su formulario) no viaja hasta pulsar un producto. */
const VentanaFormulario = lazy(() =>
  import("@/components/forms/VentanaFormulario").then((m) => ({ default: m.VentanaFormulario })),
);

/**
 * Una tarjeta del panel. Sin `href`, el nombre como texto (un modelo que WordPress nombra sin
 * página). `imagen`: su foto; `null` o sin el campo, el respaldo neutro.
 */
export type ElementoPanel = {
  id: number | string;
  nombre: string;
  href: string | null;
  imagen?: ImagenLista | null;
};

/** Sin la barra final ni el ancla, para comparar una ruta con la página en la que se está. */
const sinBarra = (ruta: string) => ruta.split("#")[0]!.replace(/\/+$/, "") || "/";

/**
 * «VER TODOS (N)»: abre un PANEL que sube desde la parte inferior de la pantalla con el
 * listado completo de los equipos del tipo (petición del cliente, 2026-10-20).
 *
 * MEJORA PROGRESIVA: es un enlace a la página del tipo (que sigue existiendo para
 * Google y otros enlaces), así que sin JavaScript —o con Ctrl, ⌘, Mayús o botón
 * central— va a esa página. Con JavaScript, el clic normal abre el panel.
 *
 * El panel es un `<dialog>` nativo con `showModal()`: foco atrapado, Esc, título
 * anunciado y la página de detrás inerte. Se añade la X y el clic fuera. El foco vuelve
 * al enlace «Ver todos» al cerrar; al abrir, el foco va al título del panel. El contenido se monta en el primer clic; cerrado no ocupa sitio.
 * Con «reducir movimiento» no hay barrido: un fundido.
 *
 * También lo usa la página de MARCA DE REPUESTOS (dirección, 2026-10-21): el «Ver todo» de
 * cada tarjeta de tipo o serie abre el panel con sus modelos (`etiqueta`, `describedBy`), con
 * un enlace discreto a la página completa del tipo (`enlacePagina`) y la barra en el color de
 * la marca (`acento`).
 *
 * R5 de repuestos (dirección, 2026-10-21), con `buscador`: un campo «Busca tu modelo» arriba del
 * listado que lo filtra al escribir (sin distinguir mayúsculas, guiones ni espacios), y los
 * modelos en ORDEN NATURAL (EX100, EX120, EX200…). El alto del panel se fija al empezar a
 * escribir, para que no salte al filtrar.
 *
 * REJILLA DE TARJETAS (diseño del cliente, 2026-10-25): foto arriba (la del modelo o el equipo;
 * sin ella, un respaldo neutro) y nombre debajo; 4 por fila en escritorio, 3 en tablet y 2 en
 * el móvil. La de la página en la que se está, marcada (borde y fondo suave del color de la marca
 * y un check). Las fotos, diferidas y con su caja reservada.
 *
 * PRODUCTOS DE UNA CATEGORÍA TÉCNICA, con `cotizar` (Juan Pablo, 2026-10-26): el LISTADO de antes
 * (filas sin foto, hasta 3 columnas con la regla del #281), con el buscador R5 en el orden de
 * WordPress, y cada producto PULSABLE: abre la ventana de cotización con el producto y la categoría
 * ya indicados y en el mensaje de WhatsApp (`cotizacionDeProducto`). No lleva a ninguna página. La
 * ventana se monta junto al panel, no dentro (así su Esc y su cierre no cierran el panel), y al
 * cerrarla el foco vuelve al producto.
 */
export function VerTodosEquipos({
  titulo,
  href,
  total,
  equipos,
  className,
  etiqueta,
  describedBy,
  enlacePagina,
  acento,
  buscador = false,
  cotizar,
}: {
  titulo: string;
  href: string;
  total: number;
  equipos: ElementoPanel[];
  className?: string;
  /** El contenido del enlace; por defecto «Ver todos (N)». */
  etiqueta?: ReactNode;
  /** `aria-describedby` del enlace (la tarjeta a la que pertenece). */
  describedBy?: string;
  /** Texto de un enlace discreto, al pie del panel, a la página completa (`href`). */
  enlacePagina?: string;
  /** Color de la barra del panel; sin él, el `--acento` de la página o un gris oscuro. */
  acento?: string | null;
  /** R5: buscador y orden natural (panel de modelos de repuestos). */
  buscador?: boolean;
  /** Productos de una categoría técnica: listado y cada producto abre la ventana de cotización. */
  cotizar?: { formulario: ConfigFormulario; categoria: string };
}) {
  const [montado, setMontado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const enlace = useRef<HTMLAnchorElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const empezoFuera = useRef(false);
  const idTitulo = useId();
  const idBuscar = useId();
  const [consulta, setConsulta] = useState("");
  const [altoFijo, setAltoFijo] = useState<number | null>(null);
  const ruta = usePathname();
  // El producto que se está cotizando (su ventana queda montada tras cerrarla, como `BotonFormulario`).
  const [cotizando, setCotizando] = useState<ElementoPanel | null>(null);
  const [ventanaAbierta, setVentanaAbierta] = useState(false);
  const botonCotizado = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      // El foco inicial va al título (decisión de dirección, 2026-10-20): se anuncia el panel y
      // el Tab siguiente llega al botón de cerrar y al listado.
      tituloRef.current?.focus();
    }
  }, [abierto, montado]);

  function alPulsar(e: MouseEvent<HTMLAnchorElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setMontado(true);
    setAbierto(true);
  }

  function cerrar() {
    const d = dialogo.current;
    if (!d || !d.open || cerrando) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      d.close();
      return;
    }
    setCerrando(true);
    // Red de seguridad por si `animationend` no llega (pestaña en segundo plano).
    window.setTimeout(() => dialogo.current?.open && dialogo.current.close(), 700);
  }

  // R5: solo con el panel montado (en el navegador), así que se puede leer la URL del preview.
  const conR5 = buscador && montado && !mejoraApagadaEnLaPagina("R5");
  // Los productos, en el orden de WordPress; los modelos, en orden natural.
  const ordenados = conR5 && !cotizar ? enOrdenNatural(equipos) : equipos;
  const q = normalizarBusqueda(consulta);
  const visibles =
    conR5 && q
      ? ordenados.filter((e) => coincideModelo(normalizarBusqueda(e.nombre), q))
      : ordenados;
  const palabra = cotizar ? "producto" : "modelo";
  const configVentana =
    cotizar && cotizando
      ? cotizacionDeProducto(cotizar.formulario, cotizando.nombre, cotizar.categoria)
      : null;
  const vistosVentana = configVentana ? tituloDeVentana(configVentana) : null;
  const esActual = (e: ElementoPanel) => !!e.href && !!ruta && sinBarra(e.href) === sinBarra(ruta);

  return (
    <>
      <Link
        ref={enlace}
        href={href}
        className={className}
        onClick={alPulsar}
        aria-haspopup="dialog"
        aria-describedby={describedBy}
      >
        {etiqueta ?? `Ver todos (${total})`}
      </Link>
      {montado ? (
        <dialog
          ref={dialogo}
          className={panel.panel}
          aria-labelledby={idTitulo}
          style={
            {
              ...(acento ? { "--acento": acento } : {}),
              ...(altoFijo ? { minHeight: `${altoFijo}px` } : {}),
            } as CSSProperties
          }
          data-panel-equipos=""
          data-cerrando={cerrando ? "" : undefined}
          // Esc: el cierre pasa por la animación de bajada.
          onCancel={(e) => {
            e.preventDefault();
            cerrar();
          }}
          onClose={() => {
            setAbierto(false);
            setCerrando(false);
            setConsulta("");
            setAltoFijo(null);
            enlace.current?.focus();
          }}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && cerrando) dialogo.current?.close();
          }}
          onPointerDown={(e) => {
            empezoFuera.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && empezoFuera.current) cerrar();
          }}
        >
          <div className={panel.hoja}>
            <span className={panel.asa} aria-hidden="true" />
            <div className={panel.cabecera}>
              <h2 id={idTitulo} ref={tituloRef} tabIndex={-1} className={panel.titulo}>
                {titulo} <span className={panel.cuenta}>({total})</span>
              </h2>
              <button type="button" className={panel.cerrar} onClick={cerrar}>
                <IconX aria-hidden="true" focusable="false" stroke={1.9} size={24} />
                <span className="sr-only">Cerrar el listado</span>
              </button>
            </div>
            {conR5 ? (
              <div className={panel.buscar} role="search">
                <label htmlFor={idBuscar} className="sr-only">
                  {cotizar ? "Busca un producto" : "Busca tu modelo"}
                </label>
                <IconSearch aria-hidden="true" focusable="false" stroke={2} size={20} />
                <input
                  id={idBuscar}
                  type="search"
                  value={consulta}
                  onChange={(e) => {
                    if (altoFijo === null && dialogo.current) {
                      setAltoFijo(dialogo.current.getBoundingClientRect().height);
                    }
                    setConsulta(e.target.value);
                  }}
                  placeholder={cotizar ? "Busca un producto" : "Busca tu modelo"}
                  autoComplete="off"
                  spellCheck={false}
                  className={panel.buscarCampo}
                />
                <p className={panel.buscarCuenta} aria-live="polite" aria-atomic="true">
                  {consulta.trim()
                    ? visibles.length === 0
                      ? `Ningún ${palabra} coincide.`
                      : visibles.length === 1
                        ? `1 ${palabra}`
                        : `${visibles.length} ${palabra}s`
                    : ""}
                </p>
              </div>
            ) : null}
            <div className={panel.cuerpo}>
              {cotizar ? (
                <ul className={`${panel.lista} ${panel.listaFilas}`}>
                  {visibles.map((e, i) => (
                    <li key={e.id} style={{ "--i": Math.min(i, 12) } as CSSProperties}>
                      <button
                        type="button"
                        className={panel.fila}
                        aria-haspopup="dialog"
                        onClick={(ev) => {
                          botonCotizado.current = ev.currentTarget;
                          setCotizando(e);
                          setVentanaAbierta(true);
                        }}
                      >
                        <span className={panel.marca} aria-hidden="true">
                          <IconCircleCheck focusable="false" stroke={1.9} size={26} />
                        </span>
                        <span className={panel.nombreFila}>
                          {e.nombre}
                          <span className="sr-only">: cotizar</span>
                        </span>
                        <span className={panel.flecha} aria-hidden="true">
                          <IconMessageCircle focusable="false" stroke={2} size={22} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className={panel.lista}>
                  {visibles.map((e, i) => {
                    const actual = esActual(e);
                    const contenido = (
                      <>
                        <span className={panel.foto}>
                          {e.imagen ? (
                            <Image
                              src={e.imagen.url}
                              alt=""
                              fill
                              sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 320px"
                              className={panel.fotoImg}
                              style={{ objectPosition: e.imagen.posicion }}
                            />
                          ) : (
                            <IconPhoto
                              className={panel.fotoVacia}
                              aria-hidden="true"
                              focusable="false"
                              stroke={1.4}
                              size={40}
                            />
                          )}
                        </span>
                        {actual ? (
                          <span className={panel.check} aria-hidden="true">
                            <IconCheck focusable="false" stroke={3} size={18} />
                          </span>
                        ) : null}
                        <span className={panel.nombreItem}>
                          {conFormaDeMarca(e.nombre)}
                          {actual ? <span className="sr-only"> (página actual)</span> : null}
                        </span>
                      </>
                    );
                    return (
                      // `--i`: el escalón de la entrada al abrir (como mucho 12 escalones).
                      <li key={e.id} style={{ "--i": Math.min(i, 12) } as CSSProperties}>
                        {e.href ? (
                          <Link
                            href={e.href}
                            className={panel.item}
                            data-actual={actual ? "" : undefined}
                            aria-current={actual ? "page" : undefined}
                          >
                            {contenido}
                          </Link>
                        ) : (
                          <span className={`${panel.item} ${panel.itemSinEnlace}`}>
                            {contenido}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {enlacePagina ? (
                <p className={panel.pie}>
                  <Link href={href} className={panel.enlacePagina}>
                    {enlacePagina}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </dialog>
      ) : null}
      {configVentana && vistosVentana ? (
        <Suspense fallback={null}>
          <VentanaFormulario
            abierta={ventanaAbierta}
            titulo={vistosVentana.visible}
            nombreAccesible={vistosVentana.accesible}
            formulario={configVentana}
            alCerrar={() => {
              setVentanaAbierta(false);
              // Foco de vuelta al producto, dentro del panel, que sigue abierto.
              botonCotizado.current?.focus();
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
}
