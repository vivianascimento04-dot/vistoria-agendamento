import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const HORARIOS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const mes = searchParams.get('mes')

    if (mes) {
      const [ano, m] = mes.split('-').map(Number)
      const inicio = mes + '-01'
      const ultimoDia = new Date(ano, m, 0).getDate()
      const fim = mes + '-' + String(ultimoDia).padStart(2, '0')

      const { data: agendados, error } = await supabase
        .from('agendamentos')
        .select('data, horario')
        .gte('data', inicio)
        .lte('data', fim)
        .eq('status', 'confirmado')

      if (error) throw error

      const porDia = {}
      for (const a of agendados || []) {
        const d = a.data
        const h = a.horario.slice(0, 5)
        if (!porDia[d]) porDia[d] = new Set()
        porDia[d].add(h)
      }

      const diasCheios = Object.entries(porDia)
        .filter(([, hset]) => hset.size >= HORARIOS.length)
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