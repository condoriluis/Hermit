import { useEffect, useRef, useState } from 'react'
import type { Card, EstadoVoz, ProveedorVoz, VozApi } from '../../shared/types'
import { lineaVoz, MOTORES, motorDe } from '../../shared/voz'
import { api } from './api'
import { Picker } from './Composer'
import { ElegirVoz, itemsDeVoz, type Musica } from './ElegirVoz'
import { Logo } from './Logos'

/**
 * La voz en la interfaz (`server/voz/`): conectar la cuenta de Google para AI Studio y poner las llaves de Fish Audio y
 * ElevenLabs (Opciones → Voz) y, en el compositor de un video, elegir entre mandar tu voz o que el agente la genere con
 * una de ellas. Lo elegido va en la línea `Voz:` del primer mensaje (`lineaVoz`, `shared/voz.ts`).
 */

/** El estado de la voz. Mientras esperas en Edge (o Chrome), se vuelve a preguntar cada 2 s. */
export function useVoz() {
  const [estado, setEstado] = useState<EstadoVoz>()
  const [error, setError] = useState<string>()
  const recibir = (p: Promise<EstadoVoz>) => p.then((e) => (setEstado(e), setError(undefined)), (e: Error) => setError(e.message))
  useEffect(() => void recibir(api('/api/voz')), [])
  useEffect(() => {
    if (!estado?.conectando) return
    const t = setInterval(() => void recibir(api('/api/voz')), 2000)
    return () => clearInterval(t)
  }, [estado?.conectando])
  /** Lo de Fish Audio y ElevenLabs: devuelve la promesa y falla si falla, para que su fila diga por qué. */
  const aProveedor = (p: Promise<EstadoVoz>) => p.then((e) => void setEstado(e))
  return {
    estado,
    error: error ?? estado?.error,
    conectar: () => void recibir(api('/api/voz/conectar', {})),
    // Devuelve la promesa, y falla si falla, para el aviso de Google Flow; el error queda también aquí.
    desconectar: () =>
      api<EstadoVoz>('/api/voz/desconectar', {}).then(
        (e) => void (setEstado(e), setError(undefined)),
        (x: Error) => {
          setError(x.message)
          throw x
        }
      ),
    llave: (p: ProveedorVoz, llave: string | null) => aProveedor(api(`/api/voz/${p}/llave`, { llave })),
    releer: (p: ProveedorVoz) => aProveedor(api(`/api/voz/${p}/voces`, {})),
    /** Clona tu voz y devuelve el estado nuevo, con ella entre las tuyas. */
    clonar: async (p: ProveedorVoz, nombre: string, audio: File): Promise<EstadoVoz> => {
      const q = new URLSearchParams({ nombre, archivo: audio.name })
      const r = await fetch(`/api/voz/${p}/clonar?${q}`, { method: 'POST', headers: { 'content-type': audio.type || 'audio/wav' }, body: audio })
      const datos = await r.json().catch(() => ({ error: `El servidor respondió ${r.status}` }))
      if (!r.ok) throw new Error(datos.error ?? `El servidor respondió ${r.status}`)
      setEstado(datos)
      return datos
    },
    /** Una voz hallada buscando en la biblioteca de Fish Audio: queda en el menú con su nombre. */
    elegirDeBiblioteca: (p: ProveedorVoz, v: VozApi) => aProveedor(api(`/api/voz/${p}/elegir`, { voz: v })),
    /** Quita una voz tuya guardada en esta computadora (`tuya-…`), con su grabación. */
    quitarTuya: (p: ProveedorVoz, id: string) => aProveedor(api(`/api/voz/${p}/quitar`, { id }))
  }
}

export type UsoVoz = ReturnType<typeof useVoz>

const PROVEEDORES: ProveedorVoz[] = ['fish', 'elevenlabs']

/**
 * ¿Se puede generar con esta voz? La de AI Studio, con la cuenta de Google; la de Fish Audio o ElevenLabs, con su llave.
 */
export function vozPosible(e: EstadoVoz | undefined, voz: string): boolean {
  if (!voz || !e) return false
  const { motor } = motorDe(voz)
  return motor === 'ai-studio' ? !!e.cuenta : !!e.motores?.[motor]?.llave
}

