import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const cpf = searchParams.get('cpf')

    if (cpf) {
      const cpfLimpo = cpf.replace(/\D/g, '')
      const { data, error } = await supabase
        .from('cpf_datas_liberadas')
        .select('data')
        .eq('cpf', cpfLimpo)
        .order('data', { ascending: true })
      if (error) throw error
      return NextResponse.json(data?.map(d => d.data) || [])
    }

    const { data, error } = await supabase
      .from('cpf_datas_liberadas')
      .select('*')
      .order('cpf', { ascending: true })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch(e) {
    return NextResponse.json([])
  }
}

export async function POST(request) {
  try {
    const { cpf, data } = await request.json()
    if (!cpf || !data) return NextResponse.json({ error: 'CPF e data obrigatorios' }, { status: 400 })
    const cpfLimpo = cpf.replace(/\D/g, '')
    const { error } = await supabase
      .from('cpf_datas_liberadas')
      .insert([{ cpf: cpfLimpo, data }])
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Data ja cadastrada para este CPF' }, { status: 409 })
      throw error
    }
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { cpf, data, todos_cpf } = await request.json()
    const cpfLimpo = cpf?.replace(/\D/g, '')

    if (todos_cpf && cpfLimpo) {
      const { error } = await supabase
        .from('cpf_datas_liberadas')
        .delete()
        .eq('cpf', cpfLimpo)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (cpfLimpo && data) {
      const { error } = await supabase
        .from('cpf_datas_liberadas')
        .delete()
        .eq('cpf', cpfLimpo)
        .eq('data', data)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}