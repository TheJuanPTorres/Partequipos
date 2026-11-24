import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InsigniaEstado } from "@/components/admin/celdas/InsigniaEstado";
import { insigniaWeb } from "@/lib/panel/fichaProducto";
import { insigniaUsada } from "@/lib/panel/fichaUsada";
import { insigniaDe, type Insignia } from "@/lib/panel/insignias";

/**
 * MUESTRA DEL SISTEMA VISUAL DEL PANEL (tanda 23, punto 1; PROTOTIPO). Una página SIN DATOS y sin
 * sesión, con los estilos del panel (`custom.scss`), para medir el contraste de cada pieza en claro
 * y en oscuro y para enseñar el sistema sin entrar al panel. No lee la base.
 *
 * SOLO fuera del sitio publicado: allí responde 404. Nunca se indexa.
 */
export const metadata: Metadata = {
  title: "Muestra del sistema visual",
  robots: { index: false, follow: false },
};

const INSIGNIAS: Array<{ donde: string; insignia: Insignia | null }> = [
  { donde: "Ficha publicada", insignia: insigniaWeb({ mostrarEnWeb: true }) },
  { donde: "Ficha oculta", insignia: insigniaWeb({ mostrarEnWeb: false }) },
  { donde: "Usada vendida", insignia: insigniaUsada({ mostrarEnWeb: true, disponible: false }) },
  { donde: "Artículo publicado", insignia: insigniaDe("publicado", true) },
  { donde: "Artículo en borrador", insignia: insigniaDe("publicado", false) },
  { donde: "Mensaje nuevo", insignia: insigniaDe("solicitud", "nueva") },
  { donde: "Mensaje contactado", insignia: insigniaDe("solicitud", "contactada") },
  { donde: "Redirección rota", insignia: insigniaDe("destino", "sin-ruta") },
];

const ESPACIOS = [1, 2, 3, 4, 5, 6, 7];

const COLORES = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "muted",
  "muted-foreground",
  "border",
  "success",
  "warning",
  "destructive",
  "info",
];

export default function MuestraTema() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <main className="pq-muestra" data-muestra-tema="">
      <h1>Sistema visual del panel</h1>
      <p>
        Página de muestra, sin datos. El tema (claro u oscuro) es el de tu cuenta del panel; sin
        elegir, claro.
      </p>

      <h2>Insignias de estado</h2>
      <ul className="pq-muestra__fila">
        {INSIGNIAS.map(({ donde, insignia }) => (
          <li key={donde}>
            <InsigniaEstado insignia={insignia} />
            <small>{donde}</small>
          </li>
        ))}
      </ul>

      <h2>Texto</h2>
      <p data-par="texto">Texto normal del panel, en Rubik, sobre el fondo.</p>
      <p data-par="texto" className="pq-muestra__atenuado">
        Texto atenuado: ayudas de los campos y fechas.
      </p>
      <p>
        <span data-par="texto" className="pq-muestra__primario">
          Botón principal
        </span>
      </p>

      <h2>Colores</h2>
      <ul className="pq-muestra__fila">
        {COLORES.map((c) => (
          <li key={c}>
            <span className="pq-muestra__color" style={{ background: `var(--pq-${c})` }} />
            <small>{c}</small>
          </li>
        ))}
      </ul>

      <h2>Espaciado</h2>
      <ul className="pq-muestra__fila">
        {ESPACIOS.map((n) => (
          <li key={n}>
            <span className="pq-muestra__espacio" style={{ width: `var(--pq-espacio-${n})` }} />
            <small>espacio-{n}</small>
          </li>
        ))}
      </ul>
    </main>
  );
}
