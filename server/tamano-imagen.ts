/**
 * El tamaño de una imagen sin abrirla entera: lee la cabecera (PNG IHDR, JPEG SOF, WebP VP8/VP8L/VP8X, GIF) y
 * devuelve su ancho y alto. `undefined` si no se pudo leer o el formato no se reconoce. Las galerías lo usan para
 * dibujar la tarjeta con su proporción real desde el primer cuadro, sin el salto que da medirla al cargar.
 */
import { openSync, readSync, closeSync, statSync } from 'node:fs'

export function tamImagen(ruta: string): { ancho: number; alto: number } | undefined {
  let fd: number | undefined
  try {
    const tam = statSync(ruta).size
    fd = openSync(ruta, 'r')
    const n = Math.min(tam, 512 * 1024)
    const b = Buffer.alloc(n)
    readSync(fd, b, 0, n, 0)
    return medir(b)
  } catch {
    return undefined
  } finally {
    if (fd !== undefined) {
      try {
        closeSync(fd)
      } catch {}
    }
  }
}

function medir(b: Buffer): { ancho: number; alto: number } | undefined {
  // PNG: firma 8 bytes y luego la cabecera IHDR con ancho y alto de 4 bytes cada uno.
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) {
    return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) }
  }
  // GIF: «GIF8», ancho y alto de 2 bytes en little-endian.
  if (b.length > 10 && b.toString('ascii', 0, 3) === 'GIF') {
    return { ancho: b.readUInt16LE(6), alto: b.readUInt16LE(8) }
  }
  // WebP: «RIFF» + tamaño + «WEBP» + formato.
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const f = b.toString('ascii', 12, 16)
    if (f === 'VP8 ') return { ancho: b.readUInt16LE(26) & 0x3fff, alto: b.readUInt16LE(28) & 0x3fff }
    if (f === 'VP8L') {
      const x = b.readUInt32LE(21)
      return { ancho: (x & 0x3fff) + 1, alto: ((x >> 14) & 0x3fff) + 1 }
    }
    if (f === 'VP8X') return { ancho: (b.readUIntLE(24, 3) & 0xffffff) + 1, alto: (b.readUIntLE(27, 3) & 0xffffff) + 1 }
  }
  // JPEG: SOI y luego segmentos hasta el SOF, que lleva alto y ancho.
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return undefined
      const marca = b[i + 1]
      // SOF0-SOF15 menos DHT, JPG y DAC: ahí están alto y ancho.
      if (marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc) {
        return { alto: b.readUInt16BE(i + 5), ancho: b.readUInt16BE(i + 7) }
      }
      i += 2 + b.readUInt16BE(i + 2)
    }
  }
  return undefined
}
