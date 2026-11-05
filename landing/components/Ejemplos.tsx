'use client'

import React from 'react'

/**
 * Los videos de ejemplo: son archivos reales generados con Hermit, sin edición a mano.
 * Van en `landing/public/videos/`, el video y su miniatura con el mismo nombre
 * (`el-diff.mp4` y `el-diff.jpg`). Para añadir otro, agrega una línea aquí y sube sus dos archivos.
 */
const EJEMPLOS = [
  { archivo: 'el-diff', estilo: 'El Diff', titulo: 'Mi factura, 28 veces el plan', duracion: '1:20' },
  { archivo: 'explicativo', estilo: 'Explicativo', titulo: 'Cómo pica un mosquito', duracion: '0:48' },
  { archivo: 'frutinovela', estilo: 'Frutinovela', titulo: 'Terror máximo', duracion: '1:05' },
]

export default function Ejemplos() {
  return (
    <section id="ejemplos" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs uppercase font-mono tracking-widest text-accent font-bold">
            Hecho con Hermit
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-text font-heading tracking-tight mt-2">
            Mira lo que ya se creó
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Estos videos los hizo Hermit solo, sin edición manual. Toca uno para verlo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {EJEMPLOS.map((e) => (
            <figure
              key={e.archivo}
              className="rounded-2xl overflow-hidden border border-line bg-panel shadow-card hover:border-accent/40 transition-all"
            >
              <video
                className="w-full aspect-[9/16] object-cover bg-bg"
                poster={`/videos/${e.archivo}.jpg`}
                controls
                preload="none"
                playsInline
              >
                <source src={`/videos/${e.archivo}.mp4`} type="video/mp4" />
                Tu navegador no puede reproducir el video.
              </video>

              <figcaption className="p-4">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent uppercase">
                  {e.estilo}
                </span>
                <p className="text-sm font-bold text-text font-heading mt-2">{e.titulo}</p>
                <p className="text-[11px] text-muted font-mono mt-1">
                  MP4 1080×1920 · {e.duracion} · sin edición
                </p>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-8">
          Todos se generaron en una computadora normal y los archivos quedan en tu equipo.
        </p>
      </div>
    </section>
  )
}