/** El nombre con que se ve una voz: el de AI Studio tal cual; el de los demás, el de su biblioteca (o el que elegiste). */
export function nombreDeVoz(e: EstadoVoz | undefined, voz: string): string {
  const { motor, id } = motorDe(voz)
  if (motor === 'ai-studio') return voz
  return e?.motores?.[motor]?.voces.find((v) => v.id === id)?.nombre ?? id
}

/** «Fola · AI Studio», «Mi voz · Fish Audio». */
const etiqueta = (e: EstadoVoz | undefined, voz: string) => {
  const { motor } = motorDe(voz)
  return `${nombreDeVoz(e, voz)} · ${motor === 'ai-studio' ? 'AI Studio' : MOTORES[motor]}`
}

/**
 * El menú «Voz» del compositor de un video: mandarla tú (o la que hace el estilo, `propia`) o una voz de AI Studio,
 * Fish Audio o ElevenLabs. Sin cuenta de Google, ofrece conectarla. `valor`: la voz elegida, vacía si la mandas tú.
 * `musica`: el interruptor de la música de fondo, solo si el estilo la sabe poner (`card.musica`).
 */
export function SelectorVoz({ card, voz, valor, musica, onCambio }: { card: Card; voz: UsoVoz; valor: string; musica?: Musica; onCambio(voz: string): void }) {
  if (card.voz === false) return null
  const e = voz.estado
  const propia = card.voz?.propia ?? 'La mando yo'
  const posible = vozPosible(e, valor)
  const label = e?.conectando ? `Voz: entra con Google en ${e.navegador}…` : voz.error ? `Voz: ${voz.error}` : posible ? `Voz: ${etiqueta(e, valor)}` : `Voz: ${propia.toLowerCase()}`
  const conMusica = card.musica ? musica : undefined
  return <ElegirVoz voz={voz} etiqueta={conMusica?.encendida ? `${label} · con música` : label} valor={posible ? valor : ''} propia={propia} deshabilitado={!e || e.conectando} musica={conMusica} onCambio={onCambio} />
}

/** La última voz que se eligió para generar desde un hilo ya empezado. */
const ULTIMA = 'voz-hilo'

/**
 * En la etapa que espera tu voz (`Etapas.tsx`): en vez de grabarla, que el agente la genere con una voz de AI Studio,
 * Fish Audio o ElevenLabs. Sin ninguna conectada, ofrece conectar Google ahí mismo. `onGenerar` recibe el mensaje para
 * el agente, con la línea `Voz:`.
 */
export function GenerarVoz({ onGenerar }: { onGenerar(texto: string): Promise<void> }) {
  const voz = useVoz()
  const e = voz.estado
  const [elegida, setElegida] = useState(() => localStorage.getItem(ULTIMA) ?? '')
  const [mandando, setMandando] = useState(false)
  if (!e) return null
  const conApi = PROVEEDORES.some((p) => e.motores?.[p]?.llave && e.motores[p].voces.length)
  // La guardada solo vale si se puede usar; si no, la primera que haya.
  const primera = itemsDeVoz(e)[0]?.valor ?? ''
  const valor = vozPosible(e, elegida) ? elegida : primera
  if (!e.cuenta && !conApi)
    return (
      <div className="generar-voz">
        <span>O que la genere el agente con una voz de AI Studio, gratis con tu cuenta de Google (o con Fish Audio o ElevenLabs, en Opciones → Voz).</span>
        <button className="ghost small" disabled={e.conectando} onClick={voz.conectar}>
          {e.conectando ? `Entra con Google en la ventana de ${e.navegador}…` : 'Conectar con Google'}
        </button>
        {voz.error && !e.conectando && <span className="bad small">{voz.error}</span>}
      </div>
    )
  return (
    <div className="generar-voz">
      <span>O que la genere el agente con una de estas voces:</span>
      <ElegirVoz voz={voz} etiqueta={valor ? `Voz: ${etiqueta(e, valor)}` : 'Voz'} valor={valor} onCambio={(x) => (localStorage.setItem(ULTIMA, x), setElegida(x))} />
      <button
        className="primary small"
        disabled={!valor || mandando}
        onClick={() => {
          setMandando(true)
          void onGenerar(`No la voy a grabar: genérala tú.\n\n${lineaVoz({}, valor, nombreDeVoz(e, valor))}`).finally(() => setMandando(false))
        }}
      >
        {mandando ? 'Pidiéndola…' : 'Generar la voz'}
      </button>
    </div>
  )
}

