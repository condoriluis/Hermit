import { useEffect, useRef, useState } from 'react'
import { COSTO_VIDEO, IMAGEN_CHATGPT, MODELOS_IMAGEN, PERMISO_CREDITOS } from '../../shared/flow'
import type { CuentaClaude, CuentaEnFlow, EstadoFlow, GastoFlow } from '../../shared/types'
import { api } from './api'
import { Picker } from './Composer'
import { Confirm } from './Confirm'
import { Logo } from './Logos'
import { toast } from './Toast'
import type { UsoVoz } from './Voz'

/**
 * Google Flow en la interfaz (`server/flow/`). En Opciones: usa la cuenta de la voz y las que agregues, y la primera vez
 * con cada una hay que abrir Flow y aceptar su aviso, que es de cada quien. «Ayudar a mejorar Flow» sale apagado: cada quien decide si Google usa lo que
 * genera. Quien manda referencias confirma que tiene sus derechos (`AvisoDerechos`). En el compositor de un video, el menú
 * «Imágenes»: con ChatGPT o con un modelo de Flow (`lineaImagenes`, `shared/flow.ts`).
 */

const POLITICA = 'https://policies.google.com/terms/generative-ai/use-policy'

/** Lo que el usuario confirma, en sus palabras: es lo mismo que Flow pide aceptar al subir una imagen. */
function AvisoDerechos({ onHecho, onCerrar }: { onHecho(e: EstadoFlow): void; onCerrar(): void }) {
  return (
    <Confirm title="Derechos de tus imágenes" action="Confirmo" onConfirm={() => api<EstadoFlow>('/api/flow/ajustes', { derechos: true }).then(onHecho)} onClose={onCerrar}>
      Para que el personaje y el estilo salgan iguales, Hermit sube a Google Flow tus imágenes de referencia, y al subirlas acepta en tu nombre lo que Flow pide. Confirma que:
      <ul>
        <li>Tienes los derechos necesarios de las imágenes que mandas, incluido el contenido de menores.</li>
        <li>No generas contenido que infrinja los derechos de otras personas, ni que engañe, hostigue o dañe.</li>
        <li>
          Cumples la{' '}
          <a href={POLITICA} target="_blank" rel="noreferrer">
            Política de Uso Prohibido de Google
          </a>
          .
        </li>
      </ul>
    </Confirm>
  )
}

/** Un video que gasta créditos espera aquí a que el usuario lo autorice; sin eso, no se genera nada. */
export function AvisoFlow() {
  const { estado, recibir } = useFlow()
  const [todos, setTodos] = useState(false)
  const aprobado = useRef(false)
  const p = estado?.pendientes?.[0]
  useEffect(() => {
    setTodos(false)
  }, [p?.id])
  if (!p) return null
  const costo = COSTO_VIDEO[p.modelo]
  return (
    <Confirm
      title="Google Flow pide permiso"
      action={todos && p.hilo ? 'Permitir los clips' : 'Generar el clip'}
      onConfirm={async () => {
        aprobado.current = true
        try {
          const e = await api<EstadoFlow>(`/api/flow/permisos/${p.id}`, { permitir: true, todos: todos && !!p.hilo })
          recibir(Promise.resolve(e))
        } catch (e) {
          aprobado.current = false
          throw e
        }
      }}
      onClose={() => {
        if (!aprobado.current) void api<EstadoFlow>(`/api/flow/permisos/${p.id}`, { permitir: false }).then((e) => recibir(Promise.resolve(e)), () => {})
        aprobado.current = false
      }}
    >
      Un video quiere generar un clip de 8 s con <b>{p.modelo}</b>. Cuesta {costo ? `${costo} créditos` : 'créditos'} y se descuentan de tus cuentas de Google Flow. No se genera nada hasta que lo autorices.
      {p.hilo && (
        <label className="con-interruptor">
          <input type="checkbox" checked={todos} onChange={(e) => setTodos(e.target.checked)} />
          Permitir los clips de este video por 30 min (hasta {PERMISO_CREDITOS} créditos)
        </label>
      )}
    </Confirm>
  )
}

