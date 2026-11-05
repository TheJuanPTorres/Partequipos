import { useId, type ReactNode } from "react";

import type { CodigoPais } from "@/lib/lubricantes/pais";

/**
 * BANDERA DE UN PAÍS (2026-11-04, dirección: el desplegable «Lubricantes» del menú, Eni de Italia y
 * Dispel de Colombia). SVG propio, sin emojis ni ficheros: todas en la misma caja 3:2 (30 × 20 de
 * dibujo), con las esquinas redondeadas y un borde fino que la separa del fondo blanco (el blanco de
 * Italia, Japón o Corea se pierde sin él). A tamaño de menú (21 × 14 px) se simplifican los
 * detalles que no se distinguen: España sin escudo (la bandera civil), las estrellas de Estados
 * Unidos como puntos y Brasil sin el lema.
 *
 * DECORATIVA (`aria-hidden`): quien la usa pone el nombre del país en texto (para lectores).
 */

const A = 30;
const H = 20;

/** Una estrella de cinco puntas con centro (cx, cy) y radio r, con una punta hacia `giro`. */
function estrella(cx: number, cy: number, r: number, giro = -90): string {
  const puntos: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radio = i % 2 === 0 ? r : r * 0.382;
    const ang = ((giro + i * 36) * Math.PI) / 180;
    puntos.push(
      `${(cx + radio * Math.cos(ang)).toFixed(2)},${(cy + radio * Math.sin(ang)).toFixed(2)}`,
    );
  }
  return puntos.join(" ");
}

const franjasV = (c: [string, string, string]) =>
  c.map((color, i) => (
    <rect key={i} x={(A / 3) * i} y={0} width={A / 3 + 0.01} height={H} fill={color} />
  ));
const franjasH = (c: [string, string, string]) =>
  c.map((color, i) => (
    <rect key={i} x={0} y={(H / 3) * i} width={A} height={H / 3 + 0.01} fill={color} />
  ));

