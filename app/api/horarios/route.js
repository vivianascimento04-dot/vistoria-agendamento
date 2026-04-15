import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const HORARIOS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00']

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')

    if (!data) {
      return NextResponse.json(HORARIOS.map(h => ({ horario: h, disponivel: true })))
    }

    const { data: agendados, error } = await supabase
      .from('agendamentos')
      .select('horario')
      .eq('data', data)
      .eq('status', 'confirmado')

    if (error) throw error

    const ocupados = agendados?.map(a => a.horario.slice(0, 5)) || []
    const disponiveis = HORARIOS.map(h => ({
      horario: h,
      disponivel: !ocupados.includes(h)
    }))

    return NextResponse.json(disponiveis)
  } catch (e) {
    console.error('Erro horarios:', e.message)
    return NextResponse.json(HORARIOS.map(h => ({ horario: h, disponivel: true })))
  }
}