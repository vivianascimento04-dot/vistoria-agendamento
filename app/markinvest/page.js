'use client'
import { useState, useEffect } from 'react'

const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const AZUL = '#1B2F7E'
const AZUL_CLARO = '#E8EBF5'
const VERMELHO = '#C0392B'

function mascaraCPF(v) {
  return v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2').slice(0,14)
}

function mascaraTelefone(v) {
  return v.replace(/\D/g,'').replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d{1,4})$/,'$1-$2').slice(0,15)
}

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
  const [empreendimentos, setEmpreendimentos] = useState(['Parque Mikonos', 'Parque Olimpia'])
  const [tentouEnviar, setTentouEnviar] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { carregarDiasCheios(ano, mes) }, [ano, mes])

  useEffect(() => {
    fetch('/api/empreendimentos')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length) setEmpreendimentos(d) })
      .catch(() => {})
  }, [])

  async function carregarDiasCheios(a, m) {
    try {
      const mesStr = a + '-' + String(m + 1).padStart(2, '0')
      const res = await fetch('/api/horarios?mes=' + mesStr)
      const data = await res.json()
      setDiasCheios(data.diasCheios || [])
    } catch(e) { setDiasCheios([]) }
  }

  async function selecionarData(ds) {
    setDataSel(ds)
    setHorarioSel(null)
    try {
      const res = await fetch('/api/horarios?data=' + ds)
      const data = await res.json()
      setHorarios(Array.isArray(data) ? data : [])
    } catch(e) { setHorarios([]) }
  }

  function selecionarHorario(h) { setHorarioSel(h); setEtapa(2) }

  async function confirmar() {
    setTentouEnviar(true)
    const { nome, cpf, email, telefone, empreendimento, torre, apartamento } = form
    if (!nome || !cpf || !email || !telefone || !empreendimento || !torre || !apartamento) {
      setErro('Preencha todos os campos obrigatorios.')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const aptoCompleto = empreendimento + ' - Torre ' + torre + ', Apto ' + apartamento
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, apartamento: aptoCompleto, data: dataSel, horario: horarioSel })
      })
      const data = await res.json()
      if (res.ok) {
        setEtapa(3)
      } else {
        if (data.error && (data.error.includes('ja esta confirmado') || data.error.includes('Relacionamento'))) {
          setErro('Nao e possivel realizar agendamento para o CPF informado pois ja existe um agendamento ativo. Por favor, entre em contato com o Relacionamento.')
        } else if (data.error === 'Horario ja ocupado') {
          setErro('Este horario acabou de ser reservado. Escolha outro horario.')
        } else {
          setErro(data.error || 'Erro ao agendar. Tente novamente.')
        }
      }
    } catch(e) {
      setErro('Erro de conexao. Verifique sua internet e tente novamente.')
    }
    setLoading(false)
  }

  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  function prevMes() { if(mes===0){setMes(11);setAno(a=>a-1)}else setMes(m=>m-1); setDataSel(null); setHorarios([]) }
  function nextMes() { if(mes===11){setMes(0);setAno(a=>a+1)}else setMes(m=>m+1); setDataSel(null); setHorarios([]) }
  const dataFormatada = dataSel ? new Date(dataSel+'T12:00:00').toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long', year:'numeric'}) : ''
  const inp = { width:'100%', padding:'10px 12px', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }
  const erroBorda = { ...inp, border:'2px solid '+VERMELHO, background:'#fff8f8' }

  return (
    <main style={{minHeight:'100vh', background:'#f4f6fb', fontFamily:"'Segoe UI',sans-serif", margin:0, padding:0}}>
      <div style={{background:AZUL, padding:'1.25rem 1rem', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <img src="/logo.png" alt="Markinvest" style={{height:isMobile?'40px':'52px', objectFit:'contain', filter:'brightness(0) invert(1)', marginBottom:'8px'}}/>
        <p style={{color:'rgba(255,255,255,0.7)', fontSize:isMobile?'10px':'12px', letterSpacing:'0.12em', textTransform:'uppercase', margin:0}}>Sistema de Agendamento de Vistoria</p>
      </div>

      <div style={{background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0.75rem 1rem', display:'flex', justifyContent:'center'}}>
        {[{n:1,label:isMobile?'DATA':'DATA E HORARIO'},{n:2,label:isMobile?'DADOS':'SEUS DADOS'},{n:3,label:'CONFIRMACAO'}].map((e,i) => (
          <div key={e.n} style={{display:'flex', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
              <div style={{width:'24px', height:'24px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', background:etapa>=e.n?AZUL:'#f3f4f6', color:etapa>=e.n?'#fff':'#9ca3af', flexShrink:0}}>{etapa>e.n?'✓':e.n}</div>
              <span style={{fontSize:'10px', fontWeight:'700', color:etapa===e.n?AZUL:'#9ca3af'}}>{e.label}</span>
            </div>
            {i<2 && <div style={{width:isMobile?'16px':'32px', height:'1px', background:etapa>e.n?AZUL:'#e5e7eb', margin:'0 4px'}}/>}
          </div>
        ))}
      </div>

      <div style={{maxWidth:'900px', margin:'0 auto', padding:isMobile?'1rem':'2rem 1rem'}}>
        {etapa === 1 && (
          <div style={{display:'grid', gridTemplateColumns:(!isMobile&&horarios.length>0)?'1fr 1fr':'1fr', gap:'1rem', alignItems:'start'}}>
            <div style={{background:'#fff', borderRadius:'16px', padding:isMobile?'1rem':'1.5rem', boxShadow:'0 2px 8px rgba(27,47,126,0.08)'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
                <button onClick={prevMes} style={{background:'none', border:'1px solid #dde1f0', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'18px', color:AZUL, fontWeight:'bold'}}>&#8249;</button>
                <span style={{fontFamily:'Georgia,serif', fontSize:isMobile?'14px':'16px', color:AZUL, fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em'}}>{MESES[mes]} {ano}</span>
                <button onClick={nextMes} style={{background:'none', border:'1px solid #dde1f0', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'18px', color:AZUL, fontWeight:'bold'}}>&#8250;</button>
              </div>
              <div style={{display:'flex', gap:'10px', marginBottom:'12px', flexWrap:'wrap', padding:'8px 10px', background:'#f8f9ff', borderRadius:'8px', border:'1px solid #e8ebf5'}}>
                {[{bg:VERMELHO,bd:'none',label:'Selecionado'},{bg:'#fee2e2',bd:'1.5px solid #ef4444',label:'Lotado'},{bg:'#fff',bd:'1px solid #d1d5db',label:'Disponivel'},{bg:'#f9fafb',bd:'none',label:'Indisponivel'}].map(l => (
                  <div key={l.label} style={{display:'flex', alignItems:'center', gap:'5px'}}>
                    <div style={{width:'14px', height:'14px', borderRadius:'3px', background:l.bg, border:l.bd, flexShrink:0}}></div>
                    <span style={{fontSize:'11px', fontWeight:'600', color:'#374151'}}>{l.label}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', textAlign:'center', marginBottom:'6px'}}>
                {['D','S','T','Q','Q','S','S'].map((d,i) => <span key={i} style={{fontSize:'11px', fontWeight:'700', color:'#9ca3af', padding:'3px 0'}}>{d}</span>)}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px'}}>
                {Array(primeiroDia).fill(null).map((_,i) => <div key={i}/>)}
                {Array(diasNoMes).fill(null).map((_,i) => {
                  const d = i+1
                  const date = new Date(ano, mes, d)
                  const dow = date.getDay()
                  const isPast = date <= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
                  const isWeekend = dow===0||dow===6
                  const ds = ano+'-'+String(mes+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
                  const isSel = dataSel===ds
                  const isToday = d===hoje.getDate()&&mes===hoje.getMonth()&&ano===hoje.getFullYear()
                  const isCheio = diasCheios.includes(ds)
                  if (isPast||isWeekend) return <div key={d} style={{aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'#d1d5db', borderRadius:'6px', background:'#f9fafb'}}>{d}</div>
                  if (isCheio&&!isSel) return <div key={d} title="Dia lotado" style={{aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'11px', color:'#dc2626', borderRadius:'6px', background:'#fee2e2', border:'1.5px solid #ef4444', cursor:'not-allowed', fontWeight:'600'}}>{d}<div style={{fontSize:'7px', fontWeight:'700', marginTop:'1px'}}>LOTADO</div></div>
                  return <div key={d} onClick={() => selecionarData(ds)} style={{aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:isSel?'700':'500', borderRadius:'6px', cursor:'pointer', background:isSel?VERMELHO:isToday?AZUL_CLARO:'#fff', color:isSel?'#fff':isToday?AZUL:'#333', border:isSel?'2px solid '+VERMELHO:isToday?'2px solid '+AZUL:'1px solid #e5e7eb', transition:'all 0.15s'}}>{d}</div>
                })}
              </div>
            </div>
            {horarios.length > 0 && (
              <div style={{background:'#fff', borderRadius:'16px', padding:isMobile?'1rem':'1.5rem', boxShadow:'0 2px 8px rgba(27,47,126,0.08)'}}>
                <p style={{fontSize:'11px', fontWeight:'700', color:AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 4px'}}>HORARIOS DISPONIVEIS</p>
                <p style={{fontSize:'12px', color:'#6b7280', margin:'0 0 1rem', textTransform:'capitalize'}}>{dataFormatada}</p>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                  {horarios.map(h => (
                    <div key={h.horario} onClick={() => h.disponivel && selecionarHorario(h.horario)} style={{padding:isMobile?'12px 6px':'14px', textAlign:'center', borderRadius:'10px', fontSize:isMobile?'14px':'15px', fontWeight:'700', border:horarioSel===h.horario?'2px solid '+VERMELHO:'1px solid #dde1f0', cursor:h.disponivel?'pointer':'not-allowed', background:horarioSel===h.horario?VERMELHO:!h.disponivel?'#f9fafb':'#fff', color:horarioSel===h.horario?'#fff':!h.disponivel?'#d1d5db':AZUL, textDecoration:!h.disponivel?'line-through':'none', transition:'all 0.15s'}}>
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
          <div style={{background:'#fff', borderRadius:'16px', padding:isMobile?'1rem':'1.5rem', boxShadow:'0 2px 8px rgba(27,47,126,0.08)', maxWidth:'560px', margin:'0 auto'}}>
            <div style={{background:AZUL_CLARO, border:'1px solid #c0c9e8', borderRadius:'10px', padding:'12px 14px', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'10px'}}>
              <div style={{width:'32px', height:'32px', background:AZUL, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{fontSize:'13px', fontWeight:'700', color:AZUL, textTransform:'capitalize'}}>{dataFormatada}</div>
                <div style={{fontSize:'12px', color:'#5a6fa8'}}>as {horarioSel} &middot; <span onClick={() => {setEtapa(1);setHorarioSel(null)}} style={{cursor:'pointer', textDecoration:'underline', fontWeight:'600'}}>Alterar</span></div>
              </div>
            </div>
            <p style={{fontSize:'11px', fontWeight:'700', color:AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.75rem'}}>DADOS PESSOAIS</p>
            <div style={{display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:'10px', marginBottom:'10px'}}>
              <div>
                <label style={{fontSize:'12px', fontWeight:'700', color:tentouEnviar&&!form.nome?VERMELHO:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>Nome Completo *</label>
                <input value={form.nome} onChange={e => setForm({...form,nome:e.target.value})} placeholder="Joao da Silva" style={tentouEnviar&&!form.nome?erroBorda:inp}/>
                {tentouEnviar&&!form.nome && <p style={{color:VERMELHO, fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Campo obrigatorio</p>}
              </div>
              <div>
                <label style={{fontSize:'12px', fontWeight:'700', color:tentouEnviar&&!form.cpf?VERMELHO:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>CPF *</label>
                <input value={form.cpf} onChange={e => setForm({...form,cpf:mascaraCPF(e.target.value)})} placeholder="000.000.000-00" maxLength={14} style={tentouEnviar&&!form.cpf?erroBorda:inp}/>
                {tentouEnviar&&!form.cpf && <p style={{color:VERMELHO, fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Campo obrigatorio</p>}
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:'10px', marginBottom:'1rem'}}>
              <div>
                <label style={{fontSize:'12px', fontWeight:'700', color:tentouEnviar&&!form.email?VERMELHO:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>E-mail *</label>
                <input value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="joao@email.com" type="email" style={tentouEnviar&&!form.email?erroBorda:inp}/>
                {tentouEnviar&&!form.email && <p style={{color:VERMELHO, fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Campo obrigatorio</p>}
              </div>
              <div>
                <label style={{fontSize:'12px', fontWeight:'700', color:tentouEnviar&&!form.telefone?VERMELHO:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>Telefone *</label>
                <input value={form.telefone} onChange={e => setForm({...form,telefone:mascaraTelefone(e.target.value)})} placeholder="(11) 99999-9999" maxLength={15} style={tentouEnviar&&!form.telefone?erroBorda:inp}/>
                {tentouEnviar&&!form.telefone && <p style={{color:VERMELHO, fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Campo obrigatorio</p>}
              </div>
            </div>
            <p style={{fontSize:'11px', fontWeight:'700', color:AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.75rem'}}>DADOS DO IMOVEL</p>
            <div style={{marginBottom:'10px'}}>
              <label style={{fontSize:'12px', fontWeight:'700', color:tentouEnviar&&!form.empreendimento?VERMELHO:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>Empreendimento *</label>
              <select value={form.empreendimento} onChange={e => setForm({...form,empreendimento:e.target.value})} style={{...(tentouEnviar&&!form.empreendimento?erroBorda:inp), background:'#fff', cursor:'pointer', color:form.empreendimento?'#111':'#9ca3af'}}>
                <option value="">Selecione o empreendimento</option>
                {empreendimentos.map(emp => <option key={emp} value={emp} style={{fontWeight:'700'}}>{emp}</option>)}
              </select>
              {tentouEnviar&&!form.empreendimento && <p style={{color:VERMELHO, fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Campo obrigatorio</p>}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'1.25rem'}}>
              <div>
                <label style={{fontSize:'12px', fontWeight:'700', color:tentouEnviar&&!form.torre?VERMELHO:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>Torre *</label>
                <input value={form.torre} onChange={e => setForm({...form,torre:e.target.value})} placeholder="Ex: A" style={tentouEnviar&&!form.torre?erroBorda:inp}/>
                {tentouEnviar&&!form.torre && <p style={{color:VERMELHO, fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Campo obrigatorio</p>}
              </div>
              <div>
                <label style={{fontSize:'12px', fontWeight:'700', color:tentouEnviar&&!form.apartamento?VERMELHO:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>Apartamento *</label>
                <input value={form.apartamento} onChange={e => setForm({...form,apartamento:e.target.value})} placeholder="Ex: 142" style={tentouEnviar&&!form.apartamento?erroBorda:inp}/>
                {tentouEnviar&&!form.apartamento && <p style={{color:VERMELHO, fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Campo obrigatorio</p>}
              </div>
            </div>
            {erro && (
              <div style={{background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px'}}>
                <p style={{color:VERMELHO, fontSize:'13px', fontWeight:'600', margin:0}}>&#9888; {erro}</p>
              </div>
            )}
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => {setEtapa(1);setHorarioSel(null);setTentouEnviar(false)}} style={{flex:1, padding:'12px', background:'#fff', color:'#6b7280', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer'}}>VOLTAR</button>
              <button onClick={confirmar} disabled={loading} style={{flex:2, padding:'12px', background:loading?'#9ca3af':AZUL, color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:loading?'not-allowed':'pointer'}}>
                {loading?'AGUARDE...':'CONFIRMAR AGENDAMENTO'}
              </button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div style={{background:'#fff', borderRadius:'16px', padding:isMobile?'2rem 1rem':'3rem 2rem', textAlign:'center', boxShadow:'0 2px 8px rgba(27,47,126,0.08)', maxWidth:'480px', margin:'0 auto'}}>
            <div style={{width:'72px', height:'72px', background:AZUL, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', boxShadow:'0 4px 16px rgba(27,47,126,0.3)'}}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M5 16l8 8 14-14" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{fontFamily:'Georgia,serif', fontSize:isMobile?'22px':'26px', fontWeight:'400', margin:'0 0 8px', color:AZUL}}>VISTORIA AGENDADA!</h2>
            <p style={{color:'#6b7280', fontSize:'14px', lineHeight:'1.7', margin:'0 0 1.5rem'}}>
              Um e-mail de confirmacao foi enviado para <strong style={{color:AZUL}}>{form.email}</strong>.
            </p>
            <div style={{background:'#f8f9ff', border:'1px solid #e0e5f5', borderRadius:'12px', padding:'1.25rem', textAlign:'left', marginBottom:'1.5rem'}}>
              <p style={{fontSize:'11px', fontWeight:'700', color:AZUL, textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 12px', borderBottom:'1px solid #e0e5f5', paddingBottom:'8px'}}>RESUMO DO AGENDAMENTO</p>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px'}}>
                  <span style={{color:'#6b7280', fontWeight:'600', textTransform:'uppercase', fontSize:'11px'}}>Data</span>
                  <span style={{fontWeight:'700', color:AZUL, textTransform:'capitalize'}}>{dataFormatada}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px'}}>
                  <span style={{color:'#6b7280', fontWeight:'600', textTransform:'uppercase', fontSize:'11px'}}>Horario</span>
                  <span style={{fontWeight:'700', color:AZUL}}>{horarioSel}</span>
                </div>
                <div style={{borderTop:'1px solid #e0e5f5', paddingTop:'8px', marginTop:'4px'}}>
                  <div style={{fontSize:'11px', color:'#6b7280', fontWeight:'600', textTransform:'uppercase', marginBottom:'4px'}}>Empreendimento</div>
                  <div style={{fontSize:'13px', fontWeight:'700', color:'#374151'}}>{form.empreendimento}</div>
                </div>
                <div>
                  <div style={{fontSize:'11px', color:'#6b7280', fontWeight:'600', textTransform:'uppercase', marginBottom:'4px'}}>Unidade</div>
                  <div style={{fontSize:'13px', fontWeight:'700', color:'#374151'}}>Torre {form.torre}, Apto {form.apartamento}</div>
                </div>
              </div>
            </div>
            <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p style={{fontSize:'13px', color:'#15803d', margin:0, fontWeight:'500', textAlign:'left'}}>E-mail enviado! Verifique sua caixa de entrada e o spam.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}