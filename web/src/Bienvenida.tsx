import { useEffect, useState, type ReactNode } from 'react'
import { Icono } from './Iconos'
import { Logo } from './Logos'
import { CuentaChatGPT, CuentaClaude, CuentaOpenCode, Requisitos } from './Opciones'
import './Bienvenida.css'

const VISTA = 'bienvenida'
const EVENTO = 'hermit-bienvenida'

/** Todos los agentes, según haya que pagar para usarlos. Los del rango gratis no son gratis: su uso gratis tiene límites. */
const OPCIONES = [
  {
    titulo: 'De paga',
    agentes: [
      ['claude', 'Claude'],
      ['codex', 'ChatGPT'],
      ['deepseek', 'DeepSeek'],
      ['gemini', 'Gemini'],
      ['cursor', 'Cursor'],
      ['muse', 'Muse Code'],
      ['pi', 'Pi']
    ]
  },
  {
    titulo: 'Rango gratis',
    nota: 'Su uso gratis tiene límites, y esos límites varían.',
    agentes: [
      ['opencode', 'OpenCode'],
      ['antigravity', 'Antigravity'],
      ['grok', 'Grok'],
      ['devin', 'Devin']
    ]
  }
]

/** Opciones la vuelve a abrir. */
export const abrirBienvenida = () => dispatchEvent(new Event(EVENTO))
/** Si la primera bienvenida aún no se cerró: lo que quiera salir al abrir Hermit (`Novedades.tsx`) espera a que no esté. */
export const bienvenidaPendiente = () => {
  try {
    return !localStorage.getItem(VISTA)
  } catch {
    return false
  }
}

/**
 * La bienvenida: sale la primera vez que se abre Hermit y luego desde Opciones. Dice qué hace, qué hace falta (con lo
 * que falta a la vista, para hacerlo ahí mismo), cómo va un video, cuánto tarda y qué cuesta.
 */
