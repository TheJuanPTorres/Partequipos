/**
 * ANALÍTICA EN EL NAVEGADOR: guardar la decisión, cargar Analytics al aceptar y enviar eventos.
 * Solo se usa desde componentes de cliente. Antes de aceptar, NADA de esto toca a Google: ni el
 * script, ni una petición, ni una cookie.
 */
import { hayPista } from "@/lib/modoAdmin/pista";

import { CLAVE_CONSENTIMIENTO, interpretar, serializar } from "./consentimiento";
import { paginaDeOrigen } from "./eventos";

type Gtag = (...args: unknown[]) => void;
type VentanaGa = Window & { dataLayer?: unknown[]; gtag?: Gtag } & Record<string, unknown>;

const ventana = () => window as unknown as VentanaGa;

/* ───── La decisión, como almacén externo (para `useSyncExternalStore`) ───── */

/** Lo que devuelve el servidor: aún no se sabe (no se pinta el aviso en el HTML). */
export const SIN_LEER = "sin-leer";

const oyentes = new Set<() => void>();
/** Copia en memoria: si el navegador no deja usar `localStorage`, la decisión vale en la visita. */
let enMemoria: string | null = null;

export function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener("storage", avisar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

/** El texto guardado («» si no hay). Es un texto para que la instantánea sea estable. */
export function leerGuardado(): string {
  if (enMemoria !== null) return enMemoria;
  try {
    return window.localStorage.getItem(CLAVE_CONSENTIMIENTO) ?? "";
  } catch {
    return "";
  }
}

export const decisionDe = (guardado: string) =>
  guardado === SIN_LEER ? null : interpretar(guardado, new Date());

export function guardarDecision(analitica: boolean) {
  const texto = serializar(analitica, new Date());
  try {
    window.localStorage.setItem(CLAVE_CONSENTIMIENTO, texto);
    enMemoria = null;
  } catch {
    enMemoria = texto;
  }
  for (const avisar of oyentes) avisar();
}

/* ───── Analytics ───── */

let cargado = false;
/** Leída la decisión y sin permiso (rechazada o pendiente): los eventos no esperan, se tiran. */
let decidido = false;
let activo = false;
/**
 * Eventos que llegan antes de LEERSE la decisión guardada (al cargar la página, un componente
 * puede avisar un instante antes). Esperan EN MEMORIA: salen si ya había permiso y se tiran si no
 * lo había o aún no se ha decidido. Nunca viajan sin permiso, ni se guardan para después.
 */
let enEspera: [string, Record<string, string | number>][] = [];
const MAX_EN_ESPERA = 20;

/** Carga Analytics (la primera vez) o lo reactiva. Solo se llama con la analítica aceptada. */
export function activarAnalitica(id: string) {
  // Quien viene del panel (la pista del modo administración) no se cuenta: no se carga Analytics.
  // Si la pista es vieja y ya no hay sesión, el módulo la borra y la visita siguiente sí cuenta.
  if (hayPista()) return;
  const w = ventana();
  w[`ga-disable-${id}`] = false;
  activo = true;
  decidido = false;
  if (cargado) {
    w.gtag?.("consent", "update", { analytics_storage: "granted" });
    vaciarEspera(w);
    return;
  }
  cargado = true;
  w.dataLayer = w.dataLayer ?? [];
  // gtag.js espera el objeto `arguments`, no una lista.
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  // Consent Mode: publicidad siempre denegada; la analítica, concedida porque acaba de aceptarse.
  w.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });
  w.gtag("js", new Date());
  w.gtag("config", id, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  vaciarEspera(w);
}

function vaciarEspera(w: VentanaGa) {
  for (const [nombre, parametros] of enEspera) w.gtag?.("event", nombre, parametros);
  enEspera = [];
}

/** Apaga Analytics y borra sus cookies (el visitante retiró el permiso, o lo rechazó). */
export function desactivarAnalitica(id: string) {
  const w = ventana();
  w[`ga-disable-${id}`] = true;
  activo = false;
  decidido = true;
  enEspera = [];
  if (cargado) w.gtag?.("consent", "update", { analytics_storage: "denied" });
  const partes = window.location.hostname.split(".");
  const dominios = ["", ...partes.map((_, i) => `.${partes.slice(i).join(".")}`)];
  for (const cookie of document.cookie.split(";")) {
    const nombre = (cookie.split("=")[0] ?? "").trim();
    if (nombre !== "_ga" && !nombre.startsWith("_ga_")) continue;
    for (const dominio of dominios) {
      document.cookie = `${nombre}=; Max-Age=0; path=/${dominio ? `; domain=${dominio}` : ""}`;
    }
  }
}

/**
 * Envía un evento, con la página de origen. Sin permiso (o sin identificador) no hace nada, así
 * que se puede llamar desde cualquier componente sin comprobar antes.
 */
export function enviarEvento(nombre: string, parametros: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  const completos = { ...parametros, pagina_origen: paginaDeOrigen(window.location.pathname) };
  if (activo) ventana().gtag?.("event", nombre, completos);
  else if (!decidido && enEspera.length < MAX_EN_ESPERA) enEspera.push([nombre, completos]);
}
