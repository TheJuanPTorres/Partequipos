import type { Insignia } from "@/lib/panel/insignias";

/**
 * Insignia de estado (F3): el `badge` del sistema del cliente con un punto de
 * color y SIEMPRE el texto. Sin hooks: vale en servidor y en cliente.
 */
export function InsigniaEstado({ insignia }: { insignia: Insignia | null }) {
  if (!insignia) return null;
  return (
    <span className={`pq-insignia pq-insignia--${insignia.tono}`}>
      <span aria-hidden="true" className="pq-insignia__punto" />
      {insignia.texto}
    </span>
  );
}
