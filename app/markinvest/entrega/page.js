'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const AZUL = '#1B2F7E'
const VERDE = '#1D9E75'
const VERMELHO = '#C0392B'
const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function mascaraCPF(v) {
  return v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2').slice(0,14)
}
function mascaraTelefone(v) {
  return v.replace(/\D/g,'').replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d{1,4})$/,'$1-$2').slice(0,15)
}

export default function EntregaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const hoje = new Date()
  const [etapa, setEtapa] = useState(1)
  const [verificando, setVerificando] = useState(true)
  const [erro, setErro] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  const [cpfInput, setCpfInput] = useState('')
  const [clienteDados, setClienteDados] = useState(null)
  const [empreendimentos, setEmpreendimentos] = useState([])
  const [empreendimentoSel, setEmpreendimentoSel] = useState('')

  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [dataSel, setDataSel] = useState(null)
  const [diasLiberados, setDiasLiberados] = useState([])
  const [diasCheios, setDiasCheios] = useState([])
  const [horarios, setHorarios] = useState([])
  const [horarioSel, setHorarioSel] = useState(null)

  const [form, setForm] = useState({ nome:'', email:'', telefone:'', unidade:'' })
  const [loading, setLoading] = useState(false)
  const [tentouEnviar, setTentouEnviar] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function init() {
      // Se tem token, valida
      if (token) {
        const res = await fetch('/api/entrega-tokens?token=' + token)
        const data = await res.json()
        if (!data.valido) {
          setErro(data.motivo || 'Link invalido ou expirado.')
          setVerificando(false)
          return
        }
        sessionStorage.setItem('entrega_cpf', data.cpf)
        setClienteDados({ cpf: data.cpf, nome: data.nome, unidade: data.unidade, empreendimento: data.empreendimento })
        if (data.empreendimento) {
          setEmpreendimentoSel(data.empreendimento)
          setEtapa(2)
        } else {
          setEtapa(1)
        }
        setVerificando(false)
        return
      }

      // Sem token — verifica sessao
      const cpfSessao = sessionStorage.getItem('entrega_cpf')
      if (cpfSessao) {
        const res = await fetch('/api/entrega-verificar', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ cpf: cpfSessao })
        })
        const data = await res.json()
        if (data.autorizado) {
          setClienteDados({ cpf: cpfSessao, nome: data.nome, unidade: data.unidade, empreendimento: data.empreendimento })
          if (data.empreendimento) { setEmpreendimentoSel(data.empreendimento); setEtapa(2) }
          else setEtapa(1)
        } else {
          sessionStorage.removeItem('entrega_cpf')
        }
      }

      // Buscar empreendimentos
      const resEmp = await fetch('/api/empreendimentos')
      const emps = await resEmp.json()
      if (Array.isArray(emps)) setEmpreendimentos(emps)

      setVerificando(false)
    }
    init()
  }, [token])

  useEffect(() => {
    if (empreendimentoSel) carregarMes(ano, mes)
  }, [ano, mes, empreendimentoSel])

  async function carregarMes(a, m) {
    const mesStr = a + '-' + String(m+1).padStart(2,'0')
    const res = await fetch('/api/entrega-horarios?mes='+mesStr+'&empreendimento='+encodeURIComponent(empreendimentoSel))
    const data = await res.json()
    setDiasLiberados(data.diasLiberados || [])
    setDiasCheios(data.diasCheios || [])
  }

  async function verificarCPF() {
    if (!cpfInput || cpfInput.replace(/\D/g,'').length < 11) { setErro('Informe o CPF completo.'); return }
    setLoading(true); setErro('')
    const res = await fetch('/api/entrega-verificar', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ cpf: cpfInput })
    })
    const data = await res.json()
    if (data.jaAgendou) {
      const agend = data.agendamento
      setErro('Voce ja possui um agendamento de entrega de chaves para ' + agend.empreendimento + ' em ' + new Date(agend.data+'T12:00:00').toLocaleDateString('pt-BR') + ' as ' + agend.horario + '.')
      setLoading(false); return
    }
    if (!data.autorizado) { setErro(data.motivo || 'CPF nao autorizado.'); setLoading(false); return }
    sessionStorage.setItem('entrega_cpf', cpfInput.replace(/\D/g,''))
    setClienteDados({ cpf: cpfInput.replace(/\D/g,''), nome: data.nome, unidade: data.unidade, empreendimento: data.empreendimento })
    setForm(prev => ({ ...prev, nome: data.nome || '', unidade: data.unidade || '' }))
    if (data.empreendimento) { setEmpreendimentoSel(data.empreendimento); setEtapa(2) }
    else setEtapa(1)
    setLoading(false)
  }

  async function selecionarData(ds) {
    setDataSel(ds); setHorarioSel(null)
    const res = await fetch('/api/entrega-horarios?data='+ds+'&empreendimento='+encodeURIComponent(empreendimentoSel))
    const data = await res.json()
    setHorarios(Array.isArray(data) ? data : [])
  }

  function selecionarEmpreendimento(emp) {
    setEmpreendimentoSel(emp)
    setDataSel(null); setHorarios([]); setHorarioSel(null)
    setEtapa(2)
  }

  function selecionarHorario(h) {
    setHorarioSel(h)
    setForm(prev => ({ ...prev, nome: clienteDados?.nome || prev.nome, unidade: clienteDados?.unidade || prev.unidade }))
    setEtapa(3)
  }

  async function confirmar() {
    setTentouEnviar(true)
    if (!form.nome || !form.email || !form.telefone || !form.unidade) { setErro('Preencha todos os campos.'); return }
    setLoading(true); setErro('')
    const res = await fetch('/api/entrega-agendamentos', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        nome: form.nome,
        cpf: clienteDados?.cpf || cpfInput.replace(/\D/g,''),
        email: form.email,
        telefone: form.telefone,
        empreendimento: empreendimentoSel,
        unidade: form.unidade,
        data: dataSel,
        horario: horarioSel,
        token: token || ''
      })
    })
    const data = await res.json()
    if (res.ok) { setEtapa(4) }
    else { setErro(data.error || 'Erro ao agendar. Tente novamente.') }
    setLoading(false)
  }

  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes+1, 0).getDate()
  const mesKey = ano + '-' + String(mes+1).padStart(2,'0')
  const dataFormatada = dataSel ? new Date(dataSel+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : ''

  const inp = {width:'100%',padding:'10px 12px',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'14px',boxSizing:'border-box',outline:'none',fontFamily:'inherit'}
  const erroBorda = {...inp,border:'2px solid '+VERMELHO,background:'#fff8f8'}
  const inpReadOnly = {...inp,background:'#f3f4f6',color:'#6b7280',cursor:'not-allowed'}

  const ETAPAS = [
    {n:1,label:isMobile?'EMPR.':'EMPREENDIMENTO'},
    {n:2,label:isMobile?'DATA':'DATA E HORA'},
    {n:3,label:isMobile?'DADOS':'SEUS DADOS'},
    {n:4,label:'CONFIRMACAO'}
  ]

  if (verificando) return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0f3fa'}}>
      <p style={{color:'#6b7280',fontSize:'14px'}}>Carregando...</p>
    </main>
  )

  if (erro && !clienteDados && etapa === 1) return (
    <main style={{minHeight:'100vh',background:'#f0f3fa',fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',padding:'1.25rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
        <img src="/logo.png" alt="Markinvest" style={{height:'40px',objectFit:'contain',filter:'brightness(0) invert(1)'}}/>
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',margin:0}}>Entrega de Chaves</p>
      </div>
      <div style={{maxWidth:'480px',margin:'2rem auto',padding:'1rem'}}>
        {!clienteDados && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'2rem',boxShadow:'0 8px 32px rgba(27,47,126,0.10)',textAlign:'center'}}>
            <div style={{width:'56px',height:'56px',background:'#fff5f5',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{fontSize:'18px',fontWeight:'700',color:'#111',margin:'0 0 8px'}}>Link invalido</h2>
            <p style={{fontSize:'14px',color:'#6b7280',margin:'0 0 20px',lineHeight:'1.6'}}>{erro}</p>
            <p style={{fontSize:'13px',color:'#9ca3af'}}>Entre em contato com o Relacionamento Markinvest.</p>
          </div>
        )}
      </div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',background:'#f0f3fa',fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',padding:'1.25rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',boxShadow:'0 4px 20px rgba(27,47,126,0.25)'}}>
        <img src="/logo.png" alt="Markinvest" style={{height:isMobile?'36px':'48px',objectFit:'contain',filter:'brightness(0) invert(1)'}}/>
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:isMobile?'10px':'12px',letterSpacing:'0.12em',textTransform:'uppercase',margin:0}}>Agendamento de Entrega de Chaves</p>
      </div>

      {!clienteDados && etapa === 1 ? (
        <div style={{maxWidth:'420px',margin:'2rem auto',padding:'1rem'}}>
          <div style={{background:'#fff',borderRadius:'16px',padding:'2rem',boxShadow:'0 8px 32px rgba(27,47,126,0.10)'}}>
            <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
              <div style={{width:'56px',height:'56px',background:'#eff3ff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#1B2F7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 style={{fontSize:'18px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Informe seu CPF</h2>
              <p style={{fontSize:'13px',color:'#6b7280',margin:0}}>Verifique se voce esta autorizado para realizar a entrega de chaves.</p>
            </div>
            <div style={{marginBottom:'16px'}}>
              <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>CPF *</label>
              <input value={cpfInput} onChange={e=>{ setCpfInput(mascaraCPF(e.target.value)); setErro('') }} placeholder="000.000.000-00" maxLength={14} onKeyDown={e=>e.key==='Enter'&&verificarCPF()} style={{...inp,fontSize:'16px',textAlign:'center',letterSpacing:'0.08em'}}/>
            </div>
            {erro && <div style={{background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'8px',padding:'10px 14px',marginBottom:'14px'}}><p style={{color:VERMELHO,fontSize:'13px',margin:0,fontWeight:'600'}}>{erro}</p></div>}
            <button onClick={verificarCPF} disabled={loading} style={{width:'100%',padding:'13px',background:loading?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor:loading?'not-allowed':'pointer'}}>
              {loading?'VERIFICANDO...':'CONTINUAR'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{background:'#fff',borderBottom:'1px solid #e5e7eb',padding:'0.75rem 1rem',display:'flex',justifyContent:'center'}}>
            {ETAPAS.map((e,i) => (
              <div key={e.n} style={{display:'flex',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                  <div style={{width:'24px',height:'24px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',background:etapa>=e.n?AZUL:'#f3f4f6',color:etapa>=e.n?'#fff':'#9ca3af',flexShrink:0}}>{etapa>e.n?'✓':e.n}</div>
                  <span style={{fontSize:'10px',fontWeight:'700',color:etapa===e.n?AZUL:'#9ca3af'}}>{e.label}</span>
                </div>
                {i<3&&<div style={{width:isMobile?'12px':'24px',height:'1px',background:etapa>e.n?AZUL:'#e5e7eb',margin:'0 4px'}}/>}
              </div>
            ))}
          </div>

          <div style={{maxWidth:'900px',margin:'0 auto',padding:isMobile?'1rem':'2rem 1rem'}}>

            {etapa===1&&(
              <div style={{maxWidth:'560px',margin:'0 auto'}}>
                <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 8px 32px rgba(27,47,126,0.10)'}}>
                  <h2 style={{fontSize:'16px',fontWeight:'700',color:AZUL,margin:'0 0 6px'}}>Selecione o empreendimento</h2>
                  <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 1.25rem'}}>Escolha o empreendimento correspondente a sua unidade.</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {empreendimentos.map(emp=>(
                      <button key={emp} onClick={()=>selecionarEmpreendimento(emp)}
                        style={{display:'flex',alignItems:'center',gap:'14px',padding:'14px 16px',borderRadius:'12px',border:'1.5px solid #e0e5f5',background:'#f8f9ff',cursor:'pointer',textAlign:'left',width:'100%'}}
                        onMouseOver={e=>{e.currentTarget.style.borderColor=AZUL;e.currentTarget.style.background='#eff3ff'}}
                        onMouseOut={e=>{e.currentTarget.style.borderColor='#e0e5f5';e.currentTarget.style.background='#f8f9ff'}}>
                        <div style={{width:'44px',height:'44px',borderRadius:'12px',background:AZUL,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'18px',fontWeight:'700',flexShrink:0}}>{emp.charAt(0).toUpperCase()}</div>
                        <div><div style={{fontSize:'14px',fontWeight:'700',color:AZUL}}>{emp}</div><div style={{fontSize:'12px',color:'#9ca3af',marginTop:'2px'}}>Agenda independente</div></div>
                        <div style={{marginLeft:'auto',fontSize:'18px',color:'#d1d5db'}}>›</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {etapa===2&&(
              <div>
                <div style={{background:'#E8EBF5',border:'1px solid #c0c9e8',borderRadius:'10px',padding:'10px 14px',marginBottom:'1rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'28px',height:'28px',borderRadius:'8px',background:AZUL,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'13px',fontWeight:'700'}}>{empreendimentoSel.charAt(0)}</div>
                    <span style={{fontSize:'13px',fontWeight:'700',color:AZUL}}>{empreendimentoSel}</span>
                  </div>
                  {!clienteDados?.empreendimento&&<button onClick={()=>{setEtapa(1);setEmpreendimentoSel('');setDataSel(null);setHorarios([])}} style={{fontSize:'12px',color:'#5a6fa8',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',fontWeight:'600'}}>Alterar</button>}
                </div>

                <div style={{display:'grid',gridTemplateColumns:(!isMobile&&horarios.length>0)?'1fr 1fr':'1fr',gap:'1.25rem',alignItems:'start'}}>
                  <div style={{maxWidth:'420px',width:'100%',margin:'0 auto'}}>
                    <div style={{background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',borderRadius:'16px 16px 0 0',padding:'1.25rem 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <button onClick={()=>{if(mes===0){setMes(11);setAno(a=>a-1)}else setMes(m=>m-1);setDataSel(null);setHorarios([])}} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'10px',width:'36px',height:'36px',cursor:'pointer',fontSize:'18px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>&#8249;</button>
                      <div style={{textAlign:'center'}}>
                        <div style={{color:'#fff',fontSize:'18px',fontWeight:'700',textTransform:'uppercase'}}>{MESES[mes]}</div>
                        <div style={{color:'rgba(255,255,255,0.65)',fontSize:'13px'}}>{ano}</div>
                      </div>
                      <button onClick={()=>{if(mes===11){setMes(0);setAno(a=>a+1)}else setMes(m=>m+1);setDataSel(null);setHorarios([])}} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'10px',width:'36px',height:'36px',cursor:'pointer',fontSize:'18px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>&#8250;</button>
                    </div>
                    <div style={{background:'#fff',borderRadius:'0 0 16px 16px',padding:'1.25rem',boxShadow:'0 8px 32px rgba(27,47,126,0.10)'}}>
                      <div style={{display:'flex',gap:'8px',marginBottom:'14px',justifyContent:'center',flexWrap:'wrap'}}>
                        {[{bg:'linear-gradient(135deg,#1B2F7E,#2a45b0)',label:'Selecionado'},{bg:'#f0f7ff',border:'1px solid #bfdbfe',label:'Disponivel'},{bg:'#fee2e2',border:'1.5px solid #fca5a5',label:'Lotado'},{bg:'#f9fafb',label:'Indisponivel'}].map(l=>(
                          <div key={l.label} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                            <div style={{width:'12px',height:'12px',borderRadius:'3px',background:l.bg,border:l.border||'none',flexShrink:0}}></div>
                            <span style={{fontSize:'10px',fontWeight:'600',color:'#555'}}>{l.label}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',textAlign:'center',marginBottom:'8px'}}>
                        {['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].map((d,i)=>(
                          <span key={i} style={{fontSize:'10px',fontWeight:'700',color:i===0||i===6?'#e5e7eb':'#9ca3af',padding:'4px 0'}}>{d}</span>
                        ))}
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px'}}>
                        {Array(primeiroDia).fill(null).map((_,i)=><div key={i}/>)}
                        {Array(diasNoMes).fill(null).map((_,i)=>{
                          const d=i+1
                          const date=new Date(ano,mes,d)
                          const dow=date.getDay()
                          const isPast=date<new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate())
                          const isWeekend=dow===0||dow===6
                          const ds=ano+'-'+String(mes+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')
                          const isSel=dataSel===ds
                          const isLiberado=diasLiberados.includes(ds)
                          const isCheio=diasCheios.includes(ds)
                          const isHoje=d===hoje.getDate()&&mes===hoje.getMonth()&&ano===hoje.getFullYear()

                          if(isPast||isWeekend||!isLiberado) return(
                            <div key={d} style={{aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'#d1d5db',borderRadius:'8px',background:'#f9fafb'}}>{d}</div>
                          )
                          if(isCheio&&!isSel) return(
                            <div key={d} style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#dc2626',borderRadius:'8px',background:'#fee2e2',border:'1.5px solid #fca5a5',cursor:'not-allowed',fontWeight:'700'}}>{d}<div style={{fontSize:'7px',fontWeight:'700',marginTop:'1px'}}>LOTADO</div></div>
                          )
                          if(isSel) return(
                            <div key={d} onClick={()=>setDataSel(null)} style={{aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'800',borderRadius:'8px',cursor:'pointer',background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',color:'#fff',boxShadow:'0 4px 12px rgba(27,47,126,0.4)'}}>{d}</div>
                          )
                          return(
                            <div key={d} onClick={()=>selecionarData(ds)} style={{aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'600',borderRadius:'8px',cursor:'pointer',background:'#f0f7ff',color:'#1d4ed8',border:'1px solid #bfdbfe'}}>{d}</div>
                          )
                        })}
                      </div>
                      {dataSel&&(
                        <div style={{marginTop:'14px',padding:'10px 14px',background:'linear-gradient(135deg,#f0f7ff,#e0edff)',borderRadius:'10px',border:'1px solid #bfdbfe',textAlign:'center'}}>
                          <p style={{fontSize:'13px',fontWeight:'700',color:AZUL,margin:0,textTransform:'capitalize'}}>✓ {dataFormatada}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {horarios.length>0&&(
                    <div style={{background:'#fff',borderRadius:'16px',padding:isMobile?'1rem':'1.5rem',boxShadow:'0 8px 32px rgba(27,47,126,0.10)'}}>
                      <p style={{fontSize:'11px',fontWeight:'700',color:AZUL,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 4px'}}>HORARIOS DISPONIVEIS</p>
                      <p style={{fontSize:'12px',color:'#6b7280',margin:'0 0 1rem',textTransform:'capitalize'}}>{dataFormatada}</p>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                        {horarios.map(h=>(
                          <div key={h.horario} onClick={()=>h.disponivel&&selecionarHorario(h.horario)}
                            style={{padding:'12px',textAlign:'center',borderRadius:'10px',fontSize:'14px',fontWeight:'700',
                              border:horarioSel===h.horario?'2px solid '+AZUL:'1px solid #dde1f0',
                              cursor:h.disponivel?'pointer':'not-allowed',
                              background:horarioSel===h.horario?AZUL:!h.disponivel?'#f9fafb':'#f0f7ff',
                              color:horarioSel===h.horario?'#fff':!h.disponivel?'#d1d5db':'#1d4ed8'}}>
                            {h.horario}
                            <div style={{fontSize:'10px',fontWeight:'400',marginTop:'3px',color:horarioSel===h.horario?'rgba(255,255,255,0.8)':!h.disponivel?'#d1d5db':'#6b7280'}}>
                              {h.disponivel?`${4-h.ocupadas} vaga${4-h.ocupadas!==1?'s':'`'}`:'Lotado'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {etapa===3&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:isMobile?'1rem':'1.5rem',boxShadow:'0 8px 32px rgba(27,47,126,0.10)',maxWidth:'560px',margin:'0 auto'}}>
                <div style={{background:'#E8EBF5',border:'1px solid #c0c9e8',borderRadius:'10px',padding:'12px 14px',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'32px',height:'32px',background:AZUL,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'12px',fontWeight:'700',color:AZUL}}>{empreendimentoSel}</div>
                    <div style={{fontSize:'12px',color:'#5a6fa8',textTransform:'capitalize'}}>{dataFormatada} · {horarioSel} · <span onClick={()=>{setEtapa(2);setHorarioSel(null)}} style={{cursor:'pointer',textDecoration:'underline',fontWeight:'600'}}>Alterar</span></div>
                  </div>
                </div>

                <p style={{fontSize:'11px',fontWeight:'700',color:AZUL,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 0.75rem'}}>DADOS PESSOAIS</p>
                <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                  <div>
                    <label style={{fontSize:'12px',fontWeight:'700',color:tentouEnviar&&!form.nome?VERMELHO:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Nome Completo *</label>
                    <input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Joao da Silva" style={tentouEnviar&&!form.nome?erroBorda:inp}/>
                  </div>
                  <div>
                    <label style={{fontSize:'12px',fontWeight:'700',color:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>CPF <span style={{fontSize:'10px',color:'#9ca3af'}}>(travado)</span></label>
                    <input value={clienteDados?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4')||''} readOnly tabIndex={-1} style={inpReadOnly}/>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                  <div>
                    <label style={{fontSize:'12px',fontWeight:'700',color:tentouEnviar&&!form.email?VERMELHO:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>E-mail *</label>
                    <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="joao@email.com" type="email" style={tentouEnviar&&!form.email?erroBorda:inp}/>
                  </div>
                  <div>
                    <label style={{fontSize:'12px',fontWeight:'700',color:tentouEnviar&&!form.telefone?VERMELHO:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Telefone *</label>
                    <input value={form.telefone} onChange={e=>setForm({...form,telefone:mascaraTelefone(e.target.value)})} placeholder="(11) 99999-9999" maxLength={15} style={tentouEnviar&&!form.telefone?erroBorda:inp}/>
                  </div>
                </div>
                <div style={{marginBottom:'1.25rem'}}>
                  <label style={{fontSize:'12px',fontWeight:'700',color:tentouEnviar&&!form.unidade?VERMELHO:'#6b7280',display:'block',marginBottom:'4px',textTransform:'uppercase'}}>Unidade *</label>
                  <input value={form.unidade} onChange={e=>setForm({...form,unidade:e.target.value})} placeholder="Ex: Torre A, Apto 301" style={tentouEnviar&&!form.unidade?erroBorda:inp}/>
                </div>
                {erro&&<div style={{background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px'}}><p style={{color:VERMELHO,fontSize:'13px',fontWeight:'600',margin:0}}>{erro}</p></div>}
                <div style={{display:'flex',gap:'10px'}}>
                  <button onClick={()=>{setEtapa(2);setHorarioSel(null);setTentouEnviar(false)}} style={{flex:1,padding:'12px',background:'#fff',color:'#6b7280',border:'1px solid #dde1f0',borderRadius:'8px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>VOLTAR</button>
                  <button onClick={confirmar} disabled={loading} style={{flex:2,padding:'12px',background:loading?'#9ca3af':AZUL,color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'700',cursor:loading?'not-allowed':'pointer'}}>
                    {loading?'AGUARDE...':'CONFIRMAR ENTREGA'}
                  </button>
                </div>
              </div>
            )}

            {etapa===4&&(
              <div style={{background:'#fff',borderRadius:'16px',padding:isMobile?'2rem 1rem':'3rem 2rem',textAlign:'center',boxShadow:'0 8px 32px rgba(27,47,126,0.10)',maxWidth:'480px',margin:'0 auto'}}>
                <div style={{width:'72px',height:'72px',background:'linear-gradient(135deg,#1B2F7E,#2a45b0)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem',boxShadow:'0 4px 16px rgba(27,47,126,0.3)'}}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M5 16l8 8 14-14" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h2 style={{fontFamily:'Georgia,serif',fontSize:isMobile?'20px':'24px',fontWeight:'400',margin:'0 0 8px',color:AZUL}}>ENTREGA AGENDADA!</h2>
                <p style={{color:'#6b7280',fontSize:'14px',lineHeight:'1.7',margin:'0 0 1.5rem'}}>Um e-mail de confirmacao foi enviado para <strong style={{color:AZUL}}>{form.email}</strong>.</p>
                <div style={{background:'#f8f9ff',border:'1px solid #e0e5f5',borderRadius:'12px',padding:'1.25rem',textAlign:'left',marginBottom:'1.5rem'}}>
                  <p style={{fontSize:'11px',fontWeight:'700',color:AZUL,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 12px',borderBottom:'1px solid #e0e5f5',paddingBottom:'8px'}}>RESUMO</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {[{l:'Empreendimento',v:empreendimentoSel},{l:'Data',v:dataFormatada},{l:'Horario',v:horarioSel},{l:'Unidade',v:form.unidade}].map(item=>(
                      <div key={item.l} style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                        <span style={{color:'#6b7280',fontWeight:'600',textTransform:'uppercase',fontSize:'11px'}}>{item.l}</span>
                        <span style={{fontWeight:'700',color:AZUL,textTransform:'capitalize'}}>{item.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <p style={{fontSize:'13px',color:'#15803d',margin:0,fontWeight:'500',textAlign:'left'}}>E-mail enviado! Verifique sua caixa de entrada e o spam.</p>
                </div>
                <p style={{fontSize:'10px',color:'#d1d5db',textAlign:'center',marginTop:'1.5rem'}}>© 2026 Markinvest. Todos os direitos reservados.</p>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}