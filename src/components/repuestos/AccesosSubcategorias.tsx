import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { EntradaFranja } from "@/components/marca/EntradaFranja";
import { LogoMarca } from "@/components/marca/LogoMarca";
import franja from "@/components/marca/franjaMarca.module.css";
import { ZonaAnimada } from "@/components/repuestos/ZonaAnimada";
import { coloresFranja, estiloFranja, MEJORAS_FRANJA } from "@/lib/marca/franjaMarca";
import type { AccesoSubcategoria } from "@/lib/repuestos/subcategorias";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./accesos.module.css";

/**
 * ACCESO a las páginas que cuelgan de una categoría técnica (2026-10-26, dirección: Filtros
 * Donaldson desde Filtración), para que no dependan solo del menú. Es la FRANJA DE MARCA del
 * #349 (`FranjaMarca`, con sus mejoras D1–D5 y los mismos interruptores): el color de la marca
 * en degradado con el blanco o el negro que se lee con AA (D1), las diagonales (D2), la foto de
 * la tarjeta asomando por la derecha (D3), «Ver productos →» (D4) y la entrada con barrido (D5),
 * con el logo en su placa blanca (no en una sola tinta: es la marca de un tercero). Toda la
 * franja es el enlace, con su hover y su foco.
 */
export function AccesosSubcategorias({
  accesos,
  categoria,
}: {
  accesos: (AccesoSubcategoria & { foto: ImagenLista | null })[];
  /** El nombre de la categoría: «Marcas de filtración». */
  categoria: string;
}) {
  const id = "marcas-de-la-categoria";
  return (
    <section className={estilos.seccion} aria-labelledby={id}>
      <h2 id={id} className={estilos.titulo}>
        Marcas de {categoria.toLowerCase()}
      </h2>
      <ZonaAnimada
        interruptores={MEJORAS_FRANJA}
        permitirUrl={process.env.VERCEL_ENV !== "production"}
      >
        <ul className={estilos.lista}>
          {accesos.map((a) => (
            <li key={a.id}>
              <EntradaFranja>
                <Link
                  href={`${a.href}/`}
                  className={`${franja.franja} ${estilos.enlace}`}
                  style={estiloFranja(a.color)}
                  data-tinta={coloresFranja(a.color).tinta === "#ffffff" ? "clara" : "oscura"}
                >
                  <span className={franja.fondo} aria-hidden="true" />
                  <span className={franja.trama} aria-hidden="true" />
                  {a.foto ? (
                    <span className={franja.foto} aria-hidden="true">
                      <Image
                        src={a.foto.url}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 340px, 180px"
                        className={franja.fotoImagen}
                        style={{ objectPosition: a.foto.posicion }}
                      />
                    </span>
                  ) : null}
                  {a.logo ? (
                    <span className={`${franja.cajaLogo} ${estilos.placa}`}>
                      {/* Decorativo: el nombre va escrito al lado. */}
                      <LogoMarca logo={a.logo} alt="" sizes="160px" className={estilos.logo} />
                    </span>
                  ) : null}
                  <span className={`${franja.texto} ${a.foto ? franja.textoConFoto : ""}`}>
                    <h3 className={`${franja.titulo} texto-titulo-bloque`}>{a.nombre}</h3>
                    <span className={`${estilos.ver} texto-etiqueta`}>
                      Ver productos
                      <IconArrowRight aria-hidden="true" focusable="false" stroke={2.25} />
                    </span>
                  </span>
                </Link>
              </EntradaFranja>
            </li>
          ))}
        </ul>
      </ZonaAnimada>
    </section>
  );
}
