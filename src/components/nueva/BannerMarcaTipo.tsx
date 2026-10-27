import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import type { VistaBanner } from "@/lib/nueva/bannerMarca";
import type { LogoConAlt } from "@/lib/marca/logoMarca";

import estilos from "./bannerMarca.module.css";

/**
 * BANNER DE MARCA de la página general de un tipo de maquinaria nueva (2026-10-26, prototipo del
 * cliente «Excavadoras nuevas» portado sin Tailwind; lógica en `src/lib/nueva/bannerMarca.ts`).
 * Escritorio: el logo sobre una forma del color de la marca con borde diagonal y esquinas
 * redondeadas (con otra más oscura detrás), el título en `<h2>` sobre un tono claro de la marca y,
 * a la derecha, la foto de la marca teñida con su color que se oscurece hacia «Ver marca».
 * Móvil (≤ 767 px): tarjeta blanca con el bloque de color del logo, el título y una flecha.
 * Sin logo, el nombre de la marca en el bloque; sin foto, el banner en su color.
 */
export function BannerMarcaTipo({
  id,
  titulo,
  marca,
  logo,
  vista,
}: {
  /** `id` del `<h2>`. */
  id: string;
  titulo: string;
  marca: { nombre: string; href: string };
  logo: LogoConAlt | null;
  vista: VistaBanner;
}) {
  const variables = {
    "--acento": vista.acento,
    "--acento-oscuro": vista.acentoOscuro,
    "--banner-fondo": vista.fondo,
    "--banner-tinta": vista.tintaTitulo,
  } as CSSProperties;
  return (
    <header className={estilos.banner} style={variables}>
      {vista.foto ? (
        <span aria-hidden="true" className={estilos.foto}>
          <Image
            src={vista.foto.url}
            alt=""
            fill
            sizes="(max-width: 1024px) 60vw, 820px"
            style={{ objectFit: "cover", objectPosition: vista.foto.posicion }}
          />
          <span className={estilos.fotoTinte} />
          <span className={estilos.fotoSombra} />
        </span>
      ) : null}
      <span aria-hidden="true" className={estilos.formaAtras} />
      <span aria-hidden="true" className={estilos.forma} />

      <div className={estilos.logoCaja} data-tinta={vista.tintaLogo}>
        {logo ? (
          <LogoMarca logo={logo} alt={logo.alt} sizes="180px" className={estilos.logo} />
        ) : (
          <span className={estilos.logoTexto}>{marca.nombre}</span>
        )}
      </div>

      <div className={estilos.texto}>
        <h2 id={id} className={estilos.titulo}>
          {titulo}
        </h2>
      </div>

      <div className={estilos.accion}>
        <Link href={marca.href} aria-label={`Ver marca ${marca.nombre}`} className={estilos.ver}>
          <span className={estilos.verTexto}>Ver marca</span>
          <IconArrowRight aria-hidden="true" size={18} stroke={2.2} />
        </Link>
      </div>
    </header>
  );
}
