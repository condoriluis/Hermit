'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  Video,
  FileText,
  Code2,
  CheckCircle2,
  Play,
  Terminal,
  ExternalLink,
  Flame,
  Globe
} from 'lucide-react'

export default function AppMockup() {
  const [activeTab, setActiveTab] = useState<'video' | 'articulo' | 'codigo'>('video')

  return (
    <section id="demostracion" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-mono tracking-widest text-accent font-bold">
            Así se ve y se usa
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-text font-heading tracking-tight mt-2">
            Elige una tarjeta y mira el resultado en vivo
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Solo escribes de qué quieres que hable tu contenido. La aplicación investiga,
            redacta y genera los archivos directamente en tu equipo.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto p-1.5 rounded-2xl bg-panel border border-line max-w-xl mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'video'
                ? 'bg-accent text-on-solid shadow-glow'
                : 'text-muted hover:text-text hover:bg-panel-2'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video Corto (TikTok / Reels)</span>
          </button>

          <button
            onClick={() => setActiveTab('articulo')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'articulo'
                ? 'bg-accent text-on-solid shadow-glow'
                : 'text-muted hover:text-text hover:bg-panel-2'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Artículo para Blog</span>
          </button>

          <button
            onClick={() => setActiveTab('codigo')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'codigo'
                ? 'bg-accent text-on-solid shadow-glow'
                : 'text-muted hover:text-text hover:bg-panel-2'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Ayuda con Código</span>
          </button>
        </div>

        {/* Main Mockup Window */}
        <div className="rounded-2xl border border-line bg-bg shadow-2xl overflow-hidden max-w-6xl mx-auto">
          {/* Window Header */}
          <div className="bg-panel px-4 py-3 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-bad/80" />
              <span className="w-3 h-3 rounded-full bg-warn/80" />
              <span className="w-3 h-3 rounded-full bg-ok/80" />
              <span className="ml-3 font-mono text-xs text-muted font-medium flex items-center gap-2">
                <Image src="/icon.svg" width={14} height={14} alt="icon" />
                Hermit — Estudio Local
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-mono text-ok bg-ok/10 px-2.5 py-1 rounded-full border border-ok/30">
                <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
                Asistente de IA listo
              </span>
            </div>
          </div>

          {/* Window Body Grid: Sidebar + Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            {/* Mock Sidebar */}
            <div className="hidden md:block md:col-span-3 bg-panel/60 border-r border-line p-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3 font-semibold">
                Tus Proyectos
              </div>

              <div className="space-y-1.5 font-medium text-xs">
                <div
                  onClick={() => setActiveTab('video')}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 ${
                    activeTab === 'video'
                      ? 'bg-panel-2 border border-accent/40 text-text shadow-sm'
                      : 'text-muted hover:text-text hover:bg-panel-2/50'
                  }`}
                >
                  <Video className="w-4 h-4 text-accent" />
                  <div className="truncate">
                    <p className="font-bold text-text truncate">Curiosidades del Espacio</p>
                    <p className="text-[10px] text-muted">Video Vertical · Terminado</p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('articulo')}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 ${
                    activeTab === 'articulo'
                      ? 'bg-panel-2 border border-accent/40 text-text shadow-sm'
                      : 'text-muted hover:text-text hover:bg-panel-2/50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-accent" />
                  <div className="truncate">
                    <p className="font-bold text-text truncate">Inteligencia Artificial y Trabajo</p>
                    <p className="text-[10px] text-muted">Artículo · Listo para publicar</p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('codigo')}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 ${
                    activeTab === 'codigo'
                      ? 'bg-panel-2 border border-accent/40 text-text shadow-sm'
                      : 'text-muted hover:text-text hover:bg-panel-2/50'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-accent" />
                  <div className="truncate">
                    <p className="font-bold text-text truncate">Automatizar Tareas con Script</p>
                    <p className="text-[10px] text-muted">Código · En ejecución</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-line">
                <div className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2">
                  Plantillas Rápidas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-panel-2 text-[10px] font-mono text-text-2 border border-line">
                    video-vertical
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-panel-2 text-[10px] font-mono text-text-2 border border-line">
                    articulo-blog
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-panel-2 text-[10px] font-mono text-text-2 border border-line">
                    publicar-redes
                  </span>
                </div>
              </div>
            </div>

            {/* Workspace View */}
            <div className="md:col-span-9 p-5 sm:p-7 flex flex-col justify-between bg-bg">
              {/* Active Tab: Video Vertical */}
              {activeTab === 'video' && (
                <div className="space-y-6">
                  {/* Top Bar de Fases */}
                  <div className="flex items-center justify-between pb-4 border-b border-line">
                    <div>
                      <span className="text-xs font-mono text-accent uppercase font-bold tracking-wider">
                        Plantilla: Video Vertical (9:16)
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-text font-heading mt-0.5">
                        Misterios del Cosmos en 60 segundos
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-ok/10 border border-ok/30 text-ok text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 4 de 4 Pasos completados
                    </span>
                  </div>

                  {/* Fases Timeline */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
                    <div className="p-2.5 rounded-xl bg-panel-2 border border-ok/40 flex items-center gap-2 text-text">
                      <CheckCircle2 className="w-4 h-4 text-ok flex-none" />
                      <span className="truncate">1. Idea y datos</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-panel-2 border border-ok/40 flex items-center gap-2 text-text">
                      <CheckCircle2 className="w-4 h-4 text-ok flex-none" />
                      <span className="truncate">2. Guion llamativo</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-panel-2 border border-ok/40 flex items-center gap-2 text-text">
                      <CheckCircle2 className="w-4 h-4 text-ok flex-none" />
                      <span className="truncate">3. Grabación de voz</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-panel-2 border border-accent flex items-center gap-2 text-accent font-semibold">
                      <Flame className="w-4 h-4 text-accent flex-none" />
                      <span className="truncate">4. Video final MP4</span>
                    </div>
                  </div>

                  {/* Video Preview Center */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center pt-2">
                    <div className="sm:col-span-5 flex justify-center">
                      <div className="relative w-44 h-72 rounded-2xl overflow-hidden border border-line-strong shadow-2xl bg-panel flex items-center justify-center group">
                        <div className="text-center p-4">
                          <div className="w-12 h-12 rounded-full bg-accent text-on-solid flex items-center justify-center mx-auto shadow-glow">
                            <Play className="w-5 h-5 fill-current translate-x-0.5" />
                          </div>
                          <p className="text-xs font-bold text-text mt-3">video-final.mp4</p>
                          <p className="text-[10px] text-muted">1080x1920 (TikTok / Reels)</p>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-7 space-y-3 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-panel border border-line">
                        <span className="text-accent font-semibold">Tema elegido:</span>
                        <p className="text-text-2 mt-1 font-sans text-xs">
                          «¿Qué pasaría si la Tierra fuera absorbida por un agujero negro supermasivo?»
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-panel border border-line">
                        <span className="text-accent font-semibold">Archivos listos en tu carpeta:</span>
                        <ul className="mt-1 space-y-1 text-muted text-[11px]">
                          <li>✓ <span className="text-text-2">tema.md</span> (Texto investigado)</li>
                          <li>✓ <span className="text-text-2">guion.json</span> (Párrafos y tiempos)</li>
                          <li>✓ <span className="text-text-2">audio.mp3</span> (Voz en off natural)</li>
                          <li>✓ <span className="text-text-2">portada.png</span> (Imagen inicial con título)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Tab: Artículo Blog */}
              {activeTab === 'articulo' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-line">
                    <div>
                      <span className="text-xs font-mono text-accent uppercase font-bold tracking-wider">
                        Plantilla: Artículo para Blog
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-text font-heading mt-0.5">
                        El impacto de la Inteligencia Artificial en el trabajo diario
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-ok/10 border border-ok/30 text-ok text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Redactado y Maquetado
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-panel border border-line space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted border-b border-line pb-2.5">
                      <span className="flex items-center gap-1.5 font-mono text-accent">
                        <Globe className="w-3.5 h-3.5" /> vista-previa.html
                      </span>
                      <span className="text-[11px] text-muted">
                        Listo para copiar o subir a tu web
                      </span>
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

              {/* Active Tab: Código */}
              {activeTab === 'codigo' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div>
                      <span className="text-xs font-mono text-accent uppercase font-bold tracking-wider">
                        Para programadores y curiosos
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-text font-heading mt-0.5">
                        Ejecución de scripts y tareas en tu equipo
                      </h3>
                    </div>
                    <span className="flex items-center gap-1.5 font-mono text-xs text-accent bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/30">
                      <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                      Trabajando
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#06090e] border border-line font-mono text-xs text-text-2 space-y-2 leading-relaxed">
                    <div className="text-muted flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-accent" />
                      <span>terminal — ejecutando en tu computadora</span>
                    </div>
                    <div className="pt-2 text-ok">✔ Archivos creados correctamente</div>
                    <div className="text-ok">✔ Formato comprobado sin errores</div>
                    <div className="text-text-2 pl-4 border-l-2 border-line">
                      ℹ Guardando archivo final en tu disco duro...<br />
                      ℹ Todo listo en la carpeta del proyecto.
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Card Actions Status */}
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
