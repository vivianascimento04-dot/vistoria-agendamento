import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('cpfs_autorizados')
      .select('*')
      .order('criado_em', { ascending: true })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch(e) {
    return NextResponse.json([])
  }
}

export async function POST(request) {
  try {
    const { cpf, nome } = await request.json()
    if (!cpf) return NextResponse.json({ error: 'CPF obrigatorio' }, { status: 400 })
    const cpfLimpo = cpf.replace(/\D/g, '')
    const { error } = await supabase
      .from('cpfs_autorizados')
      .insert([{ cpf: cpfLimpo, nome: nome || '' }])
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'CPF ja cadastrado' }, { status: 409 })
      throw error
    }
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { cpf, nome } = await request.json()
    if (!cpf) return NextResponse.json({ error: 'CPF obrigatorio' }, { status: 400 })
    const cpfLimpo = cpf.replace(/\D/g, '')
    const { error } = await supabase
      .from('cpfs_autorizados')
      .update({ nome: nome || '' })
      .eq('cpf', cpfLimpo)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json()

    if (body.todos === true) {
      const { error } = await supabase
        .from('cpfs_autorizados')
        .delete()
        .neq('cpf', '')
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (Array.isArray(body.cpfs)) {
      const cpfsLimpos = body.cpfs.map(c => c.replace(/\D/g, ''))
      const { error } = await supabase
        .from('cpfs_autorizados')
        .delete()
        .in('cpf', cpfsLimpos)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (body.cpf) {
      const cpfLimpo = body.cpf.replace(/\D/g, '')
      const { error } = await supabase
        .from('cpfs_autorizados')
        .delete()
        .eq('cpf', cpfLimpo)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Parametro invalido' }, { status: 400 })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { cpf } = await request.json()
    if (!cpf) return NextResponse.json({ autorizado: false })
    const cpfLimpo = cpf.replace(/\D/g, '')
    const { data, error } = await supabase
      .from('cpfs_autorizados')
      .select('cpf, nome')
      .eq('cpf', cpfLimpo)
      .maybeSingle()
    if (error) throw error
    return NextResponse.json({ autorizado: !!data, nome: data?.nome || '' })
  } catch(e) {
    return NextResponse.json({ autorizado: false })
  }
}