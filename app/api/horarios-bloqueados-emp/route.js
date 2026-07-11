import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('horarios_bloqueados_empreendimento')
    .select('*')
    .order('empreendimento')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request) {
  const { empreendimento, horario } = await request.json()
  if (!empreendimento || !horario)
    return NextResponse.json({ error: 'Campos obrigatorios.' }, { status: 400 })
  const { error } = await supabase
    .from('horarios_bloqueados_empreendimento')
    .insert([{ empreendimento, horario }])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  const { id } = await request.json()
  const { error } = await supabase
    .from('horarios_bloqueados_empreendimento')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}