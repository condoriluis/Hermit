import React from 'react'
import {
  Video,
  FileText,
  Share2,
  Terminal,
  FolderPlus,
  Cpu,
  CheckCircle2
} from 'lucide-react'

const herramientas = [
  {
    icon: Video,
    tag: 'Videos Cortos',
    title: 'Videos para TikTok, Reels y Shorts',
    desc: 'Crea videos verticales en segundos: la IA redacta un guion que engancha, graba la voz en off natural, agrega subtítulos y exporta el video en formato MP4 listo para publicar.',
    pasos: ['Idea y gancho inicial', 'Guion narrado', 'Voz y música', 'Video final MP4'],
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
    desc: 'Funciona con las mejores inteligencias artificiales del mercado: Claude (Anthropic), ChatGPT (OpenAI), DeepSeek o modelos gratuitos que corren en tu PC.',
    pasos: ['Claude 3.7', 'ChatGPT / OpenAI', 'DeepSeek', 'Modelos en tu PC'],
    badge: 'Sin Ataduras',
  },
]

export default function SkillsShowcase() {
  return (
    <section id="herramientas" className="py-24 relative bg-panel/30 border-y border-line/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {herramientas.map((h, idx) => {
            const Icon = h.icon
            return (
              <div
                key={idx}
                className="rounded-2xl bg-panel border border-line p-6 flex flex-col justify-between hover:border-accent/40 hover:bg-panel-2 transition-all duration-300 shadow-card group"
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
            )
          })}
        </div>
      </div>
    </section>
  )
}
