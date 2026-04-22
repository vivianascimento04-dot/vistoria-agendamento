import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('horarios_config')
      .select('horario, ativo')
      .order('horario', { ascending: true })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch(e) {
    return NextResponse.json([])
  }
}

export async function PATCH(request) {
  try {
    const { horario, ativo } = await request.json()
    const { error } = await supabase
      .from('horarios_config')
      .update({ ativo })
      .eq('horario', horario)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}