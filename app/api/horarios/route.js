import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function getHorariosAtivos() {
  try {
    const { data, error } = await supabase
      .from('horarios_config')
      .select('horario, ativo')
      .eq('ativo', true)
      .order('horario', { ascending: true })
    if (error) throw error
    return (data || []).map(h => h.horario)
  } catch(e) {
    return ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00']
  }
}

async function getDiasEspeciais() {
  try {
    const { data, error } = await supabase
      .from('dias_especiais')
      .select('*')
    if (error) throw error
    return data || []
  } catch(e) {
    return []
  }
}

function isDiaBloqueadoPorEspecial(ds, diasEspeciais) {
  for (const d of diasEspeciais) {
    if (ds >= d.data_inicio && ds <= d.data_fim) {
      if (d.tipo === 'bloqueado') return true
      if (d.tipo === 'liberado') return false
    }
  }
  return null
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const mes = searchParams.get('mes')

    const [HORARIOS, diasEspeciais] = await Promise.all([
      getHorariosAtivos(),
      getDiasEspeciais()
    ])

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

      const diasCheios = []
      for (let dia = 1; dia <= ultimoDia; dia++) {
        const ds = mes + '-' + String(dia).padStart(2, '0')
        const especial = isDiaBloqueadoPorEspecial(ds, diasEspeciais)
        if (especial === true) {
          diasCheios.push(ds)
          continue
        }
        if (especial === false) continue
        const ocupados = porDia[ds] || new Set()
        if (ocupados.size >= HORARIOS.length) diasCheios.push(ds)
      }

      return NextResponse.json({ diasCheios })
    }

    if (data) {
      const especial = isDiaBloqueadoPorEspecial(data, diasEspeciais)

      if (especial === true) {
        return NextResponse.json(HORARIOS.map(h => ({ horario: h, disponivel: false })))
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
    }

    return NextResponse.json(HORARIOS.map(h => ({ horario: h, disponivel: true })))
  } catch (e) {
    console.error('Erro horarios:', e.message)
    return NextResponse.json({ diasCheios: [] })
  }
}