import Link from "next/link";

import { paginasVisibles } from "@/lib/usados/paginacion";

/**
 * Paginación de un listado: enlaces normales (`<a href>`), sin JavaScript,
 * así los sigue un rastreador y cada página llega a las demás. Sin precarga:
 * pueden ser veinte páginas. `hrefDe` da la URL de cada página, con los
 * filtros que haya.
 */
export function Paginacion({
  actual,
  total,
  hrefDe,
}: {
  actual: number;
  total: number;
  hrefDe: (pagina: number) => string;
}) {
  if (total <= 1) return null;
  const enlace =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-gray-300 px-3 text-gray-900 hover:bg-gray-50";
  return (
    <nav aria-label="Paginación" className="mt-6">
      <ul className="flex flex-wrap items-center gap-2">
        {actual > 1 ? (
          <li>
            <Link href={hrefDe(actual - 1)} prefetch={false} rel="prev" className={enlace}>
              Anterior
            </Link>
          </li>
        ) : null}
        {paginasVisibles(actual, total).map((n, i) =>
          n === "…" ? (
            <li key={`salto-${i}`} aria-hidden="true" className="px-1 text-gray-600">
              …
            </li>
          ) : (
            <li key={n}>
              {n === actual ? (
                <span
                  aria-current="page"
                  className={`${enlace} border-gray-900 bg-gray-900 text-white hover:bg-gray-900`}
                >
                  {n}
                </span>
              ) : (
                <Link
                  href={hrefDe(n)}
                  prefetch={false}
                  aria-label={`Página ${n}`}
                  className={enlace}
                >
                  {n}
                </Link>
              )}
            </li>
          ),
        )}
        {actual < total ? (
          <li>
            <Link href={hrefDe(actual + 1)} prefetch={false} rel="next" className={enlace}>
              Siguiente
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
