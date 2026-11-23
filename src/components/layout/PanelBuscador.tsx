"use client";

import { IconArrowRight, IconBrandWhatsapp, IconSearch } from "@tabler/icons-react";
import { useEffect, useId, useRef, useState, type RefObject } from "react";

import { terminoSeguro } from "@/lib/analitica/eventos";
import { enviarEvento } from "@/lib/analitica/navegador";
import type { Clase } from "@/lib/buscador/motor";
import { resaltar } from "@/lib/buscador/resaltar";
import { ETIQUETA_CLASE } from "@/lib/buscador/etiquetas";

import estilos from "./panelBuscador.module.css";

/**
 * PANEL DE LA LUPA (2026-11-18): lo que se ve bajo la cabecera al abrir el buscador. Se carga solo
 * cuando se abre la lupa (`next/dynamic`, sin SSR), así que no pesa en la página, y al abrirse pide
 * al servidor que cargue el índice (`?calentar=1`) para que la primera letra no espere.
 *
 * Patrón COMBOBOX (el campo es de `Cabecera`; aquí se le enganchan los eventos): flechas para
 * moverse por los resultados, Intro para ir al marcado (o a `/buscar/` si no hay ninguno), Escape
 * para cerrar. El número de resultados se anuncia en una región `aria-live`.
 *
 * - Antes de escribir: búsquedas recientes (`localStorage`, con try/catch: puede no estar) y accesos
 *   rápidos.
 * - Al escribir: tras 120 ms sin teclear, hasta 8 resultados con foto o logo, la etiqueta de su
 *   tipo, lo buscado resaltado y agrupados con su número; «Ver todos los resultados (N)».
 * - Sin resultados: «¿Quisiste decir…?», búsquedas populares y WhatsApp con la búsqueda escrita.
 * - Respeta «reducir movimiento» y no mueve nada de la página (panel superpuesto, sin CLS).
 */

type Item = {
  id: string;
  clase: Clase;
  titulo: string;
  href: string;
  detalle?: string;
  marca?: string;
  imagen: { url: string; width: number; height: number } | null;
  exacto: boolean;
};

type Respuesta = {
  consulta: string;
  resultados: Item[];
  total: number;
  porClase: Partial<Record<Clase, number>>;
  sugerencia: string | null;
  exacto: { titulo: string; href: string } | null;
};

const CLAVE_RECIENTES = "pq-busquedas-recientes";
const POPULARES = [
  "Excavadora Hitachi",
  "Retroexcavadora",
  "Filtros Donaldson",
  "Tren de rodaje",
  "Lubricantes",
];
const ACCESOS = [
  { href: "/maquinaria-pesada/maquinaria-pesada-nueva/tipos/", texto: "Maquinaria nueva" },
  { href: "/maquinaria-pesada/maquinaria-pesada-usada/", texto: "Maquinaria usada" },
  { href: "/repuestos-maquinaria-pesada-colombia/", texto: "Repuestos" },
  { href: "/lubricantes/", texto: "Lubricantes" },
  { href: "/contactanos/", texto: "Contáctanos" },
];

