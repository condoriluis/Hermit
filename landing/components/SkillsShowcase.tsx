import React from 'react'
import {
  Video,
  FileText,
  Share2,
  Terminal,
  FolderPlus,
  Cpu,
  CheckCircle2,
  Image as ImageIcon,
  Presentation
} from 'lucide-react'
import { Animar } from './Animar'

const herramientas = [
  {
    icon: Video,
    tag: 'Videos Cortos y Largos',
    title: 'Videos en 13 estilos, verticales u horizontales',
    desc: 'Crea videos para TikTok, Reels, Shorts y YouTube: historias de Reddit, tops, misterios, dramas, comedia, documental y más. La IA redacta el guion, produce las escenas, graba la voz y exporta el MP4 listo para publicar.',
    pasos: ['Idea y guion', 'Voz y escenas', 'Subtítulos y portada', 'Video final MP4'],
    badge: 'Popular',
  },
  {
    icon: FileText,
    tag: 'Textos y Web',
    title: 'Artículos para tu Blog o Sitio Web',
    desc: 'Escribe artículos completos y bien estructurados. Investiga el tema en profundidad, genera una imagen de portada llamativa y te entrega el texto listo para copiar.',
    pasos: ['Investigación del tema', 'Redacción completa', 'Imagen de portada', 'Vista previa lista'],
    badge: 'Para Leer',
  },
  {
    icon: ImageIcon,
    tag: 'Imágenes con IA',
    title: 'Genera imágenes con un clic',
    desc: 'Describe lo que quieres ver y la inteligencia artificial genera la imagen. Queda guardada en tu galería «Mis imágenes», lista para ver o descargar.',
    pasos: ['Describe la imagen', 'Generación con IA', 'Galería «Mis imágenes»', 'Descarga libre'],
    badge: 'Creativo',
  },
  {
    icon: Presentation,
    tag: 'Para Trabajo y Clases',
    title: 'Presentaciones en PowerPoint y PDF',
    desc: 'Dale un tema y la IA arma la presentación completa —portada, secciones y contenido— y te la entrega lista para abrir en PowerPoint o PDF.',
    pasos: ['Tema y enfoque', 'Diapositivas redactadas', 'Diseño y portada', 'PPTX y PDF listos'],
    badge: 'Trabajo',
  },
  {
    icon: Share2,
    tag: 'Ahorra Tiempo',
    title: 'Publicación Automática en Redes',
    desc: 'Deja tus videos preparados en tu computadora para que se publiquen automáticamente en TikTok, Instagram y YouTube en los horarios que tú elijas sin tocar el teléfono.',
    pasos: ['Lista de videos', 'Horas de publicación', 'Envío automático', 'Historial guardado'],
    badge: 'Práctico',
  },
  {
    icon: Terminal,
    tag: 'Para Programadores',
    title: 'Asistente de Código y Terminal',
    desc: 'Si programas o necesitas scripts, el asistente puede crear archivos, corregir errores, ejecutar pruebas y ayudarte a programar directamente en tu equipo.',
    pasos: ['Revisión de código', 'Creación de archivos', 'Pruebas en vivo', 'Listo para usar'],
    badge: 'Desarrollo',
  },
  {
    icon: FolderPlus,
    tag: 'A tu Medida',
    title: 'Crea Nuevas Tarjetas de Trabajo',
    desc: 'Puedes añadir tus propias herramientas personalizadas creando una carpeta con tus instrucciones. Hermit la convertirá en una tarjeta visual en la aplicación.',
    pasos: ['Carpeta con tu idea', 'Instrucciones en texto', 'Tarjeta en pantalla', 'Uso repetible'],
    badge: 'Flexible',
  },
  {
    icon: Cpu,
    tag: 'Tú Eliges',
    title: 'Compatible con tu IA Favorita',
    desc: 'Funciona con el agente de IA que ya tengas o prefieras: Claude, ChatGPT (Codex), Gemini, Devin, Grok, Cursor, Muse, Pi, DeepSeek, OpenCode y Antigravity, con tu propia cuenta.',
    pasos: ['Claude', 'ChatGPT / Codex', 'Gemini', 'Devin y más'],
    badge: 'Sin Ataduras',
  },
]

export default function SkillsShowcase() {
  return (
    <section id="herramientas" className="py-24 relative bg-panel/30 border-y border-line/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Animar className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase font-mono tracking-widest text-accent font-bold">
            Lo que puedes hacer
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-text font-heading tracking-tight mt-2">
            Herramientas listas para crear con un clic
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            No necesitas ser un experto ni aprender comandos complicados. Eliges la tarjeta de lo que
            quieres hacer y la inteligencia artificial hace el trabajo a la vista.
          </p>
        </Animar>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {herramientas.map((h, idx) => {
            const Icon = h.icon
            return (
              <Animar key={idx} delay={(idx % 4) * 80}>
              <div
                key={idx}
                className="h-full rounded-2xl bg-panel border border-line p-6 flex flex-col justify-between hover:border-accent/40 hover:bg-panel-2 transition-all duration-300 shadow-card group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-panel-2 border border-line flex items-center justify-center text-accent group-hover:scale-110 group-hover:border-accent/50 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent uppercase">
                      {h.badge}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-muted uppercase tracking-wider font-semibold">
                    {h.tag}
                  </span>
                  <h3 className="text-lg font-bold text-text font-heading mt-1 group-hover:text-accent transition-colors">
                    {h.title}
                  </h3>
                  <p className="text-sm text-muted mt-2 leading-relaxed">
                    {h.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60">
                  <div className="text-[11px] font-mono text-text-2 mb-2 font-medium">
                    Lo que hace paso a paso:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-muted">
                    {h.pasos.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-none" />
                        <span className="truncate text-[11px] font-mono">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </Animar>
            )
          })}
        </div>
      </div>
    </section>
  )
}
