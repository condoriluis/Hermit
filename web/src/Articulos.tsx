import { type InputHTMLAttributes, useEffect, useState } from 'react'
import type { ArticulosConfig } from '../../shared/types'
import { api } from './api'
import { Icono } from './Iconos'
import { Segmento } from './Segmento'

/** El estado que se ve en la fila: el host de la API, o que falta conectarla. */
const host = (url?: string) => {
  try {
    return url ? new URL(url).host : ''
  } catch {
    return url ?? ''
  }
}

/**
 * Opciones → Artículos: la conexión con el blog donde publica la card «Artículos» — su API, su llave y, si la tiene,
 * su Cloudinary para la portada. Se guarda en `data/articulos.json` y la lee `skills/articulo-blog/scripts/publicar.mjs`.
 */
export function ArticulosOpciones() {
  const [config, setConfig] = useState<ArticulosConfig | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [d, setD] = useState({ apiUrl: '', apiKey: '', cloudName: '', cloudKey: '', cloudSecret: '', folder: '', categoryId: '1', status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' })

  useEffect(() => {
    api<ArticulosConfig>('/api/articulos/config').then((c) => {
      setConfig(c)
      setD({
        apiUrl: c.apiUrl ?? '',
        apiKey: c.apiKey ?? '',
        cloudName: c.cloudinary?.cloudName ?? '',
        cloudKey: c.cloudinary?.apiKey ?? '',
        cloudSecret: c.cloudinary?.apiSecret ?? '',
        folder: c.cloudinary?.folder ?? 'articulos',
        categoryId: String(c.categoryId ?? 1),
        status: c.status ?? 'DRAFT'
      })
    }, (e) => setError(e.message))
  }, [])

  function guardar() {
    setOcupado(true)
    setError('')
    const body: ArticulosConfig = {
      apiUrl: d.apiUrl,
      apiKey: d.apiKey,
      categoryId: Number(d.categoryId) || 1,
      status: d.status,
      cloudinary: d.cloudName || d.cloudKey || d.cloudSecret ? { cloudName: d.cloudName, apiKey: d.cloudKey, apiSecret: d.cloudSecret, folder: d.folder || 'articulos' } : undefined
    }
    api<ArticulosConfig>('/api/articulos/config', body)
      .then((c) => (setConfig(c), setAbierto(false)))
      .catch((e) => setError(e.message))
      .finally(() => setOcupado(false))
  }

  const cl = d.cloudName || d.cloudKey || d.cloudSecret
  const campo = (nombre: string, valor: string, cambiar: (v: string) => void, extra: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="opcion-fila">
      <span className="muted small" style={{ flex: '0 0 108px' }}>{nombre}</span>
      <input value={valor} onChange={(e) => cambiar(e.target.value)} autoComplete="off" spellCheck={false} {...extra} />
    </label>
  )

  return (
    <div className="item">
      <div className="fila">
        <span className="logo">
          <Icono de="documento" />
        </span>
        <div className="fila-nombre">
          <strong>Tu blog</strong>
          <span>
            {config?.apiUrl
              ? `Los artículos de la card «Artículo para tu blog» se publican en ${host(config.apiUrl)}${config.cloudinary?.cloudName ? ' · portada en Cloudinary' : ''}`
              : 'Conecta la API de tu blog (Blogi o compatible) para que los artículos se publiquen directo.'}
          </span>
        </div>
        {config === null ? (
          <span className="muted small">{error ? '' : 'Mirando…'}</span>
        ) : (
          <button className={config.apiUrl ? 'boton' : 'primary'} onClick={() => setAbierto(!abierto)}>
            {config.apiUrl ? 'Cambiar' : 'Conectar'}
          </button>
        )}
      </div>
      {abierto && (
        <form
          className="fila-extra"
          onSubmit={(e) => {
            e.preventDefault()
            if (d.apiUrl.trim() && d.apiKey.trim()) guardar()
          }}
        >
          {campo('URL de la API', d.apiUrl, (v) => setD({ ...d, apiUrl: v }), { placeholder: 'https://tu-blog.com', type: 'url', required: true })}
          {campo('Llave de la API', d.apiKey, (v) => setD({ ...d, apiKey: v }), { type: 'password', placeholder: 'La que pide la API en x-api-key', required: true })}
          <p className="muted small">La llave se guarda en tu usuario de esta computadora, no en la app.</p>
          <p className="muted small" style={{ marginTop: 6 }}>
            Cloudinary <span className="muted">(opcional, para alojar la portada)</span>
          </p>
          {campo('Nube', d.cloudName, (v) => setD({ ...d, cloudName: v }), { placeholder: 'cloud-name' })}
          {campo('Llave', d.cloudKey, (v) => setD({ ...d, cloudKey: v }), { placeholder: 'API key' })}
          {campo('Secreto', d.cloudSecret, (v) => setD({ ...d, cloudSecret: v }), { type: 'password', placeholder: 'API secret' })}
          {campo('Carpeta', d.folder, (v) => setD({ ...d, folder: v }), { placeholder: 'articulos' })}
          <div className="opcion-fila">
            <span className="muted small" style={{ flex: '0 0 108px' }}>Categoría</span>
            <input style={{ maxWidth: 90 }} type="number" min={1} value={d.categoryId} onChange={(e) => setD({ ...d, categoryId: e.target.value })} />
            <span className="muted small">Estado por defecto</span>
            <Segmento
              label="Estado por defecto"
              valor={d.status}
              opciones={[
                { id: 'DRAFT', texto: 'Borrador' },
                { id: 'PUBLISHED', texto: 'Publicado' }
              ]}
              onCambio={(id) => setD({ ...d, status: id })}
            />
          </div>
          <div className="opcion-fila">
            <button className="primary" disabled={ocupado || !d.apiUrl.trim() || !d.apiKey.trim()}>
              {ocupado ? 'Guardando…' : 'Guardar'}
            </button>
            {config?.apiUrl && (
              <button
                type="button"
                className="ghost"
                disabled={ocupado}
                onClick={() => {
                  setOcupado(true)
                  api<ArticulosConfig>('/api/articulos/config', {})
                    .then((c) => (setConfig(c), setAbierto(false), setD({ apiUrl: '', apiKey: '', cloudName: '', cloudKey: '', cloudSecret: '', folder: 'articulos', categoryId: '1', status: 'DRAFT' })))
                    .catch((e) => setError(e.message))
                    .finally(() => setOcupado(false))
                }}
              >
                Quitar conexión
              </button>
            )}
            <button type="button" className="ghost" onClick={() => setAbierto(false)}>
              Cancelar
            </button>
          </div>
          {!cl && <p className="muted small">Sin Cloudinary los artículos salen sin portada alojada; con ella, la imagen se sube sola.</p>}
          {error && <p className="bad small">{error}</p>}
        </form>
      )}
      {error && !abierto && <p className="bad small fila-extra">{error}</p>}
    </div>
  )
}
