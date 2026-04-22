import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('meses_bloqueados')
      .select('ano_mes')
      .order('ano_mes', { ascending: true })
    if (error) throw error
    return NextResponse.json(data.map(m => m.ano_mes))
  } catch(e) {
    return NextResponse.json([])
  }
}

export async function POST(request) {
  try {
    const { ano_mes } = await request.json()
    if (!ano_mes) return NextResponse.json({ error: 'ano_mes obrigatorio' }, { status: 400 })
    const { error } = await supabase.from('meses_bloqueados').insert([{ ano_mes }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { ano_mes } = await request.json()
    const { error } = await supabase.from('meses_bloqueados').delete().eq('ano_mes', ano_mes)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}