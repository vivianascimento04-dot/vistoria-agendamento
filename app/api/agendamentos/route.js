import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const body = await request.json()
  const { nome, cpf, email, telefone, apartamento, data, horario } = body

  const { data: agendamentoExistente } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('apartamento', apartamento)
    .eq('status', 'confirmado')
    .single()

  if (agendamentoExistente) {
    return NextResponse.json(
      { error: 'Este apartamento ja possui uma vistoria agendada. Entre em contato com nossa equipe.' },
      { status: 409 }
    )
  }

  const { data: horarioOcupado } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('data', data)
    .eq('horario', horario)
    .eq('status', 'confirmado')
    .single()

  if (horarioOcupado) {
    return NextResponse.json({ error: 'Horario ja ocupado' }, { status: 409 })
  }

  const { data: agendamento, error } = await supabase
    .from('agendamentos')
    .insert([{ nome, cpf, email, telefone, apartamento, data, horario }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Horario ja ocupado' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
    const calendar = google.calendar({ version: 'v3', auth })
    const inicio = new Date(data + 'T' + horario + ':00')
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000)
    const evento = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: 'Vistoria - ' + apartamento + ' (' + nome + ')',
        description: 'Cliente: ' + nome + '\nApto: ' + apartamento + '\nTel: ' + telefone + '\nEmail: ' + email,
        start: { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: fim.toISOString(), timeZone: 'America/Sao_Paulo' },
        attendees: [{ email }],
      },
    })
    await supabase.from('agendamentos').update({ google_event_id: evento.data.id }).eq('id', agendamento.id)
  } catch (e) {
    console.error('Erro Google Agenda:', e.message)
  }

  const dataFormatada = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  const rodape = `
  <div style="background:#1B2F7E;padding:20px 24px;text-align:center;">
    <p style="margin:0 0 8px;font-weight:700;color:#fff;font-size:15px;letter-spacing:0.08em;">MARK INVEST</p>
    <p style="margin:0 0 6px;color:#fff;font-size:13px;font-weight:600;">Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo</p>
    <div style="width:40px;height:1px;background:rgba(255,255,255,0.3);margin:10px auto;"></div>
    <p style="margin:0;color:rgba(255,255,255,0.6);font-size:11px;font-style:italic;">Este e-mail foi gerado automaticamente. Nao responda esta mensagem.</p>
  </div>`

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Sua vistoria foi agendada! - Mark Invest',
      html: `
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="background:#1B2F7E;padding:28px 24px;text-align:center;">
    <p style="color:#fff;font-size:22px;font-weight:700;margin:0 0 4px;letter-spacing:0.05em;">MARK INVEST</p>
    <p style="color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin:0;">Sistema de Agendamento de Vistoria</p>
  </div>
  <div style="padding:32px 24px;background:#ffffff;">
    <h2 style="color:#1B2F7E;font-family:Georgia,serif;font-weight:400;margin:0 0 8px;font-size:22px;">Sua vistoria foi agendada!</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6;">Ola, <strong style="color:#111;">${nome}</strong>. Seu agendamento foi confirmado com sucesso.</p>
    <div style="background:#E8EBF5;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;width:40%;">Data</td><td style="padding:8px 0;font-weight:700;color:#1B2F7E;">${dataFormatada}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;">Horario</td><td style="padding:8px 0;font-weight:700;color:#1B2F7E;">${horario}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;">Unidade</td><td style="padding:8px 0;color:#374151;">${apartamento}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;">Telefone</td><td style="padding:8px 0;color:#374151;">${telefone}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.7;margin:0;">Em caso de duvidas ou necessidade de alteracao, entre em contato com nossa equipe. Alteracoes so podem ser realizadas pela equipe Mark Invest.</p>
  </div>
  ${rodape}
</div>`
    })

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.EMAIL_EQUIPE,
      subject: 'Nova vistoria - ' + apartamento,
      html: `
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="background:#1B2F7E;padding:28px 24px;text-align:center;">
    <p style="color:#fff;font-size:22px;font-weight:700;margin:0 0 4px;letter-spacing:0.05em;">MARK INVEST</p>
    <p style="color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin:0;">Novo Agendamento de Vistoria</p>
  </div>
  <div style="padding:32px 24px;background:#ffffff;">
    <h2 style="color:#1B2F7E;font-family:Georgia,serif;font-weight:400;margin:0 0 24px;font-size:22px;">Novo agendamento recebido</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;width:35%;">Cliente</td><td style="padding:10px 0;font-weight:600;color:#111;">${nome}</td></tr>
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;">CPF</td><td style="padding:10px 0;color:#374151;">${cpf || 'Nao informado'}</td></tr>
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;">E-mail</td><td style="padding:10px 0;color:#1B2F7E;font-weight:600;">${email}</td></tr>
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;">Telefone</td><td style="padding:10px 0;color:#374151;">${telefone}</td></tr>
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;">Unidade</td><td style="padding:10px 0;color:#374151;">${apartamento}</td></tr>
      <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;">Data</td><td style="padding:10px 0;font-weight:700;color:#1B2F7E;">${dataFormatada}</td></tr>
      <tr><td style="padding:10px 0;color:#6b7280;font-weight:700;text-transform:uppercase;font-size:11px;">Horario</td><td style="padding:10px 0;font-weight:700;color:#1B2F7E;">${horario}</td></tr>
    </table>
  </div>
  ${rodape}
</div>`
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