function leerRecientes(): string[] {
  try {
    const crudo = localStorage.getItem(CLAVE_RECIENTES);
    const lista = crudo ? (JSON.parse(crudo) as unknown) : [];
    return Array.isArray(lista)
      ? lista.filter((x): x is string => typeof x === "string").slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

function guardarReciente(texto: string) {
  const limpio = texto.trim().slice(0, 80);
  if (limpio.length < 2) return;
  try {
    const nueva = [
      limpio,
      ...leerRecientes().filter((r) => r.toLowerCase() !== limpio.toLowerCase()),
    ];
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(nueva.slice(0, 5)));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export default function PanelBuscador({
  campo,
  whatsapp,
  alIr,
}: {
  campo: RefObject<HTMLInputElement | null>;
  /** El enlace de WhatsApp del sitio (`https://wa.me/…`). */
  whatsapp: string;
  /** Se llama al elegir un destino: cierra la lupa. */
  alIr: () => void;
}) {
  const id = useId();
  const idLista = "cab-resultados";
  const [q, setQ] = useState("");
  const [porTexto, setPorTexto] = useState<Record<string, Respuesta>>({});
  const [activo, setActivo] = useState(-1);
  const [recientes, setRecientes] = useState<string[]>([]);
  const panel = useRef<HTMLDivElement>(null);

  // El campo manda: se escucha lo que escribe y las teclas.
  useEffect(() => {
    const input = campo.current;
    if (!input) return;
    // Valores iniciales (lo que ya hubiera en el campo y las recientes) fuera del cuerpo del efecto.
    const inicio = setTimeout(() => {
      setQ(input.value);
      setRecientes(leerRecientes());
    }, 0);
    // Carga el índice del servidor antes de la primera letra.
    fetch("/api/buscar/?calentar=1").catch(() => {});
    const alEscribir = () => {
      setQ(input.value);
      setActivo(-1);
    };
    input.addEventListener("input", alEscribir);
    return () => {
      clearTimeout(inicio);
      input.removeEventListener("input", alEscribir);
    };
  }, [campo]);

  // Alto de la cabecera, para que en móvil el panel ocupe el resto de la pantalla.
  useEffect(() => {
    const cab = panel.current?.closest("header");
    if (!cab || !panel.current) return;
    const poner = () => panel.current?.style.setProperty("--alto-cab", `${cab.offsetHeight}px`);
    poner();
    addEventListener("resize", poner);
    return () => removeEventListener("resize", poner);
  }, []);

  // Búsqueda con debounce y cancelación: solo vale la última; lo ya buscado se reutiliza.
  const texto = q.trim();
  const clave = texto.toLowerCase();
  const datos = texto.length >= 2 ? (porTexto[clave] ?? null) : null;
  const cargando = texto.length >= 2 && !datos;
  useEffect(() => {
    if (texto.length < 2 || porTexto[clave]) return;
    const control = new AbortController();
    const espera = setTimeout(() => {
      fetch(`/api/buscar/?q=${encodeURIComponent(texto)}&limite=8`, { signal: control.signal })
        .then((r) => (r.ok ? (r.json() as Promise<Respuesta>) : Promise.reject(new Error("HTTP"))))
        .then((r) => setPorTexto((m) => ({ ...m, [clave]: r })))
        .catch(() => {});
    }, 120);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [texto, clave, porTexto]);

  // Sin resultados tras dejar de escribir: se avisa al servidor (una vez por texto) para el registro
  // de «Búsquedas sin resultado» del panel. Solo viaja el texto, que el servidor vuelve a comprobar.
  const avisados = useRef(new Set<string>());
  const sinResultados = texto.length >= 3 && datos !== null && datos.total === 0;
  useEffect(() => {
    if (!sinResultados || avisados.current.has(clave)) return;
    const t = setTimeout(() => {
      avisados.current.add(clave);
      fetch("/api/buscar/registro/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: texto }),
      }).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [sinResultados, clave, texto]);

  // Analítica: una búsqueda del panel cuenta al dejar de escribir, una vez por texto.
  const medidos = useRef(new Set<string>());
  const total = datos?.total ?? null;
  useEffect(() => {
    if (texto.length < 3 || total === null || medidos.current.has(clave)) return;
    const t = setTimeout(() => {
      medidos.current.add(clave);
      const termino = terminoSeguro(texto);
      if (termino) enviarEvento("busqueda", { termino, resultados: total, lugar: "panel" });
    }, 1500);
    return () => clearTimeout(t);
  }, [texto, clave, total]);

  const items = texto.length >= 2 && datos ? datos.resultados : [];
  const hayExacto = texto.length >= 2 && datos?.exacto;
  // Orden de lectura: las filas que se pueden elegir con las flechas.
  const filas: { href: string; texto: string }[] = [
    ...(hayExacto && datos?.exacto
      ? [{ href: datos.exacto.href, texto: datos.exacto.titulo }]
      : []),
    ...items.map((i) => ({ href: i.href, texto: i.titulo })),
    ...(texto.length >= 2 && datos && datos.total > 0
      ? [{ href: `/buscar/?q=${encodeURIComponent(texto)}`, texto }]
      : []),
  ];

  // Teclado del combobox.
  const filasRef = useRef(filas);
  const activoRef = useRef(activo);
  useEffect(() => {
    filasRef.current = filas;
    activoRef.current = activo;
  });
  useEffect(() => {
    const input = campo.current;
    if (!input) return;
    const alTeclado = (e: KeyboardEvent) => {
      const n = filasRef.current.length;
      if (e.key === "ArrowDown" && n > 0) {
        e.preventDefault();
        setActivo((a) => (a + 1) % n);
      } else if (e.key === "ArrowUp" && n > 0) {
        e.preventDefault();
        setActivo((a) => (a <= 0 ? n - 1 : a - 1));
      } else if (e.key === "Enter" && activoRef.current >= 0) {
        const fila = filasRef.current[activoRef.current];
        if (fila) {
          e.preventDefault();
          guardarReciente(input.value);
          alIr();
          location.assign(fila.href);
        }
      }
    };
    input.addEventListener("keydown", alTeclado);
    return () => input.removeEventListener("keydown", alTeclado);
  }, [campo, alIr]);

  // ARIA del campo: la opción activa.
  useEffect(() => {
    const input = campo.current;
    if (!input) return;
    if (activo >= 0) input.setAttribute("aria-activedescendant", `${id}-op-${activo}`);
    else input.removeAttribute("aria-activedescendant");
    return () => input.removeAttribute("aria-activedescendant");
  }, [activo, campo, id]);

  // La opción activa se mantiene a la vista.
  useEffect(() => {
    if (activo < 0) return;
    document.getElementById(`${id}-op-${activo}`)?.scrollIntoView({ block: "nearest" });
  }, [activo, id]);

  const anuncio =
    texto.length < 2
      ? ""
      : cargando
        ? "Buscando…"
        : datos
          ? datos.total === 0
            ? "Sin resultados"
            : `${datos.total} resultados`
          : "";

  const elegir = () => {
    guardarReciente(texto);
    alIr();
  };

  const linkWhatsApp = (() => {
    try {
      const u = new URL(whatsapp);
      u.searchParams.set("text", `Hola, busco: ${texto}`);
      return u.toString();
    } catch {
      return whatsapp;
    }
  })();

  // Resultados agrupados, conservando el orden de relevancia.
  const grupos: { clase: Clase; items: { item: Item; indice: number }[] }[] = [];
  const base = hayExacto ? 1 : 0;
  items.forEach((item, i) => {
    let g = grupos.find((x) => x.clase === item.clase);
    if (!g) {
      g = { clase: item.clase, items: [] };
      grupos.push(g);
    }
    g.items.push({ item, indice: base + i });
  });

  return (
    <div ref={panel} id={idLista} className={estilos.panel} role="presentation">
      <div className={estilos.hoja}>
        <p className="sr-only" role="status" aria-live="polite">
          {anuncio}
        </p>

        {texto.length < 2 ? (
          <div className={estilos.inicio}>
            {recientes.length > 0 ? (
              <section aria-labelledby={`${id}-rec`}>
                <h2 id={`${id}-rec`} className={estilos.titulo}>
                  Búsquedas recientes
                </h2>
                <ul className={estilos.chips}>
                  {recientes.map((r) => (
                    <li key={r}>
                      <a
                        href={`/buscar/?q=${encodeURIComponent(r)}`}
                        className={estilos.chip}
                        onClick={elegir}
                      >
                        <IconSearch aria-hidden="true" size={14} stroke={1.75} />
                        {r}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section aria-labelledby={`${id}-ac`}>
              <h2 id={`${id}-ac`} className={estilos.titulo}>
                Accesos rápidos
              </h2>
              <ul className={estilos.chips}>
                {ACCESOS.map((a) => (
                  <li key={a.href}>
                    <a href={a.href} className={estilos.chip} onClick={alIr}>
                      {a.texto}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby={`${id}-po`}>
              <h2 id={`${id}-po`} className={estilos.titulo}>
                Prueba con
              </h2>
              <ul className={estilos.chips}>
                {POPULARES.map((p) => (
                  <li key={p}>
                    <a
                      href={`/buscar/?q=${encodeURIComponent(p)}`}
                      className={estilos.chip}
                      onClick={alIr}
                    >
                      {p}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {texto.length >= 2 && datos && datos.total > 0 ? (
          <div role="listbox" aria-label="Resultados de la búsqueda" className={estilos.lista}>
            {hayExacto && datos.exacto ? (
              <a
                id={`${id}-op-0`}
                role="option"
                aria-selected={activo === 0}
                href={datos.exacto.href}
                className={estilos.ir}
                data-activo={activo === 0 ? "" : undefined}
                onClick={elegir}
              >
                <span>
                  Ir a <strong>{datos.exacto.titulo}</strong>
                </span>
                <IconArrowRight aria-hidden="true" size={18} stroke={2} />
              </a>
            ) : null}
            {grupos.map((g) => (
              <div key={g.clase} role="group" aria-label={ETIQUETA_CLASE[g.clase]}>
                <h2 className={estilos.titulo}>
                  {ETIQUETA_CLASE[g.clase]}
                  <span className={estilos.numero}>
                    {datos.porClase[g.clase] ?? g.items.length}
                  </span>
                </h2>
                {g.items.map(({ item, indice }) => (
                  <a
                    key={item.id}
                    id={`${id}-op-${indice}`}
                    role="option"
                    aria-selected={activo === indice}
                    href={item.href}
                    className={estilos.fila}
                    data-activo={activo === indice ? "" : undefined}
                    onClick={elegir}
                  >
                    <span className={estilos.foto} aria-hidden="true">
                      {item.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element -- miniatura de 44 px, con medidas
                        <img
                          src={item.imagen.url}
                          alt=""
                          width={44}
                          height={44}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <IconSearch size={18} stroke={1.5} />
                      )}
                    </span>
                    <span className={estilos.textos}>
                      <span className={estilos.nombre}>
                        {resaltar(item.titulo, texto).map((p, i) =>
                          p.marca ? <mark key={i}>{p.texto}</mark> : <span key={i}>{p.texto}</span>,
                        )}
                      </span>
                      {item.detalle ? (
                        <span className={estilos.detalle}>{item.detalle}</span>
                      ) : null}
                    </span>
                  </a>
                ))}
              </div>
            ))}
            <a
              id={`${id}-op-${filas.length - 1}`}
              role="option"
              aria-selected={activo === filas.length - 1}
              href={`/buscar/?q=${encodeURIComponent(texto)}`}
              className={estilos.todos}
              data-activo={activo === filas.length - 1 ? "" : undefined}
              onClick={elegir}
            >
              Ver todos los resultados ({datos.total})
              <IconArrowRight aria-hidden="true" size={18} stroke={2} />
            </a>
          </div>
        ) : null}

        {texto.length >= 2 && datos && datos.total === 0 ? (
          <div className={estilos.vacio}>
            <p className={estilos.vacioTitulo}>
              No encontramos resultados para «<strong>{texto}</strong>»
            </p>
            {datos.sugerencia ? (
              <p>
                ¿Quisiste decir{" "}
                <a href={`/buscar/?q=${encodeURIComponent(datos.sugerencia)}`} onClick={elegir}>
                  {datos.sugerencia}
                </a>
                ?
              </p>
            ) : null}
            <h2 className={estilos.titulo}>Búsquedas populares</h2>
            <ul className={estilos.chips}>
              {POPULARES.map((p) => (
                <li key={p}>
                  <a
                    href={`/buscar/?q=${encodeURIComponent(p)}`}
                    className={estilos.chip}
                    onClick={alIr}
                  >
                    {p}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={linkWhatsApp}
              className={estilos.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp aria-hidden="true" size={20} stroke={1.75} />
              Pregúntanos por WhatsApp
            </a>
          </div>
        ) : null}

        {texto.length >= 2 && !datos && cargando ? (
          <p className={estilos.cargando} aria-hidden="true">
            Buscando…
          </p>
        ) : null}
      </div>
    </div>
  );
}
