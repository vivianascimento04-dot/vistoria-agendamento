import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, motivo_cancelamento, obs_cancelamento } = body

    const updateData = { status }
    if (motivo_cancelamento !== undefined) updateData.motivo_cancelamento = motivo_cancelamento
    if (obs_cancelamento !== undefined) updateData.obs_cancelamento = obs_cancelamento

    const { data, error } = await supabase
      .from('agendamentos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}