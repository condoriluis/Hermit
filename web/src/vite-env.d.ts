/// <reference types="vite/client" />

interface Window {
  /** Lo que da la ventana de Hermit (electron/preload.ts). En un navegador no está. */
  hermit?: import('../../shared/types').PuenteHermit
}
