import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function POST(request) {
  try {
    const { destinatarios, assunto, mensagem } = await request.json()

    if (!destinatarios || destinatarios.length === 0) {
      return NextResponse.json({ error: 'Nenhum destinatario informado.' }, { status: 400 })
    }
    if (!assunto || !mensagem) {
      return NextResponse.json({ error: 'Assunto e mensagem sao obrigatorios.' }, { status: 400 })
    }

    const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
      <tr><td style="background:linear-gradient(135deg,#1B2F7E 0%,#2a4db5 100%);padding:36px 32px;text-align:center;">
        <p style="color:#fff;font-size:26px;font-weight:900;margin:0 0 6px;letter-spacing:0.08em;font-family:Georgia,serif;">MARKINVEST</p>
        <p style="color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;margin:0;">Comunicado</p>
      </td></tr>
      <tr><td style="background:#ffffff;padding:36px 32px;">
        <div style="font-size:14px;color:#374151;line-height:1.8;">${mensagem.replace(/\n/g,'<br/>')}</div>
      </td></tr>
      <tr><td style="background:#1B2F7E;padding:24px 32px;text-align:center;">
        <p style="color:#fff;font-size:15px;font-weight:700;margin:0 0 6px;">MARKINVEST</p>
        <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 6px;">Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo</p>
        <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">Este e-mail foi enviado pela equipe Markinvest.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`

    const erros = []
    let enviados = 0

    for (const email of destinatarios) {
      try {
        await transporter.sendMail({
          from: '"Markinvest" <' + process.env.EMAIL_USER + '>',
          to: email,
          subject: assunto,
          html,
        })
        enviados++
      } catch(e) {
        erros.push(email)
      }
    }

    return NextResponse.json({ success: true, enviados, erros })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}