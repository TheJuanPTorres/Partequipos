import {
  calidadPara,
  medidasReducidas,
  nombreCon,
  queSubir,
  type Medidas,
} from "@/lib/media/reducirImagen";

/**
 * REDUCE UNA IMAGEN EN EL NAVEGADOR, antes de subirla (dirección, 2026-11-20): la dibuja en un
 * lienzo a 3840 px de ancho como mucho —nunca más grande que el original— y la escribe en WebP.
 * Reglas y medidas en `src/lib/media/reducirImagen.ts`.
 *
 * NUNCA IMPIDE SUBIR: si el navegador no sabe abrirla o escribirla (una imagen enorme en un
 * equipo con poca memoria, un navegador sin WebP), devuelve el ORIGINAL, que sigue las reglas de
 * siempre (formato y 15 MB).
 *
 * La orientación de la cámara (EXIF) se aplica al dibujar; los demás metadatos (GPS, cámara) no
 * pasan al fichero nuevo.
 */
export type Reducida = {
  /** Lo que se sube. */
  file: File;
  /** Si es un fichero nuevo (reducido o convertido) o el original. */
  cambiada: boolean;
  /** Medidas del original y de lo que se sube; `null` si no se pudo abrir. */
  original: Medidas | null;
  subida: Medidas | null;
};

type Lienzo = {
  contexto: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  escribir: (tipo: string, calidad: number) => Promise<Blob | null>;
};

function crearLienzo(ancho: number, alto: number): Lienzo {
  if (typeof OffscreenCanvas !== "undefined") {
    const lienzo = new OffscreenCanvas(ancho, alto);
    return {
      contexto: lienzo.getContext("2d"),
      escribir: (type, quality) => lienzo.convertToBlob({ type, quality }),
    };
  }
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  return {
    contexto: lienzo.getContext("2d"),
    escribir: (tipo, calidad) => new Promise((hecho) => lienzo.toBlob(hecho, tipo, calidad)),
  };
}

export async function reducirEnNavegador(file: File): Promise<Reducida> {
  const sinCambios: Reducida = { file, cambiada: false, original: null, subida: null };
  let mapa: ImageBitmap | null = null;
  try {
    mapa = await createImageBitmap(file, { imageOrientation: "from-image" });
    const original = { ancho: mapa.width, alto: mapa.height };
    const { ancho, alto, reducida } = medidasReducidas(original);
    // Ya en WebP y sin reducir: no hay nada que hacer.
    if (!reducida && file.type === "image/webp")
      return { ...sinCambios, original, subida: original };

    const { contexto, escribir } = crearLienzo(ancho, alto);
    if (!contexto) return { ...sinCambios, original, subida: original };
    contexto.imageSmoothingEnabled = true;
    contexto.imageSmoothingQuality = "high";
    contexto.drawImage(mapa, 0, 0, ancho, alto);

    let salida = await escribir("image/webp", calidadPara("image/webp", file.type));
    // Un navegador que no escribe WebP devuelve PNG: una foto reducida va entonces en JPEG.
    if (salida && salida.type !== "image/webp" && reducida && file.type === "image/jpeg") {
      salida = await escribir("image/jpeg", calidadPara("image/jpeg", file.type));
    }
    if (queSubir(file, salida, reducida) === "original" || !salida) {
      return { ...sinCambios, original, subida: original };
    }
    return {
      file: new File([salida], nombreCon(file.name, salida.type), {
        type: salida.type,
        lastModified: file.lastModified,
      }),
      cambiada: true,
      original,
      subida: { ancho, alto },
    };
  } catch {
    return sinCambios;
  } finally {
    mapa?.close();
  }
}
