import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Lista padrao caso nao tenha no banco
const PADRAO = ['Parque Mikonos', 'Parque Olimpia']

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('empreendimentos')
      .select('nome')
      .order('nome', { ascending: true })
    if (error || !data?.length) return NextResponse.json(PADRAO)
    return NextResponse.json(data.map(e => e.nome))
  } catch(e) {
    return NextResponse.json(PADRAO)
  }
}

export async function POST(request) {
  try {
    const { nome } = await request.json()
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatorio' }, { status: 400 })
    const { error } = await supabase.from('empreendimentos').insert([{ nome: nome.trim() }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { nome } = await request.json()
    const { error } = await supabase.from('empreendimentos').delete().eq('nome', nome)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
