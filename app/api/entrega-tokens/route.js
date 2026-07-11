import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

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
  const { cpfs, empreendimento } = await request.json()
  if (!cpfs || cpfs.length === 0) {
    return NextResponse.json({ error: 'Nenhum CPF informado.' }, { status: 400 })
  }

  const resultados = { enviados: 0, erros: [] }

  for (const cpfLimpo of cpfs) {
    try {
      // Buscar dados do CPF
      const { data: cliente } = await supabase
        .from('entrega_cpfs_autorizados')
        .select('*')
        .eq('cpf', cpfLimpo)
        .maybeSingle()

      if (!cliente || !cliente.email) {
        resultados.erros.push(cpfLimpo + ' (sem email)')
        continue
      }

      // Verificar se ja agendou
      const { data: jaAgendou } = await supabase
        .from('entrega_agendamentos')
        .select('id')
        .eq('cpf', cpfLimpo)
        .eq('status', 'confirmado')
        .maybeSingle()

      if (jaAgendou) {
        resultados.erros.push(cpfLimpo + ' (ja agendou)')
        continue
      }

      // Gerar token unico
      const token = crypto.randomBytes(32).toString('hex')
      const expiraEm = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias

      // Salvar token
      await supabase.from('entrega_tokens').insert([{
        cpf: cpfLimpo,
        token,
        empreendimento: empreendimento || '',
        usado: false,
        expira_em: expiraEm.toISOString()
      }])

      const link = process.env.NEXTAUTH_URL + '/markinvest/entrega?token=' + token

      // Enviar email
      await transporter.sendMail({
        from: '"Markinvest" <' + process.env.EMAIL_USER + '>',
        to: cliente.email,
        replyTo: 'noreply@markinvest.com.br, relacionamento@markinvest.com.br',
        subject: 'Agende sua Entrega de Chaves - Markinvest',
        html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
      <tr><td style="background:linear-gradient(135deg,#1B2F7E 0%,#2a4db5 100%);padding:36px 32px;text-align:center;">
        <p style="color:#fff;font-size:26px;font-weight:900;margin:0 0 6px;letter-spacing:0.08em;font-family:Georgia,serif;">MARKINVEST</p>
        <p style="color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;margin:0;">Entrega de Chaves</p>
      </td></tr>
      <tr><td style="background:#1d9e75;padding:14px 32px;text-align:center;">
        <p style="color:#fff;font-size:13px;font-weight:700;margin:0;">&#127775; Sua unidade esta pronta para entrega!</p>
      </td></tr>
      <tr><td style="background:#ffffff;padding:36px 32px;">
        <p style="color:#1B2F7E;font-size:22px;font-family:Georgia,serif;font-weight:400;margin:0 0 8px;">Ola, ${cliente.nome || 'Cliente'}!</p>
        <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 20px;">Temos uma otima noticia: sua unidade <strong>${cliente.unidade || ''}</strong> no <strong>${empreendimento || cliente.empreendimento || ''}</strong> esta pronta para a entrega de chaves!</p>
        <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 28px;">Clique no botao abaixo para escolher o melhor dia e horario para voce. As vagas sao limitadas e preenchidas por ordem de acesso.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${link}" style="display:inline-block;background:#1B2F7E;color:#fff;font-size:15px;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.04em;">AGENDAR MINHA ENTREGA</a>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-radius:10px;border-left:4px solid #f59e0b;margin-bottom:24px;">
          <tr><td style="padding:14px 18px;">
            <p style="font-size:13px;color:#92400e;font-weight:600;margin:0 0 4px;">&#9888; Importante</p>
            <p style="font-size:13px;color:#92400e;margin:0;line-height:1.5;">Este link e exclusivo para voce e expira apos o uso. Nao compartilhe com terceiros. Apresente documento com foto no dia da entrega.</p>
          </td></tr>
        </table>
        <p style="font-size:12px;color:#9ca3af;text-align:center;">Se o botao nao funcionar, copie e cole este link no navegador:<br/><span style="color:#1B2F7E;word-break:break-all;">${link}</span></p>
      </td></tr>
      <tr><td style="background:#1B2F7E;padding:24px 32px;text-align:center;">
        <p style="color:#fff;font-size:15px;font-weight:700;margin:0 0 6px;">MARKINVEST</p>
        <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 6px;">Rua Pedroso Alvarenga, 1284 - Cj. 21 - Itaim Bibi - Sao Paulo</p>
        <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">Este e-mail foi gerado automaticamente.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      })

      resultados.enviados++
    } catch(e) {
      resultados.erros.push(cpfLimpo + ' (erro: ' + e.message + ')')
    }
  }

  return NextResponse.json({ success: true, ...resultados })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ valido: false })

  const { data } = await supabase
    .from('entrega_tokens')
    .select('*, entrega_cpfs_autorizados!inner(nome, unidade, empreendimento)')
    .eq('token', token)
    .eq('usado', false)
    .maybeSingle()

  if (!data) return NextResponse.json({ valido: false, motivo: 'Token invalido ou ja utilizado.' })

  if (data.expira_em && new Date(data.expira_em) < new Date()) {
    return NextResponse.json({ valido: false, motivo: 'Token expirado.' })
  }

  return NextResponse.json({
    valido: true,
    cpf: data.cpf,
    empreendimento: data.empreendimento,
    nome: data.entrega_cpfs_autorizados?.nome || '',
    unidade: data.entrega_cpfs_autorizados?.unidade || ''
  })
}