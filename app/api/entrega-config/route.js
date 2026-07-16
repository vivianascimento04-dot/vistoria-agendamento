import { NextResponse } from 'next/server'

let config = {
  horaInicio: '09:00',
  horaFim: '17:45',
  intervalo: 15,
  vagas: 4
}

export function getEntregaConfig() {
  return config
}

export async function GET() {
  return NextResponse.json(config)
}

export async function POST(request) {
  const body = await request.json()
  const { horaInicio, horaFim, intervalo, vagas } = body
  if (horaInicio) config.horaInicio = horaInicio
  if (horaFim) config.horaFim = horaFim
  if (intervalo) config.intervalo = Number(intervalo)
  if (vagas) config.vagas = Number(vagas)
  return NextResponse.json({ success: true, config })
}