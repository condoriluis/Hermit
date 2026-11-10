import { useEffect, useState, type RefObject } from 'react'
import { useFlow } from './Flow'
import { Icono } from './Iconos'
import { ActualizarHermit, AvisoAgentes } from './Actualizar'
import { navegacion, useNavegacion } from './navegacion'
import './Marco.css'

/** En Mac la barra de título nativa solo esconde el texto: quedan los semáforos, que tapan la esquina. */
const ES_MAC = /Mac/.test(navigator.platform) || /Mac OS X/.test(navigator.userAgent)

/**
 * La cabecera fija (40px): a la izquierda la marca, plegar la barra y atrás/adelante; en el centro, Buscar (Ctrl+K);
 * a la derecha, la actualización de los agentes, los créditos de Flow, Opciones, la cuenta y —solo en Windows y
 * Linux, donde la barra de título está oculta— los controles de ventana. En la app también se puede arrastrar.
 */
export function Cabecera({
  plegada,
  plegar,
  onNuevo,
  enOpciones,
  onOpciones,
  avisosComunidad = 0,
  busca,
  setBusca,
  campoBusca
}: {
  plegada: boolean
  plegar(p: boolean): void
  onNuevo(): void
  enOpciones: boolean
  onOpciones(): void
  /** Los avisos de la comunidad sin leer: van de cuenta en el botón. */
  avisosComunidad?: number
  busca: string
  setBusca(s: string): void
  campoBusca: RefObject<HTMLInputElement | null>
}) {
  const nav = useNavegacion()
  return (
    <header className={`topbar${ES_MAC ? ' maca' : ''}`}>
      <div className="topbar-izq">
        <button className="topbar-brand" onClick={onNuevo} title="Hermit · nuevo chat" aria-label="Hermit, nuevo chat">
          <img src="/icon.svg" alt="" />
          <span>Hermit</span>
        </button>
        <button
          className="topbar-btn"
          title={plegada ? 'Desplegar la barra (Ctrl+B)' : 'Plegar la barra (Ctrl+B)'}
          aria-label={plegada ? 'Desplegar la barra lateral' : 'Plegar la barra lateral'}
          aria-expanded={!plegada}
          onClick={() => plegar(!plegada)}
        >
          <Icono de="panel" />
        </button>
        <button className="topbar-btn" title="Atrás" aria-label="Atrás" disabled={!nav[0]} onClick={navegacion.atras}>
          <Icono de="navAtras" />
        </button>
        <button className="topbar-btn" title="Adelante" aria-label="Adelante" disabled={!nav[1]} onClick={navegacion.adelante}>
          <Icono de="navAdelante" />
        </button>
      </div>
      <label className="topbar-buscar" title="Buscar (Ctrl K)">
        <Icono de="buscar" />
        <input
          ref={campoBusca}
          placeholder="Buscar"
          aria-label="Buscar hilos"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (setBusca(''), e.currentTarget.blur())}
        />
        {busca ? (
          <button className="buscar-x" title="Borrar la búsqueda" aria-label="Borrar la búsqueda" onClick={() => setBusca('')}>
            ✕
          </button>
        ) : (
          <kbd>Ctrl K</kbd>
        )}
      </label>
      <div className="topbar-der">
        <ActualizarHermit />
        <AvisoAgentes />
        <CreditosFlow />
        <button className={`topbar-btn${enOpciones ? ' on' : ''}`} title="Opciones" aria-label="Opciones" aria-current={enOpciones || undefined} onClick={onOpciones}>
          <Icono de="ajustes" />
        </button>
        <button
          className="topbar-btn"
          title={avisosComunidad ? `Comunidad · ${avisosComunidad} ${avisosComunidad === 1 ? 'aviso' : 'avisos'} sin leer` : 'Comunidad'}
          aria-label="Comunidad"
          onClick={() => (location.hash = '#/comunidad')}
        >
          <Icono de="personas" />
          {avisosComunidad > 0 && <span className="topbar-cuenta">{avisosComunidad > 99 ? '99+' : avisosComunidad}</span>}
        </button>
        {!ES_MAC && <VentanaControles />}
      </div>
    </header>
  )
}

/** Minimizar, maximizar/restaurar y cerrar: la ventana de Hermit (`window.hermit.ventana`). En un navegador no están. */
function VentanaControles() {
  const v = window.hermit?.ventana
  const [max, setMax] = useState(false)
  useEffect(() => {
    if (!v) return
    void v.estado().then(setMax, () => {})
    return v.oirEstado(setMax)
  }, [v])
  if (!v) return null
  return (
    <div className="ventana-ctrls">
      <button title="Minimizar" aria-label="Minimizar" onClick={v.minimizar}>
        <Icono de="minimizar" />
      </button>
      <button title={max ? 'Restaurar' : 'Maximizar'} aria-label={max ? 'Restaurar' : 'Maximizar'} onClick={v.alternar}>
        <Icono de={max ? 'restaurar' : 'maximizar'} />
      </button>
      <button className="ventana-cerrar" title="Cerrar" aria-label="Cerrar" onClick={v.cerrar}>
        <Icono de="cerrar" />
      </button>
    </div>
  )
}

/** Cuánto rinde el saldo de Google Flow en videos (10 créditos por clip de 8 s en Veo Lite). */
function rindeVideo(creditos: number): { largo: string; corto: string } {
  if (creditos <= 0) return { largo: 'sin saldo para video', corto: '0 s de video' }
  const clips = Math.floor(creditos / 10)
  if (clips === 0) return { largo: 'menos de 1 clip (Veo Lite usa 10)', corto: '<8 s de video' }
  const seg = clips * 8
  const tiempo = seg >= 60 ? `~${Math.floor(seg / 60)} min${seg % 60 ? ` ${seg % 60} s` : ''}` : `~${seg} s`
  return {
    largo: `${tiempo} de video (~${clips} ${clips === 1 ? 'clip' : 'clips'} de 8 s)`,
    corto: `${tiempo} de video`
  }
}

/** Los créditos de Google Flow que quedan, con su punto de color. Antes iba en la píldora de Opciones del pie. */
function CreditosFlow() {
  const { estado: flow } = useFlow()
  const nCuentas = flow?.cuentas?.length ?? 0
  if (!nCuentas) return null
  const quedan = flow?.quedan ?? 0
  const punto = quedan > 20 ? 'ok' : quedan > 0 ? 'aviso' : 'vacio'
  const rinde = rindeVideo(quedan)
  return (
    <span
      className="creditos-pill"
      data-tooltip={`${quedan} créditos en ${nCuentas} ${nCuentas === 1 ? 'cuenta' : 'cuentas'} de Google Flow · Rinde aprox. ${rinde.largo} con Veo Lite. Las imágenes con Nano Banana son gratis.`}
    >
      <span className={`flow-dot ${punto}`} />
      {quedan} créditos
    </span>
  )
}
