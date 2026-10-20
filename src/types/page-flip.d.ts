/**
 * Tipos mínimos de `page-flip` 2.0.7 (StPageFlip, MIT): el paquete publica solo
 * el JavaScript. Solo lo que usa el visor de documentos
 * (`src/components/documentos/VisorLibro.tsx`), leído de `src/PageFlip.ts` y
 * `src/Settings.ts` del propio paquete.
 */
declare module "page-flip" {
  export type AjustesPageFlip = {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    startPage?: number;
  };

  export type EventoPageFlip = { data: unknown; object: PageFlip };

  export class PageFlip {
    constructor(elemento: HTMLElement, ajustes: AjustesPageFlip);
    loadFromHTML(elementos: HTMLElement[] | NodeListOf<HTMLElement>): void;
    destroy(): void;
    update(): void;
    flipNext(): void;
    flipPrev(): void;
    flip(pagina: number): void;
    turnToPage(pagina: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    on(
      evento: "flip" | "init" | "changeOrientation" | "changeState",
      fn: (e: EventoPageFlip) => void,
    ): this;
  }
}
