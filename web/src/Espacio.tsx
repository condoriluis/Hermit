import { useEffect, useState } from 'react'
import type { Espacio, EstadoTrabajo, GrupoEspacio, IdEspacio } from '../../shared/types'
import { api } from './api'
import { Icono } from './Iconos'

const gb = (b: number) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b >= 1e6 ? `${Math.round(b / 1e6)} MB` : b > 0 ? '<1 MB' : '0 MB')
/** Lo que no vale un botón: menos de esto no se enseña. */
const MINIMO = 20e6

/**
 * Opciones → Espacio en disco (`server/espacio.ts`): cuánto queda libre y lo que Hermit y sus videos dejaron y ya no
 * hace falta. Lo seguro va junto en «Liberar» (y Hermit lo borra solo cada 6 horas); lo demás, cada uno con su botón.
 */
export function EspacioDisco() {
  const [e, setE] = useState<Espacio>()
  const [error, setError] = useState('')
  const [liberando, setLiberando] = useState<IdEspacio[] | 'seguros' | null>(null)

  const leer = () => api<Espacio>('/api/espacio').then(setE, (x) => setError(x.message))
  useEffect(() => void leer(), [])

  async function liberar(grupos?: IdEspacio[]) {
    setLiberando(grupos ?? 'seguros')
    setError('')
    try {
      setE(await api<Espacio>('/api/espacio', { grupos }))
    } catch (x) {
      setError(x instanceof Error ? x.message : String(x))
    } finally {
      setLiberando(null)
    }
  }

  // Los sueltos se enseñan siempre que haya: aunque pesen poco, cada archivo es una decisión del usuario.
  const visibles = e?.grupos.filter((g) => g.bytes >= MINIMO || (g.id === 'sueltos' && g.cuantos > 0)) ?? []
  const seguros = visibles.filter((g) => g.seguro)
  const totalSeguro = seguros.reduce((n, g) => n + g.bytes, 0)
  const ocupado = liberando !== null

  const [trabajo, setTrabajo] = useState<EstadoTrabajo>()
  const [rutaInput, setRutaInput] = useState('')
  const [editandoTrabajo, setEditandoTrabajo] = useState(false)
  const [guardandoTrabajo, setGuardandoTrabajo] = useState(false)
  const [errorTrabajo, setErrorTrabajo] = useState('')

  const leerTrabajo = () =>
    api<EstadoTrabajo>('/api/trabajo').then((t) => {
      setTrabajo(t)
      setRutaInput(t.porDefecto ? '' : t.ruta)
    })

  useEffect(() => {
    void leerTrabajo()
  }, [])

  async function guardarRutaTrabajo(nuevaRuta: string | null) {
    setGuardandoTrabajo(true)
    setErrorTrabajo('')
    try {
      const resp = await api<EstadoTrabajo>('/api/trabajo', { ruta: nuevaRuta })
      setTrabajo(resp)
      setRutaInput(resp.porDefecto ? '' : resp.ruta)
      setEditandoTrabajo(false)
    } catch (err) {
      setErrorTrabajo(err instanceof Error ? err.message : String(err))
    } finally {
      setGuardandoTrabajo(false)
    }
  }

  return (
    <section className="grupo">
      <div className="grupo-titulo">
        <h2>Espacio en disco</h2>
        {totalSeguro > 0 && (
          <button className="boton" disabled={ocupado} onClick={() => liberar()}>
            {liberando === 'seguros' ? 'Liberando…' : `Liberar ${gb(totalSeguro)}`}
          </button>
        )}
      </div>
      <div className="panel">
        <div className="item">
          <div className="fila">
            <span className="logo" aria-hidden>
              <Icono de="carpeta" />
            </span>
            <div className="fila-nombre">
              <strong>Carpeta de videos y trabajo</strong>
              <span>
                {trabajo ? (trabajo.porDefecto ? `Por defecto: ${trabajo.ruta}` : trabajo.ruta) : 'Cargando carpeta…'}
              </span>
            </div>
            {!editandoTrabajo ? (
              <button className="ghost small" onClick={() => setEditandoTrabajo(true)}>
                Cambiar carpeta
              </button>
            ) : null}
          </div>
          {editandoTrabajo && (
            <form
              className="fila fila-extra"
              style={{ gap: 8 }}
              onSubmit={(ev) => {
                ev.preventDefault()
                void guardarRutaTrabajo(rutaInput.trim() || null)
              }}
            >
              <input
                type="text"
                className="input"
                style={{ flex: 1 }}
                placeholder="Ej. D:\HermitVideos (deja vacío para la carpeta por defecto)"
                value={rutaInput}
                onChange={(ev) => setRutaInput(ev.target.value)}
                disabled={guardandoTrabajo}
              />
              <button type="submit" className="primary small" disabled={guardandoTrabajo}>
                {guardandoTrabajo ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                className="ghost small"
                disabled={guardandoTrabajo}
                onClick={() => {
                  setEditandoTrabajo(false)
                  setRutaInput(trabajo?.porDefecto ? '' : (trabajo?.ruta ?? ''))
                  setErrorTrabajo('')
                }}
              >
                Cancelar
              </button>
            </form>
          )}
          {errorTrabajo && <p className="bad small fila-extra">{errorTrabajo}</p>}
        </div>
        {!e ? (
          <div className="item fila muted small">{error || 'Midiendo lo que se puede borrar…'}</div>
        ) : (
          <>
            <div className="item">
              <div className="fila">
                <span className="logo" aria-hidden>
                  <Icono de="basura" />
                </span>
                <div className="fila-nombre">
                  <strong>
                    {gb(e.libre)} libres de {gb(e.total)}
                    {e.disco ? ` en ${e.disco}` : ''}
                  </strong>
                  <span>
                    {e.liberado ? `Se liberaron ${gb(e.liberado)}. ` : ''}
                    {visibles.length ? 'Nada de esto es tuyo: tus videos terminados, tus grabaciones y tus guiones no se tocan.' : 'No hay nada que sobre.'}
                  </span>
                </div>
              </div>
            </div>
            {visibles.map((g) => (
              <Fila key={g.id} g={g} liberando={ocupado && (liberando === 'seguros' ? g.seguro : liberando.includes(g.id))} disabled={ocupado} onLiberar={() => liberar([g.id])} />
            ))}
          </>
        )}
      </div>
      {e && error && <p className="bad small fila-extra">{error}</p>}
      <p className="grupo-nota">Lo de «Liberar» Hermit también lo borra solo cada 6 horas, cuando nada trabaja. Lo que usa un hilo que está trabajando se queda para la próxima.</p>
    </section>
  )
}

function Fila({ g, liberando, disabled, onLiberar }: { g: GrupoEspacio; liberando: boolean; disabled: boolean; onLiberar(): void }) {
  return (
    <div className="item">
      <div className="fila">
        <div className="fila-nombre">
          <strong>{g.nombre}</strong>
          <span>{g.detalle}</span>
        </div>
        <span className="estado">{gb(g.bytes)}</span>
        <button className={g.seguro ? 'ghost small' : 'primary'} disabled={disabled} onClick={onLiberar}>
          {liberando ? 'Borrando…' : 'Borrar'}
        </button>
      </div>
    </div>
  )
}