/** El estado de Flow que comparten el compositor y Opciones. Mientras entras con otra cuenta o genera, se va leyendo. */
export function useFlow() {
  const [estado, setEstado] = useState<EstadoFlow>()
  const [error, setError] = useState<string>()
  const recibir = (p: Promise<EstadoFlow>) => p.then((n) => (setEstado(n), setError(undefined)), (x: Error) => setError(x.message))
  useEffect(() => void recibir(api('/api/flow')), [])
  const cada = estado?.pendientes?.length ? 2000 : estado?.agregando ? 2000 : estado?.leyendo ? 3000 : estado?.enFila ? 5000 : 10000
  useEffect(() => {
    const t = setInterval(() => void recibir(api('/api/flow')), cada)
    const onFocus = () => void recibir(api('/api/flow'))
    window.addEventListener('focus', onFocus)
    window.addEventListener('hermit-etapas', onFocus)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('hermit-etapas', onFocus)
    }
  }, [cada])
  return { estado, error, recibir, poner: setEstado }
}

export type UsoFlow = ReturnType<typeof useFlow>

const POR_QUE: Record<NonNullable<CuentaEnFlow['descansa']>['motivo'], string> = { creditos: 'Sin créditos de video', frenada: 'Flow la frenó', sesion: 'Sin sesión' }
const hora = (ms: number) => new Date(ms).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

const videos = (g: GastoFlow) => `${g.videos} ${g.videos === 1 ? 'video' : 'videos'} (${g.creditos} créditos)`

/** Lo que le queda a una cuenta, de lo último que se leyó en su Flow. */
function cuantoLeQueda(c: CuentaEnFlow): string {
  const s = c.saldo
  if (!s) return 'créditos sin leer'
  if (s.renueva && s.renueva <= Date.now()) return `créditos renovados a las ${hora(s.renueva)}`
  return `${s.creditos} créditos${s.renueva ? ` · se renuevan a las ${hora(s.renueva)}` : ''}`
}

/** Cómo está una cuenta, y la clase de su punto (`.estado`). */
function comoEsta(c: CuentaEnFlow): [string, string] {
  const hoy = c.hoy.videos ? ` · hoy ${c.hoy.videos} ${c.hoy.videos === 1 ? 'video' : 'videos'}` : ''
  const extra = ` · ${cuantoLeQueda(c)}${hoy}`
  if (c.generando) return [`Generando${extra}`, 'moviendo']
  if (c.descansa) return [`${POR_QUE[c.descansa.motivo]} · vuelve a probar a las ${hora(c.descansa.hasta)}${hoy}`, 'falta']
  return [`${c.deLaVoz ? 'Lista · la de la voz' : 'Lista'}${extra}`, '']
}

/** La cuenta de ChatGPT de hace poco: mirarla lanza Codex, y el compositor se abre a cada rato. */
let chatgpt: { cuando: number; lectura: Promise<boolean> } | undefined

/** Si hay una cuenta de ChatGPT conectada, de donde sale `codex exec`. */
export function useChatGPT(): boolean {
  const [hay, setHay] = useState(false)
  useEffect(() => {
    if (!chatgpt || Date.now() - chatgpt.cuando > 60_000) chatgpt = { cuando: Date.now(), lectura: api<CuentaClaude>('/api/codex/cuenta').then((c) => c.conectada, () => false) }
    let vivo = true
    void chatgpt.lectura.then((si) => vivo && setHay(si))
    return () => void (vivo = false)
  }, [])
  return hay
}

/** La opción del menú que conecta la cuenta de Google, que no es ningún modelo. */
const CONECTAR = ' conectar'

