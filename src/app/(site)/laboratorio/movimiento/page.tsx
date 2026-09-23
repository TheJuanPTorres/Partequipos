import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Revelado } from "@/components/movimiento/Revelado";

import { DemoPausa } from "./DemoPausa";

/**
 * BANCO DE PRUEBAS DEL MOVIMIENTO — fase A de la home de ux-9.
 *
 * Sirve para ver y medir, pintados, los tres ritmos del revelado y la pausa
 * antes de que ninguna sección los use. Los textos son los de ux-9 y están
 * escritos aquí a propósito: no es una página del sitio, es un instrumento.
 *
 * 404 EN PRODUCCIÓN. `VERCEL_ENV` se lee al construir: en el build de
 * producción vale `production` y la página no existe; en los preview vale
 * `preview` y en local no está definida. Fuera del sitemap por decisión
 * escrita (`RUTAS_FUERA_DEL_SITEMAP`).
 */
export const metadata: Metadata = {
  title: "Laboratorio de movimiento",
  robots: { index: false, follow: false },
};

function Hueco({ texto }: { texto: string }) {
  return (
    <div className="flex min-h-[110vh] items-end pb-8 text-sm text-gray-500">
      <p>↓ {texto}</p>
    </div>
  );
}

export default function LaboratorioMovimiento() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="texto-titulo-bloque text-texto">Laboratorio de movimiento</h1>
      <p className="texto-cuerpo mt-4 max-w-2xl text-texto-suave">
        Tres ritmos de revelado de ux-9 y la pausa. Con «reducir movimiento» activado en el sistema,
        todo el texto tiene que verse entero y quieto desde el principio.
      </p>

      <section className="mt-12" aria-labelledby="pausa-titulo">
        <h2 id="pausa-titulo" className="texto-titulo-4 text-texto">
          Pausa
        </h2>
        <DemoPausa />
      </section>

      <Hueco texto="Ritmo «portada»: escalón 0,3 s · 2 s · 50 % · disparo 85 %" />
      <Revelado
        texto="Potencia Hitachi"
        ritmo="portada"
        className="texto-titulo-seccion uppercase text-texto"
        id="revelado-portada"
      />

      <Hueco texto="Ritmo «titulo» con disparo al 95 %: títulos de sección" />
      <Revelado
        texto="Maquinaria pesada nueva"
        disparo={0.95}
        className="texto-titulo-seccion text-texto"
        id="revelado-titulo"
      />

      <Hueco texto="Ritmo «titulo» en un párrafo (sin aria-label): el vidrio del hero" />
      <Revelado
        como="p"
        texto="En Partequipos encuentras maquinaria Hitachi, diseñada para ofrecer rendimiento, precisión y confiabilidad en cada operación."
        className="texto-cuerpo max-w-md text-texto"
        id="revelado-parrafo"
      />

      <Hueco texto="Ritmo «pausado»: escalón 0,01 s · 2 s · 100 %" />
      <Revelado
        como="h3"
        ritmo="pausado"
        texto="En Partequipos somos expertos en repuestos y maquinaria pesada"
        className="texto-titulo-3 text-texto"
        id="revelado-pausado"
      />

      <Hueco texto="Ritmo «titulo» con curva back.out: preguntas frecuentes" />
      <Revelado
        texto="Preguntas frecuentes"
        curva="back.out"
        className="texto-titulo-seccion text-texto"
        id="revelado-rebote"
      />
      <div className="h-[60vh]" />
    </main>
  );
}
