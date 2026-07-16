import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request) {
  const { nome, assunto, mensagem } = await request.json()
  if (!nome || !assunto || !mensagem) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
  }
  const { error } = await supabase
    .from('email_templates')
    .insert([{ nome, assunto, mensagem }])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request) {
  const { id, nome, assunto, mensagem } = await request.json()
  const { error } = await supabase
    .from('email_templates')
    .update({ nome, assunto, mensagem })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  const { id } = await request.json()
  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
