'use client'
import { useState, useEffect } from 'react'

const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const AZUL = '#1B2F7E'
const AZUL_CLARO = '#E8EBF5'
const VERMELHO = '#C0392B'
const WHATSAPP_NUMERO = '5511999999999'

export default function Home() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [dataSel, setDataSel] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [horarioSel, setHorarioSel] = useState(null)
  const [diasCheios, setDiasCheios] = useState([])
  const [form, setForm] = useState({ nome:'', cpf:'', email:'', telefone:'', empreendimento:'', torre:'', bloco:'', apartamento:'' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [etapa, setEtapa] = useState(1)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    carregarDiasCheios(ano, mes)
  }, [ano, mes])

  async function carregarDiasCheios(a, m) {
    const mesStr = a + '-' + String(m + 1).padStart(2, '0')
    const res = await fetch('/api/horarios?mes=' + mesStr)
    const data = await res.json()
    setDiasCheios(data.diasCheios || [])
  }

  async function selecionarData(ds) {
    setDataSel(ds)
    setHorarioSel(null)
    const res = await fetch('/api/horarios?data=' + ds)
    const data = await res.json()
    setHorarios(data)
  }

  function selecionarHorario(h) {
    setHorarioSel(h)
    setEtapa(2)
  }

  async function confirmar() {
    const { nome, email, telefone, empreendimento, torre, bloco, apartamento } = form
    if (!nome || !email || !telefone || !empreendimento || !torre || !bloco || !apartamento) {
      setErro('Preencha todos os campos obrigatorios.')
      return
    }
    setLoading(true)
    setErro('')
    const aptoCompleto = empreendimento + ' - Torre ' + torre + ', Bloco ' + bloco + ', Apto ' + apartamento
    const res = await fetch('/api/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, apartamento: aptoCompleto, data: dataSel, horario: horarioSel })
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setEtapa(3)
    } else {
      if (data.error && data.error.includes('ja possui uma vistoria')) {
        setErro('Este apartamento ja possui uma vistoria agendada. Entre em contato com nossa equipe.')
      } else if (data.error === 'Horario ja ocupado') {
        setErro('Este horario acabou de ser reservado. Escolha outro horario.')
      } else {
        setErro('Erro ao agendar. Tente novamente.')
      }
    }
  }

  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  function prevMes() {
    if (mes === 0) { setMes(11); setAno(a => a-1) } else setMes(m => m-1)
    setDataSel(null); setHorarios([])
  }
  function nextMes() {
    if (mes === 11) { setMes(0); setAno(a => a+1) } else setMes(m => m+1)
    setDataSel(null); setHorarios([])
  }

  const dataFormatada = dataSel ? new Date(dataSel+'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : ''
  const inp = { width:'100%', padding:'10px 12px', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }

  const msgWhatsApp = encodeURIComponent(
    'Ola! Acabei de agendar minha vistoria pela plataforma Mark Invest.\n\n' +
    'Nome: ' + form.nome + '\n' +
    'Data: ' + dataFormatada + '\n' +
    'Horario: ' + horarioSel + '\n' +
    'Unidade: Torre ' + form.torre + ', Bloco ' + form.bloco + ', Apto ' + form.apartamento + '\n' +
    'Empreendimento: ' + form.empreendimento + '\n\n' +
    'Aguardo a confirmacao. Obrigado!'
  )

  return (
    <main style={{minHeight:'100vh', background:'#f4f6fb', fontFamily:"'Segoe UI',sans-serif", margin:0, padding:0}}>

      <div style={{background: AZUL, padding:'1.25rem 1rem', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <img src="/logo.png" alt="Mark Invest" style={{height: isMobile ? '40px' : '52px', objectFit:'contain', filter:'brightness(0) invert(1)', marginBottom:'8px'}}/>
        <p style={{color:'rgba(255,255,255,0.7)', fontSize: isMobile ? '10px' : '12px', letterSpacing:'0.12em', textTransform:'uppercase', margin:0, textAlign:'center'}}>Sistema de Agendamento de Vistoria</p>
      </div>

      <div style={{background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0.75rem 1rem', display:'flex', justifyContent:'center'}}>
        {[{n:1,label: isMobile ? 'DATA' : 'DATA E HORARIO'},{n:2,label: isMobile ? 'DADOS' : 'SEUS DADOS'},{n:3,label:'CONFIRMACAO'}].map((e,i) => (
          <div key={e.n} style={{display:'flex', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
              <div style={{width:'24px', height:'24px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', background: etapa>=e.n ? AZUL : '#f3f4f6', color: etapa>=e.n ? '#fff' : '#9ca3af', flexShrink:0}}>{etapa>e.n ? 'v' : e.n}</div>
              <span style={{fontSize:'10px', fontWeight:'700', letterSpacing:'0.03em', color: etapa===e.n ? AZUL : '#9ca3af'}}>{e.label}</span>
            </div>
            {i<2 && <div style={{width: isMobile ? '16px' : '32px', height:'1px', background: etapa>e.n ? AZUL : '#e5e7eb', margin:'0 4px', flexShrink:0}}/>}
          </div>
        ))}
      </div>

      <div style={{maxWidth:'900px', margin:'0 auto', padding: isMobile ? '1rem' : '2rem 1rem'}}>

        {etapa === 1 && (
          <div style={{display:'grid', gridTemplateColumns: (!isMobile && horarios.length > 0) ? '1fr 1fr' : '1fr', gap:'1rem', alignItems:'start'}}>
            <div style={{background:'#fff', borderRadius:'16px', padding: isMobile ? '1rem' : '1.5rem', boxShadow:'0 2px 8px rgba(27,47,126,0.08)'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
                <button onClick={prevMes} style={{background:'none', border:'1px solid #dde1f0', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'18px', color: AZUL, fontWeight:'bold', flexShrink:0}}>&#8249;</button>
                <span style={{fontFamily:'Georgia,serif', fontSize: isMobile ? '14px' : '16px', color: AZUL, fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em'}}>{MESES[mes]} {ano}</span>
                <button onClick={nextMes} style={{background:'none', border:'1px solid #dde1f0', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'18px', color: AZUL, fontWeight:'bold', flexShrink:0}}>&#8250;</button>
              </div>
              <div style={{display:'flex', gap:'10px', marginBottom:'10px', flexWrap:'wrap'}}>
                <div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#6b7280'}}><div style={{width:'10px', height:'10px', borderRadius:'2px', background: VERMELHO}}></div><span>Selecionado</span></div>
                <div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#6b7280'}}><div style={{width:'10px', height:'10px', borderRadius:'2px', background:'#fee2e2', border:'1px solid #fca5a5'}}></div><span>Lotado</span></div>
                <div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#6b7280'}}><div style={{width:'10px', height:'10px', borderRadius:'2px', border:'1px solid #e5e7eb'}}></div><span>Disponivel</span></div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', textAlign:'center', marginBottom:'6px'}}>
                {['D','S','T','Q','Q','S','S'].map((d,i) => (
                  <span key={i} style={{fontSize:'11px', fontWeight:'700', color:'#9ca3af', padding:'3px 0'}}>{d}</span>
                ))}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px'}}>
                {Array(primeiroDia).fill(null).map((_,i) => <div key={i}/>)}
                {Array(diasNoMes).fill(null).map((_,i) => {
                  const d = i+1
                  const date = new Date(ano, mes, d)
                  const dow = date.getDay()
                  const isPast = date < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
                  const isWeekend = dow===0||dow===6
                  const ds = ano+'-'+String(mes+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
                  const isSel = dataSel===ds
                  const isToday = d===hoje.getDate()&&mes===hoje.getMonth()&&ano===hoje.getFullYear()
                  const isCheio = diasCheios.includes(ds)
                  if (isPast||isWeekend) return (
                    <div key={d} style={{aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'#d1d5db', borderRadius:'6px'}}>{d}</div>
                  )
                  if (isCheio && !isSel) return (
                    <div key={d} style={{aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'11px', color:'#ef4444', borderRadius:'6px', background:'#fee2e2', border:'1px solid #fca5a5', cursor:'not-allowed', fontWeight:'500'}}>
                      {d}<div style={{fontSize:'7px', fontWeight:'700', marginTop:'1px'}}>LOTADO</div>
                    </div>
                  )
                  return (
                    <div key={d} onClick={() => selecionarData(ds)} style={{aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight: isSel?'700':'500', borderRadius:'6px', cursor:'pointer', background: isSel ? VERMELHO : isToday ? AZUL_CLARO : 'transparent', color: isSel ? '#fff' : isToday ? AZUL : '#333', border: isSel ? '1px solid '+VERMELHO : isToday ? '1px solid '+AZUL : '1px solid #e5e7eb', transition:'all 0.15s'}}>{d}</div>
                  )
                })}
              </div>
            </div>

            {horarios.length > 0 && (
              <div style={{background:'#fff', borderRadius:'16px', padding: isMobile ? '1rem' : '1.5rem', boxShadow:'0 2px 8px rgba(27,47,126,0.08)'}}>
                <p style={{fontSize:'11px', fontWeight:'700', color: AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 4px'}}>HORARIOS DISPONIVEIS</p>
                <p style={{fontSize:'12px', color:'#6b7280', margin:'0 0 1rem', textTransform:'capitalize'}}>{dataFormatada}</p>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                  {horarios.map(h => (
                    <div key={h.horario} onClick={() => h.disponivel && selecionarHorario(h.horario)} style={{padding: isMobile ? '12px 6px' : '14px', textAlign:'center', borderRadius:'10px', fontSize: isMobile ? '14px' : '15px', fontWeight:'700', border: horarioSel===h.horario ? '2px solid '+VERMELHO : '1px solid #dde1f0', cursor: h.disponivel?'pointer':'not-allowed', background: horarioSel===h.horario ? VERMELHO : !h.disponivel ? '#f9fafb' : '#fff', color: horarioSel===h.horario ? '#fff' : !h.disponivel ? '#d1d5db' : AZUL, textDecoration: !h.disponivel?'line-through':'none', transition:'all 0.15s'}}>
                      {h.horario}
                      {!h.disponivel && <div style={{fontSize:'9px', fontWeight:'400', marginTop:'2px'}}>Ocupado</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {etapa === 2 && (
          <div style={{background:'#fff', borderRadius:'16px', padding: isMobile ? '1rem' : '1.5rem', boxShadow:'0 2px 8px rgba(27,47,126,0.08)', maxWidth:'560px', margin:'0 auto'}}>
            <div style={{background: AZUL_CLARO, border:'1px solid #c0c9e8', borderRadius:'10px', padding:'12px 14px', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'10px'}}>
              <div style={{width:'32px', height:'32px', background: AZUL, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{fontSize:'13px', fontWeight:'700', color: AZUL, textTransform:'capitalize'}}>{dataFormatada}</div>
                <div style={{fontSize:'12px', color:'#5a6fa8'}}>as {horarioSel} &middot; <span onClick={() => {setEtapa(1);setHorarioSel(null)}} style={{cursor:'pointer', textDecoration:'underline', fontWeight:'600'}}>Alterar</span></div>
              </div>
            </div>
            <p style={{fontSize:'11px', fontWeight:'700', color: AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.75rem'}}>DADOS PESSOAIS</p>
            <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'10px', marginBottom:'10px'}}>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Nome Completo *</label><input value={form.nome} onChange={e => setForm({...form,nome:e.target.value})} placeholder="Joao da Silva" style={inp}/></div>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>CPF</label><input value={form.cpf} onChange={e => setForm({...form,cpf:e.target.value})} placeholder="000.000.000-00" style={inp}/></div>
            </div>
            <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'10px', marginBottom:'1rem'}}>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>E-mail *</label><input value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="joao@email.com" type="email" style={inp}/></div>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Telefone *</label><input value={form.telefone} onChange={e => setForm({...form,telefone:e.target.value})} placeholder="(11) 99999-9999" style={inp}/></div>
            </div>
            <p style={{fontSize:'11px', fontWeight:'700', color: AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.75rem'}}>DADOS DO IMOVEL</p>
            <div style={{marginBottom:'10px'}}>
              <label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Empreendimento *</label>
              <input value={form.empreendimento} onChange={e => setForm({...form,empreendimento:e.target.value})} placeholder="Ex: Residencial Park" style={inp}/>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'1.25rem'}}>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Torre *</label><input value={form.torre} onChange={e => setForm({...form,torre:e.target.value})} placeholder="Ex: A" style={inp}/></div>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Bloco *</label><input value={form.bloco} onChange={e => setForm({...form,bloco:e.target.value})} placeholder="Ex: 2" style={inp}/></div>
              <div><label style={{fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Apartamento *</label><input value={form.apartamento} onChange={e => setForm({...form,apartamento:e.target.value})} placeholder="Ex: 142" style={inp}/></div>
            </div>
            {erro && <p style={{color: VERMELHO, fontSize:'13px', fontWeight:'600', marginBottom:'12px'}}>{erro}</p>}
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => {setEtapa(1);setHorarioSel(null)}} style={{flex:1, padding:'12px', background:'#fff', color:'#6b7280', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer'}}>VOLTAR</button>
              <button onClick={confirmar} disabled={loading} style={{flex:2, padding:'12px', background: loading?'#9ca3af': AZUL, color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', letterSpacing:'0.05em', cursor: loading?'not-allowed':'pointer'}}>
                {loading ? 'AGUARDE...' : 'CONFIRMAR AGENDAMENTO'}
              </button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div style={{background:'#fff', borderRadius:'16px', padding: isMobile ? '2rem 1rem' : '3rem 2rem', textAlign:'center', boxShadow:'0 2px 8px rgba(27,47,126,0.08)', maxWidth:'480px', margin:'0 auto'}}>
            <div style={{width:'64px', height:'64px', background: AZUL, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem'}}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M5 16l8 8 14-14" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{fontFamily:'Georgia,serif', fontSize: isMobile ? '22px' : '26px', fontWeight:'400', margin:'0 0 8px', color: AZUL}}>VISTORIA AGENDADA!</h2>
            <p style={{color:'#6b7280', fontSize:'14px', lineHeight:'1.7', margin:'0 0 1.25rem'}}>
              E-mail de confirmacao enviado para <strong>{form.email}</strong>.
            </p>
            <div style={{background: AZUL_CLARO, border:'1px solid #c0c9e8', borderRadius:'10px', padding:'1rem', fontSize:'13px', color:'#374151', textAlign:'left', lineHeight:'2', marginBottom:'1.25rem'}}>
              <div><strong style={{color: AZUL, textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.05em'}}>Data:</strong> <span style={{fontWeight:'600', textTransform:'capitalize'}}>{dataFormatada}</span></div>
              <div><strong style={{color: AZUL, textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.05em'}}>Horario:</strong> <span style={{fontWeight:'600'}}>{horarioSel}</span></div>
              <div><strong style={{color: AZUL, textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.05em'}}>Empreendimento:</strong> <span style={{fontWeight:'600'}}>{form.empreendimento}</span></div>
              <div><strong style={{color: AZUL, textTransform:'uppercase', fontSize:'11px', letterSpacing:'0.05em'}}>Unidade:</strong> <span style={{fontWeight:'600'}}>Torre {form.torre}, Bloco {form.bloco}, Apto {form.apartamento}</span></div>
            </div>
            <a href={'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + msgWhatsApp} target="_blank" rel="noopener noreferrer"
              style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'14px', background:'#25D366', color:'#fff', borderRadius:'10px', fontSize:'14px', fontWeight:'700', textDecoration:'none', boxSizing:'border-box', marginBottom:'8px'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              CONFIRMAR VIA WHATSAPP
            </a>
            <p style={{fontSize:'11px', color:'#9ca3af', margin:0}}>Clique para enviar sua confirmacao pelo WhatsApp da equipe Mark Invest</p>
          </div>
        )}
      </div>
    </main>
  )
}