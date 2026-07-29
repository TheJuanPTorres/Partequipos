import Image from "next/image";
import Link from "next/link";

import { navegacionPrincipal } from "@/lib/navegacion";
import { seoConfig } from "@/lib/seo/config";

/**
 * Cabecera con la navegación principal del sitio.
 *
 * Server Component: es marcado estático, no necesita estado ni JavaScript en el
 * cliente. Sin menú desplegable en móvil a propósito — en pantallas pequeñas los
 * enlaces pasan a varias líneas, que es accesible y no requiere interactividad.
 * El diseño definitivo decidirá si hace falta un menú plegable.
 */
export function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="shrink-0" aria-label={`${seoConfig.siteName} — Inicio`}>
          <Image
            src={seoConfig.logoPath}
            alt={seoConfig.siteName}
            width={1614}
            height={317}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        <nav aria-label="Navegación principal">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {navegacionPrincipal.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-gray-700 hover:text-gray-900 hover:underline"
                >
                  {item.etiqueta}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={`tel:${seoConfig.contact.phone.replace(/\s/g, "")}`}
                className="font-medium text-gray-900 hover:underline"
              >
                {seoConfig.contact.phone}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