/**
 * Opciones → Voz: la cuenta de Google con que Hermit genera las voces en AI Studio y las llaves de Fish Audio y
 * ElevenLabs. `voz` es el de Opciones, que comparte con Google Flow.
 */
export function VozOpciones({ voz }: { voz: UsoVoz }) {
  const e = voz.estado
  return (
    <>
      <div className="item">
        <div className="fila">
          <Logo de="gemini" />
          <div className="fila-nombre">
            <strong>Google AI Studio</strong>
            <span>
              {e?.cuenta
                ? `Gemini 3.8 Flash TTS · ${e.voces.length} voces en el menú Voz${e.enFila ? ` · generando ${e.enFila}` : ''}`
                : `Genera la voz de tus videos con Gemini 3.8 Flash TTS, gratis, con tu cuenta de Google. Entras una vez, en ${e?.navegador ?? 'Edge'}.`}
            </span>
          </div>
          {e?.conectando ? (
            <span className="estado moviendo">Entra con Google en la ventana de {e.navegador}…</span>
          ) : e?.cuenta ? (
            <Picker
              className="acciones"
              label={<span className="estado">{e.cuenta}</span>}
              value=""
              groups={[{ label: 'Cuenta', options: [{ value: 'conectar', label: 'Volver a conectar' }, { value: 'desconectar', label: 'Desconectar' }] }]}
              onChange={(q) => (q === 'desconectar' ? void voz.desconectar().catch(() => {}) : voz.conectar())}
            />
          ) : (
            e && (
              <button className="primary" onClick={voz.conectar}>
                Conectar con Google
              </button>
            )
          )}
        </div>
        {e?.conectando && <p className="muted small fila-extra">Google no deja entrar desde una app. Al entrar en {e.navegador} (la primera vez, AI Studio te pide aceptar sus términos), la ventana se cierra y la sesión pasa sola a Hermit.</p>}
        {voz.error && !e?.conectando && <p className="bad small fila-extra">{voz.error}</p>}
      </div>
      {PROVEEDORES.map((p) => (
        <ProveedorOpciones key={p} p={p} voz={voz} />
      ))}
    </>
  )
}

/** Lo que dice cada proveedor en Opciones: para qué, qué cuesta y dónde se saca la llave. */
const DE: Record<ProveedorVoz, { para: string; llaves: string; ayuda: string }> = {
  fish: {
    para: 'Voces naturales en español y la tuya clonada. Gratis hasta el 30 de noviembre de 2026; después, unos 10 centavos de dólar por 6 minutos de voz.',
    llaves: 'https://fish.audio/app/api-keys/',
    ayuda: 'Crea una cuenta gratis en fish.audio (sin tarjeta) y una llave en «API Keys». Mientras sea gratis, Fish puede usar lo que generes para mejorar su modelo.'
  },
  elevenlabs: {
    para: 'Voces muy expresivas y la tuya clonada (clonar pide su plan de pago). Gasta los créditos de tu plan: el gratis da 10.000 letras al mes.',
    llaves: 'https://elevenlabs.io/app/settings/api-keys',
    ayuda: 'En elevenlabs.io, crea una llave en «API Keys» con permiso para Text to Speech y Voices.'
  }
}

