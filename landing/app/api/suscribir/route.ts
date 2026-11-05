import { NextRequest, NextResponse } from 'next/server'
import { createLicense } from '@/lib/licenses'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, plan, method, amount, currency, transactionRef } = body

    if (!email) {
      return NextResponse.json(
        { error: 'El correo electrónico es obligatorio' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 1. Plan Gratuito (Activación Inmediata)
    if (plan === 'gratis') {
      const license = await createLicense({
        email,
        plan: 'gratis',
        paymentMethod: 'free',
        amount: 0,
        currency: 'USD',
        status: 'active',
      })

      return NextResponse.json({
        success: true,
        key: license.key,
        plan: 'gratis',
        message: 'Cuenta gratuita activada con éxito',
      })
    }

    // Montos dinámicos o por defecto
    const numericAmount = Number(amount) || (plan === 'grande' ? 10 : plan === 'amigo' ? 5 : 1)
    const isBOB = currency === 'BOB' || method === 'qr_bolivia'
    const finalCurrency = isBOB ? 'BOB' : 'USD'

    // 2. Pago por QR (Bolivia)
    if (method === 'qr_bolivia') {
      const license = await createLicense({
        email,
        plan: 'mensual',
        paymentMethod: 'qr_bolivia',
        amount: numericAmount,
        currency: 'BOB',
        status: 'pending',
        externalId: transactionRef || undefined,
      })

      return NextResponse.json({
        success: true,
        method: 'qr_bolivia',
        key: license.key,
        amount: numericAmount,
        currency: 'BOB',
        reference: license.id.slice(0, 8).toUpperCase(),
        message:
          'Solicitud de pago QR registrada. Realiza la transferencia y envía el comprobante.',
      })
    }

    // 3. Pago por PayPal (Internacional)
    const license = await createLicense({
      email,
      plan: 'mensual',
      paymentMethod: 'paypal',
      amount: numericAmount,
      currency: 'USD',
      status: 'pending',
    })

    const paypalOrder = await createPayPalOrder({
      amount: numericAmount,
      currency: 'USD',
      description: `Hermit — Apoyo Voluntario ($${numericAmount} USD)`,
      customId: license.id,
      returnUrl: `${appUrl}/gracias?license_id=${license.id}`,
      cancelUrl: `${appUrl}/#precios`,
    })

    if (!paypalOrder || !paypalOrder.approveUrl) {
      // Modo demostración si no hay credenciales de PayPal configuradas aún
      return NextResponse.json({
        success: true,
        demoMode: true,
        key: license.key,
        message:
          'Modo demostración: Las llaves de PayPal aún no están configuradas en .env. Se generó tu clave de prueba.',
      })
    }

    return NextResponse.json({
      success: true,
      method: 'paypal',
      orderId: paypalOrder.id,
      approveUrl: paypalOrder.approveUrl,
    })
  } catch (error) {
    console.error('Error en /api/suscribir:', error)
    return NextResponse.json(
      { error: 'Error procesando la solicitud de suscripción' },
      { status: 500 }
    )
  }
}