/** El menú «Imágenes» del compositor de un video. `valor`: lo que se usará (`imagenPosible`); vacío, no hay con qué. */
export function SelectorImagenes({ valor, hayChatGPT, voz, flow, onCambio }: { valor: string; hayChatGPT: boolean; voz: UsoVoz; flow: UsoFlow; onCambio(imagen: string): void }) {
  // Con un modelo de Flow elegido o puesto solo, sin confirmar los derechos, las referencias no se pueden mandar.
  const [pidiendo, setPidiendo] = useState<string | null>(null)
  const cuenta = voz.estado?.cuenta || flow.estado?.cuentas.length
  const falta = !!valor && valor !== IMAGEN_CHATGPT && flow.estado?.derechos === false
  const label = voz.estado?.conectando ? `Imágenes: entra con Google en ${voz.estado.navegador}…` : valor === IMAGEN_CHATGPT ? 'Imágenes: ChatGPT' : valor ? `Imágenes: ${valor}` : 'Imágenes: sin generar'
  return (
    <>
      <Picker
        label={label}
        value={valor}
        menuWidth={300}
        disabled={!voz.estado || voz.estado.conectando}
        groups={[
          ...(hayChatGPT ? [{ label: 'ChatGPT', options: [{ value: IMAGEN_CHATGPT, label: 'ChatGPT' }] }] : []),
          { label: 'Google Flow · gratis', options: cuenta ? MODELOS_IMAGEN.map((m) => ({ value: m, label: m })) : [{ value: CONECTAR, label: 'Conectar tu cuenta de Google…' }] }
        ]}
        onChange={(v) => {
          if (v === CONECTAR) voz.conectar()
          else if (v !== IMAGEN_CHATGPT && flow.estado?.derechos === false) setPidiendo(v)
          else onCambio(v)
        }}
      />
      {falta && (
        <button className="picker-trigger" title="Para mandar referencias a Google Flow" onClick={() => setPidiendo(valor)}>
          Confirmar derechos
        </button>
      )}
      {pidiendo !== null && (
        <AvisoDerechos
          onHecho={(e) => {
            flow.poner(e)
            onCambio(pidiendo)
          }}
          onCerrar={() => setPidiendo(null)}
        />
      )}
    </>
  )
}

/**
 * Opciones → Google Flow: las cuentas de Google con que genera (la de la voz y las que agregues, para tener más créditos),
 * cada una con cómo está, lo que le queda y su menú; lo gastado en videos hoy y este mes, y los dos ajustes. Al abrirse
 * lee lo que les queda a las que nunca se leyeron; a todas, con «Actualizar créditos» (abre su Flow sin ventana).
 */
const TOPE_INICIAL = 10

