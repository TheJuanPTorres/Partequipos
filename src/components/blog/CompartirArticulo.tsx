"use client";

import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconCheck,
  IconLink,
} from "@tabler/icons-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import estilos from "./articuloPropio.module.css";

/**
 * Compartir sin terceros: enlaces de compartir de WhatsApp, LinkedIn y Facebook
 * (sin scripts ni píxeles de ellos) y «Copiar enlace». Los tres primeros son
 * enlaces normales que abren en otra pestaña; el cuarto es el único que
 * necesita JavaScript, y sin él el botón no se pinta. Al copiar, un aviso
 * `role="status"` lo anuncia a los lectores de pantalla.
 */
export function CompartirArticulo({ url, titulo }: { url: string; titulo: string }) {
  const [copiado, setCopiado] = useState(false);
  // Sin JavaScript (o sin portapapeles) el botón no se pinta; el servidor siempre dice «no».
  const puedeCopiar = useSyncExternalStore(
    () => () => {},
    () => !!navigator.clipboard?.writeText,
    () => false,
  );
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(titulo);
  const enlaces = [
    {
      nombre: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${titulo}: ${url}`)}`,
      Icono: IconBrandWhatsapp,
    },
    {
      nombre: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      Icono: IconBrandLinkedin,
    },
    {
      nombre: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`,
      Icono: IconBrandFacebook,
    },
  ];

  return (
    <div className={estilos.compartir}>
      <p className={estilos.tituloCompartir}>Compartir este artículo</p>
      <ul>
        {enlaces.map(({ nombre, href, Icono }) => (
          <li key={nombre}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Compartir en ${nombre} (se abre en otra pestaña)`}
            >
              <Icono aria-hidden="true" size={22} stroke={1.7} />
            </a>
          </li>
        ))}
        {puedeCopiar ? (
          <li>
            <button type="button" onClick={copiar} aria-label="Copiar el enlace del artículo">
              {copiado ? (
                <IconCheck aria-hidden="true" size={22} stroke={2} />
              ) : (
                <IconLink aria-hidden="true" size={22} stroke={1.7} />
              )}
            </button>
          </li>
        ) : null}
      </ul>
      <p className={estilos.copiado} role="status">
        {copiado ? "Enlace copiado" : ""}
      </p>
    </div>
  );
}
