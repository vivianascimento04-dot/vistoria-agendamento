import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  const { cpf } = await request.json()
  if (!cpf) return NextResponse.json({ autorizado: false })

  const cpfLimpo = cpf.replace(/\D/g, '')

  // Verificar se CPF esta autorizado
  const { data: cliente } = await supabase
    .from('entrega_cpfs_autorizados')
    .select('*')
    .eq('cpf', cpfLimpo)
    .maybeSingle()

  if (!cliente) {
    return NextResponse.json({ autorizado: false, motivo: 'CPF nao autorizado para entrega de chaves.' })
  }

  // Verificar se ja agendou
  const { data: agendamento } = await supabase
    .from('entrega_agendamentos')
    .select('id, data, horario, empreendimento, status')
    .eq('cpf', cpfLimpo)
    .eq('status', 'confirmado')
    .maybeSingle()

  if (agendamento) {
    return NextResponse.json({
      autorizado: false,
      jaAgendou: true,
      agendamento,
      motivo: 'Voce ja possui um agendamento de entrega de chaves confirmado.'
    })
  }

  return NextResponse.json({
    autorizado: true,
    nome: cliente.nome || '',
    unidade: cliente.unidade || '',
    empreendimento: cliente.empreendimento || ''
  })
}