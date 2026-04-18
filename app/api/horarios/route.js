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
    const mes = searchParams.get('mes')

    if (mes) {
      const { data: agendados, error } = await supabase
        .from('agendamentos')
        .select('data, horario')
        .like('data', mes + '%')
        .eq('status', 'confirmado')

      if (error) throw error

      const contagem = {}
      for (const a of agendados || []) {
        contagem[a.data] = (contagem[a.data] || 0) + 1
      }

      const diasCheios = Object.entries(contagem)
        .filter(([, qtd]) => qtd >= HORARIOS.length)
        .map(([d]) => d)

      return NextResponse.json({ diasCheios })
    }

    if (data) {
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
    }

    return NextResponse.json(HORARIOS.map(h => ({ horario: h, disponivel: true })))
  } catch (e) {
    console.error('Erro horarios:', e.message)
    return NextResponse.json({ diasCheios: [] })
  }
}