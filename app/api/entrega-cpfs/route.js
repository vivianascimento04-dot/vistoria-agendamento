import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('entrega_cpfs_autorizados')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request) {
  const { cpf, nome, unidade, empreendimento, email, telefone } = await request.json()
  if (!cpf) return NextResponse.json({ error: 'CPF obrigatorio.' }, { status: 400 })
  const cpfLimpo = cpf.replace(/\D/g, '')
  const { error } = await supabase
    .from('entrega_cpfs_autorizados')
    .insert([{ cpf: cpfLimpo, nome: nome||'', unidade: unidade||'', empreendimento: empreendimento||'', email: email||'', telefone: telefone||'' }])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request) {
  const { cpf, nome, unidade, empreendimento, email, telefone } = await request.json()
  const cpfLimpo = cpf.replace(/\D/g, '')
  const { error } = await supabase
    .from('entrega_cpfs_autorizados')
    .update({ nome, unidade, empreendimento, email: email||'', telefone: telefone||'' })
    .eq('cpf', cpfLimpo)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  const { cpf, cpfs, todos } = await request.json()
  let error
  if (todos) {
    ({ error } = await supabase.from('entrega_cpfs_autorizados').delete().neq('id', 0))
  } else if (cpfs) {
    const limpos = cpfs.map(c => c.replace(/\D/g, ''))
    ;({ error } = await supabase.from('entrega_cpfs_autorizados').delete().in('cpf', limpos))
  } else {
    const cpfLimpo = cpf.replace(/\D/g, '')
    ;({ error } = await supabase.from('entrega_cpfs_autorizados').delete().eq('cpf', cpfLimpo))
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(request) {
  const { cpf } = await request.json()
  const cpfLimpo = cpf?.replace(/\D/g, '')
  const { data } = await supabase
    .from('entrega_cpfs_autorizados')
    .select('cpf, nome, unidade, empreendimento, email')
    .eq('cpf', cpfLimpo)
    .maybeSingle()
  return NextResponse.json({ autorizado: !!data, dados: data || null })
}