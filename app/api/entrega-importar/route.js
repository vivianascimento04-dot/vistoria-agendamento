import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const empreendimento = formData.get('empreendimento')

    if (!file || !empreendimento) {
      return NextResponse.json({ error: 'Arquivo e empreendimento obrigatorios.' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

    let inseridos = 0
    let duplicados = 0
    let erros = []

    for (const row of rows) {
      const get = (nomes) => {
        for (const n of nomes) {
          const k = Object.keys(row).find(k => k.toLowerCase().trim().includes(n))
          if (k) return String(row[k] || '').trim()
        }
        return ''
      }

      const cpfRaw = get(['cpf'])
      const cpfLimpo = cpfRaw.replace(/\D/g, '')

      if (!cpfLimpo || cpfLimpo.length < 11) {
        erros.push('CPF invalido: ' + cpfRaw)
        continue
      }

      const { error } = await supabase
        .from('entrega_cpfs_autorizados')
        .insert([{
          cpf: cpfLimpo,
          nome: get(['cliente', 'nome']),
          unidade: get(['unidade', 'apto']),
          email: get(['e-mail', 'email', 'mail']),
          telefone: get(['telefone', 'celular', 'fone', 'tel']),
          empreendimento
        }])

      if (error) {
        if (error.code === '23505') duplicados++
        else erros.push(cpfRaw + ' - ' + error.message)
      } else {
        inseridos++
      }
    }

    return NextResponse.json({ success: true, inseridos, duplicados, erros })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}