export function Bienvenida({ version = '' }: { version?: string }) {
  const [abierta, setAbierta] = useState(() => !localStorage.getItem(VISTA))
  const [claude, setClaude] = useState<boolean>()
  const [chatgpt, setChatgpt] = useState<boolean>()
  const [opencode, setOpencode] = useState<boolean>()
  const [listo, setListo] = useState<boolean>()
  // En la app instalada en Windows: si Hermit está anclada a la barra de tareas. `null`, aquí no se ofrece.
  const [anclada, setAnclada] = useState<boolean | null>(null)
  const [anclando, setAnclando] = useState(false)
  const [sinPermiso, setSinPermiso] = useState(false)

  useEffect(() => {
    const abrir = () => setAbierta(true)
    addEventListener(EVENTO, abrir)
    return () => removeEventListener(EVENTO, abrir)
  }, [])
  useEffect(() => {
    if (abierta) void window.hermit?.anclada().then(setAnclada, () => {})
  }, [abierta])
  useEffect(() => {
    if (!abierta) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [abierta])

  /** Windows pregunta en su ventana; si no deja pedirlo, se dice cómo hacerlo a mano. */
  async function anclar() {
    setAnclando(true)
    const r = await window.hermit!.anclar().catch(() => 'windows' as const)
    setAnclando(false)
    if (r === 'anclada') setAnclada(true)
    setSinPermiso(r === 'windows')
  }

  function cerrar() {
    localStorage.setItem(VISTA, '1')
    setAbierta(false)
  }

  if (!abierta) return null
  return (
    <div className="modal-backdrop" onClick={cerrar}>
      <div className="modal bienvenida" role="dialog" aria-modal aria-label="Bienvenida" onClick={(e) => e.stopPropagation()}>
        <div className="bien-grid">
          <aside className="bien-marca">
            <img src="/icon.svg" alt="" />
            <h2>Te damos la bienvenida a Hermit</h2>
            <p>Hermit hace videos con agentes de IA: eliges un estilo, le das un tema y lo ves trabajar paso a paso.</p>
            {version && <span className="bien-version">Hermit {version}</span>}
            <div className="bien-puntos">
              <span className="bien-punto">
                <Icono de="play" /> Eliges el estilo y el tema; el agente hace el resto a la vista.
              </span>
              <span className="bien-punto">
                <Icono de="microfono" /> Grabas tu voz una vez y la reutilizas en todos tus videos.
              </span>
              <span className="bien-punto">
                <Icono de="usuario" /> Hermit no te cobra aparte: usa los límites de tu plan.
              </span>
            </div>
          </aside>

          <div className="bien-pasos">
        {/* Con uno basta. Con ChatGPT, además, hace las imágenes de los videos. */}
        <Paso n={1} titulo="Elige con qué trabaja" hecho={claude || chatgpt || opencode}>
          Conecta al menos un agente; Hermit no te cobra aparte. Todos se conectan en Opciones → Agentes.
          {OPCIONES.map(({ titulo, nota, agentes }) => (
            <div className="opcion" key={titulo}>
              <b>{titulo}</b>
              <div>
                <ul>
                  {agentes.map(([id, nombre]) => (
                    <li key={id}>
                      <Logo de={id} nombre={nombre} chico />
                      {nombre}
                    </li>
                  ))}
                </ul>
                {nota && <p>{nota}</p>}
              </div>
            </div>
          ))}
          <CuentaClaude onFalta={(falta) => setClaude(falta === undefined ? undefined : !falta)} />
          <CuentaChatGPT onFalta={(falta) => setChatgpt(falta === undefined ? undefined : !falta)} />
          <CuentaOpenCode aviso onFalta={(falta) => setOpencode(falta === undefined ? undefined : !falta)} />
        </Paso>
        <Paso n={2} titulo="Prepara tu computadora" hecho={listo}>
          Los estilos usan unas herramientas (FFmpeg, Python…). Si falta alguna, descárgala aquí; se hace una sola vez.
          <Requisitos onListo={setListo} />
        </Paso>
        {anclada !== null && (
          <Paso n={3} titulo="Ten Hermit a mano (opcional)" hecho={anclada}>
            {anclada ? 'Hermit está anclada a la barra de tareas.' : 'Ánclala a la barra de tareas para abrirla con un clic.'}
            {!anclada && (
              <div className="anclar">
                <button className="boton" disabled={anclando} onClick={() => void anclar()}>
                  {anclando ? 'Windows te pregunta…' : 'Anclar a la barra de tareas'}
                </button>
                {sinPermiso && (
                  <p className="small">
                    Windows no dejó anclarla desde aquí. Haz clic derecho en el icono de Hermit en la barra de tareas y elige
                    «Anclar a la barra de tareas».
                  </p>
                )}
              </div>
            )}
          </Paso>
        )}
        <Paso n={anclada === null ? 3 : 4} titulo="Haz tu primer video">
          Elige un estilo, escribe el tema o pega un enlace y pulsa <b>↑</b>. Cuando el guion está listo, te pide tu voz: grábala
          con el celular y súbela en «Tu voz». Al acabar, el video queda en «Mis videos».
        </Paso>
        <Paso n={anclada === null ? 4 : 5} titulo="Lo que gasta">
          Cada video usa parte de los límites de tu plan, que ves en Opciones. Las cifras en dólares son lo que costaría pagado
          aparte, no lo que se te cobra. Con una llave de API no hay límites: ahí esas cifras son lo que pagas. Los modelos gratis
          de OpenCode tienen tope, y vuelven solos en unas horas.
        </Paso>
          </div>
        </div>

        <div className="modal-actions">
          <button className="primary" autoFocus onClick={cerrar}>
            Empezar
          </button>
        </div>
      </div>
    </div>
  )
}

/** Un paso, con su número o, si ya está hecho, una palomita. */
function Paso({ n, titulo, hecho, children }: { n: number; titulo: string; hecho?: boolean; children: ReactNode }) {
  return (
    <section className={`paso${hecho ? ' hecho' : ''}`}>
      <span className="paso-n">{hecho ? <Icono de="palomita" /> : n}</span>
      <div className="paso-cuerpo">
        <strong>{titulo}</strong>
        <div className="paso-texto">{children}</div>
      </div>
    </section>
  )
}
