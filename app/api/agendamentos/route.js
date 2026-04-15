import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// ✅ validação de env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const resendKey = process.env.RESEND_API_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase não configurado na Vercel')
}

const supabase = createClient(supabaseUrl, supabaseKey)
const resend = resendKey ? new Resend(resendKey) : null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, cpf, email, telefone, apartamento, data, horario } = body

    // 🔍 validação básica
    if (!nome || !email || !data || !horario) {
      return NextResponse.json({ error: 'Dados obrigatórios faltando' }, { status: 400 })
    }

    // 🚫 apartamento já agendado
    const { data: existente } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('apartamento', apartamento)
      .eq('status', 'confirmado')
      .maybeSingle()

    if (existente) {
      return NextResponse.json(
        { error: 'Este apartamento já possui vistoria agendada.' },
        { status: 409 }
      )
    }

    // 🚫 horário ocupado
    const { data: ocupado } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('data', data)
      .eq('horario', horario)
      .eq('status', 'confirmado')
      .maybeSingle()

    if (ocupado) {
      return NextResponse.json({ error: 'Horário já ocupado' }, { status: 409 })
    }

    // 💾 salvar
    const { data: agendamento, error } = await supabase
      .from('agendamentos')
      .insert([{ nome, cpf, email, telefone, apartamento, data, horario }])
      .select()
      .single()

    if (error) {
      console.error('Erro Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 📅 GOOGLE (seguro — só executa se existir)
    try {
      if (
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REFRESH_TOKEN
      ) {
        const auth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        )

        auth.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        })

        const calendar = google.calendar({ version: 'v3', auth })

        const inicio = new Date(`${data}T${horario}:00`)
        const fim = new Date(inicio.getTime() + 60 * 60 * 1000)

        const evento = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: `Vistoria - ${apartamento} (${nome})`,
            description: `Cliente: ${nome}\nApto: ${apartamento}`,
            start: { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' },
            end: { dateTime: fim.toISOString(), timeZone: 'America/Sao_Paulo' },
          },
        })

        await supabase
          .from('agendamentos')
          .update({ google_event_id: evento.data.id })
          .eq('id', agendamento.id)
      }
    } catch (e: any) {
      console.error('Erro Google (ignorado):', e.message)
    }

    // 📧 EMAIL (seguro)
    try {
      if (resend) {
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Vistoria agendada',
          html: `<p>Olá ${nome}, sua vistoria foi confirmada para ${data} às ${horario}</p>`,
        })

        if (process.env.EMAIL_EQUIPE) {
          await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: process.env.EMAIL_EQUIPE,
            subject: `Nova vistoria - ${apartamento}`,
            html: `<p>${nome} agendou vistoria</p>`,
          })
        }
      }
    } catch (e: any) {
      console.error('Erro email (ignorado):', e.message)
    }

    return NextResponse.json({ success: true, agendamento })
  } catch (e: any) {
    console.error('ERRO GERAL:', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .order('data', { ascending: true })

    if (error) {
      console.error(error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}