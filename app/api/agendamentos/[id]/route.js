import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function PATCH(request, context) {
  try {
    const params = await context.params
    const id = params.id
    const body = await request.json()

    const { data, error } = await supabase
      .from('agendamentos')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('Erro PATCH:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(request, context) {
  try {
    const params = await context.params
    const id = params.id

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}