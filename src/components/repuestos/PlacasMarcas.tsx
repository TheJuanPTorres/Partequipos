import Link from "next/link";

import { LogoMarca } from "@/components/marca/LogoMarca";
import type { PlacaMarca } from "@/lib/repuestos/categoria";

import estilos from "./marca.module.css";

/**
 * «MARCAS» de los índices y de las páginas de categoría (PROVISIONAL hasta el
 * diseño de Andrés): la franja del encabezado, con una placa blanca por marca
 * con su logo (`LogoMarca`) que enlaza a su página de repuestos. Una
 * marca sin logo se pinta con su nombre, sin hueco.
 *
 * `enlaceTodas`: el enlace a la página de todas las marcas, debajo de las placas.
 */
export function PlacasMarcas({
  id,
  titulo,
  marcas,
  enlaceTodas,
  franja = "amarilla",
}: {
  id: string;
  titulo: string;
  marcas: PlacaMarca[];
  enlaceTodas?: { href: string; texto: string };
  /** `blanca`: para cuando la franja amarilla ya la pone otra sección. */
  franja?: "amarilla" | "blanca";
}) {
  if (marcas.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section
      id={id}
      className={`${estilos.modelos} ${franja === "blanca" ? estilos.modelosBlanca : ""}`}
      aria-labelledby={idTitulo}
    >
      <h2 id={idTitulo} className={estilos.tituloSeccion}>
        {titulo}
      </h2>
      <ul className={estilos.placasLista}>
        {marcas.map((m) => (
          <li key={m.id}>
            <Link href={m.href} className={estilos.placaMarca}>
              {m.logo ? (
                <LogoMarca
                  logo={m.logo}
                  alt={m.nombre}
                  sizes="131px"
                  className={estilos.placaLogo}
                />
              ) : (
                m.nombre
              )}
            </Link>
          </li>
        ))}
      </ul>
      {enlaceTodas ? (
        <p className={estilos.verTodas}>
          <Link href={enlaceTodas.href} className={estilos.botonTarjeta}>
            {enlaceTodas.texto}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
