import { NextRequest, NextResponse } from 'next/server'
import { activateLicense } from '@/lib/licenses'

export async function POST(req: NextRequest) {
  try {
    const event = await req.json()
    const eventType = event.event_type

    // Cuando una orden de checkout es aprobada o capturada
    if (
      eventType === 'CHECKOUT.ORDER.COMPLETED' ||
      eventType === 'PAYMENT.CAPTURE.COMPLETED'
    ) {
      const resource = event.resource
      const orderId =
        resource.id || resource.supplementary_data?.related_ids?.order_id

      if (orderId) {
        await activateLicense(orderId, 'paypal')
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error en webhook de PayPal:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