/** Fish Audio o ElevenLabs en Opciones → Voz: poner la llave (se prueba antes de guardarla), clonar tu voz y releer sus voces. */
function ProveedorOpciones({ p, voz }: { p: ProveedorVoz; voz: UsoVoz }) {
  const m = voz.estado?.motores?.[p]
  const de = DE[p]
  const [pegando, setPegando] = useState(false)
  const [llave, setLlave] = useState('')
  const [clonando, setClonando] = useState(false)
  const [nombre, setNombre] = useState('Mi voz')
  const [ocupado, setOcupado] = useState('')
  const [error, setError] = useState('')
  const archivo = useRef<HTMLInputElement>(null)

  const hacer = (que: string, promesa: Promise<unknown>) => {
    setOcupado(que)
    setError('')
    return promesa.then(
      () => true,
      (x: Error) => (setError(x.message), false)
    ).finally(() => setOcupado(''))
  }
  const tuyas = m?.voces.filter((v) => v.propia).length ?? 0
  // Con el plan gratis (ElevenLabs), qué no deja: las de su biblioteca y clonar; y cuántas letras del mes quedan.
  const dePago = m?.voces.filter((v) => v.bloqueo).length ?? 0
  const plan = m?.plan?.gratis
    ? [
        'plan gratis',
        m.plan.letras && `te quedan ${Math.max(0, m.plan.letras.limite - m.plan.letras.usadas).toLocaleString('es-MX')} de ${m.plan.letras.limite.toLocaleString('es-MX')} letras este mes`,
        dePago && `${dePago} piden plan de pago`,
        !m.plan.clonar && 'clonar pide plan de pago'
      ].filter(Boolean)
    : []

  return (
    <div className="item">
      <div className="fila">
        <Logo de={p} nombre={MOTORES[p]} />
        <div className="fila-nombre">
          <strong>{MOTORES[p]}</strong>
          <span>{m?.llave ? `${m.voces.length} voces en el menú Voz${tuyas ? `, ${tuyas === 1 ? 'una tuya' : `${tuyas} tuyas`}` : ''}` : de.para}</span>
          {plan.length > 0 && <span className="falta">{plan.join(' · ')}</span>}
        </div>
        {!voz.estado ? null : m?.llave ? (
          <Picker
            className="acciones"
            label={<span className="estado mono">{ocupado || `…${m.llave}`}</span>}
            value=""
            disabled={!!ocupado}
            groups={[
              {
                label: MOTORES[p],
                options: [
                  { value: 'clonar', label: 'Clonar tu voz…' },
                  { value: 'releer', label: 'Volver a leer sus voces' },
                  { value: 'cambiar', label: 'Cambiar de llave' },
                  { value: 'ver', label: 'Ver tus llaves ↗' },
                  { value: 'quitar', label: 'Quitar' }
                ]
              }
            ]}
            onChange={(q) => {
              if (q === 'clonar') setClonando(true)
              if (q === 'releer') void hacer('Leyendo…', voz.releer(p))
              if (q === 'cambiar') setPegando(true)
              if (q === 'ver') window.open(de.llaves, '_blank', 'noreferrer')
              if (q === 'quitar') void hacer('Quitando…', voz.llave(p, null))
            }}
          />
        ) : (
          !pegando && (
            <button className="primary" onClick={() => setPegando(true)}>
              Añadir llave
            </button>
          )
        )}
      </div>
      {pegando && (
        <form
          className="fila-extra"
          onSubmit={(ev) => {
            ev.preventDefault()
            if (llave.trim()) void hacer('Probando…', voz.llave(p, llave)).then((ok) => ok && (setPegando(false), setLlave('')))
          }}
        >
          <div className="opcion-fila">
            <input type="password" autoFocus placeholder="Pega tu llave" value={llave} onChange={(ev) => setLlave(ev.target.value)} autoComplete="off" />
            <button className="primary" disabled={!!ocupado || !llave.trim()}>
              {ocupado || 'Guardar'}
            </button>
            <button type="button" className="ghost" onClick={() => (setPegando(false), setLlave(''))}>
              Cancelar
            </button>
          </div>
          <p className="muted small">
            {de.ayuda}{' '}
            <a href={de.llaves} target="_blank" rel="noreferrer">
              Sacar la llave ↗
            </a>{' '}
            Se guarda en tu usuario de esta computadora, no en la app.
          </p>
        </form>
      )}
      {clonando && (
        <form
          className="fila-extra"
          onSubmit={(ev) => {
            ev.preventDefault()
            const f = archivo.current?.files?.[0]
            if (f && nombre.trim()) void hacer('Clonando…', voz.clonar(p, nombre.trim(), f)).then((ok) => ok && setClonando(false))
          }}
        >
          <div className="opcion-fila">
            <input placeholder="Cómo se llama" value={nombre} onChange={(ev) => setNombre(ev.target.value)} />
            <input ref={archivo} type="file" accept="audio/*,.m4a,.opus" />
            <button className="primary" disabled={!!ocupado || !nombre.trim()}>
              {ocupado || 'Clonar'}
            </button>
            <button type="button" className="ghost" onClick={() => setClonando(false)}>
              Cancelar
            </button>
          </div>
          <p className="muted small">Una grabación tuya hablando, de 30 s a un minuto, sin música ni ruido de fondo. La voz queda en tu cuenta de {MOTORES[p]}, privada, y sale en el menú Voz.</p>
        </form>
      )}
      {(error || (m?.error && !ocupado)) && <p className="bad small fila-extra">{error || m?.error}</p>}
    </div>
  )
}
