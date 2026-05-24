import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const HORARIOS_BASE = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30'
]

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const mes = searchParams.get('mes')
    const empreendimento = searchParams.get('empreendimento') || ''

    // Busca horarios ativos
    const { data: horariosConfig } = await supabase
      .from('horarios_config')
      .select('*')
      .eq('ativo', true)
    const horariosAtivos = (horariosConfig || []).map(h => h.horario)

    async function calcularDisponiveis(ds) {
      let disponiveis = horariosAtivos.filter(h => HORARIOS_BASE.includes(h))

      // Bloqueios por data — especifico tem prioridade sobre todos
      const { data: bloqueios } = await supabase
        .from('horarios_bloqueados_data')
        .select('*')
        .eq('data', ds)

      if (bloqueios && bloqueios.length > 0) {
        const bloqueioEmp = empreendimento
          ? bloqueios.find(b => b.empreendimento === empreendimento)
          : null
        const bloqueioTodos = bloqueios.find(
          b => !b.empreendimento || b.empreendimento === 'todos'
        )
        const bloqueio = bloqueioEmp || bloqueioTodos
        if (bloqueio && bloqueio.ultimo_horario) {
          const idx = HORARIOS_BASE.indexOf(bloqueio.ultimo_horario)
          if (idx >= 0) {
            disponiveis = disponiveis.filter(
              h => HORARIOS_BASE.indexOf(h) <= idx
            )
          }
        }
      }

      // SOMENTE agendamentos normais ocupam horarios
      // Revistorias NAO bloqueiam horarios para agendamentos normais
      const query = supabase
        .from('agendamentos')
        .select('horario')
        .eq('data', ds)
        .eq('status', 'confirmado')
        .eq('tipo', 'normal')

      if (empreendimento) {
        query.ilike('apartamento', empreendimento + '%')
      }

      const { data: agendados } = await query
      const ocupados = new Set(
        (agendados || []).map(a => (a.horario || '').slice(0, 5))
      )

      return { disponiveis, ocupados }
    }

    // Retorna dias cheios do mes
    if (mes) {
      const partes = mes.split('-')
      const ano = parseInt(partes[0])
      const mesNum = parseInt(partes[1])
      const diasNoMes = new Date(ano, mesNum, 0).getDate()
      const diasCheios = []

      for (let d = 1; d <= diasNoMes; d++) {
        const ds = ano + '-' + String(mesNum).padStart(2,'0') + '-' + String(d).padStart(2,'0')
        const dow = new Date(ano, mesNum - 1, d).getDay()
        if (dow === 0 || dow === 6) continue
        const { disponiveis, ocupados } = await calcularDisponiveis(ds)
        const livres = disponiveis.filter(h => !ocupados.has(h))
        if (livres.length === 0 && disponiveis.length > 0) diasCheios.push(ds)
      }

      return NextResponse.json({ diasCheios })
    }

    // Retorna horarios de uma data especifica
    if (data) {
      const { disponiveis, ocupados } = await calcularDisponiveis(data)
      const result = disponiveis.map(h => ({
        horario: h,
        disponivel: !ocupados.has(h)
      }))
      return NextResponse.json(result)
    }

    return NextResponse.json([])
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}