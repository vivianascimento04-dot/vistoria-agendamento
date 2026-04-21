import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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

export async function POST(request) {
  const body = await request.json()
  const { nome, cpf, email, telefone, apartamento, data, horario } = body

  if (!nome || !cpf || !email || !telefone || !apartamento || !data || !horario) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatorios.' }, { status: 400 })
  }

  const cpfLimpo = cpf.replace(/\D/g, '')
  const { data: todosAgends } = await supabase
    .from('agendamentos')
    .select('id, cpf')
    .eq('status', 'confirmado')

  const cpfJaAgendado = (todosAgends || []).some(
    a => a.cpf && a.cpf.replace(/\D/g, '') === cpfLimpo
  )

  if (cpfJaAgendado) {
    return NextResponse.json(
      { error: 'Seu horario ja esta confirmado. Por favor, entre em contato com o Relacionamento.' },
      { status: 409 }
    )
  }

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
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
    const calendar = google.calendar({ version: 'v3', auth })
    const inicio = new Date(data + 'T' + horario + ':00')
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000)
    const evento = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: 'Vistoria - ' + apartamento + ' (' + nome + ')',
        description: 'Cliente: ' + nome + '\nApto: ' + apartamento + '\nCPF: ' + cpf + '\nTel: ' + telefone + '\nEmail: ' + email,
        start: { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: fim.toISOString(), timeZone: 'America/Sao_Paulo' },
        attendees: [{ email }],
      },
    })
    await supabase.from('agendamentos').update({ google_event_id: evento.data.id }).eq('id', agendamento.id)
  } catch (e) {
    console.error('Erro Google Agenda:', e.message)
  }

  const dataFormatada = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)

  const emailsEquipe = [process.env.EMAIL_EQUIPE].filter(Boolean).join(',')

  try {
    // Email confirmacao para o cliente
    await transporter.sendMail({
      from: '"Markinvest" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Vistoria Confirmada - Markinvest',
      html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
      <tr>
        <td style="background:linear-gradient(135deg,#1B2F7E 0%,#2a4db5 100%);padding:36px 32px;text-align:center;">
          <p style="color:#fff;font-size:26px;font-weight:900;margin:0 0 6px;letter-spacing:0.08em;font-family:Georgia,serif;">MARKINVEST</p>
          <p style="color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;margin:0;">Sistema de Agendamento de Vistoria</p>
        </td>
      </tr>
      <tr>
        <td style="background:#16a34a;padding:14px 32px;text-align:center;">
          <p style="color:#fff;font-size:13px;font-weight:700;margin:0;">&#10003; AGENDAMENTO CONFIRMADO COM SUCESSO</p>
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;padding:36px 32px;">
          <p style="color:#1B2F7E;font-size:22px;font-family:Georgia,serif;font-weight:400;margin:0 0 8px;">Ola, ${nome}!</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 28px;">Sua vistoria foi agendada com sucesso. Confira os detalhes abaixo.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border-radius:12px;border:1px solid #e0e5f5;margin-bottom:24px;">
            <tr><td style="padding:16px 24px;border-bottom:1px solid #e0e5f5;">
              <p style="font-size:10px;font-weight:700;color:#1B2F7E;text-transform:uppercase;letter-spacing:0.12em;margin:0;">DETALHES DA VISTORIA</p>
            </td></tr>
            <tr><td style="padding:4px 24px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f8;width:40%;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">Data</p></td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:14px;font-weight:700;color:#1B2F7E;margin:0;">${dataCapitalizada}</p></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">Horario</p></td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:14px;font-weight:700;color:#1B2F7E;margin:0;">${horario}</p></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">Unidade</p></td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:14px;font-weight:600;color:#374151;margin:0;">${apartamento}</p></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">Telefone</p></td>
                  <td style="padding:10px 0;"><p style="font-size:14px;color:#374151;margin:0;">${telefone}</p></td>
                </tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-radius:10px;border-left:4px solid #f59e0b;margin-bottom:24px;">
            <tr><td style="padding:14px 18px;">
              <p style="font-size:13px;color:#92400e;font-weight:600;margin:0 0 4px;">&#9888; Informacao importante</p>
              <p style="font-size:13px;color:#92400e;margin:0;line-height:1.5;">Seu horario ja esta confirmado. Em caso de duvidas ou necessidade de alteracao, entre em contato com o Relacionamento.</p>
            </td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px;line-height:1.7;margin:0;">Alteracoes so podem ser realizadas pela equipe MARKINVEST. Aguardamos voce!</p>
        </td>
      </tr>
      <tr>
        <td style="background:#1B2F7E;padding:24px 32px;text-align:center;">
          <p style="color:#fff;font-size:15px;font-weight:700;margin:0 0 6px;">MARKINVEST</p>
          <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 6px;">Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo</p>
          <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">relacionamento@markinvest.com.br | Este e-mail foi gerado automaticamente.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
    })

    // Email notificacao para a equipe com CCO para relacionamento@markinvest.com.br
    await transporter.sendMail({
      from: '"Markinvest" <' + process.env.EMAIL_USER + '>',
      to: emailsEquipe,
      bcc: 'relacionamento@markinvest.com.br',
      subject: 'Nova Vistoria - ' + apartamento + ' | ' + dataCapitalizada,
      html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
      <tr>
        <td style="background:linear-gradient(135deg,#1B2F7E 0%,#2a4db5 100%);padding:36px 32px;text-align:center;">
          <p style="color:#fff;font-size:26px;font-weight:900;margin:0 0 6px;letter-spacing:0.08em;font-family:Georgia,serif;">MARKINVEST</p>
          <p style="color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;margin:0;">Novo Agendamento de Vistoria</p>
        </td>
      </tr>
      <tr>
        <td style="background:#1e40af;padding:12px 32px;text-align:center;">
          <p style="color:#fff;font-size:12px;font-weight:600;margin:0;">&#128197; Nova vistoria: ${dataCapitalizada} as ${horario}</p>
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;padding:36px 32px;">
          <p style="color:#1B2F7E;font-size:20px;font-family:Georgia,serif;font-weight:400;margin:0 0 24px;">Novo agendamento recebido</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border-radius:12px;border:1px solid #e0e5f5;margin-bottom:20px;">
            <tr><td style="padding:16px 24px;border-bottom:1px solid #e0e5f5;">
              <p style="font-size:10px;font-weight:700;color:#1B2F7E;text-transform:uppercase;letter-spacing:0.12em;margin:0;">DADOS DO CLIENTE</p>
            </td></tr>
            <tr><td style="padding:4px 24px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:9px 0;border-bottom:1px solid #eef0f8;width:35%;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">Nome</p></td>
                  <td style="padding:9px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:14px;font-weight:700;color:#111;margin:0;">${nome}</p></td>
                </tr>
                <tr>
                  <td style="padding:9px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">CPF</p></td>
                  <td style="padding:9px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:14px;color:#374151;margin:0;">${cpf}</p></td>
                </tr>
                <tr>
                  <td style="padding:9px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">E-mail</p></td>
                  <td style="padding:9px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:14px;color:#1B2F7E;font-weight:600;margin:0;">${email}</p></td>
                </tr>
                <tr>
                  <td style="padding:9px 0;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">Telefone</p></td>
                  <td style="padding:9px 0;"><p style="font-size:14px;color:#374151;margin:0;">${telefone}</p></td>
                </tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;border:2px solid #1B2F7E;margin-bottom:20px;">
            <tr><td style="background:#1B2F7E;padding:16px 24px;border-radius:10px 10px 0 0;">
              <p style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.12em;margin:0;">DADOS DA VISTORIA</p>
            </td></tr>
            <tr><td style="padding:4px 24px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f8;width:35%;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">Data</p></td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:15px;font-weight:700;color:#1B2F7E;margin:0;">${dataCapitalizada}</p></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">Horario</p></td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f8;"><p style="font-size:15px;font-weight:700;color:#1B2F7E;margin:0;">${horario}</p></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;"><p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin:0;">Unidade</p></td>
                  <td style="padding:10px 0;"><p style="font-size:14px;font-weight:600;color:#374151;margin:0;">${apartamento}</p></td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background:#1B2F7E;padding:24px 32px;text-align:center;">
          <p style="color:#fff;font-size:15px;font-weight:700;margin:0 0 6px;">MARKINVEST</p>
          <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 6px;">Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo</p>
          <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">Este e-mail foi gerado automaticamente.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
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
    .order('criado_em', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
