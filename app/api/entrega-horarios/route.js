import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const HORARIOS = []
for (let h = 8; h < 18; h++) {
  for (let m = 0; m < 60; m += 15) {
    HORARIOS.push(String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0'))
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const data = searchParams.get('data')
  const empreendimento = searchParams.get('empreendimento')
  const mes = searchParams.get('mes')

  // Retorna dias liberados do mes
  if (mes) {
    const { data: diasLiberados } = await supabase
      .from('entrega_dias_liberados')
      .select('data')
      .eq('empreendimento', empreendimento || '')
      .gte('data', mes + '-01')
      .lte('data', mes + '-31')

    const diasCheios = []
    for (const dia of (diasLiberados || [])) {
      const { data: agendados } = await supabase
        .from('entrega_agendamentos')
        .select('horario')
        .eq('data', dia.data)
        .eq('empreendimento', empreendimento)
        .eq('status', 'confirmado')

      const vagasOcupadas = {}
      for (const a of (agendados || [])) {
        vagasOcupadas[a.horario] = (vagasOcupadas[a.horario] || 0) + 1
      }
      const totalVagas = HORARIOS.length * 4
      const totalOcupadas = Object.values(vagasOcupadas).reduce((s, v) => s + v, 0)
      if (totalOcupadas >= totalVagas) diasCheios.push(dia.data)
    }

    return NextResponse.json({
      diasLiberados: (diasLiberados || []).map(d => d.data),
      diasCheios
    })
  }

  // Retorna horarios de uma data especifica
  if (data && empreendimento) {
    // Verificar se dia esta liberado
    const { data: diaLiberado } = await supabase
      .from('entrega_dias_liberados')
      .select('id')
      .eq('empreendimento', empreendimento)
      .eq('data', data)
      .maybeSingle()

    if (!diaLiberado) {
      return NextResponse.json([])
    }

    const { data: agendados } = await supabase
      .from('entrega_agendamentos')
      .select('horario, id, nome, unidade, status')
      .eq('data', data)
      .eq('empreendimento', empreendimento)

    const vagasPorHorario = {}
    for (const a of (agendados || [])) {
      if (!vagasPorHorario[a.horario]) {
        vagasPorHorario[a.horario] = { confirmados: 0, total: 0, clientes: [] }
      }
      vagasPorHorario[a.horario].total++
      if (a.status === 'confirmado') {
        vagasPorHorario[a.horario].confirmados++
        vagasPorHorario[a.horario].clientes.push({ nome: a.nome, unidade: a.unidade })
      }
    }

    const result = HORARIOS.map(h => ({
      horario: h,
      vagas: 4,
      ocupadas: vagasPorHorario[h]?.confirmados || 0,
      disponivel: (vagasPorHorario[h]?.confirmados || 0) < 4,
      clientes: vagasPorHorario[h]?.clientes || []
    }))

    return NextResponse.json(result)
  }

  return NextResponse.json([])
}