/** Un trigrama de Corea: tres barras (`true` entera, `false` partida), perpendiculares a su diagonal. */
function trigrama(cx: number, cy: number, giro: number, barras: [boolean, boolean, boolean]) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${giro})`} fill="#000">
      {barras.map((entera, i) => {
        const y = (i - 1) * 1.15 - 0.3;
        return entera ? (
          <rect key={i} x={-2} y={y} width={4} height={0.6} />
        ) : (
          <g key={i}>
            <rect x={-2} y={y} width={1.75} height={0.6} />
            <rect x={0.25} y={y} width={1.75} height={0.6} />
          </g>
        );
      })}
    </g>
  );
}

const DIAGONAL = (Math.atan(H / A) * 180) / Math.PI; // 33,69°

const DIBUJOS: Record<CodigoPais, () => ReactNode> = {
  it: () => franjasV(["#009246", "#ffffff", "#ce2b37"]),
  fr: () => franjasV(["#002654", "#ffffff", "#ce1126"]),
  de: () => franjasH(["#000000", "#dd0000", "#ffce00"]),
  nl: () => franjasH(["#ae1c28", "#ffffff", "#21468b"]),
  co: () => (
    <>
      <rect width={A} height={H / 2} fill="#fcd116" />
      <rect y={H / 2} width={A} height={H / 4} fill="#003893" />
      <rect y={(H * 3) / 4} width={A} height={H / 4} fill="#ce1126" />
    </>
  ),
  es: () => (
    <>
      <rect width={A} height={H} fill="#aa151b" />
      <rect y={H / 4} width={A} height={H / 2} fill="#f1bf00" />
    </>
  ),
  jp: () => (
    <>
      <rect width={A} height={H} fill="#ffffff" />
      <circle cx={A / 2} cy={H / 2} r={6} fill="#bc002d" />
    </>
  ),
  us: () => {
    const alto = H / 13;
    return (
      <>
        <rect width={A} height={H} fill="#ffffff" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} y={alto * i * 2} width={A} height={alto} fill="#b22234" />
        ))}
        <rect width={12} height={alto * 7} fill="#3c3b6e" />
        {Array.from({ length: 4 }, (_, f) =>
          Array.from({ length: 5 }, (_, c) => (
            <circle
              key={`${f}-${c}`}
              cx={1.5 + c * 2.25}
              cy={1.4 + f * 2.35}
              r={0.45}
              fill="#ffffff"
            />
          )),
        )}
      </>
    );
  },
  gb: () => (
    <>
      <rect width={A} height={H} fill="#012169" />
      <path d={`M0 0L${A} ${H}M${A} 0L0 ${H}`} stroke="#ffffff" strokeWidth={4} />
      <path d={`M0 0L${A} ${H}M${A} 0L0 ${H}`} stroke="#c8102e" strokeWidth={1.4} />
      <path d={`M${A / 2} 0V${H}M0 ${H / 2}H${A}`} stroke="#ffffff" strokeWidth={6} />
      <path d={`M${A / 2} 0V${H}M0 ${H / 2}H${A}`} stroke="#c8102e" strokeWidth={3.4} />
    </>
  ),
  kr: () => (
    <>
      <rect width={A} height={H} fill="#ffffff" />
      <g transform={`translate(${A / 2} ${H / 2}) rotate(${DIAGONAL})`}>
        <circle r={5} fill="#0047a0" />
        <path d="M-5 0A5 5 0 0 1 5 0Z" fill="#cd2e3a" />
        <circle cx={-2.5} r={2.5} fill="#cd2e3a" />
        <circle cx={2.5} r={2.5} fill="#0047a0" />
      </g>
      {trigrama(A / 2 - 8.6, H / 2 - 5.75, DIAGONAL - 90, [true, true, true])}
      {trigrama(A / 2 + 8.6, H / 2 + 5.75, DIAGONAL - 90, [false, false, false])}
      {trigrama(A / 2 + 8.6, H / 2 - 5.75, 90 - DIAGONAL, [false, true, false])}
      {trigrama(A / 2 - 8.6, H / 2 + 5.75, 90 - DIAGONAL, [true, false, true])}
    </>
  ),
  cn: () => (
    <>
      <rect width={A} height={H} fill="#ee1c25" />
      <polygon points={estrella(5, 5, 3)} fill="#ffff00" />
      {(
        [
          [10, 2, 33],
          [12, 4, 10],
          [12, 7, -10],
          [10, 9, -33],
        ] as const
      ).map(([x, y, g]) => (
        <polygon key={`${x}-${y}`} points={estrella(x, y, 1, 180 + g)} fill="#ffff00" />
      ))}
    </>
  ),
  br: () => (
    <>
      <rect width={A} height={H} fill="#009c3b" />
      <polygon
        points={`${A / 2},1.7 ${A - 1.7},${H / 2} ${A / 2},${H - 1.7} 1.7,${H / 2}`}
        fill="#ffdf00"
      />
      <circle cx={A / 2} cy={H / 2} r={5.25} fill="#002776" />
      <path d="M10.1 9.1Q15 7.6 19.9 11.2" stroke="#ffffff" strokeWidth={0.8} fill="none" />
    </>
  ),
};

export function Bandera({ codigo, className }: { codigo: CodigoPais; className?: string }) {
  const id = `bandera-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox={`0 0 ${A} ${H}`}
      width={21}
      height={14}
      aria-hidden="true"
      focusable="false"
      className={className}
      data-bandera={codigo}
    >
      <defs>
        <clipPath id={id}>
          <rect width={A} height={H} rx={2.6} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{DIBUJOS[codigo]()}</g>
      {/* Borde fino: separa del blanco del menú los blancos de la bandera. */}
      <rect
        x={0.5}
        y={0.5}
        width={A - 1}
        height={H - 1}
        rx={2.2}
        fill="none"
        stroke="rgb(17 24 39 / 0.18)"
        strokeWidth={1}
      />
    </svg>
  );
}

/** Los países con bandera dibujada (la prueba exige que sean todos los de la lista). */
export const BANDERAS_DIBUJADAS = Object.keys(DIBUJOS) as CodigoPais[];
