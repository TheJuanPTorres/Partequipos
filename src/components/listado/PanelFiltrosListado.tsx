import {
  IconBulldozer,
  IconCalendar,
  IconFileDescription,
  IconFilter,
  IconPlus,
  type Icon,
} from "@tabler/icons-react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import type { FacetaPintada } from "@/lib/filtros";
import type { LogoMarca as LogoMarcaDatos } from "@/lib/marca/logoMarca";

import estilos from "./listado.module.css";

/** Las facetas de tramos se pintan en píldoras; el sufijo va en su leyenda. */
const PILDORAS: Record<string, string> = { peso: " (t)", horas: "" };

/** Icono de cada acordeón (presentación). */
const ICONO_ACORDEON: Record<string, Icon> = {
  tipo: IconBulldozer,
  categoria: IconBulldozer,
  modelo: IconFileDescription,
  anio: IconCalendar,
};

/**
 * El lateral «Filtrar» con el aspecto de ux-9, para cualquier listado con el
 * módulo común de filtros: la faceta «marca» con logo y casilla, las de tramos
 * (peso, horas) en píldoras y el resto (tipo, modelo, categoría, año) en
 * acordeones, en el orden del catálogo.
 *
 * Es un formulario GET con casillas, sin JavaScript (como `PanelFiltros` de
 * C): lo que envía ya está en la forma canónica de la URL.
 */
export function PanelFiltrosListado({
  accion,
  facetas,
  orden,
  ordenPorDefecto,
  elemento,
  logoDeMarca,
  enVivo = false,
}: {
  /** Los filtros se aplican al cambiar, sin botón (listados con `ZonaCatalogo`). */
  enVivo?: boolean;
  accion: string;
  facetas: FacetaPintada[];
  orden: string;
  ordenPorDefecto: string;
  elemento: { singular: string; plural: string };
  logoDeMarca?: Map<string, LogoMarcaDatos>;
}) {
  // Con los filtros en vivo, las opciones que los demás filtros dejan en 0 siguen en el panel
  // (el panel no cambia de alto) pero no se pueden elegir.
  const sinResultados = (o: { cuenta: number; activa: boolean }) =>
    enVivo && o.cuenta === 0 && !o.activa;
  const conOpciones = facetas.filter((f) => f.opciones.length);
  if (!conOpciones.length) return null;
  const cuentaSr = (n: number) => `, ${n} ${n === 1 ? elemento.singular : elemento.plural}`;
  const cuenta = (n: number) => (
    <>
      <span className={estilos.cuenta} aria-hidden="true">
        ({n})
      </span>
      <span className="sr-only">{cuentaSr(n)}</span>
    </>
  );

  return (
    <details className={estilos.filtros}>
      <summary>
        Filtrar
        <IconFilter size={22} stroke={1.6} aria-hidden="true" />
      </summary>
      <form method="get" action={accion}>
        {conOpciones.map((f) => {
          if (f.clave === "marca") {
            return (
              <fieldset key={f.clave} className={estilos.grupo}>
                <legend>{f.etiqueta}</legend>
                <ul className={estilos.marcas}>
                  {f.opciones.map((o) => {
                    const logo = logoDeMarca?.get(o.valor);
                    return (
                      <li key={o.valor}>
                        <label className={estilos.marca}>
                          {logo ? (
                            <LogoMarca
                              logo={logo}
                              alt=""
                              sizes="56px"
                              className={estilos.marcaLogo}
                            />
                          ) : null}
                          <span>
                            {o.etiqueta} {cuenta(o.cuenta)}
                          </span>
                          <input
                            type="checkbox"
                            name={f.clave}
                            value={o.valor}
                            defaultChecked={o.activa}
                            disabled={sinResultados(o)}
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            );
          }
          if (f.clave in PILDORAS) {
            return (
              <fieldset key={f.clave} className={estilos.grupo}>
                <legend>
                  {f.etiqueta}
                  {PILDORAS[f.clave]}
                </legend>
                <ul className={estilos.tramos}>
                  {f.opciones.map((o) => (
                    <li key={o.valor}>
                      <label className={estilos.tramo}>
                        <input
                          type="checkbox"
                          name={f.clave}
                          value={o.valor}
                          defaultChecked={o.activa}
                          disabled={sinResultados(o)}
                        />
                        {o.etiqueta}
                        {cuenta(o.cuenta)}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            );
          }
          const IconoAcordeon = ICONO_ACORDEON[f.clave] ?? IconFileDescription;
          return (
            <details
              key={f.clave}
              className={estilos.acordeon}
              open={f.opciones.some((o) => o.activa)}
            >
              <summary>
                <span className={estilos.icono}>
                  <IconoAcordeon size={18} stroke={1.8} aria-hidden="true" />
                </span>
                {f.etiqueta}
                <IconPlus size={16} className={estilos.mas} aria-hidden="true" />
              </summary>
              <fieldset className={estilos.grupo} style={{ marginTop: 0 }}>
                <legend className="sr-only">{f.etiqueta}</legend>
                <ul>
                  {f.opciones.map((o) => (
                    <li key={o.valor}>
                      <label>
                        <input
                          type="checkbox"
                          name={f.clave}
                          value={o.valor}
                          defaultChecked={o.activa}
                          disabled={sinResultados(o)}
                        />
                        {o.etiqueta}
                        {cuenta(o.cuenta)}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            </details>
          );
        })}

        {orden !== ordenPorDefecto ? <input type="hidden" name="orden" value={orden} /> : null}
        {enVivo ? (
          // Con JavaScript cada cambio se aplica al momento (`ZonaCatalogo`); sin él, el botón de siempre.
          <noscript>
            <button type="submit" className={estilos.aplicar}>
              Aplicar filtros
            </button>
          </noscript>
        ) : (
          <button type="submit" className={estilos.aplicar}>
            Aplicar filtros
          </button>
        )}
      </form>
    </details>
  );
}
