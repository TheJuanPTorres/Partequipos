import type { LogoMarca } from "@/lib/marca/logoMarca";
import type { TarjetaMarca } from "@/lib/repuestos/marca";

import estilos from "./marca.module.css";
import estilosTexto from "./modelosTexto.module.css";
import { TarjetaModelo } from "./TarjetaModelo";
import estilosTarjeta from "./tarjetaModelo.module.css";

/**
 * «REPUESTOS SEGÚN TIPO DE MÁQUINA» de la página de marca, SIN FOTOS (Ronda 17, 2026-11-09: el
 * cliente vende repuestos, no máquinas). Una entrada por tipo, o por serie en los tipos con
 * series, con la TARJETA DE MODELO del diseño v2 (`TarjetaModelo`, 2026-11-15, Juan Pablo): dos
 * capas, el logo de la marca, el tipo en grande, «N modelos» donde va la serie, la barrida gris y
 * el botón del color de la marca. Toda la tarjeta es el enlace a la página del tipo (o al ancla
 * de la serie).
 */
export function TiposTexto({
  id,
  titulo,
  tarjetas,
  logo = null,
}: {
  id: string;
  titulo: string;
  tarjetas: TarjetaMarca[];
  logo?: LogoMarca | null;
}) {
  if (!titulo || tarjetas.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section
      id={id}
      className={`${estilos.tarjetas} ${estilosTexto.seccion} ${estilosTexto.sinFranja}`}
      aria-labelledby={idTitulo}
    >
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
      <div className={estilosTexto.grupo}>
        <ul className={estilosTarjeta.rejilla}>
          {tarjetas.map((t) => (
            <li key={t.clave} className={estilosTexto.tarjeta}>
              <TarjetaModelo
                modelo={t.tituloCorto || t.titulo}
                detalle={
                  t.panel ? `${t.panel.total} ${t.panel.total === 1 ? "modelo" : "modelos"}` : null
                }
                nombreCompleto={t.titulo}
                href={t.href}
                logo={logo}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
