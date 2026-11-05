import { NextRequest, NextResponse } from 'next/server'
import { validateLicense } from '@/lib/licenses'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, machineId, equipo, clave } = body

    const targetKey = key || clave
    const targetMachine = machineId || equipo || 'default-machine'

    if (!targetKey) {
      return NextResponse.json(
        { error: 'Clave de licencia requerida' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await validateLicense(targetKey, targetMachine)

    if (!result.valid || !result.license) {
      return NextResponse.json(
        { error: result.error || 'Licencia inválida' },
        { status: 401, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        valid: true,
        activa: true,
        clave: result.license.key,
        plan: result.license.plan,
        estado: result.license.status,
        fundador: result.license.founder,
        pagadaHasta: result.license.expires_at,
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error en /api/licencia:', error)
    return NextResponse.json(
      { error: 'Error interno validando licencia' },
      { status: 500, headers: corsHeaders }
    )
  }
}

