/**
 * Cliente seguro de PayPal REST v2
 */

const PAYPAL_BASE = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
}

function getBaseUrl(): string {
  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox'
  return PAYPAL_BASE[mode]
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET

  if (!clientId || !secret) {
    return null
  }

  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64')
  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    console.error('Error obteniendo token de PayPal:', await res.text())
    return null
  }

  const data = await res.json()
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}

export async function createPayPalOrder(params: {
  amount: number
  currency: string
  description: string
  customId: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ id: string; approveUrl: string } | null> {
  const token = await getAccessToken()
  if (!token) return null

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: params.customId,
          description: params.description,
          amount: {
            currency_code: params.currency,
            value: params.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'Hermit por luchodev',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  })

  if (!res.ok) {
    console.error('Error creando orden en PayPal:', await res.text())
    return null
  }

  const data = await res.json()
  const approveLink = data.links?.find((l: { rel: string; href: string }) => l.rel === 'approve')

  return {
    id: data.id,
    approveUrl: approveLink ? approveLink.href : '',
  }
}

export async function capturePayPalOrder(orderId: string): Promise<boolean> {
  const token = await getAccessToken()
  if (!token) return false

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  return res.ok
}

