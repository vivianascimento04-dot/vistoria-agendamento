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

    const { error } = await supabase
      .from('agendamentos')
      .update({ status: body.status })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Erro PATCH:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
