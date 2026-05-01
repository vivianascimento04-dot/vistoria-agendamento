'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [dataSel, setDataSel] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [horarioSel, setHorarioSel] = useState(null)
  const [diasCheios, setDiasCheios] = useState([])
  const [mesesBloqueados, setMesesBloqueados] = useState([])
  const [diasEspeciais, setDiasEspeciais] = useState([])
  const [form, setForm] = useState({ nome:'', cpf:'', email:'', telefone:'', empreendimento:'', torre:'', apartamento:'', nomeAcompanhante:'', cpfAcompanhante:'' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [etapa, setEtapa] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [empreendimentos, setEmpreendimentos] = useState([])
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { carregarDiasCheios(ano, mes) }, [ano, mes])

  useEffect(() => {
    async function init() {
      try {
        const resCpfs = await fetch('/api/cpfs-autorizados')
        const cpfs = await resCpfs.json()
        if (Array.isArray(cpfs) && cpfs.length > 0) {
          const cpfAutorizado = sessionStorage.getItem('cpf_autorizado')
          if (!cpfAutorizado) {
            router.push('/markinvest/verificar')
            return
          }
        }
      } catch(e) {}
      setVerificando(false)
      fetch('/api/empreendimentos').then(r => r.json()).then(d => { if (Array.isArray(d) && d.length) setEmpreendimentos(d) }).catch(() => {})
      fetch('/api/meses-bloqueados').then(r => r.json()).then(d => { if (Array.isArray(d)) setMesesBloqueados(d) }).catch(() => {})
      fetch('/api/dias-especiais').then(r => r.json()).then(d => { if (Array.isArray(d)) setDiasEspeciais(d) }).catch(() => {})
    }
    init()
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
    setDataSel(ds); setHorarioSel(null)
    try {
      const res = await fetch('/api/horarios?data=' + ds)
      const data = await res.json()
      setHorarios(Array.isArray(data) ? data : [])
    } catch(e) { setHorarios([]) }
  }

  function selecionarHorario(h) { setHorarioSel(h); setEtapa(2) }

  function isDiaBloqueado(ds) {
    for (const d of diasEspeciais) {
      if (ds >= d.data_inicio && ds <= d.data_fim && d.tipo === 'bloqueado') return true
    }
    return false
  }

  async function confirmar() {
    setTentouEnviar(true)
    const { nome, cpf, email, telefone, empreendimento, torre, apartamento, nomeAcompanhante, cpfAcompanhante } = form
    if (!nome || !cpf || !email || !telefone || !empreendimento || !torre || !apartamento || !nomeAcompanhante || !cpfAcompanhante) {
      setErro('Preencha todos os campos obrigatorios.')
      return
    }
    setLoading(true); setErro('')
    try {
      const aptoCompleto = empreendimento + ' - Torre ' + torre + ', Apto ' + apartamento
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, apartamento: aptoCompleto, data: dataSel, horario: horarioSel, nome_acompanhante: nomeAcompanhante, cpf_acompanhante: cpfAcompanhante })
      })
      const data = await res.json()
      if (res.ok) { setEtapa(3) }
      else {
        if (data.error && (data.error.includes('ja esta confirmado') || data.error.includes('Relacionamento'))) setErro('Nao e possivel realizar agendamento para o CPF informado pois ja existe um agendamento ativo. Por favor, entre em contato com o Relacionamento.')
        else if (data.error === 'Horario ja ocupado') setErro('Este horario acabou de ser reservado. Escolha outro horario.')
        else setErro(data.error || 'Erro ao agendar. Tente novamente.')
      }
    } catch(e) { setErro('Erro de conexao. Verifique sua internet e tente novamente.') }
    setLoading(false)
  }

  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const mesKey = ano + '-' + String(mes+1).padStart(2,'0')
  const mesBloqueado = mesesBloqueados.includes(mesKey)

  function prevMes() { if(mes===0){setMes(11);setAno(a=>a-1)}else setMes(m=>m-1); setDataSel(null); setHorarios([]) }
  function nextMes() { if(mes===11){setMes(0);setAno(a=>a+1)}else setMes(m=>m+1); setDataSel(null); setHorarios([]) }

  const dataFormatada = dataSel ? new Date(dataSel+'T12:00:00').toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long', year:'numeric'}) : ''
  const inp = { width:'100%', padding:'10px 12px', border:'1px solid #dde1f0', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }
  const erroBorda = { ...inp, border:'2px solid '+VERMELHO, background:'#fff8f8' }

  if (verificando) return (
    <main style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f3fa'}}>
      <p style={{color:'#6b7280', fontSize:'14px'}}>Carregando...</p>
    </main>
  )

  return (
    <main style={{minHeight:'100vh', background:'#f0f3fa', fontFamily:"'Segoe UI',sans-serif", margin:0, padding:0}}>
      <div style={{background:'linear-gradient(135deg, #1B2F7E 0%, #2a45b0 100%)', padding:'1.25rem 1rem', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 4px 20px rgba(27,47,126,0.25)'}}>
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
          <div style={{display:'grid', gridTemplateColumns:(!isMobile&&horarios.length>0&&!mesBloqueado)?'1fr 1fr':'1fr', gap:'1.25rem', alignItems:'start', justifyContent:'center'}}>
            <div style={{maxWidth:'420px', width:'100%', margin:'0 auto'}}>
              <div style={{background:'linear-gradient(135deg, #1B2F7E 0%, #2a45b0 100%)', borderRadius:'16px 16px 0 0', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 4px 20px rgba(27,47,126,0.2)'}}>
                <button onClick={prevMes} style={{background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'10px', width:'36px', height:'36px', cursor:'pointer', fontSize:'18px', color:'#fff', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center'}}>&#8249;</button>
                <div style={{textAlign:'center'}}>
                  <div style={{color:'#fff', fontSize:'18px', fontWeight:'700', fontFamily:'Georgia,serif', letterSpacing:'0.05em', textTransform:'uppercase'}}>{MESES[mes]}</div>
                  <div style={{color:'rgba(255,255,255,0.65)', fontSize:'13px', fontWeight:'600'}}>{ano}</div>
                  {mesBloqueado && <div style={{fontSize:'10px', color:'#fca5a5', fontWeight:'700', marginTop:'2px'}}>🔒 MES INDISPONIVEL</div>}
                </div>
                <button onClick={nextMes} style={{background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'10px', width:'36px', height:'36px', cursor:'pointer', fontSize:'18px', color:'#fff', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center'}}>&#8250;</button>
              </div>
              <div style={{background:'#fff', borderRadius:'0 0 16px 16px', padding:'1.25rem', boxShadow:'0 8px 32px rgba(27,47,126,0.10)'}}>
                {mesBloqueado && (
                  <div style={{background:'#fff5f5', border:'1px solid #fca5a5', borderRadius:'10px', padding:'12px 16px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px'}}>
                    <span style={{fontSize:'18px'}}>🔒</span>
                    <div>
                      <p style={{fontSize:'13px', fontWeight:'700', color:'#dc2626', margin:'0 0 2px'}}>Mes indisponivel</p>
                      <p style={{fontSize:'11px', color:'#9ca3af', margin:0}}>Selecione outro mes para agendar.</p>
                    </div>
                  </div>
                )}
                <div style={{display:'flex', gap:'8px', marginBottom:'14px', justifyContent:'center', flexWrap:'wrap'}}>
                  {[{bg:'linear-gradient(135deg,#1B2F7E,#2a45b0)', label:'Selecionado'},{bg:'#fee2e2', border:'1.5px solid #fca5a5', label:'Lotado'},{bg:'#f0f7ff', border:'1px solid #bfdbfe', label:'Disponivel'},{bg:'#f9fafb', label:'Indisponivel'}].map(l => (
                    <div key={l.label} style={{display:'flex', alignItems:'center', gap:'4px'}}>
                      <div style={{width:'12px', height:'12px', borderRadius:'3px', background:l.bg, border:l.border||'none', flexShrink:0}}></div>
                      <span style={{fontSize:'10px', fontWeight:'600', color:'#555'}}>{l.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', textAlign:'center', marginBottom:'8px'}}>
                  {['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].map((d,i) => (
                    <span key={i} style={{fontSize:'10px', fontWeight:'700', color:i===0||i===6?'#e5e7eb':'#9ca3af', padding:'4px 0'}}>{d}</span>
                  ))}
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px'}}>
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
                    const bloqueadoEspecial = isDiaBloqueado(ds)
                    if (isPast||isWeekend||mesBloqueado||bloqueadoEspecial) return (
                      <div key={d} style={{aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'#d1d5db', borderRadius:'8px', background:'#f9fafb', fontWeight:'500'}}>{d}</div>
                    )
                    if (isCheio&&!isSel) return (
                      <div key={d} title="Dia lotado" style={{aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'11px', color:'#dc2626', borderRadius:'8px', background:'#fee2e2', border:'1.5px solid #fca5a5', cursor:'not-allowed', fontWeight:'700'}}>{d}<div style={{fontSize:'7px', fontWeight:'700', marginTop:'1px'}}>LOTADO</div></div>
                    )
                    if (isSel) return (
                      <div key={d} onClick={() => setDataSel(null)} style={{aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', borderRadius:'8px', cursor:'pointer', background:'linear-gradient(135deg, #1B2F7E, #2a45b0)', color:'#fff', boxShadow:'0 4px 12px rgba(27,47,126,0.4)', transition:'all 0.15s'}}>{d}</div>
                    )
                    if (isToday&&!isCheio) return (
                      <div key={d} onClick={() => selecionarData(ds)} style={{aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', borderRadius:'8px', cursor:'pointer', background:'#eff6ff', color:AZUL, border:'2px solid '+AZUL, transition:'all 0.15s'}}>
                        {d}<div style={{width:'4px', height:'4px', borderRadius:'50%', background:AZUL, marginTop:'1px'}}></div>
                      </div>
                    )
                    return (
                      <div key={d} onClick={() => selecionarData(ds)} style={{aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'600', borderRadius:'8px', cursor:'pointer', background:'#f0f7ff', color:'#1d4ed8', border:'1px solid #bfdbfe', transition:'all 0.15s'}}>{d}</div>
                    )
                  })}
                </div>
                {dataSel && (
                  <div style={{marginTop:'14px', padding:'10px 14px', background:'linear-gradient(135deg,#f0f7ff,#e0edff)', borderRadius:'10px', border:'1px solid #bfdbfe', textAlign:'center'}}>
                    <p style={{fontSize:'13px', fontWeight:'700', color:AZUL, margin:0, textTransform:'capitalize'}}>✓ {dataFormatada}</p>
                  </div>
                )}
              </div>
            </div>

            {horarios.length > 0 && !mesBloqueado && (
              <div style={{background:'#fff', borderRadius:'16px', padding:isMobile?'1rem':'1.5rem', boxShadow:'0 8px 32px rgba(27,47,126,0.10)'}}>
                <p style={{fontSize:'11px', fontWeight:'700', color:AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 4px'}}>HORARIOS DISPONIVEIS</p>
                <p style={{fontSize:'12px', color:'#6b7280', margin:'0 0 1rem', textTransform:'capitalize'}}>{dataFormatada}</p>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                  {horarios.map(h => (
                    <div key={h.horario} onClick={() => h.disponivel && selecionarHorario(h.horario)} style={{padding:isMobile?'12px 6px':'14px', textAlign:'center', borderRadius:'10px', fontSize:isMobile?'14px':'15px', fontWeight:'700', border:horarioSel===h.horario?'2px solid '+VERMELHO:'1px solid #dde1f0', cursor:h.disponivel?'pointer':'not-allowed', background:horarioSel===h.horario?VERMELHO:!h.disponivel?'#f9fafb':'#f0f7ff', color:horarioSel===h.horario?'#fff':!h.disponivel?'#d1d5db':'#1d4ed8', textDecoration:!h.disponivel?'line-through':'none', transition:'all 0.15s'}}>
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
          <div style={{background:'#fff', borderRadius:'16px', padding:isMobile?'1rem':'1.5rem', boxShadow:'0 8px 32px rgba(27,47,126,0.10)', maxWidth:'560px', margin:'0 auto'}}>
            <div style={{background:AZUL_CLARO, border:'1px solid #c0c9e8', borderRadius:'10px', padding:'12px 14px', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'10px'}}>
              <div style={{width:'32px', height:'32px', background:AZUL, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{fontSize:'13px', fontWeight:'700', color:AZUL, textTransform:'capitalize'}}>{dataFormatada}</div>
                <div style={{fontSize:'12px', color:'#5a6fa8'}}>as {horarioSel} &middot; <span onClick={() => {setEtapa(1);setHorarioSel(null)}} style={{cursor:'pointer', textDecoration:'underline', fontWeight:'600'}}>Alterar</span></div>
              </div>
            </div>

            <p style={{fontSize:'11px', fontWeight:'700', color:AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.75rem', display:'flex', alignItems:'center', gap:'6px'}}>
              <span style={{width:'4px', height:'16px', background:AZUL, borderRadius:'2px', display:'inline-block'}}></span>
              DADOS PESSOAIS
            </p>
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

            <p style={{fontSize:'11px', fontWeight:'700', color:AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.75rem', display:'flex', alignItems:'center', gap:'6px'}}>
              <span style={{width:'4px', height:'16px', background:AZUL, borderRadius:'2px', display:'inline-block'}}></span>
              DADOS DO IMOVEL
            </p>
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

            <div style={{background:'#f8f9ff', border:'1px solid #e0e5f5', borderRadius:'12px', padding:'1rem', marginBottom:'1.25rem'}}>
              <p style={{fontSize:'11px', fontWeight:'700', color:AZUL, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 0.75rem', display:'flex', alignItems:'center', gap:'6px'}}>
                <span style={{width:'4px', height:'16px', background:'#6366f1', borderRadius:'2px', display:'inline-block'}}></span>
                DADOS DO ACOMPANHANTE
              </p>
              <div style={{display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:'10px'}}>
                <div>
                  <label style={{fontSize:'12px', fontWeight:'700', color:tentouEnviar&&!form.nomeAcompanhante?VERMELHO:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>Nome do Acompanhante *</label>
                  <input value={form.nomeAcompanhante} onChange={e => setForm({...form,nomeAcompanhante:e.target.value})} placeholder="Nome completo" style={tentouEnviar&&!form.nomeAcompanhante?erroBorda:inp}/>
                  {tentouEnviar&&!form.nomeAcompanhante && <p style={{color:VERMELHO, fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Campo obrigatorio</p>}
                </div>
                <div>
                  <label style={{fontSize:'12px', fontWeight:'700', color:tentouEnviar&&!form.cpfAcompanhante?VERMELHO:'#6b7280', display:'block', marginBottom:'4px', textTransform:'uppercase'}}>CPF do Acompanhante *</label>
                  <input value={form.cpfAcompanhante} onChange={e => setForm({...form,cpfAcompanhante:mascaraCPF(e.target.value)})} placeholder="000.000.000-00" maxLength={14} style={tentouEnviar&&!form.cpfAcompanhante?erroBorda:inp}/>
                  {tentouEnviar&&!form.cpfAcompanhante && <p style={{color:VERMELHO, fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Campo obrigatorio</p>}
                </div>
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
          <div style={{background:'#fff', borderRadius:'16px', padding:isMobile?'2rem 1rem':'3rem 2rem', textAlign:'center', boxShadow:'0 8px 32px rgba(27,47,126,0.10)', maxWidth:'480px', margin:'0 auto'}}>
            <div style={{width:'72px', height:'72px', background:'linear-gradient(135deg,#1B2F7E,#2a45b0)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', boxShadow:'0 4px 16px rgba(27,47,126,0.3)'}}>
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
                <div style={{borderTop:'1px solid #e0e5f5', paddingTop:'8px', marginTop:'4px'}}>
                  <div style={{fontSize:'11px', color:'#6b7280', fontWeight:'600', textTransform:'uppercase', marginBottom:'4px'}}>Acompanhante</div>
                  <div style={{fontSize:'13px', fontWeight:'700', color:'#374151'}}>{form.nomeAcompanhante}</div>
                  <div style={{fontSize:'12px', color:'#6b7280'}}>{form.cpfAcompanhante}</div>
                </div>
              </div>
            </div>
            <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p style={{fontSize:'13px', color:'#15803d', margin:0, fontWeight:'500', textAlign:'left'}}>E-mail enviado! Verifique sua caixa de entrada e o spam.</p>
            </div>
            <p style={{fontSize:'10px', color:'#d1d5db', textAlign:'center', marginTop:'1.5rem', marginBottom:0}}>
              © 2026 Markinvest. Todos os direitos reservados.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}