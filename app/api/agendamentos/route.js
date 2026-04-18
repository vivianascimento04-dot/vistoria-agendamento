import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const RODAPE = `
  <div style="background:#1B2F7E;padding:20px 24px;text-align:center;">
    <p style="margin:0 0 6px;font-weight:700;color:#fff;font-size:15px;letter-spacing:0.08em;">MARK INVEST</p>
    <p style="margin:0 0 6px;color:#fff;font-size:13px;font-weight:600;">Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo</p>
    <div style="width:40px;height:1px;background:rgba(255,255,255,0.3);margin:10px auto;"></div>
    <p style="margin:0;color:rgba(255,255,255,0.6);font-size:11px;font-style:italic;">Este e-mail foi gerado automaticamente. Nao responda esta mensagem.</p>
  </div>`

export async function POST(request) {
  const body = await request.json()
  const { nome, cpf, email, telefone, empreendimento, torre, apartamento, data, horario } = body

  // Validacoes obrigatorias
  if (!nome || !cpf || !email || !telefone || !empreendimento || !torre || !apartamento || !data || !horario) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatorios.' }, { status: 400 })
  }

  // Regra: CPF ja tem agendamento ativo
  const cpfLimpo = cpf.replace(/\D/g, '')
  const { data: cpfExistente } = await supabase
    .from('agendamentos')
    .select('id')
    .ilike('cpf', '%' + cpfLimpo.slice(0,3) + '%')
    .eq('status', 'confirmado')
    .maybeSingle()

  // Busca mais precisa por CPF
  const { data: agendsCPF } = await supabase
    .from('agendamentos')
    .select('id, cpf')
    .eq('status', 'confirmado')

  const cpfJaAgendado = agendsCPF?.some(a => a.cpf && a.cpf.replace(/\D/g,'') === cpfLimpo)

  if (cpfJaAgendado) {
    return NextResponse.json(
      { error: 'Seu horario ja esta confirmado. Por favor, entre em contato com o Relacionamento.' },
      { status: 409 }
    )
  }

  // Regra: horario ja ocupado
  const { data: horarioOcupado } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('data', data)
    .eq('horario', horario)
    .eq('status', 'confirmado')
    .maybeSingle()

  if (horarioOcupado) {
    return NextResponse.json({ error: 'Horario ja ocupado' }, { status: 409 })
  }

  // Salvar
  const aptoCompleto = empreendimento + ' - Torre ' + torre + ', Apto ' + apartamento
  const { data: agendamento, error } = await supabase
    .from('agendamentos')
    .insert([{ nome, cpf, email, telefone, apartamento: aptoCompleto, data, horario }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Horario ja ocupado' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Google Agenda
  try {
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
    const calendar = google.calendar({ version: 'v3', auth })
    const inicio = new Date(data + 'T' + horario + ':00')
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000)
    const evento = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: 'Vistoria - ' + aptoCompleto + ' (' + nome + ')',
        description: 'Cliente: ' + nome + '\nApto: ' + aptoCompleto + '\nCPF: ' + cpf + '\nTel: ' + telefone + '\nEmail: ' + email,
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
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)

  // Email equipe
  try {
    await transporter.sendMail({
      from: `"Mark Invest" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_EQUIPE,
      subject: 'Nova Vistoria Agendada - ' + empreendimento + ' Torre ' + torre + ' Apto ' + apartamento,
      html: `
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="background:#1B2F7E;padding:28px 24px;text-align:center;">
    <p style="color:#fff;font-size:24px;font-weight:700;margin:0 0 4px;letter-spacing:0.05em;">MARK INVEST</p>
    <p style="color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin:0;">Novo Agendamento de Vistoria</p>
  </div>
  <div style="padding:32px 24px;background:#ffffff;">
    <h2 style="color:#1B2F7E;font-family:Georgia,serif;font-weight:400;margin:0 0 6px;font-size:22px;">Novo agendamento recebido</h2>
    <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">Vistoria agendada em ${dataCapitalizada} as ${horario}</p>

    <div style="background:#E8EBF5;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <p style="font-size:11px;font-weight:700;color:#1B2F7E;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;border-bottom:1px solid #c0c9e8;padding-bottom:8px;">DADOS DO CLIENTE</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #d0d9ee;"><td style="padding:8px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;width:35%;">Nome</td><td style="padding:8px 0;font-weight:700;color:#111;">${nome}</td></tr>
        <tr style="border-bottom:1px solid #d0d9ee;"><td style="padding:8px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;">CPF</td><td style="padding:8px 0;color:#374151;">${cpf}</td></tr>
        <tr style="border-bottom:1px solid #d0d9ee;"><td style="padding:8px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;">E-mail</td><td style="padding:8px 0;color:#1B2F7E;font-weight:600;">${email}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;">Telefone</td><td style="padding:8px 0;color:#374151;">${telefone}</td></tr>
      </table>
    </div>

    <div style="background:#f8f9ff;border-radius:12px;padding:20px 24px;">
      <p style="font-size:11px;font-weight:700;color:#1B2F7E;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;border-bottom:1px solid #e0e5f5;padding-bottom:8px;">DADOS DA VISTORIA</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #e0e5f5;"><td style="padding:8px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;width:35%;">Empreendimento</td><td style="padding:8px 0;font-weight:700;color:#1B2F7E;">${empreendimento}</td></tr>
        <tr style="border-bottom:1px solid #e0e5f5;"><td style="padding:8px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;">Torre / Apto</td><td style="padding:8px 0;font-weight:600;color:#374151;">Torre ${torre}, Apto ${apartamento}</td></tr>
        <tr style="border-bottom:1px solid #e0e5f5;"><td style="padding:8px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;">Data</td><td style="padding:8px 0;font-weight:700;color:#1B2F7E;">${dataCapitalizada}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;">Horario</td><td style="padding:8px 0;font-weight:700;color:#1B2F7E;">${horario}</td></tr>
      </table>
    </div>
  </div>
  ${RODAPE}
</div>`
    })
    console.log('Email equipe enviado com sucesso')
  } catch (e) {
    console.error('Erro email equipe:', e.message)
  }

  // Email cliente
  try {
    await transporter.sendMail({
      from: `"Mark Invest" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Vistoria Confirmada - Mark Invest',
      html: `
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="background:#1B2F7E;padding:28px 24px;text-align:center;">
    <p style="color:#fff;font-size:24px;font-weight:700;margin:0 0 4px;letter-spacing:0.05em;">MARK INVEST</p>
    <p style="color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin:0;">Sistema de Agendamento de Vistoria</p>
  </div>
  <div style="padding:32px 24px;background:#ffffff;">
    <h2 style="color:#1B2F7E;font-family:Georgia,serif;font-weight:400;margin:0 0 8px;font-size:22px;">Sua vistoria foi agendada!</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6;">Ola, <strong style="color:#111;">${nome}</strong>. Seu agendamento foi confirmado com sucesso.</p>

    <div style="background:#E8EBF5;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:700;color:#1B2F7E;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;border-bottom:1px solid #c0c9e8;padding-bottom:8px;">RESUMO DO AGENDAMENTO</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:7px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;width:40%;">Data</td><td style="padding:7px 0;font-weight:700;color:#1B2F7E;">${dataCapitalizada}</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;">Horario</td><td style="padding:7px 0;font-weight:700;color:#1B2F7E;">${horario}</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;">Empreendimento</td><td style="padding:7px 0;font-weight:600;color:#374151;">${empreendimento}</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;">Torre / Apto</td><td style="padding:7px 0;font-weight:600;color:#374151;">Torre ${torre}, Apto ${apartamento}</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;">Telefone</td><td style="padding:7px 0;color:#374151;">${telefone}</td></tr>
      </table>
    </div>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
      <p style="color:#15803d;font-size:13px;font-weight:600;margin:0;">&#10003; Agendamento confirmado! Fique atento ao horario marcado.</p>
    </div>

    <p style="color:#6b7280;font-size:13px;line-height:1.7;margin:0;">Em caso de duvidas ou necessidade de alteracao, entre em contato com nossa equipe de Relacionamento. Alteracoes so podem ser realizadas pela equipe Mark Invest.</p>
  </div>
  ${RODAPE}
</div>`
    })
    console.log('Email cliente enviado com sucesso')
  } catch (e) {
    console.error('Erro email cliente:', e.message)
  }

  return NextResponse.json({ success: true, agendamento })
}

export async function GET() {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .order('criado_em', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}