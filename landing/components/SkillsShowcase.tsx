import React from 'react'
import {
  Video,
  FileText,
  Share2,
  FolderPlus,
  Cpu,
  Image as ImageIcon,
  Presentation,
  Box
} from 'lucide-react'
import { Animar } from './Animar'

const herramientas = [
  {
    icon: Video,
    tag: 'Videos Cortos y Largos',
    title: 'Videos en 13 estilos, verticales u horizontales',
    desc: 'Videos para TikTok, Reels, Shorts y YouTube: la IA investiga, escribe el guion, produce las escenas y exporta el MP4 listo para publicar.',
    pasos: ['Idea y guion', 'Voz y escenas', 'Subtítulos', 'Video final MP4'],
    badge: 'Popular',
  },
  {
    icon: FileText,
    tag: 'Textos y Web',
    title: 'Artículos para tu Blog o Sitio Web',
    desc: 'Escribe artículos completos y bien estructurados. Investiga el tema en profundidad, genera una imagen de portada llamativa y te entrega el texto listo para copiar.',
    pasos: ['Tema investigado', 'Texto completo', 'Portada generada', 'Vista previa'],
    badge: 'Para Leer',
  },
  {
    icon: ImageIcon,
    tag: 'Imágenes con IA',
    title: 'Genera imágenes con un clic',
    desc: 'Describe lo que quieres y la IA genera la imagen. Queda en tu galería «Mis imágenes», lista para ver o descargar.',
    pasos: ['Describe la imagen', 'Generación con IA', 'Tu galería', 'Descarga libre'],
    badge: 'Creativo',
  },
  {
    icon: Presentation,
    tag: 'Para Trabajo y Clases',
    title: 'Presentaciones en PowerPoint y PDF',
    desc: 'Dale un tema y la IA arma la presentación completa —portada, secciones y contenido— y te la entrega lista para abrir en PowerPoint o PDF.',
    pasos: ['Tema y enfoque', 'Diapositivas', 'Diseño y portada', 'PPTX y PDF'],
    badge: 'Trabajo',
  },
  {
    icon: Share2,
    tag: 'Ahorra Tiempo',
    title: 'Publicación Automática en Redes',
    desc: 'Deja tus videos listos para que se publiquen solos en TikTok, Instagram y YouTube en los horarios que tú elijas.',
    pasos: ['Videos en cola', 'Horario elegido', 'Envío automático', 'Historial'],
    badge: 'Práctico',
  },
  {
    icon: Box,
    tag: 'Biblioteca 3D',
    title: 'Modelos 3D con visor',
    desc: 'Cada modelo que creas se guarda en tu biblioteca: lo giras en el visor y lo reusas como protagonista en tus videos.',
    pasos: ['Biblioteca de modelos', 'Visor 3D', 'Reúso en videos', 'Listo para la escena'],
    badge: 'Nuevo',
  },
  {
    icon: FolderPlus,
    tag: 'A tu Medida',
    title: 'Crea tu propio estilo de video',
    desc: 'Le describes el video que quieres —o le pasas ejemplos— y Hermit arma tu estilo con su card, listo para usarlo como los demás.',
    pasos: ['Describe el estilo', 'Hermit lo arma', 'Su card lista', 'Úsalo igual'],
    badge: 'Tuyo',
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
                  <div className="flex flex-wrap gap-1.5">
                    {h.pasos.map((p, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-panel-2 text-[10px] font-mono text-text-2 border border-line"
                      >
                        {p}
                      </span>
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
