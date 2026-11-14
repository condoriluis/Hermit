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
  Mic,
  RefreshCw
} from 'lucide-react'
import { enlaceDescarga } from '@/lib/descargas'
import { Animar } from './Animar'

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

const AGENTES = ['Claude', 'ChatGPT', 'Gemini', 'Devin', 'Grok', 'Cursor', 'Muse', 'Pi', 'DeepSeek', 'OpenCode', 'Antigravity']

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
    <section id="demostracion" className="py-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Animar className="text-center max-w-3xl mx-auto mb-12">
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
        </Animar>

        {/* Los tres pasos */}
        <div className="grid gap-5 md:grid-cols-3 max-w-6xl mx-auto">
          <Animar delay={0} className="h-full">
          <div className="h-full rounded-2xl border border-line bg-panel/50 p-6 flex flex-col">
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
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted/90 leading-relaxed">
              <RefreshCw className="w-3.5 h-3.5 text-accent flex-none mt-0.5" />
              Gratis para siempre: las versiones nuevas llegan solas.
            </p>
          </div>
          </Animar>

          <Animar delay={120} className="h-full">
          <div className="h-full rounded-2xl border border-line bg-panel/50 p-6 flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-accent">02</span>
              <span className="h-px flex-1 bg-line" />
              <KeyRound className="w-4 h-4 text-accent" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold font-heading text-text">Conecta tu agente de IA</h3>
              <span className="px-2 py-0.5 rounded-md bg-panel-2 border border-line text-[10px] font-mono font-bold text-text-2">
                11 disponibles
              </span>
            </div>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Entras con la cuenta del agente que ya uses —él hace el trabajo pesado con tu
              propia cuenta, sin intermediarios.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {AGENTES.map((a) => (
                <span
                  key={a}
                  className="px-2 py-0.5 rounded-md bg-panel-2 text-[10px] font-mono text-text-2 border border-line"
                >
                  {a}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted/90 leading-relaxed">
              Si ya usas Claude Code o Codex en esta computadora, puede que ya estén conectados.
            </p>
          </div>
          </Animar>

          <Animar delay={240} className="h-full">
          <div className="h-full rounded-2xl border border-line bg-panel/50 p-6 flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-accent">03</span>
              <span className="h-px flex-1 bg-line" />
              <PenLine className="w-4 h-4 text-accent" />
            </div>
            <h3 className="mt-4 text-lg font-bold font-heading text-text">Escribe el tema</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Eliges uno de los 13 estilos de video, un artículo para tu blog, una imagen o una
              presentación, y Hermit hace el trabajo.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['El Diff', 'Explicativo', 'Documental', 'Animalnovela', 'Artículo', 'Imágenes', 'Presentación'].map((e) => (
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
          </Animar>
        </div>

        
      </div>
    </section>
  )
}
