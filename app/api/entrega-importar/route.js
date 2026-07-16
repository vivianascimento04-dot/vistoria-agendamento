import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { registros, empreendimento } = body

    if (!registros || !registros.length) {
      return NextResponse.json({ error: 'Nenhum registro enviado.' }, { status: 400 })
    }
    if (!empreendimento) {
      return NextResponse.json({ error: 'Empreendimento obrigatorio.' }, { status: 400 })
    }

    let inseridos = 0
    let duplicados = 0
    let erros = []

    for (const reg of registros) {
      const cpfLimpo = String(reg.cpf || '').replace(/\D/g, '')
      if (!cpfLimpo || cpfLimpo.length < 11) {
        erros.push('CPF invalido: ' + reg.cpf)
        continue
      }

      const { error } = await supabase
        .from('entrega_cpfs_autorizados')
        .insert([{
          cpf: cpfLimpo,
          nome: reg.nome || '',
          unidade: reg.unidade || '',
          email: reg.email || '',
          telefone: reg.telefone || '',
          empreendimento
        }])

      if (error) {
        if (error.code === '23505') {
          duplicados++
        } else {
          erros.push(reg.nome + ' - ' + error.message)
        }
      } else {
        inseridos++
      }
    }

    return NextResponse.json({ success: true, inseridos, duplicados, erros })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}