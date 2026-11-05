import crypto from 'node:crypto'
import { getSupabase } from './supabase'

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
export const MAX_MACHINES = 2

export interface LicenseData {
  id: string
  key: string
  email: string
  plan: 'gratis' | 'mensual' | 'anual'
  status: 'active' | 'pending' | 'expired' | 'cancelled'
  payment_method: 'free' | 'paypal' | 'qr_bolivia'
  amount: number
  currency: string
  founder: boolean
  machines: string[]
  created_at: string
  expires_at?: string
}

/**
 * Genera una clave con formato HERMIT-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const bytes = crypto.randomBytes(16)
  let chars = ''
  for (let i = 0; i < 16; i++) {
    chars += ALPHABET[bytes[i] % ALPHABET.length]
  }
  const chunks = chars.match(/.{1,4}/g) || []
  return `HERMIT-${chunks.join('-')}`
}

/**
 * Almacén temporal en memoria si Supabase aún no tiene credenciales configuradas
 */
const inMemoryLicenses: Map<string, LicenseData> = new Map()

/**
 * Crea o guarda una nueva licencia
 */
export async function createLicense(params: {
  email: string
  plan: 'gratis' | 'mensual' | 'anual'
  paymentMethod: 'free' | 'paypal' | 'qr_bolivia'
  amount: number
  currency: string
  status?: 'active' | 'pending'
  externalId?: string
}): Promise<LicenseData> {
  const key = generateLicenseKey()
  const now = new Date()
  
  let expiresAt: Date | undefined
  if (params.plan === 'mensual') {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  } else if (params.plan === 'anual') {
    expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  }

  const license: LicenseData = {
    id: crypto.randomUUID(),
    key,
    email: params.email.toLowerCase().trim(),
    plan: params.plan,
    status: params.status || (params.paymentMethod === 'free' ? 'active' : 'pending'),
    payment_method: params.paymentMethod,
    amount: params.amount,
    currency: params.currency,
    founder: params.plan === 'anual' || params.plan === 'mensual',
    machines: [],
    created_at: now.toISOString(),
    expires_at: expiresAt?.toISOString(),
  }

  const supabase = getSupabase()
  if (supabase) {
    const { error } = await supabase.from('licenses').insert({
      id: license.id,
      key: license.key,
      email: license.email,
      plan: license.plan,
      status: license.status,
      payment_method: license.payment_method,
      amount: license.amount,
      currency: license.currency,
      founder: license.founder,
      machines: license.machines,
      created_at: license.created_at,
      expires_at: license.expires_at,
    })

    if (error) {
      console.error('Error insertando licencia en Supabase:', error.message)
      throw new Error('No se pudo guardar la licencia en base de datos')
    }

    if (params.externalId) {
      await supabase.from('payments').insert({
        license_id: license.id,
        external_id: params.externalId,
        method: params.paymentMethod,
        amount: params.amount,
        currency: params.currency,
        status: license.status === 'active' ? 'completed' : 'pending',
      })
    }
  } else {
    // Almacenamiento local provisional
    inMemoryLicenses.set(license.key, license)
  }

  return license
}

/**
 * Valida una clave y registra la máquina (HWID)
 */
export async function validateLicense(
  key: string,
  machineId: string
): Promise<{
  valid: boolean
  license?: LicenseData
  error?: string
}> {
  const cleanKey = key.trim().toUpperCase()
  const cleanMachine = machineId.trim()

  if (!cleanKey) {
    return { valid: false, error: 'Falta la clave de licencia' }
  }

  let license: LicenseData | undefined

  const supabase = getSupabase()
  if (supabase) {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', cleanKey)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Clave de licencia no encontrada' }
    }
    license = data as LicenseData
  } else {
    license = inMemoryLicenses.get(cleanKey)
    if (!license) {
      return { valid: false, error: 'Clave de licencia no encontrada' }
    }
  }

  // Comprobar estado
  if (license.status !== 'active') {
    return { valid: false, error: `La licencia está ${license.status}` }
  }

  // Comprobar expiración
  if (license.expires_at) {
    const expiration = new Date(license.expires_at).getTime()
    if (Date.now() > expiration) {
      return { valid: false, error: 'La licencia ha expirado' }
    }
  }

  // Comprobar y actualizar computadoras
  if (cleanMachine) {
    const machines = license.machines || []
    if (!machines.includes(cleanMachine)) {
      if (machines.length >= MAX_MACHINES) {
        return {
          valid: false,
          error: `Esta clave ya está activa en ${MAX_MACHINES} computadoras`,
        }
      }
      machines.push(cleanMachine)
      license.machines = machines

      if (supabase) {
        await supabase
          .from('licenses')
          .update({ machines, updated_at: new Date().toISOString() })
          .eq('id', license.id)
      }
    }
  }

  return { valid: true, license }
}

/**
 * Activa una licencia una vez confirmado el pago
 */
export async function activateLicense(
  externalId: string,
  method: 'paypal' | 'qr_bolivia'
): Promise<LicenseData | null> {
  const supabase = getSupabase()
  if (supabase) {
    // Buscar pago
    const { data: payment } = await supabase
      .from('payments')
      .select('license_id')
      .eq('external_id', externalId)
      .single()

    if (payment?.license_id) {
      const { data: updated } = await supabase
        .from('licenses')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', payment.license_id)
        .select()
        .single()

      await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('external_id', externalId)

      return updated as LicenseData
    }
  }
  return null
}

