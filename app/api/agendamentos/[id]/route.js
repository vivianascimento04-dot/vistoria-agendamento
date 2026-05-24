import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id
    const body = await request.json()
    const campos = {}
    if (body.status !== undefined) campos.status = body.status
    if (body.motivo_cancelamento !== undefined) campos.motivo_cancelamento = body.motivo_cancelamento
    if (body.obs_cancelamento !== undefined) campos.obs_cancelamento = body.obs_cancelamento
    if (body.data !== undefined) campos.data = body.data
    if (body.horario !== undefined) campos.horario = body.horario
    const { data, error } = await supabase
      .from('agendamentos')
      .update(campos)
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, agendamento: data })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}