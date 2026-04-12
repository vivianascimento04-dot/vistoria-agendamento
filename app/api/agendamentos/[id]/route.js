import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const body = await request.json()
  const { nome, cpf, email, telefone, apartamento, data, horario } = body

  const { data: agendamento, error } = await supabase
    .from('agendamentos')
    .insert([{ nome, cpf, email, telefone, apartamento, data, horario }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Horário já ocupado' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Google Agenda
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
    const calendar = google.calendar({ version: 'v3', auth })
    const inicio = new Date(`${data}T${horario}:00`)
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000)

    const evento = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `Vistoria — ${apartamento} (${nome})`,
        description: `Cliente: ${nome}\nApto: ${apartamento}\nTel: ${telefone}\nEmail: ${email}`,
        start: { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: fim.toISOString(), timeZone: 'America/Sao_Paulo' },
        attendees: [{ email }],
      },
    })

    await supabase
      .from('agendamentos')
      .update({ google_event_id: evento.data.id })
      .eq('id', agendamento.id)

  } catch (e) {
    console.error('Erro Google Agenda:', e.message)
  }

  // E-mails
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Vistoria confirmada!',
      html: `<h2>Olá, ${nome}!</h2>
             <p>Sua vistoria foi agendada com sucesso.</p>
             <p><strong>Data:</strong> ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
             <p><strong>Horário:</strong> ${horario}</p>
             <p><strong>Apartamento:</strong> ${apartamento}</p>
             <p>Qualquer dúvida, entre em contato com nossa equipe.</p>`
    })

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.EMAIL_EQUIPE,
      subject: `Nova vistoria — ${apartamento}`,
      html: `<h2>Novo agendamento de vistoria</h2>
             <p><strong>Cliente:</strong> ${nome}</p>
             <p><strong>CPF:</strong> ${cpf}</p>
             <p><strong>E-mail:</strong> ${email}</p>
             <p><strong>Telefone:</strong> ${telefone}</p>
             <p><strong>Apartamento:</strong> ${apartamento}</p>
             <p><strong>Data:</strong> ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
             <p><strong>Horário:</strong> ${horario}</p>`
    })
  } catch (e) {
    console.error('Erro e-mail:', e.message)
  }

  return NextResponse.json({ success: true, agendamento })
}

export async function GET() {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .order('data', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}