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
  const [d, setD] = useState({ apiUrl: '', apiKey: '', authHeader: '', headers: '', endpoint: '', cloudName: '', cloudKey: '', cloudSecret: '', folder: '', categoryId: '1', status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' })
  const [ver, setVer] = useState<Record<string, boolean>>({})
  const [avanzado, setAvanzado] = useState(false)

  useEffect(() => {
    api<ArticulosConfig>('/api/articulos/config').then((c) => {
      setConfig(c)
      setD({
        apiUrl: c.apiUrl ?? '',
        apiKey: c.apiKey ?? '',
        authHeader: c.authHeader ?? '',
        headers: c.headers ? JSON.stringify(c.headers) : '',
        endpoint: c.endpoint ?? '',
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
    let headers: Record<string, string> | undefined
    const texto = d.headers.trim()
    if (texto) {
      try {
        const o = JSON.parse(texto)
        if (!o || typeof o !== 'object' || Array.isArray(o) || Object.values(o).some((v) => typeof v !== 'string')) throw new Error()
        headers = o as Record<string, string>
      } catch {
        setOcupado(false)
        setError('Los headers extra deben ser un JSON de texto: {"X-Cosa":"valor"}.')
        return
      }
    }
    const body: ArticulosConfig = {
      apiUrl: d.apiUrl,
      apiKey: d.apiKey,
      authHeader: d.authHeader.trim() || undefined,
      headers,
      endpoint: d.endpoint || '/api/articles',
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
  /** Un campo del formulario; con `secreta`, el input es de contraseña con el ojito para verla. */
  const campo = (nombre: string, valor: string, cambiar: (v: string) => void, extra: InputHTMLAttributes<HTMLInputElement> = {}, clave?: string) => (
    <label className="opcion-fila">
      <span className="muted small" style={{ flex: '0 0 120px' }}>{nombre}</span>
      {clave ? (
        <span className="opcion-clave">
          <input type={ver[clave] ? 'text' : 'password'} value={valor} onChange={(e) => cambiar(e.target.value)} autoComplete="off" spellCheck={false} {...extra} />
          <button type="button" className="ojo" title={ver[clave] ? 'Ocultar' : 'Ver'} aria-label={ver[clave] ? 'Ocultar la llave' : 'Ver la llave'} onClick={() => setVer({ ...ver, [clave]: !ver[clave] })}>
            <Icono de="ojo" />
          </button>
        </span>
      ) : (
        <input value={valor} onChange={(e) => cambiar(e.target.value)} autoComplete="off" spellCheck={false} {...extra} />
      )}
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
              ? `Los artículos de la card «Artículo para tu blog» se publican en ${host(config.apiUrl)}${config.cloudinary?.cloudName ? ' · con portada automática' : ''}`
              : 'Conecta tu blog para que la card «Artículo para tu blog» escriba y publique directo, sin copiar y pegar.'}
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
          {campo('Dirección de tu blog', d.apiUrl, (v) => setD({ ...d, apiUrl: v }), { placeholder: 'https://tublog.com', type: 'url', required: true })}
          {campo('Ruta del endpoint', d.endpoint, (v) => setD({ ...d, endpoint: v }), { placeholder: '/api/articles' })}
          {campo('Nombre del header', d.authHeader, (v) => setD({ ...d, authHeader: v }), { placeholder: 'x-api-key' })}
          {campo('Llave de tu blog', d.apiKey, (v) => setD({ ...d, apiKey: v }), { placeholder: 'El valor de ese header', required: true }, 'apiKey')}
          <p className="muted small">Los artículos se envían a <code>dirección + ruta</code>, con la llave en el header que indicas. Si no sabes qué poner en los dos del medio, déjalos como están: casi todos usan <code>/api/articles</code> y <code>x-api-key</code>. La llave se guarda en tu usuario de esta computadora, no en la app.</p>
          <div className="opcion-fila">
            <span className="muted small" style={{ flex: '0 0 120px' }}>Estado por defecto</span>
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
          <button type="button" className="ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => setAvanzado(!avanzado)} aria-expanded={avanzado}>
            {avanzado ? '▾' : '▸'} Ajustes avanzados{avanzado ? '' : ' (solo si tu blog los pide)'}
          </button>
          {avanzado && (
            <>
              <label className="opcion-fila">
                <span className="muted small" style={{ flex: '0 0 120px' }}>Headers extra</span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <textarea
                    rows={2}
                    value={d.headers}
                    onChange={(e) => setD({ ...d, headers: e.target.value })}
                    placeholder='Opcional, JSON: {"X-Cuenta":"123"}'
                    spellCheck={false}
                    style={{ padding: '7px 11px', borderRadius: 8, background: 'var(--panel)', border: '1px solid var(--line)', outline: 'none', fontFamily: 'var(--mono)', fontSize: 12, resize: 'vertical' }}
                  />
                  <span className="muted small">Solo si tu blog pide más headers además del de la llave.</span>
                </span>
              </label>
              {campo('Categoría', d.categoryId, (v) => setD({ ...d, categoryId: v }), { type: 'number', min: 1, style: { maxWidth: 90 } })}
              <p className="muted small" style={{ marginTop: 6 }}>
                Cloudinary <span className="muted">(opcional, para que la portada se suba sola)</span>
              </p>
              {campo('Nube', d.cloudName, (v) => setD({ ...d, cloudName: v }), { placeholder: 'cloud-name' })}
              {campo('Llave', d.cloudKey, (v) => setD({ ...d, cloudKey: v }), { placeholder: 'API key' })}
              {campo('Secreto', d.cloudSecret, (v) => setD({ ...d, cloudSecret: v }), { placeholder: 'API secret' }, 'cloudSecret')}
              {campo('Carpeta', d.folder, (v) => setD({ ...d, folder: v }), { placeholder: 'articulos' })}
              <p className="muted small">
                Cloudinary es el servicio que aloja la portada: sin él los artículos salen sin imagen; con él, Hermit la sube sola.
              </p>
            </>
          )}
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
                    .then((c) => (setConfig(c), setAbierto(false), setD({ apiUrl: '', apiKey: '', authHeader: '', headers: '', endpoint: '', cloudName: '', cloudKey: '', cloudSecret: '', folder: 'articulos', categoryId: '1', status: 'DRAFT' })))
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
