import Image from "next/image";

import { URL_PORTAL_BUK } from "@/lib/vacantes/portalBuk";
import type { VistaTrabaja } from "@/lib/vacantes/vista";

import estilos from "./trabaja.module.css";

/**
 * «¿No ves una oferta para tu perfil?» (plantilla de Andrés). En el diseño
 * lleva un formulario con la hoja de vida; aquí, un botón al portal de empleo de
 * Buk (Juan Pablo, 2026-10-23): no guardamos datos personales. La imagen es la
 * del panel; sin ella, el texto ocupa el bloque, sin hueco.
 */
export function HojaDeVida({ bloque }: { bloque: VistaTrabaja["hojaDeVida"] }) {
  const ultimo = bloque.parrafos.length - 1;
  return (
    <section
      className={`${estilos.hojaDeVida} ${bloque.imagen ? "" : estilos.hojaDeVidaSinImagen}`}
      aria-labelledby="trabaja-hoja-de-vida"
    >
      <div className={estilos.hojaDeVidaCaja}>
        <div className={estilos.hojaDeVidaTexto}>
          <h2 id="trabaja-hoja-de-vida" className={estilos.hojaDeVidaTitulo}>
            {bloque.titulo}
          </h2>
          {bloque.parrafos.map((p, i) => (
            <p key={i} className={i === ultimo && ultimo > 0 ? estilos.destacado : undefined}>
              {p}
            </p>
          ))}
          <a href={URL_PORTAL_BUK} className={estilos.boton} target="_blank" rel="noopener">
            {bloque.boton}
            <span className={estilos.soloLectores}>
              {" "}
              (portal de empleo de Buk, en otra pestaña)
            </span>
          </a>
        </div>
        {bloque.imagen && (
          <div className={estilos.hojaDeVidaImagen}>
            <Image
              src={bloque.imagen.url}
              alt={bloque.imagen.alt}
              width={bloque.imagen.width}
              height={bloque.imagen.height}
              sizes="(max-width: 767px) 59vw, (max-width: 1024px) 228px, 508px"
              style={{ objectPosition: bloque.imagen.posicion }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
