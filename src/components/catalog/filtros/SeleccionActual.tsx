import Link from "next/link";

/**
 * «Selección actual»: un chip por filtro elegido, que lo quita, y «Limpiar
 * filtros». Enlaces normales con `rel="nofollow"`: un rastreador no tiene por
 * qué recorrer las combinaciones (y esas páginas no se indexan).
 */
export function SeleccionActual({
  chips,
  limpiar,
}: {
  chips: { clave: string; etiqueta: string; href: string }[];
  limpiar: string;
}) {
  if (!chips.length) return null;
  const chip =
    "inline-flex min-h-8 items-center gap-1 rounded-full border border-gray-300 px-3 text-sm text-gray-900 hover:bg-gray-50";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-900">Selección actual:</span>
      <ul className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <li key={c.clave}>
            <Link
              href={c.href}
              prefetch={false}
              rel="nofollow"
              className={chip}
              aria-label={`Quitar el filtro ${c.etiqueta}`}
            >
              {c.etiqueta}
              <span aria-hidden="true">×</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={limpiar}
        prefetch={false}
        rel="nofollow"
        className="min-h-8 text-sm text-gray-900 underline underline-offset-2"
      >
        Limpiar filtros
      </Link>
    </div>
  );
}
