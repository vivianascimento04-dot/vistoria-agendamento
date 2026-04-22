import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('dias_especiais')
      .select('*')
      .order('data_inicio', { ascending: true })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch(e) {
    return NextResponse.json([])
  }
}

export async function POST(request) {
  try {
    const { data_inicio, data_fim, tipo, observacao } = await request.json()
    if (!data_inicio || !data_fim || !tipo) {
      return NextResponse.json({ error: 'Campos obrigatorios faltando' }, { status: 400 })
    }
    const { error } = await supabase
      .from('dias_especiais')
      .insert([{ data_inicio, data_fim, tipo, observacao: observacao || '' }])
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json()
    const { error } = await supabase
      .from('dias_especiais')
      .delete()
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}