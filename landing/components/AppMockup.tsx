'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Download,
  KeyRound,
  PenLine,
  CheckCircle2,
  Circle,
  Play,
  Globe,
  Video,
  FileText,
  Newspaper,
  Mic
} from 'lucide-react'
import { enlaceDescarga } from '@/lib/descargas'

/**
 * «Cómo funciona» y la ventana de la app. Los datos son los del sistema real: los estilos, sus etapas y sus
 * archivos salen de `cards.json` (Animalnovela, El Diff, Artículo para blog), y el aviso de la voz es el
 * `espera` que esa etapa declara. Nada de aquí se inventa: si un estilo cambia, esto se cambia con él.
 */
type So = 'windows' | 'mac' | 'linux'
type Caso = 'video' | 'noticiero' | 'articulo'

const SISTEMAS: { so: So; nombre: string }[] = [
  { so: 'windows', nombre: 'Windows' },
  { so: 'mac', nombre: 'Mac' },
  { so: 'linux', nombre: 'Linux' },
]

const HILOS: { caso: Caso; titulo: string; pie: string; icono: typeof Video }[] = [
  { caso: 'video', titulo: 'La inspección del bosque', pie: 'Animalnovela · Video listo', icono: Video },
  { caso: 'noticiero', titulo: '¿Por qué subió el precio del huevo?', pie: 'El Diff · Falta tu voz', icono: Newspaper },
  { caso: 'articulo', titulo: 'IA y trabajo diario', pie: 'Artículo · Publicado', icono: FileText },
]

const ESTILOS = ['animalnovela', 'video-el-diff', 'articulo-blog', 'reel-collage']

