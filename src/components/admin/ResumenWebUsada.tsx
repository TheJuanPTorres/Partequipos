"use client";

import { useDocumentInfo, useFormFields, useLivePreviewContext } from "@payloadcms/ui";
import { useEffect, useState } from "react";

import { InsigniaEstado } from "@/components/admin/celdas/InsigniaEstado";
import { completitudUsada, insigniaUsada, type DatosUsada } from "@/lib/panel/fichaUsada";
import { primeraImagen, urlMiniatura } from "@/lib/panel/miniatura";

const CAMPOS: (keyof DatosUsada)[] = [
  "nombre",
  "categoria",
  "marcaUsada",
  "modelo",
  "anio",
  "horometro",
  "pesoOperativo",
  "ubicacion",
  "descripcion",
  "imagenes",
  "mostrarEnWeb",
  "disponible",
];

const FECHA = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" });

/** Lee un documento por id con la sesión del panel; `null` si no se puede. */
async function leer<T>(ruta: string, señal: AbortSignal): Promise<T | null> {
  try {
    const r = await fetch(ruta, { credentials: "include", signal: señal });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * «ASÍ SE VE HOY EN LA WEB» (tanda 21, tarea 3, puntos 3 y 9; PROTOTIPO, sin esquema): arriba de la
 * ficha, la foto de portada, el nombre, el estado (Publicada · Oculta · Vendida; las usadas no
 * llevan precio a propósito), la última modificación y quién la hizo, «Ver en la web» y el
 * indicador de ficha completa con lo que falta.
 *
 * Foto, nombre y estado salen de lo que está GUARDADO (es lo que ve hoy un visitante); el
 * indicador de ficha completa sigue lo que se escribe, para que el editor vea el efecto al
 * momento.
 */
export default function ResumenWebUsada() {
  const { id, savedDocumentData } = useDocumentInfo();
  const { previewURL } = useLivePreviewContext();
  const valores = useFormFields(([estado]) =>
    JSON.stringify(Object.fromEntries(CAMPOS.map((c) => [c, estado?.[c]?.value ?? null]))),
  );
  const enFormulario = JSON.parse(valores) as DatosUsada;
  const guardado = (savedDocumentData ?? {}) as DatosUsada & {
    updatedAt?: string;
    actualizadoPor?: unknown;
  };

  const fotoId = primeraImagen(guardado.imagenes);
  const autorId =
    typeof guardado.actualizadoPor === "object" && guardado.actualizadoPor !== null
      ? (guardado.actualizadoPor as { id?: unknown }).id
      : guardado.actualizadoPor;
  // Cada resultado va con la clave que se pidió: si cambia, el viejo no se pinta (sin setState
  // síncrono dentro del efecto).
  const claveFoto = fotoId === null ? "" : String(fotoId);
  const claveAutor =
    typeof autorId === "number" || typeof autorId === "string" ? String(autorId) : "";
  const [foto, setFoto] = useState<{ clave: string; url: string | null }>({ clave: "", url: null });
  const [autor, setAutor] = useState<{ clave: string; texto: string | null }>({
    clave: "",
    texto: null,
  });

  useEffect(() => {
    if (!claveFoto) return;
    const control = new AbortController();
    void leer<{ url?: string }>(`/api/media/${claveFoto}?depth=0`, control.signal).then((m) =>
      setFoto({ clave: claveFoto, url: urlMiniatura(m?.url) }),
    );
    return () => control.abort();
  }, [claveFoto]);

  useEffect(() => {
    if (!claveAutor) return;
    const control = new AbortController();
    void leer<{ email?: string }>(`/api/users/${claveAutor}?depth=0`, control.signal).then((u) =>
      setAutor({ clave: claveAutor, texto: u?.email ?? null }),
    );
    return () => control.abort();
  }, [claveAutor]);

  const urlFoto = claveFoto && foto.clave === claveFoto ? foto.url : null;
  const textoAutor = claveAutor && autor.clave === claveAutor ? autor.texto : null;

  const { porcentaje, faltan } = completitudUsada(enFormulario);
  const nueva = !id;

  return (
    <section aria-label="Así se ve hoy en la web" className="pq-resumen-web">
      <div className="pq-resumen-web__tarjeta">
        <div className="pq-resumen-web__foto">
          {urlFoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- miniatura del panel, ya optimizada
            <img alt="" height={96} src={urlFoto} width={128} />
          ) : (
            <span>Sin foto</span>
          )}
        </div>
        <div className="pq-resumen-web__datos">
          <p className="pq-resumen-web__antetitulo">Así se ve hoy en la web</p>
          {nueva ? (
            <p className="pq-resumen-web__nombre">
              Todavía no está guardada: aún no sale en la web.
            </p>
          ) : (
            <>
              <p className="pq-resumen-web__nombre">{String(guardado.nombre ?? "Sin nombre")}</p>
              <div className="pq-resumen-web__linea">
                <InsigniaEstado insignia={insigniaUsada(guardado)} />
                {guardado.updatedAt ? (
                  <span>
                    Modificada el {FECHA.format(new Date(guardado.updatedAt))}
                    {textoAutor ? ` por ${textoAutor}` : ""}
                  </span>
                ) : null}
              </div>
            </>
          )}
        </div>
        {previewURL && !nueva ? (
          <a className="pq-resumen-web__ver" href={previewURL} rel="noreferrer" target="_blank">
            Ver en la web<span className="pq-solo-lectores"> (se abre en otra pestaña)</span>
          </a>
        ) : null}
      </div>

      <div className="pq-resumen-web__completa">
        <div className="pq-resumen-web__barra-texto">
          <strong>Ficha completa al {porcentaje} %</strong>
          {faltan.length > 0 ? (
            <span>Falta: {faltan.join(", ")}.</span>
          ) : (
            <span>No falta nada.</span>
          )}
        </div>
        <progress
          aria-label="Ficha completa"
          className="pq-resumen-web__barra"
          max={100}
          value={porcentaje}
        />
      </div>
    </section>
  );
}
