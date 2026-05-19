import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('horarios_bloqueados_data')
      .select('*')
      .order('data', { ascending: true })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch(e) {
    return NextResponse.json([])
  }
}

export async function POST(request) {
  try {
    const { data, ultimo_horario } = await request.json()
    if (!data || !ultimo_horario) return NextResponse.json({ error: 'Data e horario obrigatorios' }, { status: 400 })
    const { error } = await supabase
      .from('horarios_bloqueados_data')
      .upsert([{ data, ultimo_horario }], { onConflict: 'data' })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })
    const { error } = await supabase
      .from('horarios_bloqueados_data')
      .delete()
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}