/** Una etapa de la card: `ok` ya está, `ahora` es la que toca, `falta` todavía no. */
function Etapa({ nombre, estado }: { nombre: string; estado: 'ok' | 'ahora' | 'falta' }) {
  const caja =
    estado === 'ok'
      ? 'bg-panel-2 border-ok/40 text-text'
      : estado === 'ahora'
        ? 'bg-accent/10 border-accent text-accent font-semibold'
        : 'bg-panel-2/50 border-line text-muted'
  const Icono = estado === 'ok' ? CheckCircle2 : estado === 'ahora' ? Play : Circle
  return (
    <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${caja}`}>
      <Icono
        className={`w-4 h-4 flex-none ${
          estado === 'ok' ? 'text-ok' : estado === 'ahora' ? 'text-accent' : 'text-muted/60'
        }`}
      />
      <span className="truncate">{nombre}</span>
    </div>
  )
}

/** Un archivo que el hilo dejó en tu carpeta. */
function Archivo({ ruta, que }: { ruta: string; que: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <CheckCircle2 className="w-3.5 h-3.5 text-ok flex-none translate-y-0.5" />
      <span className="font-mono text-text-2">{ruta}</span>
      <span className="text-muted">({que})</span>
    </li>
  )
}

export default function AppMockup() {
  const [so, setSo] = useState<So>('windows')
  const [caso, setCaso] = useState<Caso>('video')

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase()
    if (ua.includes('mac')) setSo('mac')
    else if (ua.includes('linux')) setSo('linux')
  }, [])

  const nombreSo = SISTEMAS.find((s) => s.so === so)?.nombre ?? 'Windows'

  return (
    <section id="demostracion" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-mono tracking-widest text-accent font-bold">
            Cómo funciona
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-text font-heading tracking-tight mt-2">
            Tres pasos. El primero toma un minuto.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Descargas la app, conectas tu cuenta y escribes de qué va. Hermit investiga, redacta y
            arma el archivo en tu computadora.
          </p>
        </div>

        {/* Los tres pasos */}
        <div className="grid gap-5 md:grid-cols-3 max-w-6xl mx-auto">
          <div className="rounded-2xl border border-line bg-panel/50 p-6 flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-accent">01</span>
              <span className="h-px flex-1 bg-line" />
              <Download className="w-4 h-4 text-accent" />
            </div>
            <h3 className="mt-4 text-lg font-bold font-heading text-text">Descarga Hermit</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Gratis y sin tarjeta. Se instala como cualquier programa.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {SISTEMAS.map((s) => (
                <button
                  key={s.so}
                  type="button"
                  onClick={() => setSo(s.so)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono transition-all ${
                    so === s.so
                      ? 'bg-accent text-on-solid border-accent'
                      : 'bg-bg text-muted border-line hover:text-text'
                  }`}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
            <a
              href={enlaceDescarga(so)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent hover:bg-accent-hover text-on-solid font-bold text-sm font-heading transition-all shadow-glow"
            >
              <Download className="w-4 h-4" />
              <span>Descargar para {nombreSo}</span>
            </a>
          </div>

          <div className="rounded-2xl border border-line bg-panel/50 p-6 flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-accent">02</span>
              <span className="h-px flex-1 bg-line" />
              <KeyRound className="w-4 h-4 text-accent" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold font-heading text-text">Conecta tu Claude</h3>
              <span className="px-2 py-0.5 rounded-md bg-panel-2 border border-line text-[10px] font-mono font-bold text-text-2">
                Pro o Max
              </span>
            </div>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Entras con tu cuenta de Claude, la que pagas aparte a Anthropic: ella hace el trabajo
              pesado. Si ya usas Claude Code en esta computadora, ya está conectada.
            </p>
            <p className="mt-3 text-xs text-muted/90 leading-relaxed">
              También funciona con tu cuenta de ChatGPT (Codex), DeepSeek o Gemini.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-panel/50 p-6 flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-accent">03</span>
              <span className="h-px flex-1 bg-line" />
              <PenLine className="w-4 h-4 text-accent" />
            </div>
            <h3 className="mt-4 text-lg font-bold font-heading text-text">Escribe el tema</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Eliges un estilo, escribes de qué va y Hermit hace el video o el artículo.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['El Diff', 'Explicativo', 'Documental', 'Animalnovela', 'Artículo'].map((e) => (
                <span
                  key={e}
                  className="px-2 py-0.5 rounded-md bg-panel-2 text-[10px] font-mono text-text-2 border border-line"
                >
                  {e}
                </span>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted/90 leading-relaxed">
              <Mic className="w-3.5 h-3.5 text-accent flex-none mt-0.5" />
              Cuando el estilo lo pide, solo grabas tu voz con el celular.
            </p>
          </div>
        </div>

        {/* La ventana de la app */}
        <div className="rounded-2xl border border-line bg-bg shadow-2xl overflow-hidden max-w-6xl mx-auto mt-14">
          <div className="bg-panel px-4 py-3 border-b border-line flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full bg-bad/80 flex-none" />
              <span className="w-3 h-3 rounded-full bg-warn/80 flex-none" />
              <span className="w-3 h-3 rounded-full bg-ok/80 flex-none" />
              <span className="ml-3 font-mono text-xs text-muted font-medium flex items-center gap-2 truncate">
                <Image src="/icon.svg" width={14} height={14} alt="icon" />
                Hermit — Estudio Local
              </span>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-ok bg-ok/10 px-2.5 py-1 rounded-full border border-ok/30 flex-none">
              <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
              Claude conectado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
            {/* Los hilos */}
            <div className="hidden md:block md:col-span-3 bg-panel/60 border-r border-line p-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3 font-semibold">
                Tus hilos
              </div>

              <div className="space-y-1.5">
                {HILOS.map((h) => {
                  const Icono = h.icono
                  return (
                    <button
                      key={h.caso}
                      type="button"
                      onClick={() => setCaso(h.caso)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
                        caso === h.caso
                          ? 'bg-panel-2 border-accent/40 text-text shadow-sm'
                          : 'border-transparent text-muted hover:text-text hover:bg-panel-2/50'
                      }`}
                    >
                      <Icono className="w-4 h-4 text-accent flex-none" />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-text truncate">{h.titulo}</span>
                        <span className="block text-[10px] text-muted truncate">{h.pie}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 pt-4 border-t border-line">
                <div className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2">
                  Estilos que trae
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ESTILOS.map((e) => (
                    <span
                      key={e}
                      className="px-2 py-0.5 rounded-md bg-panel-2 text-[10px] font-mono text-text-2 border border-line"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* El hilo abierto */}
            <div className="md:col-span-9 p-5 sm:p-7 flex flex-col justify-between bg-bg">
              {caso === 'video' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
                    <div>
                      <span className="text-xs font-mono text-accent uppercase font-bold tracking-wider">
                        Estilo: Animalnovela
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-text font-heading mt-0.5">
                        La inspección más sospechosa del bosque
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-ok/10 border border-ok/30 text-ok text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 5 de 5 pasos completados
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <Etapa nombre="Guion" estado="ok" />
                    <Etapa nombre="Cuadros" estado="ok" />
                    <Etapa nombre="Clips" estado="ok" />
                    <Etapa nombre="Video" estado="ahora" />
                    <Etapa nombre="Portada" estado="ok" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    <div className="sm:col-span-5 flex justify-center">
                      <div className="w-40 sm:w-44 aspect-[9/16] rounded-2xl overflow-hidden border border-line-strong shadow-2xl bg-panel flex items-center justify-center">
                        <div className="text-center p-4">
                          <div className="w-12 h-12 rounded-full bg-accent text-on-solid flex items-center justify-center mx-auto shadow-glow">
                            <Play className="w-5 h-5 fill-current translate-x-0.5" />
                          </div>
                          <p className="text-xs font-bold text-text mt-3">animalnovela-1.mp4</p>
                          <p className="text-[10px] text-muted">1080x1920 (TikTok / Reels)</p>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-7 p-3 rounded-xl bg-panel border border-line">
                      <span className="text-xs font-mono font-semibold text-accent">
                        Archivos en tu carpeta:
                      </span>
                      <ul className="mt-2 space-y-1.5 text-[11px]">
                        <Archivo ruta="guion.md" que="Guion con sus escenas" />
                        <Archivo ruta="clips/esc-01.mp4" que="Un clip por escena" />
                        <Archivo ruta="out/animalnovela-1.mp4" que="Video vertical terminado" />
                        <Archivo ruta="portada.png" que="Primer cuadro con título" />
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {caso === 'noticiero' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
                    <div>
                      <span className="text-xs font-mono text-accent uppercase font-bold tracking-wider">
                        Estilo: El Diff
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-text font-heading mt-0.5">
                        ¿Por qué subió el precio del huevo?
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" /> Falta tu voz
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Etapa nombre="Fuentes" estado="ok" />
                    <Etapa nombre="Material" estado="ok" />
                    <Etapa nombre="Guion" estado="ok" />
                    <Etapa nombre="Tu voz" estado="ahora" />
                    <Etapa nombre="Escenas" estado="falta" />
                    <Etapa nombre="Revisión" estado="falta" />
                    <Etapa nombre="Video" estado="falta" />
                    <Etapa nombre="Portada" estado="falta" />
                  </div>

                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 text-xs text-text-2 flex items-start gap-2 leading-relaxed">
                    <Mic className="w-4 h-4 text-accent flex-none mt-0.5" />
                    <span>
                      Graba el guion (con el celular basta) y súbelo aquí o mándalo por el chat.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-panel border border-line">
                    <span className="text-xs font-mono font-semibold text-accent">
                      Archivos en tu carpeta:
                    </span>
                    <ul className="mt-2 space-y-1.5 text-[11px]">
                      <Archivo ruta="fuentes/tema/transcripcion.txt" que="Lo que dijo el video" />
                      <Archivo ruta="material.md" que="Enlaces y datos" />
                      <Archivo ruta="guion.md" que="Guion listo, se copia con un botón" />
                    </ul>
                  </div>
                </div>
              )}

              {caso === 'articulo' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
                    <div>
                      <span className="text-xs font-mono text-accent uppercase font-bold tracking-wider">
                        Estilo: Artículo para blog
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-text font-heading mt-0.5">
                        El impacto de la inteligencia artificial en el trabajo diario
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-ok/10 border border-ok/30 text-ok text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 4 de 4 pasos completados
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Etapa nombre="Enfoque" estado="ok" />
                    <Etapa nombre="Artículo" estado="ok" />
                    <Etapa nombre="Portada" estado="ok" />
                    <Etapa nombre="Publicado" estado="ahora" />
                  </div>

                  <div className="p-4 rounded-xl bg-panel border border-line space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted border-b border-line pb-2.5">
                      <span className="flex items-center gap-1.5 font-mono text-accent truncate">
                        <Globe className="w-3.5 h-3.5 flex-none" /> vista-previa.html
                      </span>
                      <span className="text-[11px] flex-none">Listo para copiar o subir a tu web</span>
                    </div>

                    <div className="bg-[#0f141c] p-4 rounded-lg border border-line/60">
                      <div className="h-28 w-full rounded-md bg-panel-2 flex items-center justify-center text-muted font-mono text-xs border border-line">
                        [portada.png — 1200x630 píxeles para redes sociales]
                      </div>
                      <h4 className="font-bold text-text text-sm sm:text-base font-heading mt-3">
                        Cómo usar la inteligencia artificial sin perder el toque humano
                      </h4>
                      <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-3">
                        Hoy en día, las herramientas de automatización permiten a cualquier creador
                        multiplicar su contenido sin dedicar horas frente a una hoja en blanco...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pie de la ventana */}
              <div className="mt-6 pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-ok" />
                  Archivos guardados en tu equipo
                </span>

                <div className="flex items-center gap-2 font-mono">
                  <span className="text-text font-bold">100% libre</span>
                  <span>·</span>
                  <span>Sin costo mensual forzado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
