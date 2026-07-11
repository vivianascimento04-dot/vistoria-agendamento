import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const empreendimento = searchParams.get('empreendimento')

  let query = supabase
    .from('entrega_dias_liberados')
    .select('*')
    .order('data', { ascending: true })

  if (empreendimento) query = query.eq('empreendimento', empreendimento)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request) {
  const { empreendimento, data } = await request.json()
  if (!empreendimento || !data) {
    return NextResponse.json({ error: 'Empreendimento e data obrigatorios.' }, { status: 400 })
  }
  const { error } = await supabase
    .from('entrega_dias_liberados')
    .upsert([{ empreendimento, data }], { onConflict: 'empreendimento,data' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  const { id } = await request.json()
  const { error } = await supabase
    .from('entrega_dias_liberados')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}