export function FlowOpciones() {
  const { estado: e, error, recibir, poner } = useFlow()
  const [pidiendo, setPidiendo] = useState(false)
  const [quitando, setQuitando] = useState<string>()
  const [expandido, setExpandido] = useState(false)
  const n = e?.cuentas.length ?? 0
  const agregar = () => void recibir(api('/api/flow/cuentas/agregar', {}))
  const leer = (faltan: boolean) => void recibir(api('/api/flow/saldos', { faltan }))

  const prevAgregando = useRef(false)
  const prevCuentas = useRef<string[]>([])

  useEffect(() => {
    if (!e) return
    const estabaAgregando = prevAgregando.current
    const agregandoAhora = !!e.agregando

    if (estabaAgregando && !agregandoAhora) {
      if (e.error) {
        toast.error(e.error)
      } else {
        const viejos = prevCuentas.current
        const nueva = e.cuentas.find((c) => !viejos.includes(c.correo))
        if (nueva) {
          toast.success(`Cuenta ${nueva.correo} conectada con éxito a Google Flow`)
        } else if (e.cuentas.length > viejos.length) {
          toast.success('Cuenta de Google conectada con éxito a Google Flow')
        }
      }
    }

    prevAgregando.current = agregandoAhora
    prevCuentas.current = e.cuentas.map((c) => c.correo)
  }, [e])

  // Al abrirse, en cuanto se sabe cuáles faltan: las que se agreguen después se leen solas en el servidor.
  const cargado = !!e
  useEffect(() => {
    if (e?.cuentas.some((c) => !c.saldo)) leer(true)
  }, [cargado])
  return (
    <div className="item">
      <div className="fila">
        <Logo de="gemini" />
        <div className="fila-nombre">
          <strong>Google Flow</strong>
          <span>
            {n
              ? `Veo y Nano Banana con ${n === 1 ? 'una cuenta' : `${n} cuentas`} · quedan ${e?.quedan ?? 0} créditos${e?.enFila ? ` · generando ${e.enFila}` : ''}`
              : 'Conecta arriba la cuenta de la voz o agrega aquí una cuenta de Google.'}
          </span>
        </div>
        {e?.agregando ? (
          <span className="estado moviendo">Entra con Google en la ventana de {e.navegador}…</span>
        ) : (
          e && (
            <button className={n ? 'boton' : 'primary'} onClick={agregar}>
              Agregar cuenta
            </button>
          )
        )}
      </div>
      {e?.agregando && (
        <p className="muted small fila-extra">
          Al llegar a Flow, acepta su aviso si te lo enseña y cierra la ventana: la cuenta queda en Hermit. Cada cuenta gratis da 50 créditos al día; cuando una se queda sin ellos, Hermit sigue con otra.
        </p>
      )}
      {n > 0 && e && (
        <div className="fila-extra">
          <div className="opcion-fila">
            <span className="muted small una-linea">
              Hoy: {videos(e.uso.hoy)} · este mes: {videos(e.uso.mes)}
            </span>
            {e.leyendo ? (
              <span className="estado moviendo small">Leyendo créditos…</span>
            ) : (
              <button className="link small" title="Abre el Flow de cada cuenta, sin ventana, y lee cuánto le queda. No gasta." onClick={() => leer(false)}>
                Actualizar créditos
              </button>
            )}
          </div>
          {(expandido || n <= TOPE_INICIAL ? e.cuentas : e.cuentas.slice(0, TOPE_INICIAL)).map((c) => {
            const [texto, clase] = comoEsta(c)
            return (
              <div className="opcion-fila" key={c.correo}>
                <Picker
                  className="acciones"
                  label={<span className={`estado ${clase}`}>{c.correo}</span>}
                  value=""
                  groups={[
                    {
                      label: 'Cuenta',
                      options: [{ value: 'abrir', label: 'Abrir Flow' }, ...(c.deLaVoz ? [] : [{ value: 'conectar', label: 'Volver a conectar' }, { value: 'quitar', label: 'Quitar de Hermit' }])]
                    }
                  ]}
                  onChange={(q) => (q === 'quitar' ? setQuitando(c.correo) : q === 'conectar' ? agregar() : void recibir(api('/api/flow/abrir', { correo: c.correo })))}
                />
                <span className="muted small una-linea" title={c.saldo ? `${texto}. Leído a las ${hora(c.saldo.leido)}.` : texto}>
                  {texto}
                </span>
              </div>
            )
          })}
          {n > TOPE_INICIAL && (
            <button
              type="button"
              className={`resumen${expandido ? ' on' : ''}`}
              onClick={() => setExpandido(!expandido)}
            >
              {expandido ? `Plegar a los primeros ${TOPE_INICIAL}` : `Ver las otras ${n - TOPE_INICIAL} cuentas`}
            </button>
          )}
        </div>
      )}
      {e && (
        <div className="fila-extra">
          <label className="con-interruptor">
            Ayudar a mejorar Flow
            <button role="switch" aria-checked={e.aportar} className={`interruptor${e.aportar ? ' on' : ''}`} onClick={() => void recibir(api('/api/flow/ajustes', { aportar: !e.aportar }))}>
              <span />
            </button>
          </label>
          <p className="muted small">
            Encendido, Google usa lo que generes para mejorar sus productos y su IA, y sus revisores pueden verlo. Se aplica en tu siguiente pedido. La primera vez, abre Flow y acepta su aviso.
          </p>
          <label className="con-interruptor">
            Tengo los derechos de las imágenes que mando
            <button
              role="switch"
              aria-checked={e.derechos}
              className={`interruptor${e.derechos ? ' on' : ''}`}
              onClick={() => (e.derechos ? void recibir(api('/api/flow/ajustes', { derechos: false })) : setPidiendo(true))}
            >
              <span />
            </button>
          </label>
          <p className="muted small">Sin esto, Flow solo recibe texto: no puede repetir tu personaje ni seguir el estilo de tu video.</p>
        </div>
      )}
      {pidiendo && <AvisoDerechos onHecho={poner} onCerrar={() => setPidiendo(false)} />}
      {quitando && (
        <Confirm
          title="Quitar la cuenta"
          action="Quitar"
          danger
          onConfirm={() =>
            api<EstadoFlow>('/api/flow/cuentas/quitar', { correo: quitando })
              .then((res) => {
                poner(res)
                toast.info(`Cuenta ${quitando} desconectada de Google Flow`)
              })
              .catch((err: Error) => toast.error(err.message))
          }
          onClose={() => setQuitando(undefined)}
        >
          Hermit deja de generar con {quitando} y borra su sesión. Lo que ya generó sigue en su Flow. Para volver a usarla, agrégala otra vez.
        </Confirm>
      )}
      {(error ?? e?.error) && !e?.agregando && <p className="bad small fila-extra">{error ?? e?.error}</p>}
    </div>
  )
}
